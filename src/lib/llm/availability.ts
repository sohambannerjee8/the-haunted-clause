import "server-only";

/** True only when GEMINI_API_KEY is set to something other than whitespace (llm-explainer R3.2). */
export function isLlmAvailable(): boolean {
  return (process.env.GEMINI_API_KEY ?? "").trim().length > 0;
}
