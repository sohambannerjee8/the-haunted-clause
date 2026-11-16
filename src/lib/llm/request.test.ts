import { describe, expect, it } from "vitest";
import type { Finding, Severity } from "../analyzer/types";
import { buildExplainRequest } from "./request";
import { ExplainRequest } from "./schema";

const finding = (start: number, severity: Severity, quote = `Clause at ${start}.`): Finding => ({
  id: `c-${start}`,
  room: "vault",
  severity,
  quote,
  start,
  end: start + quote.length,
  ruleId: "vault-renew",
  mitigationId: null,
  cancelledMitigationId: null,
  explanation: "e",
  whyItMatters: "w",
});

describe("buildExplainRequest (R13)", () => {
  it("returns null when there are no findings (R13.3)", () => {
    expect(buildExplainRequest([])).toBeNull();
  });
  it("maps each finding to id, room, severity and its quote (R13.1)", () => {
    const r = buildExplainRequest([finding(0, 2), finding(40, 0)]);
    expect(r).toEqual({
      clauses: [
        { id: "c-0", room: "vault", severity: 2, text: "Clause at 0." },
        { id: "c-40", room: "vault", severity: 0, text: "Clause at 40." },
      ],
    });
    expect(ExplainRequest.safeParse(r).success).toBe(true);
  });
  it("keeps the 40 most severe of 41 findings, in input order (R13.2)", () => {
    // Severity 0 at position 7 is the one to drop.
    const fs = Array.from({ length: 41 }, (_, i) => finding(i * 100, i === 7 ? 0 : ((i % 3) + 1) as Severity));
    const r = buildExplainRequest(fs)!;
    expect(r.clauses).toHaveLength(40);
    expect(r.clauses.map((c) => c.id)).toEqual(fs.filter((_, i) => i !== 7).map((f) => f.id));
  });
  it("breaks severity ties by input order: of 41 equal findings the last is dropped (R13.2)", () => {
    const fs = Array.from({ length: 41 }, (_, i) => finding(i * 10, 2));
    expect(buildExplainRequest(fs)!.clauses.map((c) => c.id)).toEqual(fs.slice(0, 40).map((f) => f.id));
  });
  it("prefers severe findings late in the text over mild early ones", () => {
    const fs = [...Array.from({ length: 40 }, (_, i) => finding(i * 10, 1)), finding(9999, 3)];
    const ids = buildExplainRequest(fs)!.clauses.map((c) => c.id);
    expect(ids).toHaveLength(40);
    expect(ids.at(-1)).toBe("c-9999");
    expect(ids).not.toContain("c-390");
  });
  it("cuts a 1,600-character quote to its first 1,500 characters (R13.1)", () => {
    const quote = "x".repeat(1000) + "y".repeat(600);
    const [c] = buildExplainRequest([finding(0, 3, quote)])!.clauses;
    expect(c.text).toBe(quote.slice(0, 1500));
  });
  it("backs off by one unit when the cut would split a surrogate pair", () => {
    const quote = "a".repeat(1499) + "👻" + "b".repeat(10); // the ghost's high surrogate is unit 1,499
    const [c] = buildExplainRequest([finding(0, 3, quote)])!.clauses;
    expect(c.text).toBe("a".repeat(1499));
    expect(c.text.length).toBe(1499);
  });
  it("keeps a whole surrogate pair that ends exactly at the cut", () => {
    const quote = "a".repeat(1498) + "👻" + "b";
    const [c] = buildExplainRequest([finding(0, 3, quote)])!.clauses;
    expect(c.text).toBe("a".repeat(1498) + "👻");
  });
});
