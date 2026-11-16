import { describe, it } from "vitest";
import fc from "fast-check";
import { analyze } from "../analyzer/analyze";
import { bigString, policyLike } from "../analyzer/arbitraries.test-util";
import { buildExplainRequest } from "./request";
import { ExplainRequest } from "./schema";

const RUNS = { numRuns: 1000 };

/** E6: the request holds only quoted input (R13.1, R13.2, R13.4). */
function onlyQuotedInput(input: string): boolean {
  const r = analyze(input);
  if (!r.ok) return true;
  const req = buildExplainRequest(r.findings);
  if (r.findings.length === 0) return req === null;
  if (req === null || req.clauses.length > 40 || req.clauses.length !== Math.min(40, r.findings.length)) return false;
  if (!ExplainRequest.safeParse(req).success) return false;
  const byId = new Map(r.findings.map((f) => [f.id, f]));
  let lastStart = -1;
  for (const c of req.clauses) {
    const f = byId.get(c.id);
    if (!f || c.room !== f.room || c.severity !== f.severity) return false;
    if (!f.quote.startsWith(c.text) || c.text.length > 1500 || !input.includes(c.text)) return false;
    if (f.start <= lastStart) return false; // input order
    lastStart = f.start;
  }
  return true;
}

describe("E6: the request builder sends only quoted input", () => {
  it("on analyze() output for policyLike text", () => {
    fc.assert(fc.property(policyLike, onlyQuotedInput), RUNS);
  });
  it("on analyze() output for large texts up to the cap (exercises the 40-clause limit)", () => {
    fc.assert(fc.property(bigString, onlyQuotedInput), RUNS);
  });
});
