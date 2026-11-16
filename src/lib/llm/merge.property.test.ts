import { describe, it } from "vitest";
import fc from "fast-check";
import type { Finding, RoomId, Severity } from "../analyzer/types";
import { mergeFindings } from "./merge";
import { ROOM_IDS, type LlmFinding } from "./schema";

const RUNS = { numRuns: 1000 };
const severity = fc.constantFrom<Severity>(0, 1, 2, 3);

// Analyzer findings with valid shapes and unique IDs, plus LLM findings whose IDs are drawn
// from those IDs and from random strings (llm-explainer design, E1–E3 generator).
const scenario = fc
  .uniqueArray(fc.nat({ max: 100_000 }), { maxLength: 60 })
  .chain((starts) => {
    const findings = fc.tuple(
      ...starts.map((start) =>
        fc.record({
          id: fc.constant(`c-${start}`),
          room: fc.constantFrom<RoomId>(...ROOM_IDS),
          severity,
          quote: fc.string({ minLength: 1, maxLength: 80 }),
          start: fc.constant(start),
          end: fc.integer({ min: start + 1, max: start + 200 }),
          ruleId: fc.string({ minLength: 1, maxLength: 12 }),
          mitigationId: fc.option(fc.string({ maxLength: 8 }), { nil: null }),
          cancelledMitigationId: fc.option(fc.string({ maxLength: 8 }), { nil: null }),
          explanation: fc.string({ maxLength: 40 }),
          whyItMatters: fc.string({ maxLength: 40 }),
        }),
      ),
    ) as fc.Arbitrary<Finding[]>;
    const ids = starts.map((s) => `c-${s}`);
    const llmId = ids.length > 0 ? fc.oneof(fc.constantFrom(...ids), fc.string({ maxLength: 8 })) : fc.string({ maxLength: 8 });
    const llm: fc.Arbitrary<LlmFinding[]> = fc.array(
      fc.record({
        id: llmId,
        plainEnglish: fc.string({ minLength: 1, maxLength: 40 }),
        whyItMatters: fc.string({ minLength: 1, maxLength: 40 }),
        severity,
      }),
      { maxLength: 80 },
    );
    return fc.tuple(findings, llm);
  });

describe("merge properties", () => {
  it("E1: merging never lowers a severity (R12.2)", () => {
    fc.assert(
      fc.property(scenario, ([findings, llm]) =>
        mergeFindings(findings, llm).every((m, i) => m.severity >= findings[i].severity),
      ),
      RUNS,
    );
  });
  it("E2: merging never changes quote, start, end, room or id (R12.4)", () => {
    fc.assert(
      fc.property(scenario, ([findings, llm]) =>
        mergeFindings(findings, llm).every((m, i) => {
          const f = findings[i];
          return m.quote === f.quote && m.start === f.start && m.end === f.end && m.room === f.room && m.id === f.id;
        }),
      ),
      RUNS,
    );
  });
  it("E3: the merged result has the same IDs in the same order (R12.1, R12.5)", () => {
    fc.assert(
      fc.property(scenario, ([findings, llm]) => {
        const merged = mergeFindings(findings, llm);
        return merged.length === findings.length && merged.every((m, i) => m.id === findings[i].id);
      }),
      RUNS,
    );
  });
});
