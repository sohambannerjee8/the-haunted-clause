// Guards for the llm-ui project, which builds with a placeholder key so the opt-in UI shows.
// They prove nothing can reach Google from this project (PLAN_DECISIONS.md C10.18).
import { expect, test } from "./fixtures";

const body = { clauses: [{ id: "c-0", room: "cellar", severity: 2, text: "We may sell your personal information." }] };

test("@llm-ui server guard: an unstubbed explain request returns rules/error within 5 s", async ({ request }) => {
  const started = Date.now();
  const res = await request.post("/api/explain", { data: body, timeout: 5_000 });
  const elapsed = Date.now() - started;
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ source: "rules", reason: "error", findings: [] });
  expect(elapsed).toBeLessThan(5_000);
});

test("@llm-ui browser guard: the page is built with llmAvailable true and makes no request off localhost", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main#content")).toHaveAttribute("data-llm-available", "true");
  await page.waitForLoadState("networkidle");
  // The automatic browserGuard fixture fails this test if any request left localhost.
});

test("no-key build: llmAvailable is false", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main#content")).toHaveAttribute("data-llm-available", "false");
});
