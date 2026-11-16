// The page shell (haunted-house-ui R1.1, R1.3–R1.5, R19.3).
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("one h1, English, the title, and exactly one main (R1.1, R19.3)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("The Haunted Clause");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("The Haunted Clause");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
});

test("the skip link is the first focusable element and moves focus to main (R1.3)", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const first = page.locator(":focus");
  await expect(first).toHaveText("Skip to content");
  await expect(first).toHaveAttribute("href", "#content");
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe("content");
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("MAIN");
});

test("no font or image is requested from another origin (R1.4, R1.5)", async ({ page, baseURL }) => {
  const own = new URL(baseURL!).origin;
  const foreign: string[] = [];
  const fonts: string[] = [];
  page.on("request", (r) => {
    const url = new URL(r.url());
    if (url.protocol === "data:" || url.protocol === "blob:") return;
    if (url.origin !== own) foreign.push(r.url());
    if (r.resourceType() === "font") fonts.push(r.url());
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  expect(foreign).toEqual([]);
  // The self-hosted fonts are served by the app itself.
  for (const f of fonts) expect(new URL(f).origin).toBe(own);
});

test("axe finds no serious or critical issue on the first screen", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
