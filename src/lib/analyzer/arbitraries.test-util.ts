// Shared fast-check generators for the three specs (clause-analyzer design, "Correctness properties").
// Test support only: the app never imports this file; it is excluded from coverage and the purity scan.
import fc from "fast-check";
import { ABBREVIATIONS } from "./splitter";
import { NEGATIVE_EXAMPLES, POSITIVE_EXAMPLES } from "./examples.test-util";

export const CAP = 50_000;

/** Any code point (no lone surrogates), up to 2,000 code points. */
export const anyString = fc.string({ unit: "binary", maxLength: 2_000 });

/** Any UTF-16 code unit, including lone surrogates and control characters. */
export const utf16String = fc.string({
  unit: fc.integer({ min: 0, max: 0xffff }).map((n) => String.fromCharCode(n)),
  maxLength: 2_000,
});

const FRAGMENTS: readonly string[] = [
  ...POSITIVE_EXAMPLES.map((e) => e.text),
  ...NEGATIVE_EXAMPLES.map((e) => e.text),
  ...ABBREVIATIONS.map((a) => ` ${a} `),
  "\n\n", "\r\n", "\n", "  - ", "1. ", "(a) ", "• ", "👻", "🕯️", "; ", "... ", ". ", "? ", "! ", '" ', ") ",
  " we do not sell your data, but ", " except ", " unless ", " however, ",
];

/** Text built from real policy-like fragments, separators and random words. */
export const policyLike = fc
  .array(fc.oneof(fc.constantFrom(...FRAGMENTS), fc.string({ unit: "grapheme-ascii", maxLength: 12 })), { maxLength: 60 })
  .map((parts) => parts.join(""));

const repeatTo = (fragment: string, length: number) => {
  const f = fragment.length > 0 ? fragment : "x ";
  return f.repeat(Math.ceil(length / f.length)).slice(0, length);
};

/** Policy-like text stretched to any length up to the cap. */
export const bigString = fc
  .tuple(policyLike, fc.integer({ min: 0, max: CAP }))
  .map(([fragment, length]) => repeatTo(fragment, length));

/** Policy-like text longer than the cap (50,001 to 60,000 code units). */
export const overCapString = fc
  .tuple(policyLike, fc.integer({ min: CAP + 1, max: 60_000 }))
  .map(([fragment, length]) => repeatTo(fragment, length));

/** One of the positive (risky) example clauses. */
export const riskyClause = fc.constantFrom(...POSITIVE_EXAMPLES.map((e) => e.text));
