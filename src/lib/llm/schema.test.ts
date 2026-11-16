import { describe, expect, it } from "vitest";
import { ROOM_IDS as ANALYZER_ROOM_IDS } from "../analyzer/rooms";
import {
  ExplainRequest,
  ExplainResponse,
  GEMINI_OUTPUT_JSON_SCHEMA,
  LlmFinding,
  LlmOutput,
  REASONS,
  ROOM_IDS,
  SampleExplanationsFile,
} from "./schema";

const clause = (i: number, text = "We may sell your data.") => ({ id: `c-${i}`, room: "cellar", severity: 2, text });
const req = (n: number) => ({ clauses: Array.from({ length: n }, (_, i) => clause(i * 10)) });
const finding = (id = "c-0") => ({ id, plainEnglish: "They can sell it.", whyItMatters: "Strangers get your data.", severity: 2 });

describe("constants", () => {
  it("ROOM_IDS matches the analyzer's eight rooms, in order", () => {
    expect([...ROOM_IDS]).toEqual([...ANALYZER_ROOM_IDS]);
  });
  it("REASONS holds the six reason codes", () => {
    expect([...REASONS]).toEqual(["no-key", "timeout", "invalid", "rate-limited", "error", "bad-request"]);
  });
});

describe("ExplainRequest (R2.3)", () => {
  it("rejects 0 clauses and accepts 1 and 40", () => {
    expect(ExplainRequest.safeParse(req(0)).success).toBe(false);
    expect(ExplainRequest.safeParse(req(1)).success).toBe(true);
    expect(ExplainRequest.safeParse(req(40)).success).toBe(true);
  });
  it("rejects 41 clauses", () => {
    expect(ExplainRequest.safeParse(req(41)).success).toBe(false);
  });
  it("accepts text of 1,500 characters and rejects 1,501 and empty text", () => {
    expect(ExplainRequest.safeParse({ clauses: [clause(0, "a".repeat(1500))] }).success).toBe(true);
    expect(ExplainRequest.safeParse({ clauses: [clause(0, "a".repeat(1501))] }).success).toBe(false);
    expect(ExplainRequest.safeParse({ clauses: [clause(0, "")] }).success).toBe(false);
  });
  it.each(["c-", "c-1a", "x-1", "c--1", " c-1", "C-1"])("rejects the bad ID %j", (id) => {
    expect(ExplainRequest.safeParse({ clauses: [{ ...clause(0), id }] }).success).toBe(false);
  });
  it("rejects a duplicate ID", () => {
    expect(ExplainRequest.safeParse({ clauses: [clause(5), clause(5)] }).success).toBe(false);
  });
  it("rejects an extra property on a clause and at the top level", () => {
    expect(ExplainRequest.safeParse({ clauses: [{ ...clause(0), extra: 1 }] }).success).toBe(false);
    expect(ExplainRequest.safeParse({ ...req(1), extra: 1 }).success).toBe(false);
  });
  it("rejects an unknown room and a severity outside 0–3 or not whole", () => {
    expect(ExplainRequest.safeParse({ clauses: [{ ...clause(0), room: "attic" }] }).success).toBe(false);
    for (const severity of [-1, 4, 1.5]) {
      expect(ExplainRequest.safeParse({ clauses: [{ ...clause(0), severity }] }).success).toBe(false);
    }
  });
  it("accepts every room ID and every severity 0–3", () => {
    for (const room of ROOM_IDS) for (const severity of [0, 1, 2, 3]) {
      expect(ExplainRequest.safeParse({ clauses: [{ ...clause(0), room, severity }] }).success).toBe(true);
    }
  });
});

describe("LlmFinding and LlmOutput (R6.1)", () => {
  it("trims texts and accepts 400 characters after trimming", () => {
    const r = LlmFinding.safeParse({ ...finding(), plainEnglish: `  ${"a".repeat(400)}  ` });
    expect(r.success).toBe(true);
    expect(r.data?.plainEnglish).toBe("a".repeat(400));
  });
  it("rejects 401 characters, empty and whitespace-only texts", () => {
    for (const t of ["a".repeat(401), "", "   "]) {
      expect(LlmFinding.safeParse({ ...finding(), whyItMatters: t }).success).toBe(false);
    }
  });
  it("rejects extra properties and bad severities", () => {
    expect(LlmFinding.safeParse({ ...finding(), extra: true }).success).toBe(false);
    expect(LlmFinding.safeParse({ ...finding(), severity: 4 }).success).toBe(false);
    expect(LlmOutput.safeParse({ findings: [], extra: 1 }).success).toBe(false);
  });
  it("allows at most 40 findings", () => {
    const many = (n: number) => ({ findings: Array.from({ length: n }, (_, i) => finding(`c-${i}`)) });
    expect(LlmOutput.safeParse(many(40)).success).toBe(true);
    expect(LlmOutput.safeParse(many(41)).success).toBe(false);
  });
});

