import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { createExplainHandler } from "./handler";
import type { Provider } from "./provider";
import { createRateLimiter } from "./rateLimit";
import { ExplainResponse, ROOM_IDS } from "./schema";

const RUNS = { numRuns: 1000 };

/** The status table in R8.2. */
function statusMatches(status: number, body: ExplainResponse): boolean {
  if (body.source === "llm") return status === 200;
  switch (body.reason) {
    case "rate-limited":
      return status === 429;
    case "bad-request":
      return status === 400 || status === 403 || status === 405;
    default:
      return status === 200;
  }
}

function handlerWith(explain: Provider["explain"], isKeySet = true) {
  return createExplainHandler({
    provider: { explain },
    rateLimiter: createRateLimiter({ now: () => 0, limit: Number.MAX_SAFE_INTEGER }),
    now: () => 0,
    log: () => {},
    isKeySet: () => isKeySet,
    timeoutMs: 1, // a hanging provider times out at once; the 15 s value is tested in handler.test.ts
  });
}

async function check(res: Response): Promise<boolean> {
  if (res.headers.get("cache-control") !== "no-store") return false;
  const parsed = ExplainResponse.safeParse(await res.json());
  return parsed.success && statusMatches(res.status, parsed.data);
}

const post = (body: BodyInit) => new Request("http://localhost/api/explain", { method: "POST", body });

const validClauses = fc
  .uniqueArray(fc.nat({ max: 99_999 }), { minLength: 1, maxLength: 40 })
  .chain((starts) =>
    fc.tuple(
      ...starts.map((s) =>
        fc.record({
          id: fc.constant(`c-${s}`),
          room: fc.constantFrom(...ROOM_IDS),
          severity: fc.integer({ min: 0, max: 3 }),
          text: fc.string({ minLength: 1, maxLength: 200 }),
        }),
      ),
    ),
  );
const validRequest = validClauses.map((clauses) => JSON.stringify({ clauses }));
const goodBody = JSON.stringify({ clauses: [{ id: "c-0", room: "cellar", severity: 1, text: "We may sell your data." }] });

// Bodies: valid requests, random JSON and random bytes.
const anyBody: fc.Arbitrary<BodyInit> = fc.oneof(
  validRequest,
  fc.jsonValue().map((v) => JSON.stringify(v)),
  fc.uint8Array({ maxLength: 400 }),
  fc.string({ unit: "binary", maxLength: 400 }),
);

// Provider behaviours: resolve with any string, reject, or hang.
type Behaviour = { kind: "resolve"; text: string } | { kind: "reject"; error: unknown } | { kind: "hang" };
const anyBehaviour: fc.Arbitrary<Behaviour> = fc.oneof(
  fc.oneof(fc.string({ unit: "binary" }), fc.jsonValue().map((v) => JSON.stringify(v))).map((text) => ({ kind: "resolve" as const, text })),
  validClauses.map((cs) =>
    ({
      kind: "resolve" as const,
      text: JSON.stringify({ findings: cs.map((c) => ({ id: c.id, plainEnglish: "Plain.", whyItMatters: "Why.", severity: c.severity })) }),
    }),
  ),
  fc.anything().map((error) => ({ kind: "reject" as const, error })),
  fc.constant({ kind: "hang" as const }),
);
const behave = (b: Behaviour): Provider["explain"] => () =>
  b.kind === "resolve" ? Promise.resolve(b.text) : b.kind === "reject" ? Promise.reject(b.error) : new Promise<string>(() => {});

function stringify(v: unknown): string {
  try {
    return String(JSON.stringify(v));
  } catch {
    return String(v);
  }
}

describe("E4 (handler part): any model text falls back to rules without throwing", () => {
  for (const [name, arb] of [
    ["fc.anything()", fc.anything().map(stringify)],
    ["fc.jsonValue()", fc.jsonValue().map((v) => JSON.stringify(v))],
    ['fc.string({ unit: "binary" })', fc.string({ unit: "binary" })],
  ] as const) {
    it(`${name}: 200 with a body matching ExplainResponse`, async () => {
      await fc.assert(
        fc.asyncProperty(arb, async (text) => {
          const res = await handlerWith(async () => text)(post(goodBody));
          return res.status === 200 && (await check(res));
        }),
        RUNS,
      );
    });
  }
});

// A valid request paired with a provider that answers some of that request's own IDs, so the
// success path is reached; mixed with independent bodies and behaviours.
const matched: fc.Arbitrary<[BodyInit, Behaviour]> = validClauses.chain((cs) =>
  fc.subarray(cs, { minLength: 1 }).map((answered): [BodyInit, Behaviour] => [
    JSON.stringify({ clauses: cs }),
    {
      kind: "resolve",
      text: JSON.stringify({ findings: answered.map((c) => ({ id: c.id, plainEnglish: "Plain.", whyItMatters: "Why.", severity: c.severity })) }),
    },
  ]),
);
const scenario: fc.Arbitrary<[BodyInit, Behaviour]> = fc.oneof(matched, fc.tuple(anyBody, anyBehaviour));

describe("E7: every response matches ExplainResponse and the R8.2 status table", () => {
  it("for any body and any provider behaviour", async () => {
    let llmSeen = 0;
    await fc.assert(
      fc.asyncProperty(scenario, fc.boolean(), async ([body, behaviour], keySet) => {
        const res = await handlerWith(behave(behaviour), keySet)(post(body));
        const clone = res.clone();
        const ok = await check(res);
        if (ok && (await clone.json()).source === "llm") llmSeen++;
        return ok;
      }),
      RUNS,
    );
    // The success path must be reached, or the property says little about it.
    expect(llmSeen).toBeGreaterThan(0);
  });
});
