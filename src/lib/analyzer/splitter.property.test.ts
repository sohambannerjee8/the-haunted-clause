import fc from "fast-check";
import { describe, it } from "vitest";
import { anyString, overCapString, policyLike, utf16String } from "./arbitraries.test-util";
import { splitClauses } from "./splitter";

const RUNS = { numRuns: 1000 };
const anyInput = fc.oneof(anyString, utf16String, policyLike);

/** P6: splitting and joining loses nothing; spans are contiguous; no whitespace-only clause when text exists. */
function p6Holds(input: string): boolean {
  const clauses = splitClauses(input);
  if (input.length === 0) return clauses.length === 0;
  if (clauses.map((c) => c.text).join("") !== input) return false;
  if (clauses[0].start !== 0 || clauses[clauses.length - 1].end !== input.length) return false;
  for (let i = 0; i < clauses.length; i++) {
    const c = clauses[i];
    if (c.end <= c.start || c.text !== input.slice(c.start, c.end)) return false;
    if (i > 0 && c.start !== clauses[i - 1].end) return false;
  }
  const hasText = /\S/.test(input);
  return !hasText || clauses.every((c) => /\S/.test(c.text));
}

/** P8 (clauses): IDs are c-<start> and unique. */
function p8Holds(input: string): boolean {
  const clauses = splitClauses(input);
  const ids = clauses.map((c) => c.id);
  return clauses.every((c) => c.id === `c-${c.start}`) && new Set(ids).size === ids.length;
}

describe("splitter properties", () => {
  it("P6: join equals input, spans contiguous, no whitespace-only clause (R1.1, R1.2, R1.5, R1.13)", () => {
    fc.assert(fc.property(anyInput, p6Holds), RUNS);
  });

  // 15 s instead of Vitest's 5 s default (PLAN_DECISIONS.md C23.1): 1,000 inputs over 50,000 characters each
  // took up to 5.7 s under coverage when other suites ran at the same time. Same runs, same assertions.
  it("P6 over the cap: the same holds for inputs longer than 50,000 (R1.12)", { timeout: 15_000 }, () => {
    fc.assert(fc.property(overCapString, p6Holds), RUNS);
  });

  it("P8: clause IDs are c-<start> and unique (R1.6)", () => {
    fc.assert(fc.property(anyInput, p8Holds), RUNS);
  });

  it("P8 over the cap (R1.6 with R1.12)", () => {
    fc.assert(fc.property(overCapString, p8Holds), RUNS);
  });
});
