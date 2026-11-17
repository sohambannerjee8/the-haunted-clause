// Real-policy audit (PLAN_DECISIONS.md C20): a local check of the rule-based analyzer against real policies.
//
// - The list of policies lives in audit/sources.json, which git ignores, so no real company's name or
//   policy appears in the repository. Format: [{ "name": "...", "url": "https://..." }].
// - Each policy is fetched, reduced to plain text, analysed in chunks of at most 50,000 characters, and
//   summarised in audit/report.md (also git-ignored): score and band, ghosts per room, and up to 10
//   "possible misses", sentences that mention a risky keyword but got no finding.
// - The fetched policy text itself is never written to disk; only the report's short quotes are.
//
// Run: npx tsx scripts/audit-real-policies.mts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { analyze, MAX_INPUT_LENGTH } from "../src/lib/analyzer/analyze";
import { ROOMS } from "../src/lib/analyzer/rooms";
import { hauntScore } from "../src/lib/analyzer/score";
import type { Finding, RoomId } from "../src/lib/analyzer/types";
import { bandFor } from "../src/lib/ui/houseModel";

export const SOURCES_PATH = "audit/sources.json";
export const REPORT_PATH = "audit/report.md";
export const MAX_MISSES = 10;
export const MIN_MISS_WORDS = 6;

/** The keywords the user listed: sell, share, disclose, track, location, arbitration, cancel, renew, licence, liable, change. */
export const MISS_KEYWORDS =
  /\b(?:sell\w*|sold|share[sd]?|sharing|disclos\w*|track\w*|locations?|arbitrat\w*|cancel\w*|renew\w*|licen[cs]\w*|liable|liability|chang\w*)\b/i;

const BLOCK = /<\/?(?:p|div|section|article|header|footer|main|aside|nav|h[1-6]|li|ul|ol|table|tr|td|th|dl|dt|dd|blockquote|pre|br|hr)\b[^>]*>/gi;
const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…" };

/** Plain text from HTML: no scripts or styles, block elements become paragraph breaks. */
export function htmlToText(html: string): string {
  const text = html
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(BLOCK, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => ENTITIES[name.toLowerCase()] ?? m);
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p !== "")
    .join("\n\n");
}

/** Chunks of at most MAX_INPUT_LENGTH characters, split at paragraph breaks; joining with "\n\n" restores the text. */
export function chunkText(text: string, limit = MAX_INPUT_LENGTH): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const para of text.split("\n\n")) {
    if (para.length > limit) {
      if (current) chunks.push(current);
      current = "";
      for (let i = 0; i < para.length; i += limit) chunks.push(para.slice(i, i + limit));
      continue;
    }
    const next = current ? `${current}\n\n${para}` : para;
    if (next.length > limit) {
      chunks.push(current);
      current = para;
    } else current = next;
  }
  if (current) chunks.push(current);
  return chunks;
}

export interface RoomCount {
  readonly id: RoomId;
  readonly name: string;
  /** Ghosts at severity 0, 1, 2 and 3. */
  readonly bySeverity: readonly [number, number, number, number];
}

export interface Audit {
  readonly characters: number;
  readonly clauses: number;
  readonly findings: number;
  readonly score: number;
  readonly band: string;
  readonly rooms: readonly RoomCount[];
  readonly possibleMisses: readonly string[];
  readonly totalPossibleMisses: number;
}

const short = (s: string) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 300 ? `${t.slice(0, 297)}…` : t;
};

export function auditText(text: string): Audit {
  const findings: Finding[] = [];
  const misses: string[] = [];
  const seen = new Set<string>();
  let clauses = 0;
  for (const chunk of chunkText(text)) {
    const r = analyze(chunk);
    if (!r.ok) continue; // cannot happen: every chunk is within the cap
    clauses += r.clauses.length;
    findings.push(...r.findings);
    const found = new Set(r.findings.map((f) => f.id));
    for (const c of r.clauses) {
      if (found.has(c.id) || !MISS_KEYWORDS.test(c.text)) continue;
      const s = short(c.text);
      // Headings ("Changes to this policy") and repeated sentences are not useful leads.
      if (s.split(" ").length < MIN_MISS_WORDS || seen.has(s)) continue;
      seen.add(s);
      misses.push(s);
    }
  }
  const score = hauntScore(findings);
  const rooms = ROOMS.map((room) => {
    const counts: [number, number, number, number] = [0, 0, 0, 0];
    for (const f of findings) if (f.room === room.id) counts[f.severity] += 1;
    return { id: room.id, name: room.name, bySeverity: counts };
  });
  return {
    characters: text.length,
    clauses,
    findings: findings.length,
    score,
    band: bandFor(score),
    rooms,
    possibleMisses: misses.slice(0, MAX_MISSES),
    totalPossibleMisses: misses.length,
  };
}

