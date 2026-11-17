// Runs in the house chunk only: the analyzer, the sample texts and the sample readings are not
// part of the input screen's first load (haunted-house-ui R17.1).
import { analyze } from "../../lib/analyzer/analyze";
import type { AnalyzeOk, Finding } from "../../lib/analyzer/types";
import { mergeFindings, type ExplainedFinding } from "../../lib/llm/merge";
import type { SampleId } from "../../lib/samples/meta";

export type Source = { kind: "pasted" } | { kind: "sample"; id: SampleId };

export interface Prepared {
  readonly input: string;
  readonly source: Source;
  readonly result: AnalyzeOk;
  /** The analyzer's own findings, kept so the panel can say what the medium raised (R6.4). */
  readonly ruleFindings: readonly Finding[];
  /** What is shown: the rule findings merged with any medium's reading. */
  readonly findings: readonly ExplainedFinding[];
  readonly company: string | null;
}

export type PrepareResult = { ok: true; prepared: Prepared } | { ok: false; error: "too-long" };

export async function prepare(source: Source, pastedText: string): Promise<PrepareResult> {
  let input = pastedText;
  let company: string | null = null;
  let reading: Parameters<typeof mergeFindings>[1] = [];
  if (source.kind === "sample") {
    const [{ SAMPLES }, { sampleReading }] = await Promise.all([
      import("../../lib/samples"),
      import("../../lib/samples/explanations"),
    ]);
    const sample = SAMPLES.find((s) => s.id === source.id)!;
    input = sample.text;
    company = sample.company;
    reading = sampleReading(source.id); // committed JSON; never fetched (R15.1, R15.2)
  }
  const result = analyze(input);
  if (!result.ok) return { ok: false, error: "too-long" };
  return {
    ok: true,
    prepared: { input, source, result, ruleFindings: result.findings, findings: mergeFindings(result.findings, reading), company },
  };
}
