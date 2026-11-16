// Clause splitter (clause-analyzer R1, design "Splitter").
// Joining the returned clauses always gives back the input exactly.
import type { Clause } from "./types";

const WS = /\s/;
const TERMINATORS = new Set([".", ";", "?", "!"]);
const CLOSERS = new Set([")", "]", '"', "'", "”", "’"]);
const LETTER = /\p{L}/u;

/** Abbreviations whose final "." never ends a clause (R1.10), matched exactly. */
export const ABBREVIATIONS: readonly string[] = Object.freeze([
  "e.g.", "i.e.", "Inc.", "Ltd.", "Co.", "Corp.", "U.S.", "No.", "Sec.", "etc.", "vs.",
  "E.g.", "I.e.", "Etc.", "Vs.",
]);

/** A list marker at a line start, after optional spaces or tabs, followed by a space or tab (R1.9). */
const LIST_MARKER = /^[ \t]*(?:[-*•]|\d{1,3}[.)]|[A-Za-z]\)|\([A-Za-z0-9]{1,4}\))[ \t]/;

const isWs = (ch: string | undefined) => ch !== undefined && WS.test(ch);

function endsWithAbbreviation(text: string, dot: number): boolean {
  for (const abbr of ABBREVIATIONS) {
    const start = dot + 1 - abbr.length;
    if (start < 0 || text.slice(start, dot + 1) !== abbr) continue;
    if (start === 0 || !LETTER.test(text[start - 1])) return true;
  }
  return false;
}

/** runEnd[i] = index just after the whitespace run that contains i (or i itself when text[i] is not whitespace). */
function whitespaceRunEnds(text: string): Int32Array {
  const ends = new Int32Array(text.length + 1);
  ends[text.length] = text.length;
  for (let i = text.length - 1; i >= 0; i--) ends[i] = isWs(text[i]) ? ends[i + 1] : i;
  return ends;
}

export function splitClauses(text: string): Clause[] {
  const n = text.length;
  if (n === 0) return [];
  const runEnd = whitespaceRunEnds(text);
  const candidates: number[] = [];
  const markerDots = new Set<number>();

  // List markers at each line start (R1.9). Record the "." of numbered markers so it is not a terminator.
  for (let lineStart = 0; lineStart < n; ) {
    const nl = text.indexOf("\n", lineStart);
    const lineEnd = nl === -1 ? n : nl;
    const m = LIST_MARKER.exec(text.slice(lineStart, Math.min(lineEnd, lineStart + 16)));
    if (m) {
      const markerAt = lineStart + m[0].search(/\S/);
      candidates.push(markerAt);
      const dot = text.indexOf(".", markerAt);
      if (dot !== -1 && dot < lineStart + m[0].length) markerDots.add(dot);
    }
    if (nl === -1) break;
    lineStart = nl + 1;
  }

  for (let i = 0; i < n; i++) {
    const ch = text[i];
    // Terminators followed by optional closers and then whitespace (R1.7).
    if (TERMINATORS.has(ch)) {
      if (ch === "." && (markerDots.has(i) || endsWithAbbreviation(text, i))) continue;
      let j = i + 1;
      while (j < n && CLOSERS.has(text[j])) j++;
      if (j < n && isWs(text[j])) candidates.push(runEnd[j]);
      continue;
    }
    // Paragraph breaks: a whitespace run holding \n, optional spaces/tabs/\r, then \n (R1.8, R1.11).
    if (ch === "\n") {
      let j = i + 1;
      while (j < n && (text[j] === " " || text[j] === "\t" || text[j] === "\r")) j++;
      if (j < n && text[j] === "\n") candidates.push(runEnd[j]);
    }
  }

  // Resolution (R1.13): snap every candidate to the end of the whitespace run it is in or touches,
  // drop 0 and n, remove duplicates, sort.
  const boundaries = new Set<number>();
  for (const c of candidates) {
    const snapped = c < n && isWs(text[c]) ? runEnd[c] : c;
    if (snapped > 0 && snapped < n) boundaries.add(snapped);
  }
  const sorted = [...boundaries].sort((a, b) => a - b);
  // Every clause after the first starts with a non-whitespace character (snapping above), so only the
  // first can be whitespace-only, when the input starts with a blank line. Merge it into the next (R1.5).
  if (sorted.length > 0 && runEnd[0] >= sorted[0]) sorted.shift();

  const clauses: Clause[] = [];
  let start = 0;
  for (const end of [...sorted, n]) {
    clauses.push({ id: `c-${start}`, start, end, text: text.slice(start, end) });
    start = end;
  }
  return clauses;
}
