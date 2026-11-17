// Layout from 360 px to desktop (haunted-house-ui R4.2, R12). Every state listed in R12.1.
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { analyzeText, BOX, blockChunks, holdChunks, NO_RISK, ONLY_WISPS, openSample, paste, RISKY, SPANISH } from "./helpers";

type Problem = string;

/** No horizontal scroll, no clipped text, no overlapping controls (R12.1). */
async function layoutProblems(page: Page): Promise<Problem[]> {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const out: string[] = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw) out.push(`horizontal scroll: ${document.documentElement.scrollWidth} > ${vw}`);
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && el.checkVisibility({ visibilityProperty: true, opacityProperty: false }) && !el.closest("[inert]");
    };
    // Ignore what is behind an open modal dialog: it is inert and not part of this state.
    const dialog = document.querySelector("dialog[open]");
    const scope = (el: Element) => !dialog || dialog.contains(el);
    const name = (el: Element) => `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 40)}"`;
    for (const el of document.querySelectorAll("h1,h2,h3,p,li,label,button,blockquote,a")) {
      if (!visible(el) || !scope(el)) continue;
      const e = el as HTMLElement;
      if (e.scrollWidth > e.clientWidth + 1) out.push(`clipped: ${name(el)} ${e.scrollWidth} > ${e.clientWidth}`);
      const r = el.getBoundingClientRect();
      if (el.classList.contains("skip-link")) continue; // off-screen until focused
      if (r.left < -1 || r.right > vw + 1) out.push(`outside the viewport width: ${name(el)} ${Math.round(r.left)}–${Math.round(r.right)}`);
    }
    const controls = [...document.querySelectorAll("button,a[href],input,textarea,select")].filter((el) => visible(el) && scope(el) && !el.classList.contains("skip-link"));
    const rects = controls.map((el) => el.getBoundingClientRect());
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const overlap = a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
        if (overlap) out.push(`overlap: ${name(controls[i])} and ${name(controls[j])}`);
      }
    }
    return out;
  });
}

async function gridColumns(page: Page): Promise<number> {
  return page.locator("[data-house-grid]").evaluate((g) => getComputedStyle(g).gridTemplateColumns.split(" ").length);
}

async function expectClean(page: Page, label: string, width: number) {
  expect(await layoutProblems(page), label).toEqual([]);
  if ((await page.locator("[data-house-grid]").count()) > 0) {
    expect(await gridColumns(page), `${label}: columns`).toBe(width < 768 ? 2 : 4);
  }
}

for (const [width, height] of [
  [360, 740],
  [1440, 900],
] as const) {
  test.describe(`${width} × ${height}`, () => {
    test.use({ viewport: { width, height } });

    test(`input screen states (${width})`, async ({ page }) => {
      await page.goto("/");
      await expectClean(page, "input", width);
      await page.getByRole("button", { name: "Analyze" }).click();
      await expect(page.getByText("Paste a policy or pick a sample first.")).toBeVisible();
      await expectClean(page, "empty-input message", width);
      await paste(page, "x".repeat(60_000));
      await expect(page.getByText("Your text was cut at 50,000 characters.")).toBeVisible();
      await expect(page.getByLabel(BOX)).toHaveValue("x".repeat(50_000));
      await expectClean(page, "paste-cut notice", width);
    });

    test(`loading and load-error states (${width})`, async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const release = await holdChunks(page);
      await page.getByRole("button", { name: /^Open this house: Murkwillow/ }).click();
      await expect(page.getByText("Opening the house…")).toBeVisible();
      await expectClean(page, "loading", width);
      release();
      await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();

      const page2 = await page.context().newPage();
      await page2.goto("/");
      await page2.waitForLoadState("networkidle");
      await blockChunks(page2);
      await page2.getByRole("button", { name: /^Open this house: Murkwillow/ }).click();
      await expect(page2.getByText("The house would not open. Check your connection and try again.")).toBeVisible();
      await expectClean(page2, "load error", width);
      await page2.close();
    });

    for (const id of ["mild", "average", "terrible"] as const) {
      test(`house, dialog and Lights on: ${id} (${width})`, async ({ page }) => {
        await openSample(page, id);
        await expectClean(page, `house ${id}`, width);

        await page.locator("button.hc-ghost").first().click();
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expectClean(page, `dialog ${id}`, width);
        // The panel fits the viewport and scrolls inside when it is taller (R12.3).
        const fit = await dialog.evaluate((d) => {
          const r = d.getBoundingClientRect();
          const cs = getComputedStyle(d);
          return { inside: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, overflowY: cs.overflowY, scrolls: d.scrollHeight > d.clientHeight };
        });
        expect(fit.inside, `dialog ${id} inside the viewport`).toBe(true);
        expect(fit.overflowY).toBe("auto");
        await page.keyboard.press("Escape");

        await page.getByRole("button", { name: "Lights on" }).click();
        await expect(page.getByRole("heading", { level: 2, name: "Lights on" })).toBeVisible();
        await expectClean(page, `lights on ${id}`, width);
      });
    }

    test(`notice states: non-English, no ghosts, only wisps (${width})`, async ({ page }) => {
      await analyzeText(page, SPANISH);
      await expect(page.getByText("This app reads English only.", { exact: false })).toBeVisible();
      await expectClean(page, "non-English", width);
      await analyzeText(page, NO_RISK);
      await expect(page.getByText(/^No ghosts here\./)).toBeVisible();
      await expectClean(page, "no ghosts", width);
      await analyzeText(page, ONLY_WISPS);
      await expect(page.getByText("Only calm wisps here.")).toBeVisible();
      await expectClean(page, "only wisps", width);
    });

    test(`@llm-ui opt-in panel, listening and failure (${width})`, async ({ page }) => {
      let answer!: () => void;
      const held = new Promise<void>((r) => (answer = r));
      await page.route("**/api/explain", async (route) => {
        await held;
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ source: "rules", reason: "timeout", findings: [] }) });
      });
      await analyzeText(page, RISKY);
      await expect(page.getByRole("button", { name: "Ask the medium" })).toBeVisible();
      await expectClean(page, "opt-in panel", width);
      await page.getByRole("button", { name: "Ask the medium" }).click();
      await expect(page.getByText("The medium is listening…")).toBeVisible();
      await expectClean(page, "listening", width);
      answer();
      await expect(page.getByText("The medium took too long. Showing the rule reading.")).toBeVisible();
      await expectClean(page, "failure message", width);
    });
  });
}

test("the dialog scrolls inside itself when its content is taller than a short viewport (R12.3)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 420 });
  await openSample(page, "terrible");
  await page.locator('button.hc-ghost[data-severity="3"]').first().click();
  const d = page.getByRole("dialog");
  await expect(d).toBeVisible();
  const m = await d.evaluate((el) => ({ scrolls: el.scrollHeight > el.clientHeight, bottom: el.getBoundingClientRect().bottom, vh: innerHeight }));
  expect(m.scrolls).toBe(true);
  expect(m.bottom).toBeLessThanOrEqual(m.vh);
});
