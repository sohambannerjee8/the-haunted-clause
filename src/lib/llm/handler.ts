import "server-only";
// The POST /api/explain handler (llm-explainer R1–R10). Built by a factory so tests can pass mocks.
// Steps, in order: Origin, body size, rate limit, JSON + schema, key, provider with timeout, output.
import { sameOrigin } from "./origin";
import { parseLlmOutput } from "./parse";
import { isTimeoutError, LLM_TIMEOUT_MS, withTimeout, type Provider } from "./provider";
import { clientIp, type RateLimiter } from "./rateLimit";
import { ExplainRequest, type ExplainResponse, type Reason } from "./schema";

/** 40 clauses of 1,500 characters need at most 180,000 bytes of UTF-8 text, plus JSON overhead (R2.1). */
export const MAX_BODY_BYTES = 256_000;

export interface HandlerDeps {
  provider: Provider;
  rateLimiter: RateLimiter;
  now: () => number;
  log: (line: string) => void;
  isKeySet: () => boolean;
  /** Defaults to 15 s (R5.1). */
  timeoutMs?: number;
}

/** Every response goes through here: JSON, `Cache-Control: no-store` (R1.4), and a typed body (R8.1). */
export function jsonResponse(status: number, body: ExplainResponse, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

export const rulesBody = (reason: Reason): ExplainResponse => ({ source: "rules", reason, findings: [] });

class BodyTooLarge extends Error {}

/** Read the body as bytes, stopping as soon as it passes the cap. */
async function readCapped(request: Request): Promise<Uint8Array> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new BodyTooLarge();
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      throw new BodyTooLarge();
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    bytes.set(c, at);
    at += c.byteLength;
  }
  return bytes;
}

function parseJson(bytes: Uint8Array): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false };
  }
}

export function createExplainHandler(deps: HandlerDeps): (request: Request) => Promise<Response> {
  const timed = withTimeout(deps.provider, deps.timeoutMs ?? LLM_TIMEOUT_MS);

  return async function handle(request: Request): Promise<Response> {
    const started = deps.now();
    let clauseCount = 0;
    // The single log line per request (R10.1). Only the outcome, a count and a duration (R10.2).
    const respond = (status: number, body: ExplainResponse, headers?: Record<string, string>) => {
      const outcome = body.source === "llm" ? "llm" : body.reason;
      try {
        deps.log(`explain outcome=${outcome} clauses=${clauseCount} ms=${Math.max(0, Math.round(deps.now() - started))}`);
      } catch {
        // A failing logger must not break the response.
      }
      return jsonResponse(status, body, headers);
    };

    try {
      if (!sameOrigin(request)) return respond(403, rulesBody("bad-request"));

      let bytes: Uint8Array;
      try {
        bytes = await readCapped(request);
      } catch {
        return respond(400, rulesBody("bad-request"));
      }

      const limit = deps.rateLimiter.check(clientIp(request.headers));
      if (!limit.ok) return respond(429, rulesBody("rate-limited"), { "retry-after": String(limit.retryAfterS) });

      const json = parseJson(bytes);
      if (!json.ok) return respond(400, rulesBody("bad-request"));
      const parsed = ExplainRequest.safeParse(json.value);
      if (!parsed.success) return respond(400, rulesBody("bad-request"));
      const { clauses } = parsed.data;
      clauseCount = clauses.length;

      if (!deps.isKeySet()) return respond(200, rulesBody("no-key"));

      let text: string;
      try {
        text = await timed.explain(clauses);
      } catch (e) {
        return respond(200, rulesBody(isTimeoutError(e) ? "timeout" : "error"));
      }

      const out = parseLlmOutput(text, new Set(clauses.map((c) => c.id)));
      if (!out.ok) return respond(200, rulesBody("invalid"));
      return respond(200, { source: "llm", findings: out.findings });
    } catch {
      return respond(200, rulesBody("error")); // R7.2: never throw
    }
  };
}
