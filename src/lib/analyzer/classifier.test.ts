import { describe, expect, it } from "vitest";
import { classifyClause } from "./classifier";
import { NEGATIVE_EXAMPLES, POSITIVE_EXAMPLES } from "./examples.test-util";
import { RULES } from "./rules";
import type { Clause } from "./types";

const whole = (text: string): Clause => ({ id: "c-0", start: 0, end: text.length, text });
const classify = (text: string) => classifyClause(whole(text), text);

describe("room examples (R2.7): positive cases", () => {
  it.each(POSITIVE_EXAMPLES.map((e) => [e.room, e.severity, e.ruleId, e.text] as const))(
    "%s, severity %i, %s: %s",
    (room, severity, ruleId, text) => {
      const f = classify(text);
      expect(f).not.toBeNull();
      expect(f!.room).toBe(room);
      expect(f!.severity).toBe(severity);
      expect(f!.ruleId).toBe(ruleId);
    },
  );

  it("has at least three positive examples per room", () => {
    const counts = new Map<string, number>();
    for (const e of POSITIVE_EXAMPLES) counts.set(e.room, (counts.get(e.room) ?? 0) + 1);
    expect([...counts.values()].every((n) => n >= 3)).toBe(true);
    expect(counts.size).toBe(8);
  });
});

describe("room examples (R2.7): negative cases", () => {
  it.each(NEGATIVE_EXAMPLES.map((e) => [e.room, e.text] as const))("not assigned to %s: %s", (room, text) => {
    const f = classify(text);
    expect(f === null || f.room !== room).toBe(true);
  });

  it("has at least two negative examples per room", () => {
    const counts = new Map<string, number>();
    for (const e of NEGATIVE_EXAMPLES) counts.set(e.room, (counts.get(e.room) ?? 0) + 1);
    expect([...counts.values()].every((n) => n >= 2)).toBe(true);
    expect(counts.size).toBe(8);
  });

  it("gives no finding at all for the negative examples (R2.2)", () => {
    for (const e of NEGATIVE_EXAMPLES) expect(classify(e.text)).toBeNull();
  });
});

describe("classifyClause rules", () => {
  it("chooses the room that comes first when two rooms tie (R2.4)", () => {
    const f = classify("We sell your data and track you across other websites.");
    expect(f!.room).toBe("cellar");
    expect(f!.severity).toBe(3);
  });

  it("chooses the higher-severity room when rooms differ (R2.4)", () => {
    const f = classify("We use cookies, and all disputes go to binding arbitration.");
    expect(f!.room).toBe("court");
    expect(f!.severity).toBe(3);
  });

  it("names the first rule in the table when rules in a room tie (R2.5)", () => {
    expect(classify("We sell your data to data brokers.")!.ruleId).toBe("cellar.sell");
  });

  it("matches case-insensitively (R2.8)", () => {
    const f = classify("WE MAY SELL YOUR PERSONAL INFORMATION.");
    expect(f!.room).toBe("cellar");
    expect(f!.severity).toBe(3);
  });

  it("gives no finding for a whitespace-only clause (R2.3)", () => {
    expect(classify(" \n\t ")).toBeNull();
  });

  it("trims the span and quotes the input exactly (R4.1, R4.2)", () => {
    const input = "  We may sell your data.  \n";
    const f = classifyClause(whole(input), input)!;
    expect(f.start).toBe(2);
    expect(f.end).toBe(24);
    expect(f.quote).toBe("We may sell your data.");
    expect(f.quote).toBe(input.slice(f.start, f.end));
  });

  it("uses the clause ID and the clause's position inside a longer input (R4.3)", () => {
    const input = "Intro. We may sell your data.";
    const clause: Clause = { id: "c-7", start: 7, end: input.length, text: input.slice(7) };
    const f = classifyClause(clause, input)!;
    expect(f.id).toBe("c-7");
    expect(f.start).toBe(7);
    expect(f.quote).toBe("We may sell your data.");
  });

  it("takes the explanation and why-it-matters texts from the rule named by ruleId (R4.5)", () => {
    for (const e of POSITIVE_EXAMPLES) {
      const f = classify(e.text)!;
      const r = RULES.find((x) => x.id === f.ruleId)!;
      expect(f.explanation).toBe(r.explanation);
      expect(f.whyItMatters).toBe(r.whyItMatters);
    }
  });

  it("produces at most one finding per clause (R2.1)", () => {
    const f = classify("We sell your data, track you across other websites and use binding arbitration.");
    expect(Array.isArray(f)).toBe(false);
    expect(f!.room).toBe("cellar");
  });
});
