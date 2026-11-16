// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyze, ROOMS, type AnalyzeOk } from "../analyzer";
import { SAMPLE_META, SAMPLES } from "./index";

const ok = (text: string): AnalyzeOk => {
  const r = analyze(text);
  if (!r.ok) throw new Error("sample is over the cap");
  return r;
};
const byId = Object.fromEntries(SAMPLES.map((s) => [s.id, s]));

describe("the three fictional samples (R11)", () => {
  it("provides mild, average and terrible, each with a company, title and text (R11.1)", () => {
    expect(SAMPLES.map((s) => s.id)).toEqual(["mild", "average", "terrible"]);
    for (const s of SAMPLES) {
      expect(s.company.length).toBeGreaterThan(0);
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.text.length).toBeGreaterThan(500);
    }
  });

  it.each(SAMPLES.map((s) => [s.id, s] as const))("%s is at most 50,000 characters and reads as English (R11.3)", (_id, s) => {
    expect(s.text.length).toBeLessThanOrEqual(50_000);
    expect(ok(s.text).likelyNonEnglish).toBe(false);
  });

  it("mild scores at most 25 (R11.4)", () => {
    expect(ok(byId.mild.text).score).toBeLessThanOrEqual(25);
  });

  it("mild has a severity 0 finding lowered by a mitigation (R11.7)", () => {
    expect(ok(byId.mild.text).findings.some((f) => f.severity === 0 && f.mitigationId !== null)).toBe(true);
  });

  it("average scores from 35 to 65 (R11.5)", () => {
    const { score } = ok(byId.average.text);
    expect(score).toBeGreaterThanOrEqual(35);
    expect(score).toBeLessThanOrEqual(65);
  });

  it("terrible scores at least 80 with a risky finding in every room (R11.6)", () => {
    const r = ok(byId.terrible.text);
    expect(r.score).toBeGreaterThanOrEqual(80);
    for (const room of ROOMS) expect(r.findings.some((f) => f.room === room.id && f.severity >= 1), room.name).toBe(true);
  });

  it("names each company under a 'Sample name check' heading in BUILD_LOG.md (R11.2)", () => {
    const log = readFileSync(join(process.cwd(), "BUILD_LOG.md"), "utf8");
    const at = log.indexOf("Sample name check");
    expect(at).toBeGreaterThan(-1);
    for (const s of SAMPLES) expect(log.slice(at)).toContain(s.company);
  });

  it.each(SAMPLES.map((s) => [s.id, s] as const))("%s contains no URL, email address or ©, ® or ™ (R11.8)", (_id, s) => {
    const all = `${s.company} ${s.title} ${s.text}`;
    expect(all).not.toMatch(/https?:\/\/|www\.|\.(com|net|org|io)\b/i);
    expect(all).not.toMatch(/[^\s@]+@[^\s@]+\.[a-z]{2,}/i);
    expect(all).not.toMatch(/[©®™]/);
  });

  it("prints each sample's score and ghosts per room", () => {
    for (const s of SAMPLES) {
      const r = ok(s.text);
      const perRoom = ROOMS.map((room) => {
        const fs = r.findings.filter((f) => f.room === room.id);
        return `${room.id}=${fs.map((f) => f.severity).join("") || "-"}`;
      }).join(" ");
      console.log(`${s.id} (${s.company}): score ${r.score}, ${r.clauses.length} clauses, ${r.findings.length} findings | ${perRoom}`);
    }
  });
});

describe("meta.ts", () => {
  it("agrees with the samples' IDs and company names", () => {
    expect(SAMPLE_META.map((m) => [m.id, m.company])).toEqual(SAMPLES.map((s) => [s.id, s.company]));
  });

  it("holds no policy text: each blurb is short and does not appear in any sample text", () => {
    for (const m of SAMPLE_META) {
      expect(m.blurb.length).toBeGreaterThan(0);
      expect(m.blurb.length).toBeLessThanOrEqual(120);
      for (const s of SAMPLES) expect(s.text.includes(m.blurb)).toBe(false);
    }
  });
});
