import { afterEach, describe, expect, it, vi } from "vitest";
import { isLlmAvailable } from "./availability";

afterEach(() => vi.unstubAllEnvs());

describe("isLlmAvailable (R3.2)", () => {
  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["whitespace", "  \t\n "],
  ])("is false when the key is %s", (_label, value) => {
    vi.stubEnv("GEMINI_API_KEY", value);
    expect(isLlmAvailable()).toBe(false);
  });
  it("is true when a key is set", () => {
    vi.stubEnv("GEMINI_API_KEY", "placeholder-" + "value");
    expect(isLlmAvailable()).toBe(true);
  });
  it("reads the environment on every call", () => {
    vi.stubEnv("GEMINI_API_KEY", "set");
    expect(isLlmAvailable()).toBe(true);
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isLlmAvailable()).toBe(false);
  });
});
