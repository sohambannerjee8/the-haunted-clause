// Keyboard use on the terrible sample (haunted-house-ui R5.6, R6.6, R6.7, R9, R19.4).
import type { Page } from "@playwright/test";
import { ROOMS } from "../src/lib/analyzer/rooms";
import { SAMPLE_META } from "../src/lib/samples/meta";
import { expect, test } from "./fixtures";

const TERRIBLE = SAMPLE_META.find((m) => m.id === "terrible")!;
const RING = { style: "solid", width: "3px", offset: "2px", colour: "rgb(242, 181, 68)" };

async function openTerrible(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: `Open this house: ${TERRIBLE.company}` }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
}

/** What the focused element is, and its computed focus ring. */
function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      text: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim(),
      id: el.getAttribute("data-finding-id"),
      room: el.closest("section[data-room]")?.getAttribute("data-room") ?? null,
      inDialog: !!el.closest("dialog"),
      ring: { style: cs.outlineStyle, width: cs.outlineWidth, offset: cs.outlineOffset, colour: cs.outlineColor },
    };
  });
}

test("tab order: skip link, toolbar, then one stop per room in room order, then the footer (R9.1, R9.2, R9.5, R9.7)", async ({ page }) => {
  await openTerrible(page);
  // Chromium keeps its sequential-focus starting point after a blur, so start at the skip link and
  // prove it is first: Shift+Tab from it leaves the page's content.
  const skip = page.getByRole("link", { name: "Skip to content" });
  await skip.focus();
  await page.keyboard.press("Shift+Tab");
  expect(await focused(page)).toBeNull();
  await skip.focus();
  const stops: NonNullable<Awaited<ReturnType<typeof focused>>>[] = [(await focused(page))!];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    const f = await focused(page);
    if (!f || stops.some((s) => s.tag === f.tag && s.text === f.text && s.id === f.id)) break;
    stops.push(f);
  }
  expect(stops[0].text).toBe("Skip to content");
  expect(stops[1].text).toBe("Read another policy");
  const ghostStops = stops.filter((s) => s.id !== null);
  expect(ghostStops.map((s) => s.room)).toEqual(ROOMS.map((r) => r.id)); // one stop per room, all 8 have ghosts
  // Toolbar controls come before the first room; nothing focusable follows the last room except the footer's content.
  const firstGhost = stops.findIndex((s) => s.id !== null);
  expect(stops.slice(0, firstGhost).every((s) => s.id === null)).toBe(true);
  expect(stops.slice(firstGhost).every((s) => s.id !== null)).toBe(true);
});

test("arrows, Home and End reach every ghost in each room (R9.3)", async ({ page }) => {
  await openTerrible(page);
  for (const room of ROOMS) {
    const section = page.locator(`section[data-room="${room.id}"]`);
    const ids = await section.locator("button.hc-ghost").evaluateAll((els) => els.map((e) => e.getAttribute("data-finding-id")));
    expect(ids.length).toBeGreaterThan(0);
    await section.locator('button.hc-ghost[tabindex="0"]').focus();
    const seen: (string | null)[] = [];
    for (let i = 0; i < ids.length; i++) {
      seen.push((await focused(page))!.id);
      await page.keyboard.press("ArrowRight");
    }
    expect(seen).toEqual(ids);
    expect((await focused(page))!.id).toBe(ids[0]); // wrapped
    await page.keyboard.press("End");
    expect((await focused(page))!.id).toBe(ids.at(-1));
    await page.keyboard.press("Home");
    expect((await focused(page))!.id).toBe(ids[0]);
    await page.keyboard.press("ArrowUp");
    expect((await focused(page))!.id).toBe(ids.at(-1));
  }
});

test("Tab after a ghost goes to the next room, not the next ghost (R9.5)", async ({ page }) => {
  await openTerrible(page);
  const cellar = page.locator('section[data-room="cellar"]');
  await cellar.locator('button.hc-ghost[tabindex="0"]').focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Tab");
  expect((await focused(page))!.room).toBe("portraits");
});

test("a focused ghost and every control reached by Tab show the 3 px candle-amber ring (R5.6, R19.4)", async ({ page }) => {
  // Input screen.
  await page.goto("/");
  const seen = new Set<string>();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const f = await focused(page);
    if (!f || seen.has(f.text)) break;
    seen.add(f.text);
    expect(f.ring, `input screen: ${f.text}`).toEqual(RING);
  }
  expect([...seen]).toEqual(expect.arrayContaining(["Skip to content", "Analyze", `Open this house: ${TERRIBLE.company}`]));
  // House view.
  await page.getByRole("button", { name: `Open this house: ${TERRIBLE.company}` }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
  await page.getByRole("link", { name: "Skip to content" }).focus();
  await page.keyboard.press("Tab"); // keyboard focus, so :focus-visible applies from here on
  const houseStops: string[] = [];
  let ghosts = 0;
  for (let i = 0; i < 20; i++) {
    const f = await focused(page);
    if (!f) break;
    expect(f.ring, `house view: ${f.text}`).toEqual(RING);
    houseStops.push(f.text);
    if (f.id) ghosts++;
    await page.keyboard.press("Tab");
  }
  expect(houseStops[0]).toBe("Read another policy");
  expect(ghosts).toBe(8);
});

test("Enter opens the panel, focus stays inside it, Escape closes it and returns focus (R6.6, R6.7, R9.6)", async ({ page }) => {
  await openTerrible(page);
  const ghost = page.locator('section[data-room="court"] button.hc-ghost[tabindex="0"]');
  await ghost.focus();
  const id = await ghost.getAttribute("data-finding-id");
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((d) => d.matches(":modal"))).toBe(true);
  for (const key of ["Tab", "Shift+Tab"]) {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(key);
      const f = await focused(page);
      // Chromium may move focus to the browser UI past the last control; it must never land on the page behind.
      if (f) expect(f.inDialog, `${key} #${i}: ${f.text}`).toBe(true);
    }
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect((await focused(page))!.id).toBe(id);
  // Space opens it too.
  await page.keyboard.press(" ");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
