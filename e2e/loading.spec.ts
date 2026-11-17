// Loading and error states (haunted-house-ui R17.1–R17.4). No-key project.
import { expect, test } from "./fixtures";
import { BOX, holdChunks } from "./helpers";

const LOAD_ERROR = "The house would not open. Check your connection and try again.";
const PASTED = "We may sell your personal information to data brokers. Your plan renews automatically.";

test("while the house chunk loads, 'Opening the house…' shows and main is aria-busy (R17.2)", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const release = await holdChunks(page);
  await page.getByLabel(BOX).fill(PASTED);
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByText("Opening the house…")).toBeVisible();
  await expect(page.locator("main#content")).toHaveAttribute("aria-busy", "true");
  release();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
  await expect(page.locator("main#content")).not.toHaveAttribute("aria-busy", "true");
});

test("a blocked house chunk shows the error and Try again; after unblocking, Try again opens the house and keeps the text (R17.3)", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  let blocked = true;
  const chunkRequests: string[] = [];
  await page.route("**/_next/static/chunks/**", (route) => {
    chunkRequests.push(route.request().url());
    return blocked ? route.abort("failed") : route.continue();
  });
  await page.getByLabel(BOX).fill(PASTED);
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByText(LOAD_ERROR)).toBeVisible();
  await expect(page.locator("main#content").getByRole("alert")).toHaveText(LOAD_ERROR);
  await expect(page.locator("main#content")).not.toHaveAttribute("aria-busy", "true");
  const failedAttempts = chunkRequests.length;
  expect(failedAttempts).toBeGreaterThan(0);

  blocked = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
  expect(chunkRequests.length, "Try again really imports again").toBeGreaterThan(failedAttempts);

  // The pasted text was kept through the failure (R17.3) and comes back with Read another policy (R17.4).
  await page.getByRole("button", { name: "Read another policy" }).click();
  await expect(page.getByLabel(BOX)).toHaveValue(PASTED);
});

test("a blocked chunk on a sample shows the error, and Try again opens that sample", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  let blocked = true;
  await page.route("**/_next/static/chunks/**", (route) => (blocked ? route.abort("failed") : route.continue()));
  await page.getByRole("button", { name: /^Open this house: Murkwillow/ }).click();
  await expect(page.getByText(LOAD_ERROR)).toBeVisible();
  blocked = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Sample: Murkwillow Social (a fictional company)")).toBeVisible();
});
