// Precompute the medium's readings for the three samples (llm-explainer R16, PLAN_DECISIONS.md C10.13–C10.14).
// Run by hand only: `npm run precompute:samples`, which uses `tsx --conditions=react-server` so that
// `server-only` (imported by gemini.ts) resolves to its empty module. The build never runs this script and never calls Google.
//
// - No GEMINI_API_KEY: no network call; keeps valid, consistent entries and writes rule-based entries for the rest; exit 0.
// - With a key: one real `models.get` call first. If Google rejects the model or the key, print an
//   ERROR, leave the file untouched and exit 1. Then one call per sample; any failed sample exits 1.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { analyze as realAnalyze } from "../src/lib/analyzer/analyze";
import type { AnalyzeResult } from "../src/lib/analyzer/types";
import { createGeminiProvider, DEFAULT_MODEL, fetchModel } from "../src/lib/llm/gemini";
import { parseLlmOutput } from "../src/lib/llm/parse";
import { isTimeoutError, LLM_TIMEOUT_MS, runWithTimeout, withTimeout, type Provider } from "../src/lib/llm/provider";
import { buildExplainRequest } from "../src/lib/llm/request";
import { SAMPLE_IDS, SampleEntry, type SampleExplanationsFile } from "../src/lib/llm/schema";
import { SAMPLES } from "../src/lib/samples";

export const FILE_PATH = "src/lib/samples/sample-explanations.json";
const MODELS_DOC = "https://ai.google.dev/gemini-api/docs/models";
type SampleId = (typeof SAMPLE_IDS)[number];
type Entry = SampleEntry;

interface SampleInput {
  readonly id: SampleId;
  readonly text: string;
}

export interface PrecomputeArgs {
  provider: Provider | null;
  existing: unknown;
  model: string | null;
  samples?: readonly SampleInput[];
  analyze?: (text: string) => AnalyzeResult;
  timeoutMs?: number;
}
export interface PrecomputeResult {
  file: SampleExplanationsFile;
  lines: string[];
  exitCode: 0 | 1;
  wrote: boolean;
}

/** Keys in a fixed order (R16.11). */
function entry(source: Entry["source"], model: string | null, findingIds: string[], llmFindings: Entry["llmFindings"]): Entry {
  return { source, model, findingIds, llmFindings } as Entry;
}
const rulesEntry = (findingIds: string[]): Entry => entry("rules", null, findingIds, []);

function existingEntry(existing: unknown, id: SampleId): Entry | null {
  if (!existing || typeof existing !== "object") return null;
  const file = existing as { version?: unknown; samples?: Record<string, unknown> };
  if (file.version !== 1 || !file.samples || typeof file.samples !== "object") return null;
  const parsed = SampleEntry.safeParse(file.samples[id]);
  return parsed.success ? parsed.data : null;
}

/** R16.7: same finding IDs as the analyzer now gives, and every LLM finding ID among them. */
function consistent(e: Entry, findingIds: readonly string[]): boolean {
  if (e.findingIds.length !== findingIds.length || e.findingIds.some((x, i) => x !== findingIds[i])) return false;
  const ids = new Set(findingIds);
  return e.llmFindings.every((f) => ids.has(f.id));
}

const summary = (id: SampleId, e: Entry) =>
  `precompute: ${id} source=${e.source} llmFindings=${e.llmFindings.length} model=${e.model ?? "null"}`;

