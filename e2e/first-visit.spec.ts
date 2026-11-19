// Explanations for a first-time visitor (PLAN_DECISIONS.md C25), at 1440 and 360 px.
import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { AXE_TAGS, expect, test } from "./fixtures";
import { BOX, openSample, waitForFades } from "./helpers";

const INPUT_NOTE = "Your text is read in your browser and never stored. The app finds risky clauses and files each one in a room of the house.";
const LEGEND = "Each ghost is one clause. 0 looks fine · 1 mild concern · 2 real concern · 3 serious concern.";
const QUIET = "Quiet means no risky clause of this kind was found. It doesn't prove the policy is safe.";
const REPO = "https://github.com/sohambannerjee8/the-haunted-clause";

async function axe(page: Page, label: string) {
  await waitForFades(page);
  const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), label).toEqual([]);
}
/** Body font, mist, at least 16 px, not clipped, inside the viewport, and no horizontal scroll. */
async function bodyTextFits(el: Locator) {
  const r = await el.evaluate((n) => {
    const cs = getComputedStyle(n);
    const box = n.getBoundingClientRect();
    return {
      atkinson: /Atkinson/i.test(cs.fontFamily) && !/Creepster/i.test(cs.fontFamily),
      mist: cs.color === "rgb(185, 169, 194)",
      size16: parseFloat(cs.fontSize) >= 16,
      notClipped: n.scrollWidth <= n.clientWidth + 1,
      inside: box.left >= -1 && box.right <= document.documentElement.clientWidth + 1,
      noHScroll: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    };
  });
  expect(r).toEqual({ atkinson: true, mist: true, size16: true, notClipped: true, inside: true, noHScroll: true });
}

for (const width of [1440, 360]) {
  test.describe(`first-visit explanations at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("input screen: the note sits under the paste box; the footer links to the source code; axe clean", async ({ page }) => {
      await page.goto("/");
      const note = page.getByText(INPUT_NOTE, { exact: true });
      await expect(note).toBeVisible();
      const box = await page.getByLabel(BOX).boundingBox();
      expect((await note.boundingBox())!.y).toBeGreaterThan(box!.y + box!.height - 1);
      await bodyTextFits(note);
      const link = page.getByRole("contentinfo").getByRole("link", { name: "How it works and source code" });
      await expect(link).toHaveAttribute("href", REPO);
      await axe(page, `input screen, ${width} px`);
    });

    test("house: the legend and the Quiet note sit between the heading and the house; the panel explains the badge; axe clean", async ({ page }) => {
      await openSample(page, "mild");
      const legend = page.getByTestId("house-legend");
      await expect(legend.getByText(LEGEND, { exact: true })).toBeVisible();
      await expect(legend.getByText(QUIET, { exact: true })).toBeVisible();
      const heading = await page.getByRole("heading", { level: 2, name: "Inside the house" }).boundingBox();
      const grid = await page.locator("[data-house-grid]").boundingBox();
      const l = await legend.boundingBox();
      expect(l!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height - 1);
      expect(l!.y + l!.height).toBeLessThanOrEqual(grid!.y);
      for (const p of await legend.locator("p").all()) await bodyTextFits(p);
      await axe(page, `house, ${width} px`);
      await page.locator("button.hc-ghost").first().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByText("Rule reading", { exact: true })).toBeVisible();
      await expect(dialog.getByText("From the app's built-in rules", { exact: true })).toBeVisible();
      await axe(page, `detail panel, ${width} px`);
    });

    test("Lights on: the scale, legend and Quiet note come first, before the first room; axe clean", async ({ page }) => {
      await openSample(page, "mild");
      await page.getByRole("button", { name: "Lights on" }).click();
      await expect(page.getByRole("heading", { level: 2, name: "Lights on" })).toBeVisible();
      const legend = page.getByTestId("house-legend");
      await expect(legend).toHaveCount(1);
      await expect(legend.getByText(LEGEND, { exact: true })).toBeVisible();
      await expect(legend.getByText(QUIET, { exact: true })).toBeVisible();
      const firstRoom = await page.getByRole("heading", { level: 3 }).first().boundingBox();
      const top = await page.getByTestId("score-scale").nth(1).boundingBox();
      const l = await legend.boundingBox();
      expect(top!.y).toBeLessThan(l!.y);
      expect(l!.y + l!.height).toBeLessThanOrEqual(firstRoom!.y);
      await axe(page, `Lights on, ${width} px`);
    });
  });
}

test("keyboard: the footer link is reachable from the input screen with Tab", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("contentinfo").getByRole("link", { name: "How it works and source code" });
  let reached = false;
  for (let i = 0; i < 20 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await link.evaluate((el) => el === document.activeElement);
  }
  expect(reached).toBe(true);
});
