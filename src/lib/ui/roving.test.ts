import { describe, expect, it } from "vitest";
import { nextIndex } from "./roving";

describe("nextIndex (R9.3)", () => {
  it.each([
    ["ArrowRight", 0, 3, 1],
    ["ArrowDown", 1, 3, 2],
    ["ArrowRight", 2, 3, 0],
    ["ArrowLeft", 0, 3, 2],
    ["ArrowUp", 2, 3, 1],
    ["Home", 2, 3, 0],
    ["End", 0, 3, 2],
    ["ArrowRight", 0, 1, 0],
  ] as const)("%s from %i of %i gives %i", (key, i, n, want) => {
    expect(nextIndex(key, i, n)).toBe(want);
  });
  it.each(["Tab", "Enter", " ", "a", "Escape", "PageDown"])("%j is not a move", (key) => {
    expect(nextIndex(key, 1, 3)).toBeNull();
  });
  it("gives null for an empty group", () => {
    expect(nextIndex("ArrowRight", 0, 0)).toBeNull();
  });
});
