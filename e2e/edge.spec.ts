// Edge states in the browser (haunted-house-ui R2.2–R2.4, R16; PLAN.md Phase 5). No-key project.
import { ROOMS } from "../src/lib/analyzer/rooms";
import { expect, test } from "./fixtures";
import { analyzeText, BOX, JAPANESE, NO_RISK, ONLY_WISPS, paste, SPANISH } from "./helpers";

const ENGLISH_ONLY = "This app reads English only. Results for other languages may be missing or wrong.";

test("empty input: the message, aria-invalid, and the input screen stays (R2.4, R16.1)", async ({ page }) => {
  await page.goto("/");
  for (const text of ["", "   \n\t  "]) {
    await page.getByLabel(BOX).fill(text);
    await page.getByRole("button", { name: "Analyze" }).click();
    const msg = page.getByText("Paste a policy or pick a sample first.");
    await expect(msg).toBeVisible();
    await expect(page.getByLabel(BOX)).toHaveAttribute("aria-invalid", "true");
    const describedBy = (await page.getByLabel(BOX).getAttribute("aria-describedby"))!.split(" ");
    expect(describedBy).toContain(await msg.getAttribute("id"));
    await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toHaveCount(0);
  }
});

test("exactly 50,000 characters are analyzed and the house opens (R16.2)", async ({ page }) => {
  const sentence = "We may sell your personal information to data brokers. ";
  const text = sentence.repeat(Math.ceil(50_000 / sentence.length)).slice(0, 50_000);
  expect(text.length).toBe(50_000);
  await page.goto("/");
  await page.getByLabel(BOX).fill(text);
  await expect(page.getByText("50,000 / 50,000 characters")).toBeVisible();
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
  await expect(page.locator('section[data-room="cellar"] button.hc-ghost').first()).toBeVisible();
});

test("the 50,001st typed character is blocked (R2.2)", async ({ page }) => {
  await page.goto("/");
  const box = page.getByLabel(BOX);
  await box.fill("x".repeat(50_000));
  await box.press("End");
  await box.pressSequentially("yz");
  expect((await box.inputValue()).length).toBe(50_000);
  await expect(page.getByText("50,000 / 50,000 characters")).toBeVisible();
});

test("a 60,000-character paste is cut to 50,000 with the notice (R2.3)", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(BOX).click();
  await paste(page, "p".repeat(60_000));
  await expect(page.getByLabel(BOX)).toHaveValue("p".repeat(50_000));
  const notice = page.getByText("Your text was cut at 50,000 characters.");
  await expect(notice).toBeVisible();
  await expect(page.locator('[role="status"]', { has: notice })).toHaveCount(1);
});

for (const [name, text] of [
  ["Spanish", SPANISH],
  ["Japanese", JAPANESE],
] as const) {
  test(`a ${name} paragraph shows the English-only notice (R16.3)`, async ({ page }) => {
    await analyzeText(page, text);
    await expect(page.getByText(ENGLISH_ONLY)).toBeVisible();
  });
}

test("an English policy does not show the English-only notice", async ({ page }) => {
  await analyzeText(page, NO_RISK);
  await expect(page.getByText(ENGLISH_ONLY)).toHaveCount(0);
});

test('no risky clauses: "No ghosts here", every room Quiet and "0 · Mostly quiet" (R16.4)', async ({ page }) => {
  await analyzeText(page, NO_RISK);
  await expect(page.getByText("No ghosts here. None of the clauses matched a risky pattern, but that does not make the policy safe.")).toBeVisible();
  await expect(page.getByTestId("haunt-score")).toHaveText("0 · Mostly quiet");
  await expect(page.locator("button.hc-ghost")).toHaveCount(0);
  for (const r of ROOMS) await expect(page.locator(`section[data-room="${r.id}"] [data-room-status]`)).toHaveText("Quiet");
  await expect(page.getByText("Only calm wisps here.")).toHaveCount(0);
});

test('a wisps-only policy shows "Only calm wisps here." (R16.5)', async ({ page }) => {
  await analyzeText(page, ONLY_WISPS);
  await expect(page.getByText("Only calm wisps here.")).toBeVisible();
  const severities = await page.locator("button.hc-ghost").evaluateAll((els) => els.map((e) => e.getAttribute("data-severity")));
  expect(severities.length).toBeGreaterThan(0);
  expect(new Set(severities)).toEqual(new Set(["0"]));
  await expect(page.getByText(/^No ghosts here\./)).toHaveCount(0);
});
