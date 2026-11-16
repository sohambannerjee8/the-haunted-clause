import { afterEach, describe, expect, it, vi } from "vitest";
import { createExplainHandler, MAX_BODY_BYTES, type HandlerDeps } from "./handler";
import type { Provider } from "./provider";
import { createRateLimiter } from "./rateLimit";
import { ExplainResponse } from "./schema";

const CLAUSE_TEXT = "We may sell your personal information to data brokers.";
const MODEL_TEXT = "The company can sell what it knows about you.";
const IP = "203.0.113.77";
const fakeKey = () => "AI" + "za" + "q".repeat(35);

const goodRequest = {
  clauses: [
    { id: "c-0", room: "cellar", severity: 2, text: CLAUSE_TEXT },
    { id: "c-60", room: "court", severity: 3, text: "You waive any right to a class action." },
  ],
};
const goodOutput = JSON.stringify({
  findings: [
    { id: "c-0", plainEnglish: MODEL_TEXT, whyItMatters: "Strangers may build a profile of you.", severity: 3 },
    { id: "c-999", plainEnglish: "Invented.", whyItMatters: "Invented.", severity: 1 },
  ],
});

function post(body: BodyInit | null, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/explain", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": IP, ...headers },
    body,
  });
}
const json = (v: unknown) => post(JSON.stringify(v));

function setup(over: Partial<HandlerDeps> = {}) {
  const explain = vi.fn<Provider["explain"]>(async () => goodOutput);
  const log = vi.fn<(line: string) => void>();
  let t = 1_000;
  const deps: HandlerDeps = {
    provider: { explain },
    rateLimiter: createRateLimiter({ now: () => t }),
    now: () => t,
    log,
    isKeySet: () => true,
    ...over,
  };
  return { handler: createExplainHandler(deps), explain, log, tick: (ms: number) => (t += ms) };
}

async function read(res: Response) {
  const body = await res.json();
  expect(ExplainResponse.safeParse(body).success, JSON.stringify(body)).toBe(true);
  expect(res.headers.get("cache-control")).toBe("no-store");
  expect(res.headers.get("content-type")).toMatch(/^application\/json/);
  return body;
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the four required cases", () => {
  it("good output: 200 llm with the validated, filtered findings (R4.1, R6.4)", async () => {
    const { handler, explain } = setup();
    const res = await handler(json(goodRequest));
    expect(res.status).toBe(200);
    expect(await read(res)).toEqual({
      source: "llm",
      findings: [{ id: "c-0", plainEnglish: MODEL_TEXT, whyItMatters: "Strangers may build a profile of you.", severity: 3 }],
    });
    expect(explain).toHaveBeenCalledTimes(1);
    expect(explain.mock.calls[0][0]).toEqual(goodRequest.clauses);
  });
  it("malformed output: 200 rules/invalid (R6.3)", async () => {
    for (const text of ["not json", "{}", JSON.stringify({ findings: [{ id: "c-0" }] }), JSON.stringify({ findings: [] })]) {
      const { handler } = setup({ provider: { explain: async () => text } });
      const res = await handler(json(goodRequest));
      expect(res.status).toBe(200);
      expect(await read(res)).toEqual({ source: "rules", reason: "invalid", findings: [] });
    }
  });
  it("timeout: 200 rules/timeout after 15 s, with the signal aborted (R5.1)", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    let signal: AbortSignal | undefined;
    const { handler } = setup({
      provider: {
        explain: (_c, opts) => {
          signal = opts.signal;
          return new Promise<string>(() => {});
        },
      },
    });
    const pending = handler(json(goodRequest));
    await vi.advanceTimersByTimeAsync(14_999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const res = await pending;
    expect(res.status).toBe(200);
    expect(await read(res)).toEqual({ source: "rules", reason: "timeout", findings: [] });
    expect(signal?.aborted).toBe(true);
  });
  it("no key: 200 rules/no-key and the provider is not called (R3.1)", async () => {
    const { handler, explain } = setup({ isKeySet: () => false });
    const res = await handler(json(goodRequest));
    expect(res.status).toBe(200);
    expect(await read(res)).toEqual({ source: "rules", reason: "no-key", findings: [] });
    expect(explain).not.toHaveBeenCalled();
  });
});

