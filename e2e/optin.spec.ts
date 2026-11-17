// Asking the medium about pasted text, in the llm-ui project (llmAvailable true). Every
// /api/explain call is answered by a page.route stub; the server behind it has a dead proxy
// (PLAN_DECISIONS.md C10.18). Haunted-house-ui R3.2, R14, R15.2.
import type { Page, Route } from "@playwright/test";
import { analyze } from "../src/lib/analyzer/analyze";
import { hauntScore } from "../src/lib/analyzer/score";
import { OPT_IN_NOTICE } from "../src/lib/llm/privacy";
import { SAMPLE_META } from "../src/lib/samples/meta";
import { expect, test } from "./fixtures";

const UNFLAGGED = ["Welcome to the Example Tea service.", "Thanks for reading."];
const PASTED = `${UNFLAGGED[0]} We may sell your personal information to data brokers. Your subscription renews automatically each year. ${UNFLAGGED[1]}`;
const analysed = analyze(PASTED);
if (!analysed.ok) throw new Error("too long");
const FINDINGS = analysed.findings;

async function analysePasted(page: Page) {
  await page.goto("/");
  await page.getByLabel("Paste a Terms & Conditions or privacy policy").fill(PASTED);
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
}
const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: "application/json", headers: { "cache-control": "no-store" }, body: JSON.stringify(body) });

test("@llm-ui the button and notice show for pasted text, and nothing is sent before the press (R14.1, R14.7, R3.2)", async ({ page }) => {
  const calls: string[] = [];
  await page.route("**/api/explain", (route) => {
    calls.push(route.request().postData() ?? "");
    return json(route, 200, { source: "rules", reason: "error", findings: [] });
  });
  expect(FINDINGS.length).toBe(2);
  for (const u of UNFLAGGED) expect(FINDINGS.some((f) => f.quote.includes(u))).toBe(false);
  await analysePasted(page);
  await expect(page.getByRole("button", { name: "Ask the medium" })).toBeVisible();
  await expect(page.getByText(OPT_IN_NOTICE)).toBeVisible();
  await expect(page.getByRole("link", { name: "Google's Gemini API terms" })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(calls).toEqual([]);
});

test("@llm-ui the button is hidden for samples, and samples never call the route (R14.3, R15.2)", async ({ page }) => {
  const calls: string[] = [];
  page.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/explain")) calls.push(r.url());
  });
  for (const m of SAMPLE_META) {
    await page.goto("/");
    await page.getByRole("button", { name: `Open this house: ${m.company}` }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Inside the house" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ask the medium" })).toHaveCount(0);
  }
  expect(calls).toEqual([]);
});

test("@llm-ui success: the body holds only flagged-clause text; badges and score update (R14.4, R14.5, R14.7)", async ({ page }) => {
  const raised = FINDINGS.find((f) => f.severity < 3)!;
  const bodies: { clauses: { id: string; text: string }[] }[] = [];
  await page.route("**/api/explain", (route) => {
    bodies.push(route.request().postDataJSON());
    return json(route, 200, {
      source: "llm",
      findings: [{ id: raised.id, plainEnglish: "The medium says this renews by itself.", whyItMatters: "You may pay for a year you did not want.", severity: 3 }],
    });
  });
  await analysePasted(page);
  const before = hauntScore(FINDINGS);
  await expect(page.getByTestId("haunt-score")).toHaveText(new RegExp(`^${before} · `));
  await page.getByRole("button", { name: "Ask the medium" }).click();
  await expect(page.getByText("The medium has spoken.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask the medium" })).toHaveCount(0);

  expect(bodies).toHaveLength(1);
  const sent = bodies[0].clauses;
  expect(sent.map((c) => c.id)).toEqual(FINDINGS.map((f) => f.id));
  for (const c of sent) expect(FINDINGS.some((f) => f.quote.includes(c.text))).toBe(true);
  const raw = JSON.stringify(bodies[0]);
  for (const u of UNFLAGGED) expect(raw).not.toContain(u);

  const after = hauntScore(FINDINGS.map((f) => (f.id === raised.id ? { ...f, severity: 3 as const } : f)));
  await expect(page.getByTestId("haunt-score")).toHaveText(new RegExp(`^${after} · `));
  const ghost = page.locator(`button.hc-ghost[data-finding-id="${raised.id}"]`);
  await expect(ghost).toHaveAttribute("data-severity", "3");
  await ghost.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Medium's reading", { exact: true })).toBeVisible();
  await expect(dialog.getByText("The medium says this renews by itself.")).toBeVisible();
  await expect(dialog.getByText(`The medium raised this from ${raised.severity} to 3.`)).toBeVisible();
});

for (const [name, answer, message] of [
  ["rate-limited", (r: Route) => json(r, 429, { source: "rules", reason: "rate-limited", findings: [] }), "The medium needs a rest. Try again in a minute."],
  ["timeout", (r: Route) => json(r, 200, { source: "rules", reason: "timeout", findings: [] }), "The medium took too long. Showing the rule reading."],
  ["network abort", (r: Route) => r.abort("failed"), "The medium is silent right now. Showing the rule reading."],
] as const) {
  test(`@llm-ui ${name}: the rule reading stays and the message shows (R14.6)`, async ({ page }) => {
    await page.route("**/api/explain", answer);
    await analysePasted(page);
    const score = hauntScore(FINDINGS);
    await page.getByRole("button", { name: "Ask the medium" }).click();
    await expect(page.getByText(message)).toBeVisible();
    await expect(page.getByRole("button", { name: "Ask the medium" })).toBeEnabled();
    await expect(page.getByTestId("haunt-score")).toHaveText(new RegExp(`^${score} · `));
    await page.locator(`button.hc-ghost[data-finding-id="${FINDINGS[0].id}"]`).click();
    await expect(page.getByRole("dialog").getByText("Rule reading", { exact: true })).toBeVisible();
  });
}
