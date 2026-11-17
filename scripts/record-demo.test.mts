// Demo recorder (PLAN_DECISIONS.md C20): the parts that do not need a browser.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { captionCues, kiroPageHtml, MAX_TOTAL_SECONDS, parseScript } from "./record-demo.mjs";

const script = readFileSync(join(process.cwd(), "docs/VIDEO_SCRIPT.md"), "utf8");

describe("parseScript on docs/VIDEO_SCRIPT.md", () => {
  const segments = parseScript(script);
  it("reads seven back-to-back segments from 0:00 to 2:30", () => {
    expect(segments).toHaveLength(7);
    expect(segments[0].start).toBe(0);
    for (let i = 1; i < segments.length; i++) expect(segments[i].start).toBe(segments[i - 1].end);
    expect(segments.at(-1)!.end).toBe(150);
    expect(segments.at(-1)!.end).toBeLessThanOrEqual(MAX_TOTAL_SECONDS);
  });
  it("takes each segment's narration word for word, without the quotes", () => {
    expect(segments[0].narration.startsWith("This is a privacy policy from a company that doesn't exist.")).toBe(true);
    expect(segments.at(-1)!.narration).toBe("The Haunted Clause. Built with Kiro, for Kiroween.");
    for (const s of segments) expect(s.narration).not.toMatch(/^"|"$/);
  });
  it("throws on a script with no timed segments", () => {
    expect(() => parseScript("# nothing here")).toThrow();
  });
});

describe("captionCues", () => {
  const seg = { start: 10, end: 30, title: "t", narration: "One two three four. Five six seven eight, nine ten eleven twelve. Thirteen." };
  const cues = captionCues(seg);
  it("covers the segment back to back, in order, with every word once", () => {
    expect(cues[0].at).toBe(10);
    expect(cues.at(-1)!.until).toBe(30);
    for (let i = 1; i < cues.length; i++) expect(cues[i].at).toBeCloseTo(cues[i - 1].until, 6);
    expect(cues.map((c) => c.text).join(" ")).toBe(seg.narration);
  });
  it("keeps each caption to at most 90 characters", () => {
    const long = { ...seg, narration: "word ".repeat(80).trim() + "." };
    for (const c of captionCues(long)) expect(c.text.length).toBeLessThanOrEqual(90);
  });
  it("splits a long sentence into lines of similar length, so no caption is a short leftover", () => {
    for (const s of parseScript(script)) for (const c of captionCues(s)) expect(c.text.length, c.text).toBeGreaterThanOrEqual(20);
  });
  it("gives every caption at least 1.5 seconds on the real script", () => {
    for (const s of parseScript(script)) for (const c of captionCues(s)) expect(c.until - c.at).toBeGreaterThanOrEqual(1.5);
  });
});

describe("kiroPageHtml", () => {
  const html = kiroPageHtml({
    files: [".kiro/specs/a/requirements.md", ".kiro/hooks/x.json"],
    ears: ["WHEN <input> is empty THE SYSTEM SHALL say so."],
    reports: ["phase-1-spec-reviewer-attempt-1.md"],
    propertyLine: "fc.assert(prop, { numRuns: 1000 });",
  });
  it("lists the real files it is given, grouped by folder", () => {
    expect(html).toContain(".kiro/specs/");
    expect(html).toContain("requirements.md");
    expect(html).toContain(".kiro/hooks/");
    expect(html).toContain("phase-1-spec-reviewer-attempt-1.md");
    expect(html).toContain("numRuns: 1000");
  });
  it("escapes file content as text", () => {
    expect(html).toContain("WHEN &lt;input&gt; is empty");
    expect(html).not.toContain("<input>");
  });
  it("loads nothing from the network", () => {
    expect(html).not.toMatch(/https?:\/\//);
  });
});