describe("other outcomes", () => {
  it("provider error: 200 rules/error (R7.1)", async () => {
    const { handler } = setup({ provider: { explain: async () => Promise.reject(new Error(`boom ${CLAUSE_TEXT}`)) } });
    const res = await handler(json(goodRequest));
    expect(res.status).toBe(200);
    expect(await read(res)).toEqual({ source: "rules", reason: "error", findings: [] });
  });
  it("a provider that throws synchronously: 200 rules/error (R7.2)", async () => {
    const { handler } = setup({
      provider: {
        explain: () => {
          throw new Error("sync");
        },
      },
    });
    expect(await read(await handler(json(goodRequest)))).toEqual({ source: "rules", reason: "error", findings: [] });
  });
  it("the 11th request in a minute: 429 rules/rate-limited with Retry-After, provider not called (R9.2)", async () => {
    const { handler, explain, tick } = setup();
    for (let i = 0; i < 10; i++) {
      expect((await handler(json(goodRequest))).status).toBe(200);
      tick(1000);
    }
    explain.mockClear();
    const res = await handler(json(goodRequest));
    expect(res.status).toBe(429);
    expect(await read(res)).toEqual({ source: "rules", reason: "rate-limited", findings: [] });
    expect(res.headers.get("retry-after")).toBe("50");
    expect(explain).not.toHaveBeenCalled();
  });
  it("no-key requests are counted by the rate limiter too", async () => {
    const { handler } = setup({ isKeySet: () => false });
    for (let i = 0; i < 10; i++) expect((await handler(json(goodRequest))).status).toBe(200);
    expect((await handler(json(goodRequest))).status).toBe(429);
  });
  it("malformed requests are rate limited too (the limit runs before JSON parsing)", async () => {
    const { handler } = setup();
    for (let i = 0; i < 10; i++) expect((await handler(post("{"))).status).toBe(400);
    expect((await handler(post("{"))).status).toBe(429);
  });
});

describe("request validation (R2)", () => {
  it(`a body over ${MAX_BODY_BYTES} bytes: 400 bad-request, not counted, provider not called (R2.1)`, async () => {
    expect(MAX_BODY_BYTES).toBe(256_000);
    const { handler, explain } = setup();
    const big = JSON.stringify(goodRequest) + " ".repeat(MAX_BODY_BYTES);
    for (let i = 0; i < 12; i++) {
      const res = await handler(post(big));
      expect(res.status).toBe(400);
      expect(await read(res)).toEqual({ source: "rules", reason: "bad-request", findings: [] });
    }
    expect(explain).not.toHaveBeenCalled();
    // Oversized bodies did not use up the rate limit.
    expect((await handler(json(goodRequest))).status).toBe(200);
  });
  it("counts bytes, not characters: 128,001 two-byte characters are over the cap", async () => {
    const { handler } = setup();
    const res = await handler(post("é".repeat(128_001)));
    expect(res.status).toBe(400);
  });
  it("a body of exactly 256,000 bytes passes the size check", async () => {
    const { handler, explain } = setup();
    const base = JSON.stringify(goodRequest);
    const res = await handler(post(base + " ".repeat(MAX_BODY_BYTES - base.length)));
    expect(res.status).toBe(200);
    expect(explain).toHaveBeenCalledTimes(1);
  });
  it("a Content-Length over the cap is refused before the body is read", async () => {
    const { handler, explain } = setup();
    const fake = {
      url: "http://localhost:3000/api/explain",
      method: "POST",
      headers: new Headers({ "content-length": String(MAX_BODY_BYTES + 1) }),
      body: null,
      bodyUsed: false,
    } as unknown as Request;
    const res = await handler(fake);
    expect(res.status).toBe(400);
    expect(explain).not.toHaveBeenCalled();
  });
  it("bad JSON: 400 bad-request (R2.2)", async () => {
    const { handler, explain } = setup();
    for (const body of ["", "{", "nope", "\u0000", new Uint8Array([0xff, 0xfe, 0x00])]) {
      const res = await handler(post(body));
      expect(res.status).toBe(400);
      expect(await read(res)).toEqual({ source: "rules", reason: "bad-request", findings: [] });
    }
    expect(explain).not.toHaveBeenCalled();
  });
  it("schema mismatch: 400 bad-request (R2.3)", async () => {
    const { handler, explain } = setup();
    for (const body of [{}, { clauses: [] }, { clauses: [{ ...goodRequest.clauses[0], id: "x" }] }, { ...goodRequest, extra: 1 }, null, [1]]) {
      const res = await handler(json(body));
      expect(res.status).toBe(400);
      expect(await read(res)).toEqual({ source: "rules", reason: "bad-request", findings: [] });
    }
    expect(explain).not.toHaveBeenCalled();
  });
  it("Origin mismatch: 403 bad-request, provider not called (R2.4)", async () => {
    const { handler, explain } = setup();
    for (const origin of ["https://evil.example", "null"]) {
      const res = await handler(post(JSON.stringify(goodRequest), { origin, host: "localhost:3000" }));
      expect(res.status).toBe(403);
      expect(await read(res)).toEqual({ source: "rules", reason: "bad-request", findings: [] });
    }
    expect(explain).not.toHaveBeenCalled();
  });
  it("a matching Origin is accepted", async () => {
    const { handler } = setup();
    const res = await handler(post(JSON.stringify(goodRequest), { origin: "http://localhost:3000", host: "localhost:3000" }));
    expect(res.status).toBe(200);
  });
});

