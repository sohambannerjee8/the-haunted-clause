// Motion and sound (haunted-house-ui R10, R11.1). Uses document.getAnimations() to measure.
import type { Page } from "@playwright/test";
import { SAMPLE_META } from "../src/lib/samples/meta";
import { expect, test } from "./fixtures";

type Anim = { name: string; iterations: number | null; duration: number; playState: string; opacity: number[] };

/** Every animation on the page: name, iterations (null = infinite), duration per cycle and opacity keyframes. */
function animations(page: Page): Promise<Anim[]> {
  return page.evaluate(() =>
    document.getAnimations().map((a) => {
      const effect = a.effect as KeyframeEffect | null;
      const timing = effect?.getComputedTiming();
      const frames = effect?.getKeyframes() ?? [];
      const iterations = timing?.iterations ?? 1;
      return {
        name: (a as CSSAnimation).animationName ?? a.id ?? "waapi",
        iterations: Number.isFinite(iterations) ? iterations : null,
        duration: Number(timing?.duration ?? 0),
        playState: a.playState,
        opacity: frames.filter((k) => k.opacity !== undefined).map((k) => Number(k.opacity)),
      };
    }),
  );
}
const repeating = (a: Anim) => a.iterations === null || a.iterations > 1;

/** Local maxima of the opacity keyframes, treating the cycle as a loop. */
function opacityPeaks(values: number[]): number {
  if (values.length < 3) return 0;
  const v = values.slice(0, values.at(-1) === values[0] ? -1 : undefined);
  let peaks = 0;
  for (let i = 0; i < v.length; i++) {
    const prev = v[(i - 1 + v.length) % v.length];
    const next = v[(i + 1) % v.length];
    if (v[i] > prev && v[i] >= next) peaks++;
  }
  return peaks;
}
function monotone(values: number[]): boolean {
  const up = values.every((x, i) => i === 0 || x >= values[i - 1]);
  const down = values.every((x, i) => i === 0 || x <= values[i - 1]);
  return up || down;
}

function checkFlashRules(list: Anim[], where: string) {
  for (const a of list) {
    if (repeating(a)) {
      expect(a.duration, `${where}: ${a.name} cycle`).toBeGreaterThanOrEqual(1000);
      expect(opacityPeaks(a.opacity), `${where}: ${a.name} opacity peaks`).toBeLessThanOrEqual(1);
    } else {
      expect(monotone(a.opacity), `${where}: ${a.name} one-way opacity`).toBe(true);
      expect(a.duration, `${where}: ${a.name} one-off length`).toBeLessThanOrEqual(300);
    }
  }
}

async function openSample(page: Page, id: string) {
  const m = SAMPLE_META.find((x) => x.id === id)!;
  await page.goto("/");
  await page.getByRole("button", { name: `Open this house: ${m.company}` }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
}

test.describe("with reduced motion (R10.2, R10.3)", () => {
  test.use({ reducedMotion: "reduce" });
  test("ghosts are still: animation-name none, no movement over 1 s, no running repeating animation", async ({ page }) => {
    await openSample(page, "terrible");
    const ghosts = page.locator(".hc-ghost");
    expect(await ghosts.count()).toBeGreaterThan(0);
    // The button and everything inside it (the art moves when motion is on).
    const parts = page.locator(".hc-ghost, .hc-ghost *");
    expect(new Set(await parts.evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName)))).toEqual(new Set(["none"]));
    const boxes = () => parts.evaluateAll((els) => els.map((e) => JSON.stringify(e.getBoundingClientRect())));
    const before = await boxes();
    await page.waitForTimeout(1000);
    expect(await boxes()).toEqual(before);
    expect((await animations(page)).filter((a) => repeating(a) && a.playState === "running")).toEqual([]);
    // The level still shows without motion: size, opacity and colour differ by level.
    const looks = await page.locator(".hc-ghost .hc-art").evaluateAll((els) => new Set(els.map((e) => getComputedStyle(e).width)).size);
    expect(looks).toBeGreaterThan(1);
  });
});

test.describe("with motion (R10.1, R10.4, R10.5)", () => {
  test.use({ reducedMotion: "no-preference" });

  test("level 3 ghosts are animated", async ({ page }) => {
    await openSample(page, "terrible");
    const names = await page.locator('.hc-ghost[data-severity="3"] .hc-art').evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) expect(n).not.toBe("none");
    expect((await animations(page)).some((a) => repeating(a) && a.playState === "running")).toBe(true);
  });

  for (const m of SAMPLE_META) {
    test(`${m.id}: every animation keeps under the flash limits, in the house and in an open panel`, async ({ page }) => {
      await openSample(page, m.id);
      const house = await animations(page);
      expect(house.length).toBeGreaterThan(0);
      checkFlashRules(house, `${m.id} house`);
      await page.locator("button.hc-ghost").first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      checkFlashRules(await animations(page), `${m.id} dialog`);
    });
  }

  test("switching Lights on stops every repeating animation", async ({ page }) => {
    await openSample(page, "terrible");
    expect((await animations(page)).some((a) => repeating(a) && a.playState === "running")).toBe(true);
    await page.getByRole("button", { name: "Lights on" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Lights on" })).toBeVisible();
    expect((await animations(page)).filter((a) => repeating(a) && a.playState === "running")).toEqual([]);
  });
});

test("sound is off on load and no AudioContext is made until Sound is turned on (R11.1, R11.2)", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __audioContexts: number; AudioContext: typeof AudioContext };
    w.__audioContexts = 0;
    const Real = w.AudioContext;
    w.AudioContext = class extends Real {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        w.__audioContexts++;
      }
    } as typeof AudioContext;
  });
  const count = () => page.evaluate(() => (window as unknown as { __audioContexts: number }).__audioContexts);
  await openSample(page, "terrible");
  const toggle = page.getByRole("button", { name: "Sound" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.locator("button.hc-ghost").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  expect(await count()).toBe(0);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect(await count()).toBe(1);
});
