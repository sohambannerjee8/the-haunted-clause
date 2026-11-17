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
