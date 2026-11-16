import { describe, expect, it } from "vitest";
import { analyze, MAX_INPUT_LENGTH } from "./analyze";
import { POSITIVE_EXAMPLES } from "./examples.test-util";

const realistic = (length: number) => {
  const block = POSITIVE_EXAMPLES.map((e) => e.text).join(" ") + "\n\n";
  return block.repeat(Math.ceil(length / block.length)).slice(0, length);
};

describe("analyze: the size cap (R8)", () => {
  it("exports the cap as 50,000", () => {
    expect(MAX_INPUT_LENGTH).toBe(50_000);
  });

  it("accepts exactly 50,000 characters (R8.1, R8.3)", () => {
    const r = analyze(realistic(50_000));
    expect(r.ok).toBe(true);
  });

  it("refuses 50,001 characters with a typed error and does not split (R8.2, R6.2)", () => {
    const r = analyze("x".repeat(50_001));
    expect(r).toEqual({ ok: false, error: { code: "too-long", length: 50_001, limit: 50_000 } });
    expect("clauses" in r).toBe(false);
  });
});

describe("analyze: results", () => {
  it("returns clauses, findings, a score and a boolean likelyNonEnglish (R8.1, R9.1)", () => {
    const r = analyze("We may sell your data. We use cookies.");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.clauses).toHaveLength(2);
    expect(r.findings.map((f) => [f.room, f.severity])).toEqual([
      ["cellar", 3],
      ["portraits", 1],
    ]);
    expect(r.score).toBe(34);
    expect(typeof r.likelyNonEnglish).toBe("boolean");
  });

  it("returns findings in input order (R4.4)", () => {
    const text = POSITIVE_EXAMPLES.map((e) => e.text).join(" ");
    const r = analyze(text);
    if (!r.ok) throw new Error("unexpected");
    const starts = r.findings.map((f) => f.start);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    expect(r.findings).toHaveLength(POSITIVE_EXAMPLES.length);
  });

  it("still classifies text flagged as non-English (R9.6)", () => {
    // Mostly Spanish (so the flag is set), with one English phrase that a rule matches.
    const text =
      "Podemos compartir sus datos personales con data brokers para fines publicitarios y comerciales. Al usar el servicio, usted acepta estas condiciones generales de uso.";
    const r = analyze(text);
    if (!r.ok) throw new Error("unexpected");
    expect(r.likelyNonEnglish).toBe(true);
    expect(r.findings.some((f) => f.room === "cellar")).toBe(true);
  });

  it("handles empty text and emoji (R6.1)", () => {
    expect(analyze("")).toEqual({ ok: true, clauses: [], findings: [], score: 0, likelyNonEnglish: false });
    const r = analyze("👻👻👻 🕯️");
    expect(r.ok && r.findings.length === 0).toBe(true);
  });
});

describe("analyze: speed (R6.3)", () => {
  it("analyses 50,000 characters of realistic policy text in under 1 second", () => {
    const text = realistic(50_000);
    const t0 = performance.now();
    analyze(text);
    expect(performance.now() - t0).toBeLessThan(1000);
  });

  it("analyses one 50,000-character clause with no terminators in under 1 second", () => {
    const text = ("we share your data with partners and track you across sites while you use the app " ).repeat(700).slice(0, 50_000);
    const t0 = performance.now();
    const r = analyze(text);
    expect(performance.now() - t0).toBeLessThan(1000);
    expect(r.ok && r.clauses.length === 1).toBe(true);
  });
});