/** The pure core: no file or console I/O. */
export async function precompute({
  provider,
  existing,
  model,
  samples = SAMPLES,
  analyze = realAnalyze,
  timeoutMs = LLM_TIMEOUT_MS,
}: PrecomputeArgs): Promise<PrecomputeResult> {
  const lines: string[] = [];
  let exitCode: 0 | 1 = 0;
  if (!provider) lines.push("precompute: no GEMINI_API_KEY; writing rule-based readings");
  const timed = provider ? withTimeout(provider, timeoutMs) : null;
  const out = {} as Record<SampleId, Entry>;

  for (const id of SAMPLE_IDS) {
    const sample = samples.find((s) => s.id === id);
    const result = sample ? analyze(sample.text) : null;
    const findings = result?.ok ? result.findings : [];
    const findingIds = findings.map((f) => f.id);
    const prior = existingEntry(existing, id);
    const fallback = prior && consistent(prior, findingIds) ? prior : rulesEntry(findingIds);

    let e: Entry = fallback;
    const request = buildExplainRequest(findings);
    if (timed && model && request) {
      let reason: "timeout" | "error" | "invalid" | null = null;
      try {
        const text = await timed.explain(request.clauses);
        const parsed = parseLlmOutput(text, new Set(request.clauses.map((c) => c.id)));
        if (parsed.ok) {
          const order = new Map(findingIds.map((x, i) => [x, i]));
          const llmFindings = [...parsed.findings].sort((a, b) => order.get(a.id)! - order.get(b.id)!);
          e = entry("llm", model, findingIds, llmFindings);
        } else reason = "invalid";
      } catch (err) {
        reason = isTimeoutError(err) ? "timeout" : "error";
      }
      if (reason) {
        exitCode = 1;
        lines.push(`ERROR precompute: sample ${id} failed (${reason})`);
      }
    }
    out[id] = e;
    lines.push(summary(id, e));
  }

  return { file: { version: 1, samples: { mild: out.mild, average: out.average, terrible: out.terrible } }, lines, exitCode, wrote: true };
}

export function serialize(file: SampleExplanationsFile): string {
  return JSON.stringify(file, null, 2) + "\n";
}

/** One real models.get call before any sample call (R16.12, R16.13). */
export async function checkModel({
  model,
  source,
  getModel,
  timeoutMs = LLM_TIMEOUT_MS,
}: {
  model: string;
  source: "GEMINI_MODEL" | "default";
  getModel: (model: string, signal: AbortSignal) => Promise<unknown>;
  timeoutMs?: number;
}): Promise<{ ok: boolean; lines: string[] }> {
  const lines = [`precompute: model=${model} source=${source}`];
  try {
    await runWithTimeout((signal) => getModel(model, signal), timeoutMs);
    return { ok: true, lines };
  } catch (err) {
    const status = typeof (err as { status?: unknown })?.status === "number" ? (err as { status: number }).status : null;
    if (status === 401 || status === 403) {
      lines.push(
        `ERROR precompute: Gemini refused the API key (HTTP ${status}) while checking model "${model}".`,
        "Check GEMINI_API_KEY in .env.local and run npm run precompute:samples again.",
      );
    } else {
      lines.push(
        `ERROR precompute: Gemini rejected model "${model}" (HTTP ${status ?? "no response"}).`,
        `Set GEMINI_MODEL in .env.local to a current model ID (see ${MODELS_DOC}) and run npm run precompute:samples again.`,
      );
    }
    return { ok: false, lines };
  }
}

export interface RunIO {
  env: Record<string, string | undefined>;
  readFile: () => string | null;
  writeFile: (content: string) => void;
  print: (line: string) => void;
  createProvider: () => Provider;
  getModel: (model: string, signal: AbortSignal) => Promise<unknown>;
}

/** Everything main() does, with the I/O injected so it can be tested. Returns the exit code. */
export async function run(io: RunIO): Promise<number> {
  const raw = io.readFile();
  let existing: unknown = null;
  try {
    existing = raw === null ? null : JSON.parse(raw);
  } catch {
    existing = null;
  }

  const key = (io.env.GEMINI_API_KEY ?? "").trim();
  let provider: Provider | null = null;
  let model: string | null = null;
  if (key) {
    const override = (io.env.GEMINI_MODEL ?? "").trim();
    model = override || DEFAULT_MODEL;
    const check = await checkModel({ model, source: override ? "GEMINI_MODEL" : "default", getModel: io.getModel });
    for (const l of check.lines) io.print(l);
    if (!check.ok) return 1; // the file is left exactly as it was
    provider = io.createProvider();
  }

  const result = await precompute({ provider, existing, model });
  const content = serialize(result.file);
  if (result.wrote && content !== raw) io.writeFile(content);
  for (const l of result.lines) io.print(l);
  return result.exitCode;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const { loadEnvConfig } = await import("@next/env");
  loadEnvConfig(root); // reads .env.local, where the user keeps the key
  const path = join(root, FILE_PATH);
  process.exitCode = await run({
    env: process.env,
    readFile: () => {
      try {
        return readFileSync(path, "utf8");
      } catch {
        return null;
      }
    },
    writeFile: (content) => writeFileSync(path, content),
    print: (line) => (line.startsWith("ERROR") ? console.error(line) : console.log(line)),
    createProvider: createGeminiProvider,
    getModel: fetchModel,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
