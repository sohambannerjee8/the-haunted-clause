// axe scans of every state in haunted-house-ui R19.1, failing on serious or critical issues.
// Colour contrast (R19.2) is a serious rule in axe, so it is covered too.
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { AXE_TAGS, expect, test } from "./fixtures";
import { analyzeText, NO_RISK, openSample, RISKY, SPANISH, waitForFades } from "./helpers";

async function scan(page: Page, label: string) {
  await waitForFades(page); // a half-faded text would be measured at partial opacity
  const r = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), label).toEqual([]);
  expect(r.passes.length, `${label}: axe ran rules`).toBeGreaterThan(0);
}

test("axe: input screen, and with the empty-input error", async ({ page }) => {
  await page.goto("/");
  await scan(page, "input");
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByText("Paste a policy or pick a sample first.")).toBeVisible();
  await scan(page, "empty-input error");
});

for (const id of ["mild", "average", "terrible"] as const) {
  test(`axe: house for the ${id} sample`, async ({ page }) => {
    await openSample(page, id);
    await scan(page, `house ${id}`);
  });
}

test("axe: an open detail panel, and Lights on mode", async ({ page }) => {
  await openSample(page, "terrible");
  await page.locator('button.hc-ghost[data-severity="3"]').first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await scan(page, "detail panel");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Lights on" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Lights on" })).toBeVisible();
  await scan(page, "lights on");
});

test("axe: the no-ghosts state and the non-English notice", async ({ page }) => {
  await analyzeText(page, NO_RISK);
  await expect(page.getByText(/^No ghosts here\./)).toBeVisible();
  await scan(page, "no ghosts");
  await analyzeText(page, SPANISH);
  await expect(page.getByText(/^This app reads English only\./)).toBeVisible();
  await scan(page, "non-English");
});

test("@llm-ui axe: the opt-in panel (llmAvailable true)", async ({ page }) => {
  await page.route("**/api/explain", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ source: "rules", reason: "error", findings: [] }) }),
  );
  await analyzeText(page, RISKY);
  await expect(page.getByRole("button", { name: "Ask the medium" })).toBeVisible();
  await scan(page, "opt-in panel");
  await page.getByRole("button", { name: "Ask the medium" }).click();
  await expect(page.getByText("The medium is silent right now. Showing the rule reading.")).toBeVisible();
  await scan(page, "opt-in failure message");
});
