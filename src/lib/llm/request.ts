// Build the explain request from the analyzer's findings only (llm-explainer R13).
// Each text is a prefix of a finding's quote, so nothing outside the quotes is sent (R13.4).
import type { Finding } from "../analyzer/types";
import { MAX_CLAUSE_TEXT, MAX_CLAUSES, type ExplainRequest } from "./schema";

/** Cut to at most `max` UTF-16 units without leaving a lone high surrogate at the end. */
function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  const last = text.charCodeAt(max - 1);
  return text.slice(0, last >= 0xd800 && last <= 0xdbff ? max - 1 : max);
}

export function buildExplainRequest(findings: readonly Finding[]): ExplainRequest | null {
  if (findings.length === 0) return null;
  const chosen = [...findings]
    .sort((a, b) => b.severity - a.severity || a.start - b.start)
    .slice(0, MAX_CLAUSES)
    .sort((a, b) => a.start - b.start);
  return {
    clauses: chosen.map((f) => ({ id: f.id, room: f.room, severity: f.severity, text: cut(f.quote, MAX_CLAUSE_TEXT) })),
  };
}
