import "server-only";
// The Gemini provider (llm-explainer R4, R11.2). Signatures checked in
// node_modules/@google/genai/dist/genai.d.ts (3.3.0): Models.generateContent, GenerateContentConfig
// (systemInstruction, responseMimeType, responseJsonSchema, thinkingConfig, store, abortSignal).
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { SYSTEM_INSTRUCTION, renderClauses } from "./prompt";
import type { Provider } from "./provider";
import { GEMINI_OUTPUT_JSON_SCHEMA } from "./schema";

export const DEFAULT_MODEL = "gemini-4-hydrogen";

/** GEMINI_MODEL when set, otherwise the default. Read on every call. */
export function defaultModel(): string {
  return (process.env.GEMINI_MODEL ?? "").trim() || DEFAULT_MODEL;
}

export function modelSource(): "GEMINI_MODEL" | "default" {
  return (process.env.GEMINI_MODEL ?? "").trim() ? "GEMINI_MODEL" : "default";
}

/** The key is read at call time, never at module load (R4.5). */
function readKey(): string {
  const key = (process.env.GEMINI_API_KEY ?? "").trim();
  if (!key) throw new Error("no key");
  return key;
}

export function createGeminiProvider(): Provider {
  return {
    async explain(clauses, { signal }) {
      const ai = new GoogleGenAI({ apiKey: readKey() });
      const res = await ai.models.generateContent({
        model: defaultModel(),
        contents: renderClauses(clauses),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseJsonSchema: GEMINI_OUTPUT_JSON_SCHEMA,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          temperature: 0.2,
          maxOutputTokens: 8192,
          store: false, // R11.2: not kept in Google AI Studio request logs
          abortSignal: signal,
        },
      });
      return res.text ?? "";
    },
  };
}

/**
 * One real `models.get` call, used by the precompute script's model check (R16.12, R16.13).
 * Rejects with the SDK's ApiError (which carries `status`) when Google refuses the model or the key.
 */
export async function fetchModel(model: string, signal: AbortSignal): Promise<unknown> {
  const ai = new GoogleGenAI({ apiKey: readKey() });
  return ai.models.get({ model, config: { abortSignal: signal } });
}
