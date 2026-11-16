// Public API of the clause analyzer.
export { analyze, MAX_INPUT_LENGTH } from "./analyze";
export { classifyClause } from "./classifier";
export { likelyNonEnglish } from "./language";
export { ROOMS, ROOM_IDS, ROOM_ORDER, roomById } from "./rooms";
export { EXCEPTION_MARKER, MITIGATIONS, RULES } from "./rules";
export type { Mitigation, Rule } from "./rules";
export { hauntScore, MAX_REACHABLE_SCORE, ROOM_CAPS, SEVERITY_WEIGHTS } from "./score";
export type { Scored } from "./score";
export { splitClauses } from "./splitter";
export type { AnalyzeOk, AnalyzeResult, AnalyzeTooLong, Clause, Finding, Room, RoomId, Severity } from "./types";
