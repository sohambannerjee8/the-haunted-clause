// Crowded rooms (PLAN_DECISIONS.md C22): a made-up text with 40 ghosts in one room, at 1440 and 360 px.
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { AXE_TAGS, expect, test } from "./fixtures";
import { analyzeText, CROWDED, waitForFades } from "./helpers";

const ROOM = 'section[data-room="portraits"]';
const ghostsIn = (page: Page) => page.locator(`${ROOM} button[data-finding-id]`);
const toggle = (page: Page) => page.locator(`${ROOM} button[data-room-toggle]`);

/** Rooms whose bottom sits well below their own content are stretched by their row (C22.1). */
async function stretchedRooms(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const s of document.querySelectorAll<HTMLElement>("section[data-room]")) {
      const box = s.getBoundingClientRect();
      const last = s.lastElementChild!.getBoundingClientRect();
      const minHeight = parseFloat(getComputedStyle(s).minHeight) || 0;
      if (box.bottom - last.bottom > 20 && box.height > minHeight + 1) out.push(`${s.dataset.room}: ${Math.round(box.bottom - last.bottom)} px of empty space`);
    }
    return out;
  });
}
const hScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
async function axe(page: Page, label: string) {
  await waitForFades(page);
  const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), label).toEqual([]);
}

for (const width of [1440, 360]) {
  test.describe(`crowded room at ${width} px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("12 ghosts and '+28 more'; the room's name keeps the count; no stretched rows; no horizontal scroll; axe clean", async ({ page }) => {
      await analyzeText(page, CROWDED);
      await expect(page.getByRole("region", { name: "The Watching Portraits, 40 ghosts, worst: real concern" })).toBeVisible();
      await expect(ghostsIn(page)).toHaveCount(12);
      await expect(page.locator(`${ROOM} button[data-severity="2"]`)).toHaveCount(12); // the 14 at severity 2 outrank the 26 at 1
      await expect(toggle(page)).toHaveText("+28 more");
      await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
      expect(await stretchedRooms(page)).toEqual([]);
      expect(await hScroll(page)).toBe(false);
      await axe(page, `collapsed, ${width} px`);
    });

    test("the button expands and collapses by mouse", async ({ page }) => {
      await analyzeText(page, CROWDED);
      await toggle(page).click();
      await expect(ghostsIn(page)).toHaveCount(40);
      await expect(toggle(page)).toHaveText("Show fewer");
      await expect(toggle(page)).toHaveAttribute("aria-expanded", "true");
      expect(await stretchedRooms(page)).toEqual([]);
      expect(await hScroll(page)).toBe(false);
      await axe(page, `expanded, ${width} px`);
      await toggle(page).click();
      await expect(ghostsIn(page)).toHaveCount(12);
      await expect(toggle(page)).toHaveAttribute("aria-expanded", "false");
    });

    test("the button is in the room's keyboard path and works with Enter and Space", async ({ page }) => {
      await analyzeText(page, CROWDED);
      await ghostsIn(page).first().focus();
      await page.keyboard.press("End");
      await expect(toggle(page)).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(ghostsIn(page)).toHaveCount(40);
      await expect(toggle(page)).toBeFocused();
      await page.keyboard.press("ArrowLeft");
      await expect(ghostsIn(page).nth(39)).toBeFocused();
      await page.keyboard.press("End");
      await page.keyboard.press("Space");
      await expect(ghostsIn(page)).toHaveCount(12);
      await expect(toggle(page)).toBeFocused();
      // Tab leaves the room: the next stop is outside The Watching Portraits.
      await page.keyboard.press("Tab");
      expect(await page.evaluate((sel) => !document.querySelector(sel)!.contains(document.activeElement), ROOM)).toBe(true);
    });

    test("Lights on still lists every finding", async ({ page }) => {
      await analyzeText(page, CROWDED);
      await page.getByRole("button", { name: "Lights on" }).click();
      const list = page.getByRole("region", { name: "The Watching Portraits" });
      for (const n of [1, 13, 26]) await expect(list.getByText(`We use cookies to remember your choices on screen ${n}.`, { exact: true })).toBeVisible();
      await expect(list.getByText("We show interest-based ads in section 14 of the app.", { exact: true })).toBeVisible();
    });
  });
}
