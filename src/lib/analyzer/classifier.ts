// Classifier (clause-analyzer R2, R3, R4; design "Classifier").
// Each clause is classified on its own: no clock, no randomness, no state between calls.
import { ROOMS } from "./rooms";
import { EXCEPTION_MARKER, MITIGATIONS, RULES, type Mitigation, type Rule } from "./rules";
import type { Clause, Finding, RoomId, Severity } from "./types";

const RULES_BY_ROOM: ReadonlyMap<RoomId, readonly Rule[]> = new Map(
  ROOMS.map((room) => [room.id, RULES.filter((r) => r.room === room.id)]),
);

// Table order matters: ties between mitigations of the same level go to the first one listed.
const MITIGATIONS_BY_ROOM: ReadonlyMap<RoomId, readonly Mitigation[]> = new Map(
  ROOMS.map((room) => [room.id, MITIGATIONS.filter((m) => m.room === room.id)]),
);

const WS = /\s/;

/** Highest-severity matching rule of a room; ties go to the first rule in the table. */
function bestRule(room: RoomId, text: string): Rule | null {
  let best: Rule | null = null;
  for (const r of RULES_BY_ROOM.get(room) ?? []) {
    if (r.pattern.test(text) && (best === null || r.severity > best.severity)) best = r;
  }
  return best;
}

interface RoomReading {
  readonly room: RoomId;
  readonly severity: Severity;
  readonly rule: Rule;
  readonly mitigationId: string | null;
  readonly cancelledMitigationId: string | null;
  /** The applied mitigation, whose texts replace the rule's (R4.5, C13). */
  readonly mitigation?: Mitigation;
}

/** Replace [start, end) with spaces of the same length, so offsets do not move (R3.11). */
function mask(text: string, spans: readonly (readonly [number, number])[]): string {
  let out = text;
  for (const [start, end] of spans) out = out.slice(0, start) + " ".repeat(end - start) + out.slice(end);
  return out;
}

function readRoom(room: RoomId, text: string): RoomReading | null {
  // R3.1: raw severity is the highest matching rule of the room.
  const rule = bestRule(room, text);
  if (rule === null) return null;
  const raw = rule.severity;

  // R3.2–R3.5: a mitigation applies unless an exception marker follows it in the same clause.
  let applying: Mitigation | null = null;
  const cancelled: { id: string; span: readonly [number, number] }[] = [];
  for (const m of MITIGATIONS_BY_ROOM.get(room) ?? []) {
    const match = m.pattern.exec(text);
    if (match === null) continue;
    const end = match.index + match[0].length;
    if (EXCEPTION_MARKER.test(text.slice(end))) cancelled.push({ id: m.id, span: [match.index, end] });
    else if (applying === null || m.level < applying.level) applying = m;
  }

  if (applying !== null) {
    // R3.2, R3.6: lower to the mitigation's level unless already lower.
    if (applying.level < raw) {
      return { room, severity: applying.level, rule, mitigationId: applying.id, cancelledMitigationId: null, mitigation: applying };
    }
    return { room, severity: raw, rule, mitigationId: null, cancelledMitigationId: null };
  }

  if (cancelled.length > 0) {
    // R3.11: ignore the cancelled reassurance's own words, judge the rest, never below 1 or above raw.
    const rest = bestRule(room, mask(text, cancelled.map((c) => c.span)));
    const severity = Math.min(raw, Math.max(rest?.severity ?? 0, 1)) as Severity;
    return { room, severity, rule: rest ?? rule, mitigationId: null, cancelledMitigationId: cancelled[0].id };
  }

  return { room, severity: raw, rule, mitigationId: null, cancelledMitigationId: null };
}

export function classifyClause(clause: Clause, input: string): Finding | null {
  // Step 1: trim to the non-whitespace span (R2.3, R4.2).
  let s = clause.start;
  let e = clause.end;
  while (s < e && WS.test(input[s])) s++;
  while (e > s && WS.test(input[e - 1])) e--;
  if (s === e) return null;
  const text = input.slice(s, e);

  // Steps 2–4: read every room in order; keep the highest severity, ties to the earlier room (R2.4).
  let best: RoomReading | null = null;
  for (const room of ROOMS) {
    const reading = readRoom(room.id, text);
    if (reading !== null && (best === null || reading.severity > best.severity)) best = reading;
  }
  if (best === null) return null;

  // Step 5: build the finding (R4).
  return {
    id: clause.id,
    room: best.room,
    severity: best.severity,
    quote: text,
    start: s,
    end: e,
    ruleId: best.rule.id,
    mitigationId: best.mitigationId,
    cancelledMitigationId: best.cancelledMitigationId,
    // A reassurance that lowered the finding is described as a reassurance (R4.5, C13).
    explanation: (best.mitigation ?? best.rule).explanation,
    whyItMatters: (best.mitigation ?? best.rule).whyItMatters,
  };
}
