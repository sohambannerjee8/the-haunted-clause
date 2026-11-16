// /api/explain against the production build (`next build && next start`) with no key
// (llm-explainer R1.3, R1.4, R3.1; PLAN_DECISIONS.md C10.22).
import { expect, test } from "@playwright/test";

const body = { clauses: [{ id: "c-0", room: "cellar", severity: 2, text: "We may sell your personal information." }] };

test("POST with no key returns 200 rules/no-key with Cache-Control: no-store", async ({ request }) => {
  const res = await request.post("/api/explain", { data: body });
  expect(res.status()).toBe(200);
  expect(res.headers()["cache-control"]).toBe("no-store");
  expect(await res.json()).toEqual({ source: "rules", reason: "no-key", findings: [] });
});

test("POST with a bad body returns 400 rules/bad-request with Cache-Control: no-store", async ({ request }) => {
  const res = await request.post("/api/explain", { data: "{", headers: { "content-type": "application/json" } });
  expect(res.status()).toBe(400);
  expect(res.headers()["cache-control"]).toBe("no-store");
  expect(await res.json()).toEqual({ source: "rules", reason: "bad-request", findings: [] });
});

for (const method of ["GET", "PUT", "PATCH", "DELETE"] as const) {
  test(`${method} returns 405 with Allow: POST and Cache-Control: no-store`, async ({ request }) => {
    // Twice, so a prerendered or cached response would show up on the second call.
    for (let i = 0; i < 2; i++) {
      const res = await request.fetch("/api/explain", { method });
      expect(res.status()).toBe(405);
      expect(res.headers()["allow"]).toBe("POST");
      expect(res.headers()["cache-control"]).toBe("no-store");
      expect(await res.json()).toEqual({ source: "rules", reason: "bad-request", findings: [] });
    }
  });
}
