import { afterEach, describe, expect, it, vi } from "vitest";
import type { Finding } from "../analyzer/types";
import { buildExplainRequest } from "./request";

const finding = (start: number): Finding => ({
  id: `c-${start}`,
  room: "cellar",
  severity: 2,
  quote: "We may sell your personal information.",
  start,
  end: start + 38,
  ruleId: "cellar-sell",
  mitigationId: null,
  cancelledMitigationId: null,
  explanation: "e",
  whyItMatters: "w",
});
const findings = [finding(0), finding(100)];
const llmBody = {
  source: "llm",
  findings: [{ id: "c-0", plainEnglish: "They can sell it.", whyItMatters: "Strangers get it.", severity: 3 }],
};
const reply = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("client.ts on import (R14.3)", () => {
  it("makes no fetch when imported", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => reply(200, llmBody));
    vi.resetModules();
    await import("./client");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("requestExplanations (R14)", () => {
  it("returns the LLM findings on 200 llm, posting the built request (R14.1)", async () => {
    const { requestExplanations } = await import("./client");
    const fetchImpl = vi.fn<typeof fetch>(async () => reply(200, llmBody));
    expect(await requestExplanations(findings, { fetchImpl })).toEqual(llmBody);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("/api/explain");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual(buildExplainRequest(findings));
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
  it("keeps the server's reason on 429 rate-limited", async () => {
    const { requestExplanations } = await import("./client");
    const fetchImpl = vi.fn<typeof fetch>(async () => reply(429, { source: "rules", reason: "rate-limited", findings: [] }));
    expect(await requestExplanations(findings, { fetchImpl })).toEqual({ source: "rules", reason: "rate-limited", findings: [] });
  });
  it("keeps the server's reason on a 200 rules body", async () => {
    const { requestExplanations } = await import("./client");
    const fetchImpl = vi.fn<typeof fetch>(async () => reply(200, { source: "rules", reason: "no-key", findings: [] }));
    expect(await requestExplanations(findings, { fetchImpl })).toEqual({ source: "rules", reason: "no-key", findings: [] });
  });
  it("gives invalid for a 500 with a bad body (R14.2)", async () => {
    const { requestExplanations } = await import("./client");
    for (const body of ["<html>oops</html>", { error: "x" }, ""]) {
      const fetchImpl = vi.fn<typeof fetch>(async () => reply(500, body));
      expect(await requestExplanations(findings, { fetchImpl })).toEqual({ source: "rules", reason: "invalid", findings: [] });
    }
  });
  it("gives invalid for a 200 body that does not match the schema", async () => {
    const { requestExplanations } = await import("./client");
    const fetchImpl = vi.fn<typeof fetch>(async () => reply(200, { source: "llm", findings: [{ id: "c-0" }] }));
    expect(await requestExplanations(findings, { fetchImpl })).toEqual({ source: "rules", reason: "invalid", findings: [] });
  });
  it("gives invalid for an llm body with a status other than 200", async () => {
    const { requestExplanations } = await import("./client");
    const fetchImpl = vi.fn<typeof fetch>(async () => reply(503, llmBody));
    expect(await requestExplanations(findings, { fetchImpl })).toEqual({ source: "rules", reason: "invalid", findings: [] });
  });
  it("gives error for a network failure (R14.2)", async () => {
    const { requestExplanations } = await import("./client");
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(await requestExplanations(findings, { fetchImpl })).toEqual({ source: "rules", reason: "error", findings: [] });
  });
  it("gives error after the 20 s client timeout, and aborts the request (R14.2)", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { requestExplanations, CLIENT_TIMEOUT_MS } = await import("./client");
    expect(CLIENT_TIMEOUT_MS).toBe(20_000);
    let signal: AbortSignal | undefined;
    const fetchImpl = vi.fn<typeof fetch>(
      (_u, init) =>
        new Promise<Response>((_resolve, reject) => {
          signal = init?.signal ?? undefined;
          signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    let result: unknown = "pending";
    void requestExplanations(findings, { fetchImpl }).then((r) => (result = r));
    await vi.advanceTimersByTimeAsync(19_999);
    expect(result).toBe("pending");
    await vi.advanceTimersByTimeAsync(1);
    expect(result).toEqual({ source: "rules", reason: "error", findings: [] });
    expect(signal?.aborted).toBe(true);
  });
  it("makes no fetch when there are no findings (R13.3)", async () => {
    const { requestExplanations } = await import("./client");
    const fetchImpl = vi.fn<typeof fetch>(async () => reply(200, llmBody));
    expect(await requestExplanations([], { fetchImpl })).toEqual({ source: "rules", reason: "invalid", findings: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("uses the global fetch by default", async () => {
    const { requestExplanations } = await import("./client");
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => reply(200, llmBody));
    expect(await requestExplanations(findings)).toEqual(llmBody);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
