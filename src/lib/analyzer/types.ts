// Types for the clause analyzer (clause-analyzer design, "Types").
// This module is pure: no imports from React, Next.js, node: modules or the network.

export type RoomId =
  | "cellar"
  | "portraits"
  | "vault"
  | "locked-door"
  | "court"
  | "mirror"
  | "trapdoor"
  | "stairs";

export type Severity = 0 | 1 | 2 | 3;

export interface Room {
  readonly id: RoomId;
  readonly name: string;
  readonly clauseType: string;
}

/** A contiguous span of the input. Invariant: text === input.slice(start, end). */
export interface Clause {
  readonly id: string;
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

export interface Finding {
  /** The clause ID, "c-<start>". */
  readonly id: string;
  readonly room: RoomId;
  readonly severity: Severity;
  /** Exactly input.slice(start, end), with the clause's edge whitespace trimmed. */
  readonly quote: string;
  readonly start: number;
  readonly end: number;
  readonly ruleId: string;
  /** Set when a mitigation lowered the severity (R3.6). */
  readonly mitigationId: string | null;
  /** Set when an exception marker cancelled a reassurance (R3.11). */
  readonly cancelledMitigationId: string | null;
  readonly explanation: string;
  readonly whyItMatters: string;
}

export interface AnalyzeOk {
  readonly ok: true;
  readonly clauses: readonly Clause[];
  readonly findings: readonly Finding[];
  readonly score: number;
  readonly likelyNonEnglish: boolean;
}

export interface AnalyzeTooLong {
  readonly ok: false;
  readonly error: { readonly code: "too-long"; readonly length: number; readonly limit: 50000 };
}

export type AnalyzeResult = AnalyzeOk | AnalyzeTooLong;
