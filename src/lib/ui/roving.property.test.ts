import { describe, it } from "vitest";
import fc from "fast-check";
import { nextIndex } from "./roving";

const RUNS = { numRuns: 1000 };
const KEYS = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End", "Tab", "Enter", "x"];
const OPPOSITE: Record<string, string> = { ArrowRight: "ArrowLeft", ArrowLeft: "ArrowRight", ArrowDown: "ArrowUp", ArrowUp: "ArrowDown" };

const scenario = fc
  .integer({ min: 1, max: 50 })
  .chain((count) => fc.tuple(fc.constant(count), fc.integer({ min: 0, max: count - 1 }), fc.array(fc.constantFrom(...KEYS), { maxLength: 60 })));

describe("U3: nextIndex (R9.3)", () => {
  it("keeps the index in [0, count) for any key sequence", () => {
    fc.assert(
      fc.property(scenario, ([count, start, keys]) => {
        let i = start;
        for (const k of keys) {
          const n = nextIndex(k, i, count);
          if (n !== null) i = n;
          if (!Number.isInteger(i) || i < 0 || i >= count) return false;
        }
        return true;
      }),
      RUNS,
    );
  });
  it("each arrow followed by its opposite returns to the start", () => {
    fc.assert(
      fc.property(scenario, fc.constantFrom(...Object.keys(OPPOSITE)), ([count, start], key) => {
        const there = nextIndex(key, start, count)!;
        return nextIndex(OPPOSITE[key], there, count) === start;
      }),
      RUNS,
    );
  });
  it("Home gives 0 and End gives count − 1, from anywhere", () => {
    fc.assert(
      fc.property(scenario, ([count, start]) => nextIndex("Home", start, count) === 0 && nextIndex("End", start, count) === count - 1),
      RUNS,
    );
  });
});
