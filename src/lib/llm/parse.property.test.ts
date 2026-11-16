import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { parseLlmOutput } from "./parse";
import { LlmFinding } from "./schema";

const RUNS = { numRuns: 1000 };
const ids = new Set(["c-0", "c-12", "c-300"]);

function stringify(v: unknown): string {
  try {
    return String(JSON.stringify(v));
  } catch {
    return String(v);
  }
}

/** The result is either a failure or a valid, filtered, de-duplicated list. */
function wellFormed(r: ReturnType<typeof parseLlmOutput>): boolean {
  if (!r.ok) return Object.keys(r).length === 1;
  const seen = new Set<string>();
  for (const f of r.findings) {
    if (!ids.has(f.id) || seen.has(f.id) || !LlmFinding.safeParse(f).success) return false;
    seen.add(f.id);
  }
  return r.findings.length > 0;
}

// A generator that sometimes produces valid output, so both branches are exercised.
const nearlyValid = fc.record({
  findings: fc.array(
    fc.record({
      id: fc.oneof(fc.constantFrom(...ids), fc.string()),
      plainEnglish: fc.oneof(fc.string({ minLength: 1, maxLength: 20 }), fc.string({ maxLength: 500 })),
      whyItMatters: fc.string({ minLength: 0, maxLength: 450 }),
      severity: fc.oneof(fc.integer({ min: 0, max: 3 }), fc.integer(), fc.double()),
    }),
    { maxLength: 45 },
  ),
});

describe("E4 (parser part): any input falls back without throwing (R6.5)", () => {
  it("fc.anything(), passed raw", () => {
    fc.assert(fc.property(fc.anything(), (v) => wellFormed(parseLlmOutput(v, ids))), RUNS);
  });
  it("fc.anything(), stringified", () => {
    fc.assert(fc.property(fc.anything(), (v) => wellFormed(parseLlmOutput(stringify(v), ids))), RUNS);
  });
  it("fc.jsonValue(), stringified", () => {
    fc.assert(fc.property(fc.jsonValue(), (v) => wellFormed(parseLlmOutput(JSON.stringify(v), ids))), RUNS);
  });
  it('fc.string({ unit: "binary" })', () => {
    fc.assert(fc.property(fc.string({ unit: "binary" }), (s) => wellFormed(parseLlmOutput(s, ids))), RUNS);
  });
  it("nearly valid model output", () => {
    let okCount = 0;
    fc.assert(
      fc.property(nearlyValid, (v) => {
        const r = parseLlmOutput(JSON.stringify(v), ids);
        if (r.ok) okCount++;
        return wellFormed(r);
      }),
      RUNS,
    );
    // The generator must reach the success branch, or the property says little.
    expect(okCount).toBeGreaterThan(0);
  });
});
