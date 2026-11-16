import { describe, it } from "vitest";
import fc from "fast-check";
import { createRateLimiter } from "./rateLimit";

const RUNS = { numRuns: 1000 };
const WINDOW = 60_000;
const LIMIT = 10;

// Sorted request times over up to 10 minutes, each from one of a few IPs.
const requests = fc
  .array(fc.tuple(fc.integer({ min: 0, max: 600_000 }), fc.constantFrom("a", "b", "c", "unknown")), { maxLength: 300 })
  .map((rs) => [...rs].sort((x, y) => x[0] - y[0]));
// Bursts make the limit bite often: many requests packed into a few seconds.
const bursts = fc
  .array(fc.tuple(fc.integer({ min: 0, max: 90_000 }), fc.constantFrom("a", "b")), { minLength: 20, maxLength: 200 })
  .map((rs) => [...rs].sort((x, y) => x[0] - y[0]));

/** E5: never more than 10 allowed from one IP in any 60-second window, and exactly the sliding-window rule. */
function holds(rs: [number, string][]): boolean {
  let t = 0;
  const rl = createRateLimiter({ now: () => t });
  const allowed = new Map<string, number[]>();
  for (const [time, ip] of rs) {
    t = time;
    const ok = rl.check(ip).ok;
    const mine = allowed.get(ip) ?? [];
    const inWindow = mine.filter((x) => time - x < WINDOW).length;
    if (ok !== inWindow < LIMIT) return false; // allowed exactly when fewer than 10 are in the window
    if (ok) allowed.set(ip, [...mine, time]);
  }
  // Direct check of the bound over every window that starts at an allowed request.
  for (const times of allowed.values()) {
    for (const start of times) {
      if (times.filter((x) => x >= start && x < start + WINDOW).length > LIMIT) return false;
    }
  }
  return true;
}

describe("E5: the rate limiter (R9.1)", () => {
  it("never allows more than 10 per IP in any 60-second window (spread over 10 minutes)", () => {
    fc.assert(fc.property(requests, holds), RUNS);
  });
  it("never allows more than 10 per IP in any 60-second window (bursts)", () => {
    fc.assert(fc.property(bursts, holds), RUNS);
  });
});
