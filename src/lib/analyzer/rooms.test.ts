import { describe, expect, it } from "vitest";
import { ROOMS, ROOM_IDS, roomById } from "./rooms";

// The glossary table in .kiro/specs/clause-analyzer/requirements.md, copied here on purpose:
// this test fails if the code drifts from the approved room list.
const GLOSSARY = [
  ["cellar", "The Cellar", "Data sharing and selling"],
  ["portraits", "The Watching Portraits", "Tracking and profiling"],
  ["vault", "The Coin Vault", "Auto-renewal, fees and billing"],
  ["locked-door", "The Locked Door", "Cancellation and account deletion"],
  ["court", "The Silent Court", "Forced arbitration and class-action waivers"],
  ["mirror", "The Mirror Room", "Rights the company takes over your content"],
  ["trapdoor", "The Trapdoor", "Liability limits and disclaimers"],
  ["stairs", "The Shifting Stairs", "Terms the company can change without notice"],
] as const;

describe("ROOMS (R10.1)", () => {
  it("lists the eight rooms in glossary order with exact IDs, names and clause types", () => {
    expect(ROOMS.map((r) => [r.id, r.name, r.clauseType])).toEqual(GLOSSARY.map((g) => [...g]));
  });

  it("has unique IDs and exposes them in the same order", () => {
    expect(new Set(ROOM_IDS).size).toBe(8);
    expect(ROOM_IDS).toEqual(GLOSSARY.map((g) => g[0]));
  });

  it("looks a room up by ID", () => {
    expect(roomById("mirror").name).toBe("The Mirror Room");
  });

  it("is frozen so callers cannot change it", () => {
    expect(Object.isFrozen(ROOMS)).toBe(true);
    expect(Object.isFrozen(ROOMS[0])).toBe(true);
  });
});
