// Clause heading lines are left out of quotes (clause-analyzer R4.2, PLAN_DECISIONS.md C14.6).
import { describe, expect, it } from "vitest";
import { analyze } from "./analyze";
import { classifyClause } from "./classifier";
import { SAMPLES } from "../samples";
import type { Clause } from "./types";

const whole = (text: string): Clause => ({ id: "c-0", start: 0, end: text.length, text });
const classify = (text: string) => classifyClause(whole(text), text);

describe("heading lines (R4.2, C14.6)", () => {
  it("leaves a numbered heading line out of the quote, which stays an exact slice", () => {
    const input = "1. Your information\nWe may sell your data.";
    const f = classify(input)!;
    expect(f.quote).toBe("We may sell your data.");
    expect(input.slice(f.start, f.end)).toBe(f.quote);
    expect(f.id).toBe("c-0");
    expect(f.start).toBe(input.indexOf("We may"));
  });
  it.each([
    ["an unnumbered heading", "Your content\nYou grant us a perpetual, irrevocable licence to use your posts."],
    ["a heading with CRLF and indentation", "6. Disputes\r\n   All disputes will be resolved by binding arbitration."],
    ["a bare list number", "1.\nWe may sell your data."],
  ])("handles %s", (_name, input) => {
    const f = classify(input)!;
    const firstBreak = input.search(/\r?\n/);
    expect(f.start).toBeGreaterThan(firstBreak);
    expect(input.slice(f.start, f.end)).toBe(f.quote);
    expect(f.quote).not.toMatch(/^\s/);
  });
  it("does not let heading words alone create a finding", () => {
    expect(classify("3. Selling your data\nYou can read this policy at any time.")).toBeNull();
  });
  it.each([
    ["a one-line clause", "We may sell your data."],
    ["a first line ending in a full stop", "We may sell your data.\nThis helps us run the service."],
    ["a first line ending in a colon", "We share your data with:\nadvertising partners and data brokers."],
    ["a first line over 60 characters", "We may sell some of your personal information to selected partners\nwhen you use the app."],
    ["a heading with nothing after it", "1. Your information\n   "],
  ])("leaves %s alone", (_name, input) => {
    const f = classify(input);
    if (f === null) return; // nothing to quote, nothing moved
    expect(f.start).toBe(0);
    expect(input.slice(f.start, f.end)).toBe(f.quote);
  });
  it("the samples' quotes no longer start with a numbered heading", () => {
    for (const s of SAMPLES) {
      const r = analyze(s.text);
      if (!r.ok) throw new Error("too long");
      for (const f of r.findings) {
        expect(f.quote, `${s.id} ${f.id}`).not.toMatch(/^\d+\.\s+[^\n]{0,60}\n/);
        expect(s.text.slice(f.start, f.end)).toBe(f.quote);
      }
    }
  });
  it("the mild sample's Cellar quote is just the clause", () => {
    const mild = SAMPLES.find((s) => s.id === "mild")!;
    const r = analyze(mild.text);
    if (!r.ok) throw new Error("too long");
    const cellar = r.findings.find((f) => f.room === "cellar")!;
    expect(cellar.quote.startsWith("1.")).toBe(false);
  });
});
