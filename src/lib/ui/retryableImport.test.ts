import { describe, expect, it, vi } from "vitest";
import { createRetryableImport } from "./retryableImport";

describe("createRetryableImport (R17.3)", () => {
  it("loads once and caches the result", async () => {
    const loader = vi.fn(async () => ({ value: 1 }));
    const load = createRetryableImport(loader);
    expect(await load()).toEqual({ value: 1 });
    expect(await load()).toEqual({ value: 1 });
    expect(loader).toHaveBeenCalledTimes(1);
  });
  it("shares one pending promise between callers", async () => {
    const loader = vi.fn(async () => "m");
    const load = createRetryableImport(loader);
    await Promise.all([load(), load(), load()]);
    expect(loader).toHaveBeenCalledTimes(1);
  });
  it("forgets a failure, so the next call really imports again", async () => {
    let n = 0;
    const loader = vi.fn(async () => {
      if (++n === 1) throw new Error("chunk failed");
      return "ok";
    });
    const load = createRetryableImport(loader);
    await expect(load()).rejects.toThrow("chunk failed");
    await expect(load()).resolves.toBe("ok");
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
