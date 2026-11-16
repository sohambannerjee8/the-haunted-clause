import { describe, expect, it } from "vitest";
import { ROOM_IDS } from "./rooms";
import { hauntScore, MAX_REACHABLE_SCORE, ROOM_CAPS, roundHalfUp, SEVERITY_WEIGHTS, type Scored } from "./score";
import type { RoomId, Severity } from "./types";

/** Build findings from a per-room count table [sev0, sev1, sev2, sev3]. */
function build(spec: Partial<Record<RoomId, [number, number, number, number]>>): Scored[] {
  return Object.entries(spec).flatMap(([room, counts]) =>
    counts!.flatMap((n, s) => Array.from({ length: n }, () => ({ room: room as RoomId, severity: s as Severity }))),
  );
}

describe("constants (R5.1)", () => {
  it("uses the approved weights, caps and maximum", () => {
    expect(SEVERITY_WEIGHTS).toEqual([0, 0.05, 0.15, 0.3]);
    expect(ROOM_CAPS).toEqual([0, 0.06, 0.15, 0.35]);
    expect(MAX_REACHABLE_SCORE).toBe(97);
  });
});

describe("hauntScore (R5.1, R5.3, R5.4)", () => {
  it("is 0 with no findings", () => {
    expect(hauntScore([])).toBe(0);
  });

  it("is 0 when every finding has severity 0", () => {
    expect(hauntScore(build({ cellar: [5, 0, 0, 0], mirror: [3, 0, 0, 0] }))).toBe(0);
  });

  it.each([
    [1, 5],
    [2, 15],
    [3, 30],
  ] as const)("gives a single severity %i finding a score of %i", (severity, score) => {
    expect(hauntScore([{ room: "cellar", severity }])).toBe(score);
  });

  it.each([
    [1, 6],
    [2, 15],
    [3, 35],
  ] as const)("caps a room whose worst finding is severity %i at %i", (severity, score) => {
    expect(hauntScore(Array.from({ length: 6 }, () => ({ room: "court" as RoomId, severity })))).toBe(score);
  });

  it("gives exactly 97 when all eight rooms are saturated", () => {
    expect(hauntScore(ROOM_IDS.flatMap((room) => [{ room, severity: 3 as const }, { room, severity: 3 as const }]))).toBe(97);
  });

  it("never exceeds 97, however many severity 3 findings there are", () => {
    expect(hauntScore(ROOM_IDS.flatMap((room) => Array.from({ length: 50 }, () => ({ room, severity: 3 as const }))))).toBe(97);
  });

  it("keeps a policy with only severity 1 findings at 39 or below", () => {
    expect(hauntScore(ROOM_IDS.flatMap((room) => Array.from({ length: 30 }, () => ({ room, severity: 1 as const }))))).toBe(39);
  });

  it.each([
    ["long realistic (150 clauses, 62 findings)", { cellar: [6, 8, 3, 1], portraits: [4, 9, 2, 0], vault: [2, 3, 1, 0], "locked-door": [3, 2, 1, 0], court: [0, 1, 0, 1], mirror: [2, 3, 0, 0], trapdoor: [3, 3, 1, 0], stairs: [2, 1, 0, 0] }, 80],
    ["long, mostly severity 1 (50 findings)", { cellar: [4, 8, 2, 0], portraits: [4, 9, 2, 0], vault: [2, 4, 0, 0], "locked-door": [2, 3, 0, 0], mirror: [2, 3, 0, 0], trapdoor: [2, 3, 0, 0] }, 44],
    ["long mild (40 findings)", { cellar: [6, 5, 0, 0], portraits: [4, 6, 0, 0], vault: [2, 3, 0, 0], "locked-door": [3, 2, 0, 0], mirror: [2, 2, 0, 0], trapdoor: [3, 2, 0, 0] }, 31],
    ["very long mild (400 clauses, 120 findings)", { cellar: [15, 15, 0, 0], portraits: [15, 15, 0, 0], vault: [10, 10, 0, 0], "locked-door": [10, 10, 0, 0], mirror: [5, 5, 0, 0], trapdoor: [5, 5, 0, 0] }, 31],
  ] as const)("gives the design's long-policy scenario %s a score of %i", (_name, spec, score) => {
    expect(hauntScore(build(spec as Partial<Record<RoomId, [number, number, number, number]>>))).toBe(score);
  });
});

describe("roundHalfUp", () => {
  it("rounds halves up and is safe against tiny floating-point errors", () => {
    expect(roundHalfUp(24.5)).toBe(25);
    expect(roundHalfUp(24.49)).toBe(24);
    expect(roundHalfUp(24.499999999999996)).toBe(25);
    expect(roundHalfUp(96.814)).toBe(97);
    expect(roundHalfUp(0)).toBe(0);
  });
});
