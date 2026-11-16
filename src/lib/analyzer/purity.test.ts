// @vitest-environment node
// R7.2 and R7.4 (and llm-explainer R3.3): the analyzer is pure and self-contained, and the sample
// modules can be imported by Playwright tests and scripts without the Next.js path alias.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ANALYZER = join(process.cwd(), "src/lib/analyzer");
const SAMPLES = join(process.cwd(), "src/lib/samples");
const isSource = (f: string) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !/\.test-util\.ts$/.test(f);
const sources = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter(isSource) : []);

/** Import specifiers in a file, with whether the import is type-only. */
function imports(code: string): { spec: string; typeOnly: boolean }[] {
  const out: { spec: string; typeOnly: boolean }[] = [];
  for (const m of code.matchAll(/^\s*(import|export)\s+(type\s+)?[^'";]*?\bfrom\s+["']([^"']+)["']/gm)) {
    out.push({ spec: m[3], typeOnly: Boolean(m[2]) });
  }
  for (const m of code.matchAll(/^\s*import\s+["']([^"']+)["']/gm)) out.push({ spec: m[1], typeOnly: false });
  for (const m of code.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) out.push({ spec: m[1], typeOnly: false });
  return out;
}

/** Code with comments and string literals removed, so a word inside a message or comment does not count. */
const codeOnly = (code: string) =>
  code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, '""');

describe("analyzer purity (R7.2, R7.4)", () => {
  const files = sources(ANALYZER);

  it("finds the analyzer source files", () => {
    expect(files).toEqual(expect.arrayContaining(["analyze.ts", "classifier.ts", "splitter.ts", "rules.ts", "score.ts"]));
  });

  it.each(files)("%s reads no clock, uses no randomness and makes no network call", (file) => {
    const code = codeOnly(readFileSync(join(ANALYZER, file), "utf8"));
    for (const banned of [/\bDate\b/, /\bperformance\b/, /\bMath\.random\b/, /\bcrypto\b/, /\bfetch\b/, /\bXMLHttpRequest\b/, /\bWebSocket\b/]) {
      expect(code, `${file} uses ${banned}`).not.toMatch(banned);
    }
  });

  it.each(files)("%s imports only relative analyzer modules, with no @/ alias and nothing from src/lib/llm", (file) => {
    for (const { spec, typeOnly } of imports(readFileSync(join(ANALYZER, file), "utf8"))) {
      expect(spec.startsWith("@/"), `${file} imports ${spec}`).toBe(false);
      expect(spec.includes("llm"), `${file} imports ${spec}`).toBe(false);
      if (!typeOnly) expect(spec.startsWith("./"), `${file} imports ${spec}`).toBe(true);
    }
  });
});

describe("sample module imports (R7.4)", () => {
  const files = sources(SAMPLES);
  const TEXT_MODULES = ["mild.ts", "average.ts", "terrible.ts"];

  it.each(files.length ? files : ["(none yet)"])("%s uses no @/ alias", (file) => {
    if (file === "(none yet)") return;
    for (const { spec } of imports(readFileSync(join(SAMPLES, file), "utf8"))) expect(spec.startsWith("@/")).toBe(false);
  });

  it("text modules import only analyzer types; meta.ts imports nothing; index.ts imports only the text modules and meta.ts", () => {
    for (const file of files) {
      const deps = imports(readFileSync(join(SAMPLES, file), "utf8"));
      if (TEXT_MODULES.includes(file)) {
        for (const d of deps) {
          expect(d.typeOnly, `${file} imports ${d.spec}`).toBe(true);
          expect(d.spec.startsWith("../analyzer"), `${file} imports ${d.spec}`).toBe(true);
        }
      } else if (file === "meta.ts") {
        expect(deps).toEqual([]);
      } else if (file === "index.ts") {
        for (const d of deps) expect(["./mild", "./average", "./terrible", "./meta"], `index.ts imports ${d.spec}`).toContain(d.spec);
      }
    }
  });
});
