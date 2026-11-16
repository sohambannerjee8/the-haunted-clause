// The medium's precomputed readings for the samples (llm-explainer R16.8). Read from the committed
// JSON, validated with Zod once, and never fetched. A bad file or entry gives no LLM findings, so the
// UI shows the rule texts (the merge keeps each finding's rule text when it has no LLM finding).
import { SampleExplanationsFile, type LlmFinding } from "../llm/schema";
import committed from "./sample-explanations.json";
import type { SampleId } from "./meta";

export function readingFrom(file: unknown, id: SampleId): LlmFinding[] {
  const parsed = SampleExplanationsFile.safeParse(file);
  return parsed.success ? parsed.data.samples[id].llmFindings : [];
}

let cache: SampleExplanationsFile | null | undefined;

export function sampleReading(id: SampleId): LlmFinding[] {
  if (cache === undefined) {
    const parsed = SampleExplanationsFile.safeParse(committed);
    cache = parsed.success ? parsed.data : null;
  }
  return cache ? cache.samples[id].llmFindings : [];
}
