import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { analyze, MAX_INPUT_LENGTH } from "./analyze";
import { anyString, bigString, overCapString, policyLike, riskyClause, utf16String } from "./arbitraries.test-util";
import { ROOM_IDS } from "./rooms";
import { RULES } from "./rules";
import { MAX_REACHABLE_SCORE } from "./score";
import type { AnalyzeOk } from "./types";

const RUNS = { numRuns: 1000 };
const ok = (text: string): AnalyzeOk => {
  const r = analyze(text);
  if (!r.ok) throw new Error("expected ok");
  return r;
};

describe("analyze properties", () => {
  it("P1 through analyze(): the score is a whole number from 0 to 100, at most 97 (R5.2)", () => {
    fc.assert(
      fc.property(policyLike, (text) => {
        const { score } = ok(text);
        return Number.isInteger(score) && score >= 0 && score <= 100 && score <= MAX_REACHABLE_SCORE;
      }),
      RUNS,
    );
  });

  it("P2: adding a risky clause at a clause boundary never lowers the score (R5.5)", () => {
    fc.assert(
      fc.property(policyLike, riskyClause, (t, r) => {
        const base = t.slice(0, MAX_INPUT_LENGTH - r.length - 2);
        return ok(`${base}\n\n${r}`).score >= ok(base).score;
      }),
      RUNS,
    );
  });

  it("P3: every finding quotes the input exactly, non-empty, with no edge whitespace (R4.1, R4.2)", () => {
    fc.assert(
      fc.property(fc.oneof(policyLike, utf16String), (input) =>
        ok(input).findings.every(
          (f) => f.quote === input.slice(f.start, f.end) && f.quote.length > 0 && f.quote.trim() === f.quote,
        ),
      ),
      RUNS,
    );
  });

  it("P4: never throws for any string up to the cap, including empty text and emoji (R6.1)", () => {
    fc.assert(fc.property(fc.oneof(anyString, utf16String, policyLike, bigString), (input) => analyze(input).ok === true), RUNS);
  });

  it("P4 over the cap: always the typed too-long result, never a throw (R6.2, R8.2)", () => {
    fc.assert(
      fc.property(overCapString, (input) => {
        const r = analyze(input);
        return !r.ok && r.error.code === "too-long" && r.error.length === input.length && r.error.limit === 50_000;
      }),
      RUNS,
    );
  });

  it("P5: the same input gives a deeply equal result, even after analysing another input (R7.1, R7.3)", () => {
    fc.assert(
      fc.property(policyLike, policyLike, (x, y) => {
        const first = analyze(x);
        analyze(y);
        expect(analyze(x)).toEqual(first);
        return true;
      }),
      RUNS,
    );
  });

  it("P8 (findings): at most one finding per clause; finding IDs are unique clause IDs (R2.1, R4.3)", () => {
    fc.assert(
      fc.property(policyLike, (input) => {
        const r = ok(input);
        const clauseIds = new Set(r.clauses.map((c) => c.id));
        const ids = r.findings.map((f) => f.id);
        return new Set(ids).size === ids.length && ids.every((id) => clauseIds.has(id));
      }),
      RUNS,
    );
  });

  it("P9: every finding's room is one of the eight room IDs (R10.2)", () => {
    fc.assert(fc.property(fc.oneof(policyLike, utf16String), (input) => ok(input).findings.every((f) => ROOM_IDS.includes(f.room))), RUNS);
  });

  it("P10: severity never exceeds the room's unmasked rule severity; a cancelled mitigation gives at least 1 (R3.1, R3.11)", () => {
    fc.assert(
      fc.property(policyLike, (input) =>
        ok(input).findings.every((f) => {
          const raw = Math.max(0, ...RULES.filter((r) => r.room === f.room && r.pattern.test(f.quote)).map((r) => r.severity));
          return f.severity <= raw && (f.cancelledMitigationId === null || f.severity >= 1);
        }),
      ),
      RUNS,
    );
  });
});
