// The score scale line (haunted-house-ui R7.4, R8.6; PLAN_DECISIONS.md C24), at 1440 and 360 px.
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { AXE_TAGS, expect, test } from "./fixtures";
import { openSample, waitForFades } from "./helpers";

const LINE = "Scores run from 0 to 97, the most haunted a policy can be: 0–24 Mostly quiet · 25–49 Uneasy · 50–74 Haunted · 75+ Run.";
/** The line as shown: the current band is followed by the visible marker "(this policy)" (C25.2). */
const shown = (band: string) => LINE.replace(band, `${band} (this policy)`);
const SAMPLES = [
  ["mild", "14 · Mostly quiet", "0–24 Mostly quiet"],
  ["average", "59 · Haunted", "50–74 Haunted"],
  ["terrible", "97 · Run", "75+ Run"],
] as const;

async function axe(page: Page, label: string) {
  await waitForFades(page);
  const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), label).toEqual([]);
}

/** The line's own layout: no horizontal scroll, not clipped, inside the viewport. */
async function lineFits(page: Page, scale: ReturnType<Page["getByTestId"]>) {
  const r = await scale.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return {
      hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      clipped: el.scrollWidth > el.clientWidth + 1,
      inside: box.left >= -1 && box.right <= document.documentElement.clientWidth + 1,
    };
  });
  expect(r).toEqual({ hScroll: false, clipped: false, inside: true });
}

for (const width of [1440, 360]) {
  test.describe(`score scale at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const [id, score, band] of SAMPLES) {
      test(`${id}: the line sits under the score panel, ${band} is bold and aria-current, and the score is unchanged`, async ({ page }) => {
        await openSample(page, id);
        await expect(page.getByTestId("haunt-score")).toHaveText(score);
        const scale = page.getByTestId("score-scale").first();
        await expect(scale).toBeVisible();
        await expect(scale).toHaveText(shown(band));
        const current = scale.locator("[aria-current='true']");
        await expect(current).toHaveCount(1);
        await expect(current).toHaveText(band);
        const style = await current.evaluate((el) => getComputedStyle(el).fontWeight);
        expect(Number(style)).toBeGreaterThanOrEqual(700);
        const font = await scale.evaluate((el) => ({ family: getComputedStyle(el).fontFamily, color: getComputedStyle(el).color, size: parseFloat(getComputedStyle(el).fontSize) }));
        expect(font.family).toMatch(/Atkinson/i);
        expect(font.family).not.toMatch(/Creepster/i);
        expect(font.color).toBe("rgb(185, 169, 194)"); // mist
        expect(font.size).toBeGreaterThanOrEqual(16);
        // Directly under the panel: below its bottom edge, above "Inside the house".
        const panel = await page.locator("[data-score-hero]").boundingBox();
        const line = await scale.boundingBox();
        const heading = await page.getByRole("heading", { level: 2, name: "Inside the house" }).boundingBox();
        expect(line!.y).toBeGreaterThanOrEqual(panel!.y + panel!.height);
        expect(line!.y + line!.height).toBeLessThanOrEqual(heading!.y);
        await lineFits(page, scale);
        await axe(page, `${id}, house, ${width} px`);
      });
    }

    test("Lights on shows the same line at the top of the list, before the first room; axe clean", async ({ page }) => {
      await openSample(page, "average");
      await page.getByRole("button", { name: "Lights on" }).click();
      const list = page.getByRole("heading", { level: 2, name: "Lights on" });
      await expect(list).toBeVisible();
      const scales = page.getByTestId("score-scale");
      await expect(scales).toHaveCount(2); // under the score panel, and at the top of the list
      const top = scales.nth(1);
      await expect(top).toHaveText(shown("50–74 Haunted"));
      await expect(top.locator("[aria-current='true']")).toHaveText("50–74 Haunted");
      const lineBox = await top.boundingBox();
      const firstRoom = await page.getByRole("heading", { level: 3 }).first().boundingBox();
      expect(lineBox!.y + lineBox!.height).toBeLessThanOrEqual(firstRoom!.y);
      await lineFits(page, top);
      await axe(page, `Lights on, ${width} px`);
    });
  });
}