describe("ExplainResponse (R8.1)", () => {
  it("accepts llm with findings and no reason", () => {
    expect(ExplainResponse.safeParse({ source: "llm", findings: [finding()] }).success).toBe(true);
  });
  it("rejects llm with a reason or with no findings", () => {
    expect(ExplainResponse.safeParse({ source: "llm", reason: "timeout", findings: [finding()] }).success).toBe(false);
    expect(ExplainResponse.safeParse({ source: "llm", findings: [] }).success).toBe(false);
  });
  it.each(["no-key", "timeout", "invalid", "rate-limited", "error", "bad-request"])("accepts rules with reason %s and no findings", (reason) => {
    expect(ExplainResponse.safeParse({ source: "rules", reason, findings: [] }).success).toBe(true);
  });
  it("rejects rules without a reason, with an unknown reason or with findings", () => {
    expect(ExplainResponse.safeParse({ source: "rules", findings: [] }).success).toBe(false);
    expect(ExplainResponse.safeParse({ source: "rules", reason: "nope", findings: [] }).success).toBe(false);
    expect(ExplainResponse.safeParse({ source: "rules", reason: "error", findings: [finding()] }).success).toBe(false);
  });
  it("rejects an unknown source", () => {
    expect(ExplainResponse.safeParse({ source: "oracle", findings: [] }).success).toBe(false);
  });
});

describe("GEMINI_OUTPUT_JSON_SCHEMA", () => {
  const SUPPORTED = new Set([
    "type", "properties", "required", "additionalProperties", "items",
    "minItems", "maxItems", "minimum", "maximum", "enum", "format",
  ]);
  function keywords(node: unknown, inProperties = false, out = new Set<string>()): Set<string> {
    if (node && typeof node === "object" && !Array.isArray(node)) {
      for (const [k, v] of Object.entries(node)) {
        if (!inProperties) out.add(k);
        // Keys directly under "properties" are field names, not keywords.
        keywords(v, k === "properties" && !inProperties, out);
      }
    } else if (Array.isArray(node)) {
      for (const v of node) keywords(v, false, out);
    }
    return out;
  }
  it("uses only keywords Gemini supports, with no $schema", () => {
    const used = keywords(GEMINI_OUTPUT_JSON_SCHEMA);
    for (const k of used) expect(SUPPORTED, `unsupported keyword ${k}`).toContain(k);
    expect(GEMINI_OUTPUT_JSON_SCHEMA).not.toHaveProperty("$schema");
  });
  it("describes the four LLM finding fields, all required", () => {
    const s = GEMINI_OUTPUT_JSON_SCHEMA as {
      properties: { findings: { maxItems: number; items: { required: string[]; properties: Record<string, unknown> } } };
    };
    expect(s.properties.findings.maxItems).toBe(40);
    expect(s.properties.findings.items.required.sort()).toEqual(["id", "plainEnglish", "severity", "whyItMatters"]);
    expect(Object.keys(s.properties.findings.items.properties).sort()).toEqual(["id", "plainEnglish", "severity", "whyItMatters"]);
  });
});

describe("SampleExplanationsFile (R16.7)", () => {
  const rules = { source: "rules", model: null, findingIds: ["c-0"], llmFindings: [] };
  const llm = { source: "llm", model: "gemini-4-hydrogen", findingIds: ["c-0"], llmFindings: [finding()] };
  const file = (s: Record<string, unknown>) => ({ version: 1, samples: { mild: rules, average: rules, terrible: rules, ...s } });
  it("accepts rules and llm entries", () => {
    expect(SampleExplanationsFile.safeParse(file({})).success).toBe(true);
    expect(SampleExplanationsFile.safeParse(file({ average: llm })).success).toBe(true);
  });
  it("rejects a missing sample, an extra sample, and another version", () => {
    expect(SampleExplanationsFile.safeParse({ version: 1, samples: { mild: rules, average: rules } }).success).toBe(false);
    expect(SampleExplanationsFile.safeParse(file({ extra: rules })).success).toBe(false);
    expect(SampleExplanationsFile.safeParse({ ...file({}), version: 2 }).success).toBe(false);
  });
  it("rejects a rules entry with a model or LLM findings, and an llm entry without a model", () => {
    expect(SampleExplanationsFile.safeParse(file({ mild: { ...rules, model: "x" } })).success).toBe(false);
    expect(SampleExplanationsFile.safeParse(file({ mild: { ...rules, llmFindings: [finding()] } })).success).toBe(false);
    expect(SampleExplanationsFile.safeParse(file({ mild: { ...llm, model: null } })).success).toBe(false);
  });
});
