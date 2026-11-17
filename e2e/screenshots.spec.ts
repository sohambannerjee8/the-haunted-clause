// Screenshots for the user's visual review (haunted-house-ui R20, PLAN_DECISIONS.md C10.15).
// Runs only through `npm run screenshots`; `npm run test:e2e` excludes @screenshots.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "./fixtures";
import { openSample, waitForFades } from "./helpers";

const OUT = join(process.cwd(), "docs", "screenshots");

for (const [width, height] of [
  [1440, 900],
  [360, 740],
] as const) {
  test.describe(`@screenshots ${width}`, () => {
    test.use({ viewport: { width, height }, reducedMotion: "reduce" });

    test(`@screenshots six states at ${width} px`, async ({ page }) => {
      mkdirSync(OUT, { recursive: true });
      const shot = async (name: string, fullPage = true) => {
        await page.evaluate(() => document.fonts.ready);
        await waitForFades(page);
        await page.screenshot({ path: join(OUT, `${name}-${width}.png`), fullPage });
      };

      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await shot("input");

      for (const id of ["mild", "average", "terrible"] as const) {
        await openSample(page, id);
        await shot(`house-${id}`);
      }

      // The terrible sample is open: its first severity 3 ghost, in the viewport (the dialog is modal).
      await page.locator('button.hc-ghost[data-severity="3"]').first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await shot("detail", false);
      await page.keyboard.press("Escape");

      await page.getByRole("button", { name: "Lights on" }).click();
      await expect(page.getByRole("heading", { level: 2, name: "Lights on" })).toBeVisible();
      await shot("lights-on");
    });
  });
}

// One extra screenshot with motion on (PLAN_DECISIONS.md C14.7): the terrible house mid-animation.
test.describe("@screenshots motion", () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  test("@screenshots terrible house with motion on", async ({ page }) => {
    mkdirSync(OUT, { recursive: true });
    await openSample(page, "terrible");
    await page.evaluate(() => document.fonts.ready);
    // Let the ghosts, fog and candles move for a moment; all repeating animations must be running.
    await page.waitForTimeout(1200);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
    expect(running).toBeGreaterThan(0);
    await page.screenshot({ path: join(OUT, "house-terrible-motion-1440.png"), fullPage: true });
  });
});
