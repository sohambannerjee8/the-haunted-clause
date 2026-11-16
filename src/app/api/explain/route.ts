// POST /api/explain: the only server route (llm-explainer R1). No `runtime` export: with Cache
// Components on, Next.js 16 runs route handlers on Node.js and rejects that export.
import { connection } from "next/server";
import { isLlmAvailable } from "@/lib/llm/availability";
import { createGeminiProvider } from "@/lib/llm/gemini";
import { createExplainHandler, jsonResponse, rulesBody } from "@/lib/llm/handler";
import { createRateLimiter } from "@/lib/llm/rateLimit";

/** 15 s model timeout plus overhead. Vercel Hobby allows up to 300 s. */
export const maxDuration = 30;

// One limiter per server instance: best-effort, reset on cold start (R9.4, docs/DEPLOY.md).
const rateLimiter = createRateLimiter({ now: Date.now });

export const POST = createExplainHandler({
  provider: createGeminiProvider(),
  rateLimiter,
  now: Date.now,
  log: (line) => console.info(line),
  isKeySet: isLlmAvailable,
});

/** 405 for every other method. `await connection()` keeps it a request-time response (R1.3, R1.4). */
async function methodNotAllowed(): Promise<Response> {
  await connection();
  return jsonResponse(405, rulesBody("bad-request"), { allow: "POST" });
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
