// Pure functions behind the house view (haunted-house-ui design, "Pure functions").
import { ROOMS } from "../analyzer/rooms";
import type { Finding, Room, Severity } from "../analyzer/types";

export interface RoomModel<F extends Finding = Finding> {
  readonly room: Room;
  /** Every finding in this room, in input order. */
  readonly items: readonly F[];
  readonly ghosts: readonly F[];
  readonly wisps: readonly F[];
  readonly worst: Severity | null;
}

export function buildHouseModel<F extends Finding>(findings: readonly F[]): RoomModel<F>[] {
  return ROOMS.map((room) => {
    const items = findings.filter((f) => f.room === room.id);
    const worst = items.length ? (Math.max(...items.map((f) => f.severity)) as Severity) : null;
    return { room, items, ghosts: items.filter((f) => f.severity >= 1), wisps: items.filter((f) => f.severity === 0), worst };
  });
}

export const BANDS = ["Mostly quiet", "Uneasy", "Haunted", "Run"] as const;
export type Band = (typeof BANDS)[number];

export function bandFor(score: number): Band {
  if (score <= 24) return "Mostly quiet";
  if (score <= 49) return "Uneasy";
  if (score <= 74) return "Haunted";
  return "Run";
}

const SEVERITY_LABELS = ["Looks fine", "Mild concern", "Real concern", "Serious concern"] as const;
export function severityLabel(s: Severity): string {
  return SEVERITY_LABELS[s];
}

export function ghostLabel(f: Finding, room: Room): string {
  return f.severity === 0
    ? `Severity 0 wisp in ${room.name}: looks fine`
    : `Severity ${f.severity} ghost in ${room.name}: ${severityLabel(f.severity).toLowerCase()}`;
}

const ghostCount = (n: number) => `${n} ${n === 1 ? "ghost" : "ghosts"}`;
const wispCount = (n: number) => `${n} checked, ${n === 1 ? "looks" : "look"} fine`;

/** The room's accessible name (R4.5). */
export function roomLabel(m: RoomModel): string {
  if (m.items.length === 0) return `${m.room.name}, quiet`;
  const parts = [m.room.name];
  if (m.ghosts.length) parts.push(ghostCount(m.ghosts.length), `worst: ${severityLabel(m.worst!).toLowerCase()}`);
  if (m.wisps.length) parts.push(wispCount(m.wisps.length));
  return parts.join(", ");
}

/** The visible status line (R4.3, R4.4). */
export function roomStatus(m: RoomModel): string {
  if (m.items.length === 0) return "Quiet";
  const parts: string[] = [];
  if (m.ghosts.length) parts.push(ghostCount(m.ghosts.length));
  if (m.wisps.length) parts.push(wispCount(m.wisps.length));
  return parts.join(" · ");
}
