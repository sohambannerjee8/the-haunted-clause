import { describe, expect, it } from "vitest";
import type { Finding, Severity } from "../analyzer/types";
import { mergeFindings } from "./merge";
import type { LlmFinding } from "./schema";

const finding = (id: string, severity: Severity, start = 0): Finding => ({
  id,
  room: "cellar",
  severity,
  quote: `We may sell your data (${id}).`,
  start,
  end: start + 30,
  ruleId: "cellar-sell",
  mitigationId: null,
  cancelledMitigationId: null,
  explanation: "Rule explanation.",
  whyItMatters: "Rule why.",
});
const llm = (id: string, severity: Severity): LlmFinding => ({
  id,
  plainEnglish: `Medium explanation for ${id}.`,
  whyItMatters: `Medium why for ${id}.`,
  severity,
});

describe("mergeFindings (R12)", () => {
  it("raises a severity from 1 to 3 and uses the medium's texts (R12.2)", () => {
    const [m] = mergeFindings([finding("c-0", 1)], [llm("c-0", 3)]);
    expect(m).toEqual({
      ...finding("c-0", 1),
      severity: 3,
      explanation: "Medium explanation for c-0.",
      whyItMatters: "Medium why for c-0.",
      source: "llm",
    });
  });
  it("keeps 3 when the medium tries to lower it to 1 (R12.2)", () => {
    const [m] = mergeFindings([finding("c-0", 3)], [llm("c-0", 1)]);
    expect(m.severity).toBe(3);
    expect(m.source).toBe("llm");
    expect(m.explanation).toBe("Medium explanation for c-0.");
  });
  it("ignores an LLM finding whose ID is not an analyzer finding (R12.5)", () => {
    const merged = mergeFindings([finding("c-0", 2)], [llm("c-999", 3)]);
    expect(merged).toEqual([{ ...finding("c-0", 2), source: "rules" }]);
  });
  it("keeps the rule severity and texts with source rules when there is no LLM finding (R12.3)", () => {
    const fs = [finding("c-0", 0), finding("c-50", 2, 50)];
    expect(mergeFindings(fs, [])).toEqual(fs.map((f) => ({ ...f, source: "rules" })));
  });
  it("uses the first LLM finding when an ID repeats", () => {
    const [m] = mergeFindings([finding("c-0", 1)], [llm("c-0", 2), { ...llm("c-0", 3), plainEnglish: "Second." }]);
    expect(m.severity).toBe(2);
    expect(m.explanation).toBe("Medium explanation for c-0.");
  });
  it("keeps order and mixes sources finding by finding", () => {
    const fs = [finding("c-0", 1), finding("c-50", 2, 50), finding("c-90", 0, 90)];
    const merged = mergeFindings(fs, [llm("c-90", 1), llm("c-0", 1)]);
    expect(merged.map((m) => [m.id, m.source, m.severity])).toEqual([
      ["c-0", "llm", 1],
      ["c-50", "rules", 2],
      ["c-90", "llm", 1],
    ]);
  });
  it("does not change the input arrays", () => {
    const fs = [finding("c-0", 1)];
    const ls = [llm("c-0", 3)];
    const before = JSON.stringify([fs, ls]);
    mergeFindings(fs, ls);
    expect(JSON.stringify([fs, ls])).toBe(before);
  });
});
