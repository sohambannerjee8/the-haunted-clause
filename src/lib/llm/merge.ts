// Merge the analyzer's findings with the medium's findings (llm-explainer R12).
// The severity can only rise, and the quote and its position always come from the analyzer.
import type { Finding, Severity } from "../analyzer/types";
import type { LlmFinding } from "./schema";

export type ExplainedFinding = Finding & { readonly source: "llm" | "rules" };

export function mergeFindings(findings: readonly Finding[], llm: readonly LlmFinding[]): ExplainedFinding[] {
  const byId = new Map<string, LlmFinding>();
  for (const l of llm) if (!byId.has(l.id)) byId.set(l.id, l);
  return findings.map((f): ExplainedFinding => {
    const l = byId.get(f.id);
    if (!l) return { ...f, source: "rules" };
    return {
      ...f,
      severity: Math.max(f.severity, l.severity) as Severity,
      explanation: l.plainEnglish,
      whyItMatters: l.whyItMatters,
      source: "llm",
    };
  });
}
