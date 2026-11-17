// Each mitigation has its own texts, used when it lowers a finding (clause-analyzer R4.5, PLAN_DECISIONS.md C13).
import { describe, expect, it } from "vitest";
import { classifyClause } from "./classifier";
import { MITIGATIONS, RULES } from "./rules";
import type { Clause } from "./types";

const whole = (text: string): Clause => ({ id: "c-0", start: 0, end: text.length, text });
const classify = (text: string) => classifyClause(whole(text), text)!;

/** One clause per mitigation that it applies to and lowers. */
const LOWERED: Readonly<Record<string, string>> = {
  "cellar.no-sell": "We do not sell your data.",
  "cellar.no-share": "We will never share your personal data with third parties.",
  "cellar.consent": "We share your data with partners only with your explicit consent.",
  "portraits.no-track": "We will never track you across other websites.",
  "portraits.opt-out": "We show you targeted ads and you can always opt out in your settings.",
  "vault.reminder": "Your plan renews automatically, and we will send you a reminder before each renewal.",
  "locked.delete-anytime": "You can always cancel at any time, and there is no cancellation fee.",
  "court.opt-out": "Disputes go to binding arbitration, and you may opt out of the arbitration agreement within 30 days.",
  "mirror.you-own": "You grant us a licence to use your posts, and you will retain ownership of them.",
  "trapdoor.carve-out": "Our liability is limited to the fees you paid, and nothing in these terms restricts our liability for fraud.",
  "stairs.advance-notice": "We may change these terms at any time, and we will give you 30 days' notice.",
};

describe("mitigation texts (R4.5, C13)", () => {
  it("every mitigation has an explanation and a why-it-matters text of 1 to 400 characters", () => {
    for (const m of MITIGATIONS) {
      expect(m.explanation.trim().length, m.id).toBeGreaterThan(0);
      expect(m.explanation.length, m.id).toBeLessThanOrEqual(400);
      expect(m.whyItMatters.trim().length, m.id).toBeGreaterThan(0);
      expect(m.whyItMatters.length, m.id).toBeLessThanOrEqual(400);
    }
  });
  it("no mitigation reuses a rule's text", () => {
    const ruleTexts = new Set(RULES.flatMap((r) => [r.explanation, r.whyItMatters]));
    for (const m of MITIGATIONS) {
      expect(ruleTexts.has(m.explanation), m.id).toBe(false);
      expect(ruleTexts.has(m.whyItMatters), m.id).toBe(false);
    }
  });
  it("has a lowering clause for every mitigation", () => {
    expect(Object.keys(LOWERED).sort()).toEqual(MITIGATIONS.map((m) => m.id).sort());
  });
  it.each(Object.entries(LOWERED))("%s: a clause it lowers takes the mitigation's texts, not the rule's", (id, text) => {
    const f = classify(text);
    const m = MITIGATIONS.find((x) => x.id === id)!;
    const r = RULES.find((x) => x.id === f.ruleId)!;
    expect(f.mitigationId).toBe(id);
    expect(f.severity).toBeLessThan(r.severity);
    expect(f.explanation).toBe(m.explanation);
    expect(f.whyItMatters).toBe(m.whyItMatters);
  });
  it('"We do not sell your data." reads as a promise not to sell', () => {
    const f = classify("We do not sell your data.");
    expect(f.severity).toBe(0);
    expect(f.explanation).toMatch(/promises not to sell/i);
    expect(f.explanation).not.toMatch(/lets the company sell/i);
  });
  it("a cancelled mitigation applies nothing, so the finding keeps the rule's texts (R3.11)", () => {
    const f = classify("We do not sell your data, but we may share it with advertising partners.");
    expect(f.mitigationId).toBeNull();
    expect(f.cancelledMitigationId).toBe("cellar.no-sell");
    const r = RULES.find((x) => x.id === f.ruleId)!;
    expect(f.explanation).toBe(r.explanation);
    expect(f.whyItMatters).toBe(r.whyItMatters);
  });
});
