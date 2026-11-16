// analyze(): the analyzer's single entry point (clause-analyzer R6, R7, R8).
// No try/catch: every step is written so that it cannot throw on any string, and the properties prove it.
import { classifyClause } from "./classifier";
import { likelyNonEnglish } from "./language";
import { hauntScore } from "./score";
import { splitClauses } from "./splitter";
import type { AnalyzeResult, Finding } from "./types";

export const MAX_INPUT_LENGTH = 50_000;

export function analyze(text: string): AnalyzeResult {
  if (text.length > MAX_INPUT_LENGTH) {
    return { ok: false, error: { code: "too-long", length: text.length, limit: MAX_INPUT_LENGTH } };
  }
  const clauses = splitClauses(text);
  const findings: Finding[] = [];
  for (const clause of clauses) {
    const f = classifyClause(clause, text);
    if (f !== null) findings.push(f);
  }
  return { ok: true, clauses, findings, score: hauntScore(findings), likelyNonEnglish: likelyNonEnglish(text) };
}
