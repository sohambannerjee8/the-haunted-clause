// Real-policy audit script (PLAN_DECISIONS.md C20). Every fixture here is invented for the test;
// no real policy text and no real company name is used.
import { describe, expect, it } from "vitest";
import { MAX_INPUT_LENGTH } from "../src/lib/analyzer/analyze";
import {
  auditText,
  chunkText,
  htmlToText,
  MISS_KEYWORDS,
  parseSources,
  renderReport,
  run,
  type RunIO,
} from "./audit-real-policies.mjs";

describe("htmlToText", () => {
  it("drops script, style, noscript and svg content and all tags", () => {
    const t = htmlToText("<p>Keep me.</p><script>var x = 'drop';</script><style>.a{}</style><noscript>drop</noscript><svg><text>drop</text></svg>");
    expect(t).toBe("Keep me.");
  });
  it("turns block elements and <br> into paragraph breaks", () => {
    const t = htmlToText("<h2>Sharing</h2><p>One.</p><ul><li>Two.</li><li>Three.</li></ul>Four<br>Five");
    expect(t.split("\n\n")).toEqual(["Sharing", "One.", "Two.", "Three.", "Four", "Five"]);
  });
  it("decodes entities and collapses spaces", () => {
    expect(htmlToText("<p>We&nbsp;&amp;   our&#39;s &quot;partners&quot;</p>")).toBe("We & our's \"partners\"");
  });
});

describe("chunkText", () => {
  it("keeps short text in one chunk", () => {
    expect(chunkText("a\n\nb")).toEqual(["a\n\nb"]);
  });
  it("splits long text at paragraph breaks into chunks within the analyzer cap, losing no paragraph", () => {
    const para = "We may share your data with third parties. ".repeat(40).trim();
    const text = Array.from({ length: 80 }, () => para).join("\n\n");
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(MAX_INPUT_LENGTH);
    expect(chunks.join("\n\n")).toBe(text);
  });
  it("hard-splits a single paragraph longer than the cap", () => {
    const chunks = chunkText("x".repeat(MAX_INPUT_LENGTH + 10));
    expect(chunks.map((c) => c.length)).toEqual([MAX_INPUT_LENGTH, 10]);
  });
});

describe("auditText", () => {
  const text = [
    "We may sell your personal information to third parties.",
    "We may change the colours of the app from time to time.",
    "This paragraph has nothing to look at.",
  ].join("\n\n");
  const a = auditText(text);

  it("scores the findings and gives the band", () => {
    expect(a.findings).toBe(1);
    expect(a.score).toBe(30); // one severity 3 finding, as in score.test.ts
    expect(a.band).toBe("Uneasy");
    expect(a.rooms.find((r) => r.id === "cellar")!.bySeverity[3]).toBe(1);
  });
  it("lists keyword sentences with no finding as possible misses, and not the found ones", () => {
    expect(a.possibleMisses).toEqual(["We may change the colours of the app from time to time."]);
    expect(a.totalPossibleMisses).toBe(1);
  });
  it("skips headings (fewer than six words) and repeated sentences", () => {
    const b = auditText([
      "Changes to this policy",
      "How we share information",
      "We may change the colours of the app from time to time.",
      "We may change the colours of the app from time to time.",
    ].join("\n\n"));
    expect(b.possibleMisses).toEqual(["We may change the colours of the app from time to time."]);
    expect(b.totalPossibleMisses).toBe(1);
  });
  it("keeps at most 10 possible misses but counts them all", () => {
    const many = Array.from({ length: 14 }, (_, i) => `Rule ${i}: we may change the colours of screen ${i}.`).join("\n\n");
    const b = auditText(many);
    expect(b.possibleMisses).toHaveLength(10);
    expect(b.totalPossibleMisses).toBe(14);
  });
  it("matches every keyword the user listed", () => {
    for (const w of ["sell", "share", "disclose", "track", "location", "arbitration", "cancel", "renew", "licence", "license", "liable", "change"]) {
      expect(MISS_KEYWORDS.test(`a ${w} b`), w).toBe(true);
    }
    expect(MISS_KEYWORDS.test("a shareholder meeting")).toBe(false);
  });
});

describe("parseSources", () => {
  it("accepts a list of names and https URLs", () => {
    expect(parseSources('[{"name":"Example","url":"https://example.test/privacy"}]')).toEqual([{ name: "Example", url: "https://example.test/privacy" }]);
  });
  it.each(["{}", "[]", '[{"name":"x"}]', '[{"name":"x","url":"http://plain.test"}]', "not json"])("rejects %s", (raw) => {
    expect(() => parseSources(raw)).toThrow();
  });
});

describe("run", () => {
  const io = (over: Partial<RunIO> = {}) => {
    const written: Record<string, string> = {};
    const lines: string[] = [];
    const base: RunIO = {
      readSources: () => '[{"name":"Example Notes","url":"https://example.test/privacy"}]',
      fetchHtml: async () => "<p>We may sell your personal information to third parties.</p><p>We may change the colours from time to time.</p>",
      writeFile: (p, c) => { written[p] = c; },
      print: (l) => lines.push(l),
      now: () => new Date("2026-11-18T10:00:00Z"),
    };
    return { io: { ...base, ...over }, written, lines };
  };

  it("writes only audit/report.md, with the score, the rooms and the possible misses", async () => {
    const t = io();
    expect(await run(t.io)).toBe(0);
    expect(Object.keys(t.written)).toEqual(["audit/report.md"]);
    const md = t.written["audit/report.md"];
    expect(md).toContain("## Example Notes");
    expect(md).toContain("**Haunt Score:** 30 · Uneasy");
    expect(md).toContain("The Cellar");
    expect(md).toContain("We may change the colours from time to time.");
    expect(md).toContain("Do not commit");
  });
  it("exits 1 and writes nothing when the sources file is missing", async () => {
    const t = io({ readSources: () => { throw new Error("ENOENT"); } });
    expect(await run(t.io)).toBe(1);
    expect(t.written).toEqual({});
    expect(t.lines.join("\n")).toContain("audit/sources.json");
  });
  it("records a failed fetch in the report and carries on", async () => {
    const t = io({
      readSources: () => '[{"name":"Down","url":"https://down.test/p"},{"name":"Up","url":"https://up.test/p"}]',
      fetchHtml: async (url) => { if (url.includes("down")) throw new Error("HTTP 503"); return "<p>We may sell your data.</p>"; },
    });
    expect(await run(t.io)).toBe(0);
    const md = t.written["audit/report.md"];
    expect(md).toContain("## Down");
    expect(md).toContain("Fetch failed: HTTP 503");
    expect(md).toContain("## Up");
  });
  it("renderReport says the text is not stored", () => {
    expect(renderReport([], new Date("2026-11-18T10:00:00Z"))).toMatch(/policy text itself is not saved/i);
  });
});
