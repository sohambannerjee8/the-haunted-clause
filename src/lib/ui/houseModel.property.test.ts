import { describe, it } from "vitest";
import fc from "fast-check";
import { analyze } from "../analyzer/analyze";
import { policyLike } from "../analyzer/arbitraries.test-util";
import { ROOMS } from "../analyzer/rooms";
import type { Finding, RoomId, Severity } from "../analyzer/types";
import { BANDS, bandFor, buildHouseModel, ghostLabel, severityLabel } from "./houseModel";

const RUNS = { numRuns: 1000 };
const ROOM_IDS = ROOMS.map((r) => r.id);

// Findings from the analyzer on policy-like text, and arbitrary { room, severity } lists.
const fromAnalyzer = policyLike.map((t) => {
  const r = analyze(t);
  return r.ok ? [...r.findings] : [];
});
const arbitraryFindings = fc
  .array(fc.record({ room: fc.constantFrom<RoomId>(...ROOM_IDS), severity: fc.constantFrom<Severity>(0, 1, 2, 3) }), { maxLength: 60 })
  .map((xs) =>
    xs.map(
      (x, i): Finding => ({
        id: `c-${i * 7}`,
        room: x.room,
        severity: x.severity,
        quote: `q${i}`,
        start: i * 7,
        end: i * 7 + 2,
        ruleId: "r",
        mitigationId: null,
        cancelledMitigationId: null,
        explanation: "e",
        whyItMatters: "w",
      }),
    ),
  );
const anyFindings = fc.oneof(fromAnalyzer, arbitraryFindings);

describe("houseModel properties", () => {
  it("U1: 8 rooms in order; every finding in its own room once, in input order; ghosts are severity ≥ 1, wisps 0 (R4.1, R4.4, R8.3)", () => {
    fc.assert(
      fc.property(anyFindings, (fs) => {
        const m = buildHouseModel(fs);
        if (m.length !== 8 || m.some((r, i) => r.room.id !== ROOM_IDS[i])) return false;
        const placed = m.flatMap((r) => r.items);
        if (placed.length !== fs.length) return false;
        for (const r of m) {
          const expected = fs.filter((x) => x.room === r.room.id);
          if (r.items.length !== expected.length || r.items.some((x, i) => x !== expected[i])) return false;
          if (r.ghosts.some((x) => x.severity < 1) || r.wisps.some((x) => x.severity !== 0)) return false;
          if (r.ghosts.length + r.wisps.length !== r.items.length) return false;
          const worst = expected.length ? Math.max(...expected.map((x) => x.severity)) : null;
          if (r.worst !== worst) return false;
        }
        return true;
      }),
      RUNS,
    );
  });

  it("U2: bandFor is defined for 0–100, never falls as the score rises, and matches the table", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        const bl = BANDS.indexOf(bandFor(lo));
        const bh = BANDS.indexOf(bandFor(hi));
        const table = lo <= 24 ? 0 : lo <= 49 ? 1 : lo <= 74 ? 2 : 3;
        return bl >= 0 && bh >= 0 && bl <= bh && bl === table;
      }),
      RUNS,
    );
  });

  it("U4: every ghostLabel names its own room and severity, in button order (R5.2)", () => {
    fc.assert(
      fc.property(anyFindings, (fs) => {
        for (const r of buildHouseModel(fs)) {
          const labels = r.items.map((x) => ghostLabel(x, r.room));
          for (const [i, x] of r.items.entries()) {
            const label = labels[i];
            const kind = x.severity === 0 ? "wisp" : "ghost";
            if (!label.startsWith(`Severity ${x.severity} ${kind} in ${r.room.name}: `)) return false;
            if (!label.endsWith(severityLabel(x.severity).toLowerCase())) return false;
            for (const other of ROOMS) if (other.id !== r.room.id && label.includes(` in ${other.name}:`)) return false;
          }
          // Button order is item order, which is input order.
          for (let i = 1; i < r.items.length; i++) if (r.items[i - 1].start >= r.items[i].start) return false;
        }
        return true;
      }),
      RUNS,
    );
  });
});
