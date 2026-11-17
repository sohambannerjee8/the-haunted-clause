import { describe, expect, it } from "vitest";
import { ROOM_IDS } from "./rooms";
import { EXCEPTION_MARKER, MITIGATIONS, RULES } from "./rules";

describe("rule table (R2.6, R2.8, R4.5)", () => {
  it.each(ROOM_IDS)("room %s has at least three rules", (room) => {
    expect(RULES.filter((r) => r.room === room).length).toBeGreaterThanOrEqual(3);
  });

  it("has 48 rules and 11 mitigations, as in the design (40 + 5 added by PLAN_DECISIONS.md C12.2 + 3 by C21)", () => {
    expect(RULES).toHaveLength(48); // 45, plus three from C21
    expect(MITIGATIONS).toHaveLength(11);
  });

  it("uses unique IDs across rules and mitigations, each prefixed by its room", () => {
    const ids = [...RULES, ...MITIGATIONS].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    const prefix: Record<string, string> = { "locked-door": "locked" };
    for (const x of [...RULES, ...MITIGATIONS]) expect(x.id.startsWith(`${prefix[x.room] ?? x.room}.`)).toBe(true);
  });

  it("gives every rule a severity of 1, 2 or 3 and every mitigation a level of 0 or 1", () => {
    for (const r of RULES) expect([1, 2, 3]).toContain(r.severity);
    for (const m of MITIGATIONS) expect([0, 1]).toContain(m.level);
  });

  it("gives every rule an explanation and a why-it-matters text of 1 to 400 characters", () => {
    for (const r of RULES) {
      expect(r.explanation.trim().length).toBeGreaterThan(0);
      expect(r.explanation.length).toBeLessThanOrEqual(400);
      expect(r.whyItMatters.trim().length).toBeGreaterThan(0);
      expect(r.whyItMatters.length).toBeLessThanOrEqual(400);
    }
  });

  it("makes every pattern case-insensitive and stateless (no g or y flag)", () => {
    for (const x of [...RULES, ...MITIGATIONS, { id: "marker", pattern: EXCEPTION_MARKER }]) {
      expect(x.pattern.flags).toContain("i");
      expect(x.pattern.flags).not.toMatch(/[gy]/);
    }
  });
});

describe("EXCEPTION_MARKER (R3.8)", () => {
  it.each(["except", "unless", "other than", "however", "provided that", "but", "although", "subject to"])(
    "matches %s on word boundaries, in any case",
    (marker) => {
      expect(EXCEPTION_MARKER.test(`a ${marker} b`)).toBe(true);
      expect(EXCEPTION_MARKER.test(`a ${marker.toUpperCase()} b`)).toBe(true);
    },
  );

  it.each(["exceptional", "butter", "subjected to", "unlessened", "buttress", "excepted"])("does not match inside %s", (word) => {
    expect(EXCEPTION_MARKER.test(`a ${word} b`)).toBe(false);
  });
});
