// Non-English flag (clause-analyzer R9; design "Non-English flag").
// A cheap, deterministic check: it only decides whether to show an "English only" notice.

/** Common English words in policies (lowercase). */
export const COMMON_ENGLISH: ReadonlySet<string> = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "by", "at", "from", "as",
  "is", "are", "be", "been", "was", "were", "will", "may", "can", "shall", "must", "we", "us", "our",
  "you", "your", "it", "its", "this", "that", "these", "those", "any", "all", "not", "if", "when",
  "which", "who", "such", "other", "than", "use", "information", "data", "terms", "service", "account",
  "policy", "personal", "time", "do", "have", "has", "no",
]);

const LETTER = /\p{L}/gu;
const ASCII_LETTER = /[A-Za-z]/g;
const ASCII_WORD = /[a-z']+/g;

const count = (text: string, re: RegExp) => text.match(re)?.length ?? 0;

export function likelyNonEnglish(text: string): boolean {
  const letters = count(text, LETTER);
  if (letters < 40) return false; // R9.2
  if (count(text, ASCII_LETTER) * 2 < letters) return true; // R9.3: fewer than half are ASCII
  const words = text.toLowerCase().match(ASCII_WORD) ?? [];
  if (words.length === 0) return true;
  const common = words.filter((w) => COMMON_ENGLISH.has(w)).length;
  return common * 10 < words.length; // R9.4: fewer than 10% common English words
}
