// Tests for the manual precompute script (llm-explainer R16). The provider and models.get are
// always mocked; no test makes a real network call.
import { describe, expect, it, vi } from "vitest";
import { analyze } from "../src/lib/analyzer/analyze";
import type { Provider } from "../src/lib/llm/provider";
import { SampleExplanationsFile } from "../src/lib/llm/schema";
import { SAMPLES } from "../src/lib/samples";
import { checkModel, precompute, run, serialize, type RunIO } from "./precompute-samples.mjs";

const MODEL = "gemini-4-hydrogen";
const SUMMARY = /^precompute: (mild|average|terrible) source=(llm|rules) llmFindings=\d+ model=\S+$/;

function idsOf(text: string): string[] {
  const r = analyze(text);
  if (!r.ok) throw new Error("sample too long");
  return r.findings.map((f) => f.id);
}
const quotes = SAMPLES.flatMap((s) => {
  const r = analyze(s.text);
  return r.ok ? r.findings.map((f) => f.quote) : [];
});

/** A provider that answers every clause it is sent, raising severity 1 to 2. */
function goodProvider(): Provider & { calls: number } {
  const p = {
    calls: 0,
    async explain(clauses: readonly { id: string; severity: number }[]) {
      p.calls++;
      return JSON.stringify({
        findings: clauses.map((c) => ({
          id: c.id,
          plainEnglish: `Medium reading of ${c.id}.`,
          whyItMatters: `Why ${c.id} matters.`,
          severity: c.severity === 1 ? 2 : c.severity,
        })),
      });
    },
  };
  return p;
}
const failing = (how: "reject" | "invalid"): Provider => ({
  explain: async () => (how === "reject" ? Promise.reject(new Error("down")) : "not json"),
});

describe("precompute(): no key (R16.5, R16.9)", () => {
  it("writes rule-based entries, makes no call, prints the notice and exits 0", async () => {
    const r = await precompute({ provider: null, existing: null, model: null });
    expect(r.exitCode).toBe(0);
    expect(r.wrote).toBe(true);
    expect(r.lines[0]).toBe("precompute: no GEMINI_API_KEY; writing rule-based readings");
    expect(SampleExplanationsFile.safeParse(r.file).success).toBe(true);
    for (const s of SAMPLES) {
      expect(r.file.samples[s.id]).toEqual({ source: "rules", model: null, findingIds: idsOf(s.text), llmFindings: [] });
    }
  });
  it("keeps an existing entry that is valid and consistent", async () => {
    const first = await precompute({ provider: goodProvider(), existing: null, model: MODEL });
    const r = await precompute({ provider: null, existing: first.file, model: null });
    expect(r.file.samples.average).toEqual(first.file.samples.average);
    expect(r.file.samples.average.source).toBe("llm");
  });
});

describe("precompute(): with a provider (R16.3, R16.15)", () => {
  it("writes LLM entries carrying the model, with findings in analyzer order", async () => {
    const provider = goodProvider();
    const r = await precompute({ provider, existing: null, model: MODEL });
    expect(r.exitCode).toBe(0);
    expect(provider.calls).toBe(3);
    for (const s of SAMPLES) {
      const e = r.file.samples[s.id];
      expect(e.source).toBe("llm");
      expect(e.model).toBe(MODEL);
      expect(e.findingIds).toEqual(idsOf(s.text));
      expect(e.llmFindings.map((f) => f.id)).toEqual(idsOf(s.text).slice(0, 40));
    }
    expect(SampleExplanationsFile.safeParse(r.file).success).toBe(true);
  });
  it("output is byte-identical on a second run (R16.11)", async () => {
    const a = await precompute({ provider: goodProvider(), existing: null, model: MODEL });
    const b = await precompute({ provider: goodProvider(), existing: a.file, model: MODEL });
    expect(serialize(b.file)).toBe(serialize(a.file));
    expect(serialize(a.file).endsWith("}\n")).toBe(true);
    expect(serialize(a.file)).not.toMatch(/\d{4}-\d{2}-\d{2}T/); // no timestamps
    expect(Object.keys(a.file)).toEqual(["version", "samples"]);
    expect(Object.keys(a.file.samples)).toEqual(["mild", "average", "terrible"]);
    expect(Object.keys(a.file.samples.mild)).toEqual(["source", "model", "findingIds", "llmFindings"]);
  });
});

