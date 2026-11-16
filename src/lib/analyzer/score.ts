// Haunt Score (clause-analyzer R5; PLAN_DECISIONS.md C10.6, Option B).
// Inside each room, findings combine; each room is capped by its worst severity; then rooms combine.
import { ROOMS } from "./rooms";
import type { RoomId, Severity } from "./types";

/** Weight per severity 0–3 inside a room. */
export const SEVERITY_WEIGHTS: readonly number[] = Object.freeze([0, 0.05, 0.15, 0.3]);
/** Ceiling per room, by the room's highest severity 0–3. */
export const ROOM_CAPS: readonly number[] = Object.freeze([0, 0.06, 0.15, 0.35]);
/** 100 × (1 − 0.65⁸) = 96.81, which rounds to 97. No input can score higher. */
export const MAX_REACHABLE_SCORE = 97;

export interface Scored {
  readonly room: RoomId;
  readonly severity: Severity;
}

/** Round half up, tolerant of floating-point results such as 24.499999999999996 for an exact 24.5. */
export function roundHalfUp(x: number): number {
  return Math.floor(x + 0.5 + 1e-9);
}

export function hauntScore(findings: readonly Scored[]): number {
  const survive = new Map<RoomId, number>(); // Π(1 − w) per room
  const worst = new Map<RoomId, Severity>();
  for (const f of findings) {
    survive.set(f.room, (survive.get(f.room) ?? 1) * (1 - SEVERITY_WEIGHTS[f.severity]));
    if (f.severity > (worst.get(f.room) ?? 0)) worst.set(f.room, f.severity);
  }
  let product = 1;
  for (const { id } of ROOMS) {
    if (!survive.has(id)) continue;
    const raw = 1 - survive.get(id)!;
    const room = Math.min(raw, ROOM_CAPS[worst.get(id) ?? 0]);
    product *= 1 - room;
  }
  return roundHalfUp(100 * (1 - product));
}
