// Zod schemas for the explain route and the sample explanations file (llm-explainer design, "Schemas").
// Shared by the browser client, the server handler and the precompute script. Reads no environment.
import { z } from "zod";

export const ROOM_IDS = ["cellar", "portraits", "vault", "locked-door", "court", "mirror", "trapdoor", "stairs"] as const;
export const REASONS = ["no-key", "timeout", "invalid", "rate-limited", "error", "bad-request"] as const;
export type Reason = (typeof REASONS)[number];

/** Request limits (R2.3). */
export const MAX_CLAUSES = 40;
export const MAX_CLAUSE_TEXT = 1500;
/** Limit on each model text after trimming (R6.1). */
export const MAX_LLM_TEXT = 400;

const Severity = z.int().min(0).max(3);

export const ExplainClause = z.strictObject({
  id: z.string().regex(/^c-\d+$/),
  room: z.enum(ROOM_IDS),
  severity: Severity,
  text: z.string().min(1).max(MAX_CLAUSE_TEXT),
});
export type ExplainClause = z.infer<typeof ExplainClause>;

export const ExplainRequest = z.strictObject({
  clauses: z
    .array(ExplainClause)
    .min(1)
    .max(MAX_CLAUSES)
    .refine((cs) => new Set(cs.map((c) => c.id)).size === cs.length, "duplicate id"),
});
export type ExplainRequest = z.infer<typeof ExplainRequest>;

const LlmText = z.string().trim().min(1).max(MAX_LLM_TEXT);
export const LlmFinding = z.strictObject({
  id: z.string(),
  plainEnglish: LlmText,
  whyItMatters: LlmText,
  severity: Severity,
});
export type LlmFinding = z.infer<typeof LlmFinding>;

export const LlmOutput = z.strictObject({ findings: z.array(LlmFinding).max(MAX_CLAUSES) });

export const ExplainResponse = z.discriminatedUnion("source", [
  z.strictObject({ source: z.literal("llm"), findings: z.array(LlmFinding).min(1).max(MAX_CLAUSES) }),
  z.strictObject({ source: z.literal("rules"), reason: z.enum(REASONS), findings: z.array(LlmFinding).max(0) }),
]);
export type ExplainResponse = z.infer<typeof ExplainResponse>;

// Gemini's responseJsonSchema does not support minLength, maxLength or pattern, so the schema sent
// to Gemini is a looser twin of LlmOutput. The strict LlmOutput above still validates every answer.
const GeminiFinding = z.strictObject({
  id: z.string(),
  plainEnglish: z.string(),
  whyItMatters: z.string(),
  severity: Severity,
});
const GeminiOutput = z.strictObject({ findings: z.array(GeminiFinding).max(MAX_CLAUSES) });

function withoutDollarSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const { $schema: _drop, ...rest } = schema;
  void _drop;
  return rest;
}
export const GEMINI_OUTPUT_JSON_SCHEMA: Readonly<Record<string, unknown>> = Object.freeze(
  withoutDollarSchema(z.toJSONSchema(GeminiOutput) as Record<string, unknown>),
);

// The sample explanations file (R16.7, R16.9).
export const SAMPLE_IDS = ["mild", "average", "terrible"] as const;
export const SampleEntry = z.union([
  z.strictObject({
    source: z.literal("rules"),
    model: z.null(),
    findingIds: z.array(z.string()),
    llmFindings: z.array(LlmFinding).max(0),
  }),
  z.strictObject({
    source: z.literal("llm"),
    model: z.string().min(1),
    findingIds: z.array(z.string()),
    llmFindings: z.array(LlmFinding),
  }),
]);
export type SampleEntry = z.infer<typeof SampleEntry>;

export const SampleExplanationsFile = z.strictObject({
  version: z.literal(1),
  samples: z.strictObject({ mild: SampleEntry, average: SampleEntry, terrible: SampleEntry }),
});
export type SampleExplanationsFile = z.infer<typeof SampleExplanationsFile>;
