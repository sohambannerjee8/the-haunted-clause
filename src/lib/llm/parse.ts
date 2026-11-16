// Parse and validate the model's raw text (llm-explainer R6). Never throws, for any input (R6.5).
import { LlmOutput, type LlmFinding } from "./schema";

export type ParseResult = { ok: true; findings: LlmFinding[] } | { ok: false };

export function parseLlmOutput(text: unknown, requestIds: ReadonlySet<string>): ParseResult {
  if (typeof text !== "string") return { ok: false };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false };
  }
  const parsed = LlmOutput.safeParse(value);
  if (!parsed.success) return { ok: false };
  const seen = new Set<string>();
  const findings: LlmFinding[] = [];
  for (const f of parsed.data.findings) {
    if (!requestIds.has(f.id) || seen.has(f.id)) continue; // unknown IDs dropped, first duplicate kept (R6.2)
    seen.add(f.id);
    findings.push(f);
  }
  return findings.length > 0 ? { ok: true, findings } : { ok: false }; // nothing left is invalid (R6.3)
}
