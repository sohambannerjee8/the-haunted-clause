import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rateLimit";

function clock(start = 1_000_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms), set: (ms: number) => (t = ms) };
}

describe("createRateLimiter (R9.1, R9.2, R9.4)", () => {
  it("defaults to 10 requests per 60 s and refuses the 11th", () => {
    const c = clock();
    const rl = createRateLimiter({ now: c.now });
    for (let i = 0; i < 10; i++) {
      expect(rl.check("1.2.3.4").ok).toBe(true);
      c.advance(1000);
    }
    expect(rl.check("1.2.3.4").ok).toBe(false);
  });
  it("counts each IP separately", () => {
    const c = clock();
    const rl = createRateLimiter({ now: c.now });
    for (let i = 0; i < 10; i++) rl.check("a");
    expect(rl.check("a").ok).toBe(false);
    expect(rl.check("b").ok).toBe(true);
  });
  it("slides the window: a slot frees exactly 60 s after the oldest counted request", () => {
    const c = clock(0);
    const rl = createRateLimiter({ now: c.now });
    for (let i = 0; i < 10; i++) {
      c.set(i * 1000);
      expect(rl.check("ip").ok).toBe(true);
    }
    c.set(59_999);
    expect(rl.check("ip").ok).toBe(false);
    c.set(60_000); // the request at 0 leaves the window
    expect(rl.check("ip").ok).toBe(true);
    expect(rl.check("ip").ok).toBe(false); // the one at 1,000 is still inside
    c.set(61_000);
    expect(rl.check("ip").ok).toBe(true);
  });
  it("gives Retry-After in whole seconds until the oldest counted request leaves, at least 1", () => {
    const c = clock(0);
    const rl = createRateLimiter({ now: c.now });
    for (let i = 0; i < 10; i++) rl.check("ip");
    c.set(15_500);
    expect(rl.check("ip")).toEqual({ ok: false, retryAfterS: 45 }); // 44.5 s rounds up
    c.set(59_999);
    expect(rl.check("ip")).toEqual({ ok: false, retryAfterS: 1 }); // 1 ms left still says 1
  });
  it("does not count rejected requests", () => {
    const c = clock(0);
    const rl = createRateLimiter({ now: c.now });
    for (let i = 0; i < 10; i++) rl.check("ip");
    for (let i = 0; i < 50; i++) {
      c.advance(1000);
      rl.check("ip"); // refused while blocked
    }
    c.set(60_000);
    // Had the refusals been counted, the client would still be blocked.
    expect(rl.check("ip").ok).toBe(true);
  });
  it("removes stale timestamps", () => {
    const c = clock(0);
    const rl = createRateLimiter({ now: c.now });
    for (let i = 0; i < 5; i++) rl.check("ip");
    c.set(120_000);
    rl.check("ip");
    expect(rl.inspect().get("ip")).toEqual([120_000]);
  });
  it("holds only string keys and arrays of numbers (R11.1)", () => {
    const c = clock();
    const rl = createRateLimiter({ now: c.now });
    rl.check("1.1.1.1");
    rl.check("unknown");
    c.advance(5);
    rl.check("1.1.1.1");
    for (const [k, v] of rl.inspect()) {
      expect(typeof k).toBe("string");
      expect(Array.isArray(v)).toBe(true);
      for (const t of v) expect(typeof t).toBe("number");
    }
    expect([...rl.inspect().keys()].sort()).toEqual(["1.1.1.1", "unknown"]);
  });
  it("evicts the least recently used key when a new key would exceed maxKeys", () => {
    const c = clock();
    const rl = createRateLimiter({ now: c.now, maxKeys: 3 });
    rl.check("a");
    rl.check("b");
    rl.check("c");
    rl.check("a"); // a is now the most recent
    rl.check("d"); // b is the least recently used
    expect([...rl.inspect().keys()].sort()).toEqual(["a", "c", "d"]);
    expect(rl.inspect().size).toBe(3);
  });
  it("defaults to 10,000 keys", () => {
    const rl = createRateLimiter({ now: () => 0 });
    for (let i = 0; i < 10_050; i++) rl.check(`ip-${i}`);
    expect(rl.inspect().size).toBe(10_000);
    expect(rl.inspect().has("ip-0")).toBe(false);
    expect(rl.inspect().has("ip-10049")).toBe(true);
  });
  it("inspect() is a copy, so callers cannot change the counts", () => {
    const rl = createRateLimiter({ now: () => 0 });
    rl.check("ip");
    const view = rl.inspect() as Map<string, number[]>;
    view.get("ip")!.push(1, 2, 3);
    view.clear();
    expect(rl.inspect().get("ip")).toEqual([0]);
  });
});

describe("clientIp (R9.3)", () => {
  const h = (init: Record<string, string>) => new Headers(init);
  it("prefers x-vercel-forwarded-for", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": "9.9.9.9", "x-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2" }))).toBe("9.9.9.9");
  });
  it("then the first comma-separated value of x-forwarded-for, trimmed", () => {
    expect(clientIp(h({ "x-forwarded-for": "  1.1.1.1 , 3.3.3.3, 4.4.4.4", "x-real-ip": "2.2.2.2" }))).toBe("1.1.1.1");
  });
  it("then x-real-ip", () => {
    expect(clientIp(h({ "x-real-ip": " 2.2.2.2 " }))).toBe("2.2.2.2");
  });
  it('then the shared "unknown" key', () => {
    expect(clientIp(h({}))).toBe("unknown");
  });
  it("skips empty values", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": "  ", "x-forwarded-for": " , 5.5.5.5", "x-real-ip": "6.6.6.6" }))).toBe("6.6.6.6");
    expect(clientIp(h({ "x-vercel-forwarded-for": "", "x-forwarded-for": "", "x-real-ip": "" }))).toBe("unknown");
  });
  it("trims x-vercel-forwarded-for too", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": " 9.9.9.9 " }))).toBe("9.9.9.9");
  });
});

describe("rateLimit.ts source (R9.5)", () => {
  it("cites the Vercel request-headers page", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/llm/rateLimit.ts"), "utf8");
    expect(src).toContain("https://vercel.com/docs/headers/request-headers");
  });
});