describe("precompute(): provider failure (R16.4, R16.14)", () => {
  it.each(["reject", "invalid"] as const)("keeps a consistent existing entry when the call fails (%s), and exits 1", async (how) => {
    const good = await precompute({ provider: goodProvider(), existing: null, model: MODEL });
    const r = await precompute({ provider: failing(how), existing: good.file, model: MODEL });
    expect(r.exitCode).toBe(1);
    expect(r.file).toEqual(good.file);
    for (const s of SAMPLES) {
      expect(r.lines).toContain(`ERROR precompute: sample ${s.id} failed (${how === "reject" ? "error" : "invalid"})`);
    }
  });
  it("replaces an inconsistent existing entry with the rule-based entry", async () => {
    const good = await precompute({ provider: goodProvider(), existing: null, model: MODEL });
    const stale = structuredClone(good.file);
    stale.samples.mild.findingIds = ["c-999999"];
    const r = await precompute({ provider: failing("reject"), existing: stale, model: MODEL });
    expect(r.file.samples.mild).toEqual({ source: "rules", model: null, findingIds: idsOf(SAMPLES[0].text), llmFindings: [] });
    expect(r.file.samples.average).toEqual(good.file.samples.average);
  });
  it("treats an LLM finding ID outside findingIds as inconsistent", async () => {
    const good = await precompute({ provider: goodProvider(), existing: null, model: MODEL });
    const bad = structuredClone(good.file);
    bad.samples.terrible.llmFindings[0] = { ...bad.samples.terrible.llmFindings[0], id: "c-123456789" };
    const r = await precompute({ provider: null, existing: bad, model: null });
    expect(r.file.samples.terrible.source).toBe("rules");
  });
  it("ignores an existing file that is not valid at all", async () => {
    for (const existing of [42, "x", { version: 2 }, { version: 1, samples: { mild: { source: "llm" } } }]) {
      const r = await precompute({ provider: null, existing, model: null });
      expect(r.file.samples.mild.source).toBe("rules");
      expect(r.exitCode).toBe(0);
    }
  });
  it("names only the failing sample when one call fails", async () => {
    const provider = goodProvider();
    let n = 0;
    const flaky: Provider = { explain: (c, o) => (++n === 2 ? Promise.reject(new Error("x")) : provider.explain(c, o)) };
    const r = await precompute({ provider: flaky, existing: null, model: MODEL });
    expect(r.exitCode).toBe(1);
    expect(r.lines.filter((l) => l.startsWith("ERROR"))).toEqual(["ERROR precompute: sample average failed (error)"]);
    expect(r.file.samples.mild.source).toBe("llm");
    expect(r.file.samples.average.source).toBe("rules");
  });
  it("times out a slow call after 15 s and names the reason", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const hang: Provider = { explain: () => new Promise<string>(() => {}) };
      const pending = precompute({ provider: hang, existing: null, model: MODEL });
      await vi.advanceTimersByTimeAsync(45_000);
      const r = await pending;
      expect(r.exitCode).toBe(1);
      expect(r.lines).toContain("ERROR precompute: sample mild failed (timeout)");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("summary lines (R16.6)", () => {
  it("match the format and contain no finding quote from any sample", async () => {
    const runs = [
      await precompute({ provider: null, existing: null, model: null }),
      await precompute({ provider: goodProvider(), existing: null, model: MODEL }),
      await precompute({ provider: failing("reject"), existing: null, model: MODEL }),
    ];
    for (const r of runs) {
      const summaries = r.lines.filter((l) => !l.startsWith("ERROR") && !l.includes("no GEMINI_API_KEY"));
      expect(summaries).toHaveLength(3);
      for (const l of summaries) expect(l).toMatch(SUMMARY);
      for (const l of r.lines) for (const q of quotes) expect(l).not.toContain(q);
    }
    expect(runs[1].lines).toContain(`precompute: mild source=llm llmFindings=${idsOf(SAMPLES[0].text).length} model=${MODEL}`);
    expect(runs[0].lines).toContain(`precompute: mild source=rules llmFindings=0 model=null`);
  });
});

describe("checkModel (R16.12, R16.13)", () => {
  it("prints the model line and passes when models.get succeeds", async () => {
    const getModel = vi.fn(async () => ({ name: `models/${MODEL}` }));
    const r = await checkModel({ model: MODEL, source: "default", getModel });
    expect(r).toEqual({ ok: true, lines: [`precompute: model=${MODEL} source=default`] });
    expect(getModel).toHaveBeenCalledTimes(1);
    expect(getModel).toHaveBeenCalledWith(MODEL, expect.any(AbortSignal));
  });
  it.each([400, 404])("a %i names the model, the status and the fix", async (status) => {
    const getModel = async () => Promise.reject(Object.assign(new Error("bad model"), { status }));
    const r = await checkModel({ model: "gemini-0-nope", source: "GEMINI_MODEL", getModel });
    expect(r.ok).toBe(false);
    expect(r.lines[0]).toBe("precompute: model=gemini-0-nope source=GEMINI_MODEL");
    expect(r.lines[1]).toBe(`ERROR precompute: Gemini rejected model "gemini-0-nope" (HTTP ${status}).`);
    expect(r.lines[2]).toMatch(/Set GEMINI_MODEL in \.env\.local to a current model ID \(see https:\/\/ai\.google\.dev\/gemini-api\/docs\/models\) and run npm run precompute:samples again\./);
  });
  it.each([401, 403])("a %i says the key was refused", async (status) => {
    const getModel = async () => Promise.reject(Object.assign(new Error("denied"), { status }));
    const r = await checkModel({ model: MODEL, source: "default", getModel });
    expect(r.ok).toBe(false);
    expect(r.lines[1]).toBe(`ERROR precompute: Gemini refused the API key (HTTP ${status}) while checking model "${MODEL}".`);
    expect(r.lines[2]).toMatch(/GEMINI_API_KEY/);
  });
  it("a failure with no HTTP status still fails loudly", async () => {
    const r = await checkModel({ model: MODEL, source: "default", getModel: async () => Promise.reject(new Error("offline")) });
    expect(r.ok).toBe(false);
    expect(r.lines[1]).toBe(`ERROR precompute: Gemini rejected model "${MODEL}" (HTTP no response).`);
  });
});

describe("run(): the I/O around the core", () => {
  function io(over: Partial<RunIO> & { file?: string | null } = {}) {
    const state = { file: over.file === undefined ? null : over.file, writes: 0, printed: [] as string[] };
    const base: RunIO = {
      env: {},
      readFile: () => state.file,
      writeFile: (s) => {
        state.file = s;
        state.writes++;
      },
      print: (l) => state.printed.push(l),
      createProvider: () => goodProvider(),
      getModel: async () => ({}),
    };
    return { io: { ...base, ...over }, state };
  }
  it("no key: writes the rule-based file and returns 0, without calling models.get or the provider", async () => {
    const getModel = vi.fn(async () => ({}));
    const createProvider = vi.fn(() => goodProvider());
    const { io: x, state } = io({ getModel, createProvider });
    expect(await run(x)).toBe(0);
    expect(getModel).not.toHaveBeenCalled();
    expect(createProvider).not.toHaveBeenCalled();
    expect(state.writes).toBe(1);
    expect(SampleExplanationsFile.safeParse(JSON.parse(state.file!)).success).toBe(true);
  });
  it("does not rewrite a file whose content is unchanged", async () => {
    const { io: x, state } = io();
    await run(x);
    const before = state.file;
    await run(x);
    expect(state.writes).toBe(1);
    expect(state.file).toBe(before);
  });
  it("a rejected model check exits 1 and leaves the file byte-for-byte unchanged (R16.13)", async () => {
    const original = '{"version":1,"anything":"exactly as it was"}\n';
    const createProvider = vi.fn(() => goodProvider());
    const { io: x, state } = io({
      file: original,
      env: { GEMINI_API_KEY: "set", GEMINI_MODEL: "gemini-0-nope" },
      getModel: async () => Promise.reject(Object.assign(new Error("nf"), { status: 404 })),
      createProvider,
    });
    expect(await run(x)).toBe(1);
    expect(state.file).toBe(original);
    expect(state.writes).toBe(0);
    expect(createProvider).not.toHaveBeenCalled();
    expect(state.printed).toContain('ERROR precompute: Gemini rejected model "gemini-0-nope" (HTTP 404).');
  });
  it("a refused key (403) exits 1 and leaves the file unchanged", async () => {
    const { io: x, state } = io({
      file: "keep me\n",
      env: { GEMINI_API_KEY: "set" },
      getModel: async () => Promise.reject(Object.assign(new Error("denied"), { status: 403 })),
    });
    expect(await run(x)).toBe(1);
    expect(state.file).toBe("keep me\n");
    expect(state.printed.some((l) => l.includes("refused the API key"))).toBe(true);
  });
  it("with a key and a passing check: prints the model line first, writes LLM entries with that model", async () => {
    const { io: x, state } = io({ env: { GEMINI_API_KEY: "set" } });
    expect(await run(x)).toBe(0);
    expect(state.printed[0]).toBe(`precompute: model=${MODEL} source=default`);
    const file = JSON.parse(state.file!);
    for (const id of ["mild", "average", "terrible"]) expect(file.samples[id]).toMatchObject({ source: "llm", model: MODEL });
  });
  it("uses the GEMINI_MODEL override and reports its source", async () => {
    const getModel = vi.fn(async () => ({}));
    const { io: x, state } = io({ env: { GEMINI_API_KEY: "set", GEMINI_MODEL: "gemini-custom" }, getModel });
    await run(x);
    expect(getModel).toHaveBeenCalledWith("gemini-custom", expect.any(AbortSignal));
    expect(state.printed[0]).toBe("precompute: model=gemini-custom source=GEMINI_MODEL");
    expect(JSON.parse(state.file!).samples.mild.model).toBe("gemini-custom");
  });
  it("a failed sample call after a passing check exits 1, names the sample and still writes (R16.14)", async () => {
    const { io: x, state } = io({ env: { GEMINI_API_KEY: "set" }, createProvider: () => failing("invalid") });
    expect(await run(x)).toBe(1);
    expect(state.printed).toContain("ERROR precompute: sample terrible failed (invalid)");
    expect(state.writes).toBe(1);
  });
  it("treats an unreadable existing file as absent", async () => {
    const { io: x, state } = io({ file: "{not json" });
    expect(await run(x)).toBe(0);
    expect(JSON.parse(state.file!).version).toBe(1);
  });
});
