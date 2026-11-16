import { describe, expect, it } from "vitest";
import { classifyClause } from "./classifier";
import { splitClauses } from "./splitter";
import type { Clause, Finding } from "./types";

const whole = (text: string): Clause => ({ id: "c-0", start: 0, end: text.length, text });
const classify = (text: string): Finding => {
  const f = classifyClause(whole(text), text);
  if (f === null) throw new Error(`no finding for: ${text}`);
  return f;
};

describe("R3.10: the three required cases", () => {
  it("(a) a reassurance followed by `but` and a harmless remark is severity 1 or lower", () => {
    const f = classify("We do not sell your data, but you can ask us to delete it.");
    expect(f.room).toBe("cellar");
    expect(f.severity).toBeLessThanOrEqual(1);
    expect(f.severity).toBe(1);
    expect(f.cancelledMitigationId).toBe("cellar.no-sell");
  });

  it("(b) a reassurance followed by `but` and a real risk is severity 2 or higher", () => {
    const f = classify("We do not sell your data, but we may share it with advertising partners.");
    expect(f.room).toBe("cellar");
    expect(f.severity).toBeGreaterThanOrEqual(2);
    expect(f.severity).toBe(3);
    expect(f.ruleId).toBe("cellar.ad-partners");
    expect(f.cancelledMitigationId).toBe("cellar.no-sell");
  });

  it("(c) a reassurance with `except` is severity 1 or higher", () => {
    const f = classify("We do not sell your data except to our partners.");
    expect(f.room).toBe("cellar");
    expect(f.severity).toBeGreaterThanOrEqual(1);
    expect(f.severity).toBe(1);
    expect(f.cancelledMitigationId).toBe("cellar.no-sell");
  });
});

describe("each exception marker cancels a mitigation before it (R3.3, R3.9, R3.11)", () => {
  it.each([
    ["except", "We do not sell your personal information except to our partners.", 1],
    ["unless", "We do not sell your personal information unless you opt in.", 1],
    ["other than", "We do not sell your personal information other than to trusted partners.", 1],
    ["however", "We do not sell your personal information, however we may sell aggregated data.", 3],
    ["provided that", "We do not sell your personal information, provided that you have not opted in to offers.", 1],
    ["but", "We do not sell your personal information, but we may sell usage statistics.", 1],
    ["although", "We do not sell your personal information, although we may sell usage statistics.", 1],
    ["subject to", "We do not sell your personal information, subject to the exceptions in Sec. 9.", 1],
  ])("%s", (_marker, text, severity) => {
    const f = classify(text);
    expect(f.room).toBe("cellar");
    expect(f.severity).toBe(severity);
    expect(f.mitigationId).toBeNull();
    expect(f.cancelledMitigationId).not.toBeNull();
  });

  it("keeps a real risk that comes after the marker", () => {
    const f = classify("We do not sell your data, but we sell your contact details to data brokers.");
    expect(f.severity).toBe(3);
    expect(f.cancelledMitigationId).toBe("cellar.no-sell");
  });
});

describe("mitigations that apply (R3.2, R3.4, R3.5, R3.6, R3.7, R3.8)", () => {
  it("applies when the marker comes before the mitigation", () => {
    const f = classify("Except where the law requires it, we do not sell your personal information.");
    expect(f.severity).toBe(0);
    expect(f.mitigationId).toBe("cellar.no-sell");
    expect(f.cancelledMitigationId).toBeNull();
  });

  it("applies when the marker comes before the mitigation in another room", () => {
    const f = classify("Your plan renews automatically, but we email you 7 days before each renewal.");
    expect(f.room).toBe("vault");
    expect(f.severity).toBe(1);
    expect(f.mitigationId).toBe("vault.reminder");
  });

  it("applies when the marker is only in a different clause", () => {
    const input = "We do not sell your personal information. However, we use cookies.";
    const [first, second] = splitClauses(input).map((c) => classifyClause(c, input));
    expect(first).toMatchObject({ room: "cellar", severity: 0, mitigationId: "cellar.no-sell" });
    expect(second).toMatchObject({ room: "portraits", severity: 1, mitigationId: null });
  });

  it.each([
    ["exceptional", "We do not sell your personal information, which is an exceptional promise."],
    ["butter", "We do not sell your personal information, not even to the butter-makers next door."],
    ["subjected to", "We do not sell your personal information, as subjected to review by our auditors."],
  ])("ignores %s, which is not a marker", (_word, text) => {
    const f = classify(text);
    expect(f.severity).toBe(0);
    expect(f.mitigationId).toBe("cellar.no-sell");
  });

  it("still produces a severity 0 finding for a plain mitigation", () => {
    const f = classify("We do not sell your data.");
    expect(f).toMatchObject({ room: "cellar", severity: 0, mitigationId: "cellar.no-sell", cancelledMitigationId: null });
  });

  it("does not raise a severity that is already below the mitigation level", () => {
    const f = classify("We use cookies, and you can opt out in Settings.");
    expect(f.room).toBe("portraits");
    expect(f.severity).toBe(1);
    expect(f.mitigationId).toBeNull();
  });
});
