import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTimeoutError, LLM_TIMEOUT_MS, runWithTimeout, TimeoutError, withTimeout, type Provider } from "./provider";
import type { ExplainClause } from "./schema";

const clauses: ExplainClause[] = [{ id: "c-0", room: "cellar", severity: 2, text: "We may sell your data." }];

/** A provider that resolves after `ms`, recording the signal it was given. */
function slowProvider(ms: number, value = '{"findings":[]}') {
  const seen: { signal?: AbortSignal } = {};
  const provider: Provider = {
    explain: (_c, { signal }) => {
      seen.signal = signal;
      return new Promise((resolve) => setTimeout(() => resolve(value), ms));
    },
  };
  return { provider, seen };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("withTimeout (R5)", () => {
  it("uses 15 seconds", () => {
    expect(LLM_TIMEOUT_MS).toBe(15_000);
  });

  it("returns the text of a call that resolves at 14.9 s", async () => {
    const { provider, seen } = slowProvider(14_900, "ok");
    const p = withTimeout(provider, LLM_TIMEOUT_MS).explain(clauses);
    await vi.advanceTimersByTimeAsync(14_900);
    await expect(p).resolves.toBe("ok");
    expect(seen.signal?.aborted).toBe(false);
  });

  it("times out a call that would resolve at 15.1 s, and aborts its signal (R5.1)", async () => {
    const { provider, seen } = slowProvider(15_100);
    const p = withTimeout(provider, LLM_TIMEOUT_MS).explain(clauses);
    const settled = p.then(
      () => "resolved",
      (e: unknown) => e,
    );
    await vi.advanceTimersByTimeAsync(15_000);
    const result = await settled;
    expect(result).toBeInstanceOf(TimeoutError);
    expect(isTimeoutError(result)).toBe(true);
    expect(seen.signal?.aborted).toBe(true);
  });

  it("settles by 15.5 s even when the provider ignores the signal (R5.2)", async () => {
    const provider: Provider = { explain: () => new Promise<string>(() => {}) }; // never settles
    let outcome: unknown = "pending";
    withTimeout(provider, LLM_TIMEOUT_MS)
      .explain(clauses)
      .catch((e: unknown) => (outcome = e));
    await vi.advanceTimersByTimeAsync(15_500);
    expect(outcome).toBeInstanceOf(TimeoutError);
  });

  it("clears its timer after success", async () => {
    const { provider } = slowProvider(10);
    const p = withTimeout(provider, LLM_TIMEOUT_MS).explain(clauses);
    await vi.advanceTimersByTimeAsync(10);
    await p;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("passes a provider error through unchanged and clears its timer", async () => {
    const boom = new Error("provider failed");
    const provider: Provider = { explain: () => Promise.reject(boom) };
    await expect(withTimeout(provider, LLM_TIMEOUT_MS).explain(clauses)).rejects.toBe(boom);
    expect(vi.getTimerCount()).toBe(0);
    expect(isTimeoutError(boom)).toBe(false);
  });

  it("turns a synchronous throw into a rejection", async () => {
    const provider: Provider = {
      explain: () => {
        throw new Error("sync");
      },
    };
    await expect(withTimeout(provider, LLM_TIMEOUT_MS).explain(clauses)).rejects.toThrow("sync");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("passes the clauses through", async () => {
    const explain = vi.fn<Provider["explain"]>(async () => "x");
    await withTimeout({ explain }, 1000).explain(clauses);
    expect(explain).toHaveBeenCalledWith(clauses, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});

describe("runWithTimeout", () => {
  it("times out any async task the same way", async () => {
    let outcome: unknown = "pending";
    runWithTimeout(() => new Promise<number>(() => {}), 500).catch((e: unknown) => (outcome = e));
    await vi.advanceTimersByTimeAsync(500);
    expect(outcome).toBeInstanceOf(TimeoutError);
  });
});