export interface Source {
  readonly name: string;
  readonly url: string;
}

export function parseSources(raw: string): Source[] {
  const list: unknown = JSON.parse(raw);
  if (!Array.isArray(list) || list.length === 0) throw new Error("expected a non-empty array");
  return list.map((s, i) => {
    const { name, url } = (s ?? {}) as Record<string, unknown>;
    if (typeof name !== "string" || !name.trim()) throw new Error(`entry ${i}: name missing`);
    if (typeof url !== "string" || !url.startsWith("https://")) throw new Error(`entry ${i}: url must be https`);
    return { name: name.trim(), url };
  });
}

export type Result = { readonly source: Source; readonly audit?: Audit; readonly error?: string };

export function renderReport(results: readonly Result[], at: Date): string {
  const out = [
    "# Real-policy audit",
    "",
    `Generated ${at.toISOString()} by \`scripts/audit-real-policies.mts\`. **Do not commit this file.** The audit/ folder is git-ignored; the policy text itself is not saved, only the short quotes below.`,
    "",
    "Possible misses are sentences that mention sell, share, disclose, track, location, arbitration, cancel, renew, licence, liable or change but got no finding (headings under six words and repeats are skipped). Many are harmless (headings, definitions, a promise not to sell); they are leads to check, not errors.",
    "",
  ];
  for (const { source, audit, error } of results) {
    out.push(`## ${source.name}`, "", `Source: ${source.url}`, "");
    if (!audit) {
      out.push(`Fetch failed: ${error}`, "");
      continue;
    }
    out.push(
      `**Haunt Score:** ${audit.score} · ${audit.band}  `,
      `${audit.characters.toLocaleString("en")} characters, ${audit.clauses} clauses, ${audit.findings} ghosts.`,
      "",
      "| Room | Ghosts | Sev 0 | Sev 1 | Sev 2 | Sev 3 |",
      "| --- | --- | --- | --- | --- | --- |",
      ...audit.rooms.map((r) => `| ${r.name} | ${r.bySeverity.reduce((a, b) => a + b, 0)} | ${r.bySeverity.join(" | ")} |`),
      "",
      `**Possible misses** (${audit.possibleMisses.length} shown of ${audit.totalPossibleMisses}):`,
      "",
      ...(audit.possibleMisses.length ? audit.possibleMisses.map((m, i) => `${i + 1}. ${m.replace(/\|/g, "\\|")}`) : ["none"]),
      "",
    );
  }
  return out.join("\n");
}

export interface RunIO {
  readSources(): string;
  fetchHtml(url: string): Promise<string>;
  writeFile(path: string, content: string): void;
  print(line: string): void;
  now(): Date;
}

export async function run(io: RunIO): Promise<number> {
  let sources: Source[];
  try {
    sources = parseSources(io.readSources());
  } catch (e) {
    io.print(`audit: cannot read ${SOURCES_PATH} (${(e as Error).message}). Create it as [{ "name": "...", "url": "https://..." }].`);
    return 1;
  }
  const results: Result[] = [];
  for (const source of sources) {
    try {
      const audit = auditText(htmlToText(await io.fetchHtml(source.url)));
      results.push({ source, audit });
      io.print(`audit: ${source.name} score=${audit.score} ghosts=${audit.findings} possibleMisses=${audit.totalPossibleMisses}`);
    } catch (e) {
      results.push({ source, error: (e as Error).message });
      io.print(`audit: ${source.name} fetch failed (${(e as Error).message})`);
    }
  }
  io.writeFile(REPORT_PATH, renderReport(results, io.now()));
  io.print(`audit: wrote ${REPORT_PATH}`);
  return 0;
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/159.0 Safari/537.36";

async function main(): Promise<void> {
  const root = process.cwd();
  const code = await run({
    readSources: () => readFileSync(join(root, SOURCES_PATH), "utf8"),
    fetchHtml: async (url) => {
      const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    },
    writeFile: (p, c) => {
      mkdirSync(dirname(join(root, p)), { recursive: true });
      writeFileSync(join(root, p), c);
    },
    print: (l) => console.log(l),
    now: () => new Date(),
  });
  process.exitCode = code;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
