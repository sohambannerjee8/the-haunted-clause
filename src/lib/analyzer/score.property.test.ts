import fc from "fast-check";
import { describe, it } from "vitest";
import { ROOM_IDS } from "./rooms";
import { hauntScore, MAX_REACHABLE_SCORE } from "./score";
import type { Severity } from "./types";

const RUNS = { numRuns: 1000 };
const scored = fc.record({
  room: fc.constantFrom(...ROOM_IDS),
  severity: fc.constantFrom<Severity>(0, 1, 2, 3),
});
const findingLists = fc.array(scored, { maxLength: 400 });

const inRange = (s: number) => Number.isInteger(s) && s >= 0 && s <= 100 && s <= MAX_REACHABLE_SCORE;

describe("score properties", () => {
  it("P1: the Haunt Score is always a whole number from 0 to 100, and at most 97 (R5.2)", () => {
    fc.assert(fc.property(findingLists, (fs) => inRange(hauntScore(fs))), RUNS);
  });

  it("P7: the score does not depend on the order of findings (R5.6)", () => {
    fc.assert(
      fc.property(
        findingLists.chain((fs) => fc.tuple(fc.constant(fs), fc.shuffledSubarray(fs, { minLength: fs.length, maxLength: fs.length }))),
        ([fs, shuffled]) => hauntScore(fs) === hauntScore(shuffled),
      ),
      RUNS,
    );
  });

  it("adding any finding never lowers the score (supports P2, R5.5)", () => {
    fc.assert(fc.property(findingLists, scored, (fs, extra) => hauntScore([...fs, extra]) >= hauntScore(fs)), RUNS);
  });
});
