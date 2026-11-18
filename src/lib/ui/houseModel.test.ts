import { describe, expect, it } from "vitest";
import { ROOMS } from "../analyzer/rooms";
import type { Finding, RoomId, Severity } from "../analyzer/types";
import { bandFor, buildHouseModel, capRoom, ghostLabel, ROOM_GHOST_CAP, roomLabel, roomStatus, severityLabel } from "./houseModel";

const f = (start: number, room: RoomId, severity: Severity): Finding => ({
  id: `c-${start}`,
  room,
  severity,
  quote: `q${start}`,
  start,
  end: start + 2,
  ruleId: "r",
  mitigationId: null,
  cancelledMitigationId: null,
  explanation: "e",
  whyItMatters: "w",
});
const room = (id: RoomId) => ROOMS.find((r) => r.id === id)!;

describe("buildHouseModel", () => {
  it("returns the eight rooms in order, quiet when empty", () => {
    const m = buildHouseModel([]);
    expect(m.map((r) => r.room.id)).toEqual(ROOMS.map((r) => r.id));
    for (const r of m) expect(r).toMatchObject({ items: [], ghosts: [], wisps: [], worst: null });
  });
  it("puts each finding in its room, in input order, splitting ghosts and wisps", () => {
    const fs = [f(0, "cellar", 3), f(10, "vault", 0), f(20, "cellar", 0), f(30, "cellar", 1)];
    const m = buildHouseModel(fs);
    const cellar = m[0];
    expect(cellar.items.map((x) => x.id)).toEqual(["c-0", "c-20", "c-30"]);
    expect(cellar.ghosts.map((x) => x.id)).toEqual(["c-0", "c-30"]);
    expect(cellar.wisps.map((x) => x.id)).toEqual(["c-20"]);
    expect(cellar.worst).toBe(3);
    expect(m[2].worst).toBe(0);
  });
});

describe("labels", () => {
  it("severityLabel", () => {
    expect([0, 1, 2, 3].map((s) => severityLabel(s as Severity))).toEqual(["Looks fine", "Mild concern", "Real concern", "Serious concern"]);
  });
  it("ghostLabel for ghosts and wisps (R5.2)", () => {
    expect(ghostLabel(f(0, "cellar", 3), room("cellar"))).toBe("Severity 3 ghost in The Cellar: serious concern");
    expect(ghostLabel(f(0, "vault", 1), room("vault"))).toBe("Severity 1 ghost in The Coin Vault: mild concern");
    expect(ghostLabel(f(0, "mirror", 0), room("mirror"))).toBe("Severity 0 wisp in The Mirror Room: looks fine");
  });
  it("roomLabel matches the R4.5 examples", () => {
    const m = buildHouseModel([f(0, "cellar", 3), f(1, "cellar", 2), f(2, "cellar", 1), f(3, "mirror", 0)]);
    expect(roomLabel(m[0])).toBe("The Cellar, 3 ghosts, worst: serious concern");
    expect(roomLabel(m[5])).toBe("The Mirror Room, 1 checked, looks fine");
    expect(roomLabel(m[6])).toBe("The Trapdoor, quiet");
  });
  it("roomLabel with one ghost and wisps", () => {
    const m = buildHouseModel([f(0, "stairs", 2), f(1, "stairs", 0), f(2, "stairs", 0)]);
    expect(roomLabel(m[7])).toBe("The Shifting Stairs, 1 ghost, worst: real concern, 2 checked, look fine");
  });
  it("roomStatus is the visible status line (R4.3, R4.4)", () => {
    const m = buildHouseModel([f(0, "cellar", 3), f(1, "cellar", 0), f(2, "vault", 0)]);
    expect(roomStatus(m[0])).toBe("1 ghost · 1 checked, looks fine");
    expect(roomStatus(m[2])).toBe("1 checked, looks fine");
    expect(roomStatus(m[3])).toBe("Quiet");
  });
});

describe("bandFor (R7.1)", () => {
  it.each([
    [0, "Mostly quiet"],
    [24, "Mostly quiet"],
    [25, "Uneasy"],
    [49, "Uneasy"],
    [50, "Haunted"],
    [74, "Haunted"],
    [75, "Run"],
    [97, "Run"],
  ])("%i is %s", (score, band) => {
    expect(bandFor(score)).toBe(band);
  });
});

describe("capRoom (C22.2)", () => {
  it("caps at 12", () => {
    expect(ROOM_GHOST_CAP).toBe(12);
  });
  it("shows every item when there are 12 or fewer", () => {
    const items = Array.from({ length: 12 }, (_, i) => f(i * 10, "portraits", 1));
    expect(capRoom(items)).toEqual({ shown: items, hidden: 0 });
  });
  it("keeps the 12 most severe, ties in input order, and shows them in input order", () => {
    // 10 at severity 1, then 5 at severity 3, then 5 at severity 2: keep all five 3s, all five 2s, and the first two 1s.
    const items = [
      ...Array.from({ length: 10 }, (_, i) => f(i, "portraits", 1)),
      ...Array.from({ length: 5 }, (_, i) => f(100 + i, "portraits", 3)),
      ...Array.from({ length: 5 }, (_, i) => f(200 + i, "portraits", 2)),
    ];
    const { shown, hidden } = capRoom(items);
    expect(hidden).toBe(8);
    expect(shown.map((x) => x.start)).toEqual([0, 1, 100, 101, 102, 103, 104, 200, 201, 202, 203, 204]);
  });
  it("the room's accessible name still counts every finding", () => {
    const items = Array.from({ length: 40 }, (_, i) => f(i, "portraits", 1));
    const m = buildHouseModel(items)[1];
    expect(roomLabel(m)).toBe("The Watching Portraits, 40 ghosts, worst: mild concern");
  });
});
