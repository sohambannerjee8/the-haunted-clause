// Same-origin check against the request's own host (llm-explainer R2.4, PLAN_DECISIONS.md C10.11).
// No domain is configured, so it works on localhost, every Vercel preview URL and production.

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true; // curl and server-to-server calls; the rate limit still applies
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase(); // "null" and garbage throw
  } catch {
    return false;
  }
  let ownHost = request.headers.get("host");
  if (!ownHost) {
    try {
      ownHost = new URL(request.url).host;
    } catch {
      return false;
    }
  }
  return originHost === ownHost.toLowerCase();
}
