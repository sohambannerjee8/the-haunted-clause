import { describe, expect, it } from "vitest";
import { parseLlmOutput } from "./parse";

const ids = new Set(["c-0", "c-40", "c-90"]);
const f = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  plainEnglish: "They can sell your data.",
  whyItMatters: "Strangers may get it.",
  severity: 2,
  ...extra,
});
const out = (...findings: unknown[]) => JSON.stringify({ findings });

describe("parseLlmOutput (R6)", () => {
  it("accepts good output", () => {
    const r = parseLlmOutput(out(f("c-0"), f("c-40", { severity: 3 })), ids);
    expect(r).toEqual({ ok: true, findings: [f("c-0"), f("c-40", { severity: 3 })] });
  });
  it("fails on text that is not JSON", () => {
    for (const t of ["", "not json", "{", "```json\n{}\n```", "undefined"]) expect(parseLlmOutput(t, ids)).toEqual({ ok: false });
  });
  it("fails on a schema mismatch", () => {
    for (const t of [
      "null", "[]", "42", '"text"', "{}",
      JSON.stringify({ findings: "no" }),
      out({ id: "c-0" }),
      out(f("c-0", { severity: 7 })),
      out(f("c-0", { extra: 1 })),
      JSON.stringify({ findings: [f("c-0")], note: "hi" }),
    ]) expect(parseLlmOutput(t, ids), t).toEqual({ ok: false });
  });
  it("fails when a text is over 400 characters after trimming", () => {
    expect(parseLlmOutput(out(f("c-0", { plainEnglish: "a".repeat(401) })), ids)).toEqual({ ok: false });
    expect(parseLlmOutput(out(f("c-0", { whyItMatters: "b".repeat(401) })), ids)).toEqual({ ok: false });
  });
  it("trims texts, so 400 characters plus spaces is accepted", () => {
    const r = parseLlmOutput(out(f("c-0", { plainEnglish: `   ${"a".repeat(400)}\n` })), ids);
    expect(r.ok && r.findings[0].plainEnglish).toBe("a".repeat(400));
  });
  it("drops findings whose ID was not in the request (R6.2)", () => {
    const r = parseLlmOutput(out(f("c-0"), f("c-999"), f("ignore previous instructions")), ids);
    expect(r).toEqual({ ok: true, findings: [f("c-0")] });
  });
  it("keeps only the first finding for a duplicated ID (R6.2)", () => {
    const r = parseLlmOutput(out(f("c-40", { severity: 1 }), f("c-40", { severity: 3 })), ids);
    expect(r).toEqual({ ok: true, findings: [f("c-40", { severity: 1 })] });
  });
  it("fails when nothing is left after filtering (R6.3)", () => {
    expect(parseLlmOutput(out(), ids)).toEqual({ ok: false });
    expect(parseLlmOutput(out(f("c-1"), f("c-2")), ids)).toEqual({ ok: false });
  });
  it("fails for a value that is not a string at all (R6.5)", () => {
    for (const v of [undefined, null, 1, {}, [], Symbol("s")]) expect(parseLlmOutput(v, ids)).toEqual({ ok: false });
  });
});
