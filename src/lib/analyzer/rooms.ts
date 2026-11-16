// The eight rooms of the house, in their fixed order (clause-analyzer R10).
import type { Room, RoomId } from "./types";

const room = (id: RoomId, name: string, clauseType: string): Room => Object.freeze({ id, name, clauseType });

export const ROOMS: readonly Room[] = Object.freeze([
  room("cellar", "The Cellar", "Data sharing and selling"),
  room("portraits", "The Watching Portraits", "Tracking and profiling"),
  room("vault", "The Coin Vault", "Auto-renewal, fees and billing"),
  room("locked-door", "The Locked Door", "Cancellation and account deletion"),
  room("court", "The Silent Court", "Forced arbitration and class-action waivers"),
  room("mirror", "The Mirror Room", "Rights the company takes over your content"),
  room("trapdoor", "The Trapdoor", "Liability limits and disclaimers"),
  room("stairs", "The Shifting Stairs", "Terms the company can change without notice"),
]);

export const ROOM_IDS: readonly RoomId[] = Object.freeze(ROOMS.map((r) => r.id));

/** Position of each room in the house order, used for tie-breaks. */
export const ROOM_ORDER: Readonly<Record<RoomId, number>> = Object.freeze(
  Object.fromEntries(ROOMS.map((r, i) => [r.id, i])) as Record<RoomId, number>,
);

export function roomById(id: RoomId): Room {
  return ROOMS[ROOM_ORDER[id]];
}
