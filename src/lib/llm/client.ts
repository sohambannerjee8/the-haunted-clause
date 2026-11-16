// Browser client for POST /api/explain (llm-explainer R14). No side effects on import (R14.3).
// The haunted-house-ui spec calls it only from the opt-in control for pasted text, never for samples.
import type { Finding } from "../analyzer/types";
import { buildExplainRequest } from "./request";
import { ExplainResponse, type Reason } from "./schema";

export const CLIENT_TIMEOUT_MS = 20_000;

const rules = (reason: Reason): ExplainResponse => ({ source: "rules", reason, findings: [] });

/** Never throws: every failure becomes a rules result with a reason code (R14.2). */
export async function requestExplanations(
  findings: readonly Finding[],
  { fetchImpl = (...args: Parameters<typeof fetch>) => fetch(...args), timeoutMs = CLIENT_TIMEOUT_MS }: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<ExplainResponse> {
  const request = buildExplainRequest(findings);
  if (request === null) return rules("invalid"); // nothing flagged, nothing sent (R13.3)

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetchImpl("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
    } catch {
      return rules("error"); // network failure or client timeout
    }
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return rules(controller.signal.aborted ? "error" : "invalid");
    }
    const parsed = ExplainResponse.safeParse(body);
    if (!parsed.success) return rules("invalid");
    if (parsed.data.source === "llm" && res.status !== 200) return rules("invalid");
    return parsed.data; // a rules body keeps the server's reason, for example rate-limited
  } finally {
    clearTimeout(timer);
  }
}