describe("logging (R10)", () => {
  it("writes exactly one line per request with the outcome, clause count and duration only (R10.1)", async () => {
    const { handler, log, tick } = setup({
      provider: {
        explain: async () => {
          tick(1234);
          return goodOutput;
        },
      },
    });
    await handler(json(goodRequest));
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toBe("explain outcome=llm clauses=2 ms=1234");
  });
  it("logs the reason code and 0 clauses for a rejected request", async () => {
    const { handler, log } = setup();
    await handler(post("{"));
    expect(log.mock.calls).toEqual([["explain outcome=bad-request clauses=0 ms=0"]]);
  });
  it("a console spy shows no clause text, model text, IP or key in any output (R10.2)", async () => {
    vi.stubEnv("GEMINI_API_KEY", fakeKey());
    const outputs: string[] = [];
    for (const m of ["log", "info", "warn", "error", "debug"] as const) {
      vi.spyOn(console, m).mockImplementation((...args: unknown[]) => {
        outputs.push(args.map((a) => (a instanceof Error ? `${a.message} ${a.stack}` : String(a))).join(" "));
      });
    }
    const providers: Provider["explain"][] = [
      async () => goodOutput,
      async () => `garbage ${CLAUSE_TEXT}`,
      async () => {
        throw new Error(`failed on ${CLAUSE_TEXT} with ${fakeKey()}`);
      },
    ];
    for (const explain of providers) {
      const { handler } = setup({ provider: { explain }, log: (line) => console.info(line) });
      await handler(json(goodRequest));
      await handler(post("{" + CLAUSE_TEXT));
    }
    const { handler } = setup({ isKeySet: () => false, log: (line) => console.info(line) });
    await handler(json(goodRequest));
    vi.unstubAllEnvs();

    expect(outputs.length).toBe(7);
    const all = outputs.join("\n");
    for (const secret of [CLAUSE_TEXT, "data brokers", MODEL_TEXT, IP, fakeKey(), "garbage", "failed on"]) {
      expect(all).not.toContain(secret);
    }
    for (const line of outputs) expect(line).toMatch(/^explain outcome=[a-z-]+ clauses=\d+ ms=\d+$/);
  });
});

describe("status codes (R8.2)", () => {
  it("maps each outcome to its status", async () => {
    const cases: [Partial<HandlerDeps>, Request, number, string][] = [
      [{}, json(goodRequest), 200, "llm"],
      [{ isKeySet: () => false }, json(goodRequest), 200, "no-key"],
      [{ provider: { explain: async () => "x" } }, json(goodRequest), 200, "invalid"],
      [{ provider: { explain: async () => Promise.reject(new Error()) } }, json(goodRequest), 200, "error"],
      [{}, post("{"), 400, "bad-request"],
      [{}, post("{}", { origin: "https://evil.example", host: "localhost:3000" }), 403, "bad-request"],
    ];
    for (const [over, request, status, outcome] of cases) {
      const { handler } = setup(over);
      const res = await handler(request);
      expect(res.status).toBe(status);
      const body = await read(res);
      expect(body.source === "llm" ? "llm" : body.reason).toBe(outcome);
    }
  });
  it("turns an unexpected failure inside the handler into 200 rules/error (R7.2)", async () => {
    const { handler } = setup({
      rateLimiter: {
        check: () => {
          throw new Error("limiter broke");
        },
        inspect: () => new Map(),
      },
    });
    const res = await handler(json(goodRequest));
    expect(res.status).toBe(200);
    expect(await read(res)).toEqual({ source: "rules", reason: "error", findings: [] });
  });
});
