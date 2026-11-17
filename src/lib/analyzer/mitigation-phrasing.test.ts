// Mitigation phrasings that used to be missed (PLAN_DECISIONS.md C12.1, clause-analyzer Task 16.3).
// Each case names the mitigation that must apply and the severity it must give.
import { describe, expect, it } from "vitest";
import { classifyClause } from "./classifier";
import { MITIGATIONS } from "./rules";
import type { Clause } from "./types";

const whole = (text: string): Clause => ({ id: "c-0", start: 0, end: text.length, text });
const classify = (text: string) => classifyClause(whole(text), text);

const CASES: readonly { mitigation: string; room: string; severity: number; text: string }[] = [
  // The reported bug.
  { mitigation: "cellar.no-sell", room: "cellar", severity: 0, text: "We will never sell your personal data." },
  { mitigation: "cellar.no-sell", room: "cellar", severity: 0, text: "We shall not sell your personal information." },
  { mitigation: "cellar.no-sell", room: "cellar", severity: 0, text: "We do not and will not sell your personal information." },
  { mitigation: "cellar.no-sell", room: "cellar", severity: 0, text: "We would never sell your data." },
  { mitigation: "cellar.no-share", room: "cellar", severity: 0, text: "We will never share your personal data with third parties." },
  { mitigation: "cellar.no-share", room: "cellar", severity: 0, text: "We cannot share your information with advertising partners." },
  { mitigation: "cellar.no-share", room: "cellar", severity: 0, text: "We shall not share your information with our affiliates." },
  { mitigation: "cellar.no-share", room: "cellar", severity: 0, text: "We do not share your email address with our sponsors." },
  { mitigation: "cellar.no-share", room: "cellar", severity: 0, text: "We will never share your data with advertisers." },
  { mitigation: "portraits.no-track", room: "portraits", severity: 0, text: "We will never track you across other websites." },
  { mitigation: "portraits.no-track", room: "portraits", severity: 0, text: "We won't track your activity across other apps." },
  { mitigation: "portraits.opt-out", room: "portraits", severity: 1, text: "We show you targeted ads and you can always opt out in your settings." },
  { mitigation: "vault.reminder", room: "vault", severity: 1, text: "Your plan renews automatically, and we will send you a reminder before each renewal." },
  { mitigation: "locked.delete-anytime", room: "locked-door", severity: 0, text: "You can always cancel at any time, and there is no cancellation fee." },
  { mitigation: "locked.delete-anytime", room: "locked-door", severity: 0, text: "You are free to cancel at any time and no cancellation fee applies." },
  { mitigation: "court.opt-out", room: "court", severity: 1, text: "Disputes go to binding arbitration, and you may opt out of the arbitration agreement within 30 days." },
  { mitigation: "mirror.you-own", room: "mirror", severity: 1, text: "You grant us a licence to use your posts, and you will retain ownership of them." },
  { mitigation: "trapdoor.carve-out", room: "trapdoor", severity: 1, text: "Our liability is limited to the fees you paid, and nothing in these terms restricts our liability for fraud." },
  { mitigation: "stairs.advance-notice", room: "stairs", severity: 1, text: "We may change these terms at any time, and we will give you 30 days' notice." },
];

describe("mitigation phrasings (C12.1)", () => {
  it.each(CASES.map((c) => [c.mitigation, c.severity, c.text, c.room] as const))("%s gives severity %i: %s", (mitigation, severity, text, room) => {
    const f = classify(text);
    expect(f).not.toBeNull();
    expect(f!.room).toBe(room);
    expect(f!.mitigationId).toBe(mitigation);
    expect(f!.severity).toBe(severity);
  });

  it("covers every mitigation in the table", () => {
    expect(new Set(CASES.map((c) => c.mitigation))).toEqual(new Set(MITIGATIONS.map((m) => m.id).filter((id) => id !== "cellar.consent")));
  });

  it("cellar.consent needs no new form: 'only with your consent' has no modal to vary", () => {
    const f = classify("We share your data with partners only with your explicit consent.");
    expect(f!.mitigationId).toBe("cellar.consent");
    expect(f!.severity).toBe(1);
  });

  it("an exception after the new forms still cancels the reassurance (R3.11)", () => {
    const f = classify("We will never sell your personal data, except to our partners.");
    expect(f!.mitigationId).toBeNull();
    expect(f!.cancelledMitigationId).toBe("cellar.no-sell");
    expect(f!.severity).toBeGreaterThanOrEqual(1);
  });

  it("an exception still cancels the reassurance for the C19 targets (R3.11)", () => {
    const f = classify("We do not share your email with sponsors, except when you enter a sponsored contest.");
    expect(f!.room).toBe("cellar");
    expect(f!.mitigationId).toBeNull();
    expect(f!.cancelledMitigationId).toBe("cellar.no-share");
    expect(f!.severity).toBeGreaterThanOrEqual(1);
  });
  it("a positive statement is not read as a reassurance", () => {
    expect(classify("We will sell your personal data.")!.severity).toBe(3);
    expect(classify("We will share your personal data with third parties.")!.severity).toBe(2);
  });
});
