import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyze } from "../analyzer/analyze";
import { mergeFindings } from "../llm/merge";
import { SampleExplanationsFile } from "../llm/schema";
import { readingFrom, sampleReading } from "./explanations";
import { SAMPLES } from "./index";

const committed: unknown = JSON.parse(readFileSync(join(process.cwd(), "src/lib/samples/sample-explanations.json"), "utf8"));
const findingsOf = (text: string) => {
  const r = analyze(text);
  if (!r.ok) throw new Error("too long");
  return r.findings;
};

describe("the committed sample-explanations.json (R16.7, R16.10)", () => {
  it("passes the Zod schema", () => {
    const r = SampleExplanationsFile.safeParse(committed);
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true);
  });
  it.each(SAMPLES.map((s) => [s.id, s] as const))("%s: its entry is consistent with the current analyzer output", (id, s) => {
    const file = SampleExplanationsFile.parse(committed);
    const e = file.samples[id];
    const ids = findingsOf(s.text).map((f) => f.id);
    expect(e.findingIds, "rerun npm run precompute:samples and commit the file").toEqual(ids);
    for (const f of e.llmFindings) expect(ids).toContain(f.id);
    if (e.source === "rules") expect(e).toEqual({ source: "rules", model: null, findingIds: ids, llmFindings: [] });
    else expect(e.model).toBeTruthy();
  });
  it("is written in the script's fixed format (two-space JSON and a trailing newline)", () => {
    const text = readFileSync(join(process.cwd(), "src/lib/samples/sample-explanations.json"), "utf8");
    expect(text).toBe(JSON.stringify(committed, null, 2) + "\n");
  });
});

describe("readingFrom and sampleReading (R16.8)", () => {
  const mild = SAMPLES.find((s) => s.id === "mild")!;
  const mildFindings = findingsOf(mild.text);
  const ids = mildFindings.map((f) => f.id);
  const rules = (fid: string[]) => ({ source: "rules", model: null, findingIds: fid, llmFindings: [] });

  it("sampleReading returns the committed entry's LLM findings, for every sample", () => {
    const file = SampleExplanationsFile.parse(committed);
    for (const s of SAMPLES) expect(sampleReading(s.id)).toEqual(file.samples[s.id].llmFindings);
  });

  it("a partial entry gives medium texts for its IDs and rule texts for the rest", () => {
    const partial = {
      version: 1,
      samples: {
        mild: {
          source: "llm",
          model: "gemini-test",
          findingIds: ids,
          llmFindings: [{ id: ids[1], plainEnglish: "Medium text.", whyItMatters: "Medium why.", severity: 2 }],
        },
        average: rules([]),
        terrible: rules([]),
      },
    };
    const reading = readingFrom(partial, "mild");
    expect(reading).toHaveLength(1);
    const merged = mergeFindings(mildFindings, reading);
    expect(merged[1]).toMatchObject({ source: "llm", explanation: "Medium text.", whyItMatters: "Medium why." });
    for (const [i, m] of merged.entries()) {
      if (i === 1) continue;
      expect(m).toMatchObject({ source: "rules", explanation: mildFindings[i].explanation, whyItMatters: mildFindings[i].whyItMatters });
    }
  });

  it("an invalid file gives rule texts everywhere", () => {
    for (const bad of [null, 42, "x", {}, { version: 2, samples: {} }, { version: 1, samples: { mild: { source: "llm" } } }]) {
      const reading = readingFrom(bad, "mild");
      expect(reading).toEqual([]);
      expect(mergeFindings(mildFindings, reading).every((m) => m.source === "rules")).toBe(true);
    }
  });

  it("an LLM finding with an ID the analyzer does not have is ignored by the merge", () => {
    const file = {
      version: 1,
      samples: {
        mild: { source: "llm", model: "m", findingIds: ids, llmFindings: [{ id: "c-99999999", plainEnglish: "x", whyItMatters: "y", severity: 3 }] },
        average: rules([]),
        terrible: rules([]),
      },
    };
    expect(mergeFindings(mildFindings, readingFrom(file, "mild")).every((m) => m.source === "rules")).toBe(true);
  });
});
