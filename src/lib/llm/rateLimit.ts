import "server-only";
// In-memory, per-instance, sliding-window rate limit (llm-explainer R9). Best-effort: each server
// instance keeps its own counts, counts reset on a cold start, and instances do not share counts.
// Only IP strings and timestamps are held (R11.1).

export type RateCheck = { ok: true } | { ok: false; retryAfterS: number };

export interface RateLimiter {
  check(ip: string): RateCheck;
  /** A copy of the current state, for tests. */
  inspect(): ReadonlyMap<string, readonly number[]>;
}

export function createRateLimiter({
  limit = 10,
  windowMs = 60_000,
  maxKeys = 10_000,
  now,
}: {
  limit?: number;
  windowMs?: number;
  maxKeys?: number;
  now: () => number;
}): RateLimiter {
  const hits = new Map<string, number[]>(); // insertion order = recency
  return {
    check(ip) {
      const t = now();
      const list = (hits.get(ip) ?? []).filter((x) => t - x < windowMs); // drop stale timestamps
      hits.delete(ip); // re-inserted below, which marks it most recent
      if (list.length >= limit) {
        hits.set(ip, list); // a refused request is not counted
        return { ok: false, retryAfterS: Math.max(1, Math.ceil((list[0] + windowMs - t) / 1000)) };
      }
      list.push(t);
      hits.set(ip, list);
      if (hits.size > maxKeys) hits.delete(hits.keys().next().value!); // least recently used
      return { ok: true };
    },
    inspect() {
      return new Map([...hits].map(([k, v]) => [k, [...v]]));
    },
  };
}

// Client IP order, per https://vercel.com/docs/headers/request-headers (re-read 16 Nov 2026):
// Vercel overwrites x-forwarded-for and does not forward external IPs, to prevent spoofing;
// x-vercel-forwarded-for is identical but is not overwritten by a proxy placed in front of Vercel;
// x-real-ip is identical to x-forwarded-for. With none of them, all requests share one bucket.
export function clientIp(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for")?.trim();
  if (vercel) return vercel;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}
