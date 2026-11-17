// With no key, there is no opt-in button, and the "no medium" line shows (haunted-house-ui R14.2).
import { expect, test } from "./fixtures";

test("no key: no Ask the medium button, and the 'no medium' line shows", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Paste a Terms & Conditions or privacy policy").fill("We may sell your personal information to data brokers.");
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask the medium" })).toHaveCount(0);
  await expect(page.getByText("These readings come from built-in rules. No medium is configured on this site.")).toBeVisible();
});
