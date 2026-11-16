// Server-only boundaries for the key (llm-explainer R4.5, R15.1, R15.2).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const KEY_NAME = "GEMINI" + "_API_KEY";

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const isSource = (p: string) => /\.(ts|tsx|mts|js|mjs)$/.test(p) && !/\.test\.(ts|tsx|mts)$/.test(p) && !/\.test-util\.ts$/.test(p);
const srcFiles = walk(join(root, "src")).filter(isSource);
const rel = (p: string) => relative(root, p).split("\\").join("/");
const read = (p: string) => readFileSync(p, "utf8");
const SERVER_ONLY_IMPORT = /^\s*import\s+["']server-only["'];?/m;

describe("the key name stays in server-only modules", () => {
  it("finds source files to check", () => {
    expect(srcFiles.length).toBeGreaterThan(10);
  });
  it("only gemini.ts and availability.ts under src/ contain the key name (R4.5)", () => {
    const withKey = srcFiles.filter((p) => read(p).includes(KEY_NAME)).map(rel).sort();
    expect(withKey).toEqual(["src/lib/llm/availability.ts", "src/lib/llm/gemini.ts"]);
  });
  it("every src/ file that contains the key name imports server-only (R15.1)", () => {
    for (const p of srcFiles.filter((f) => read(f).includes(KEY_NAME))) {
      expect(read(p), rel(p)).toMatch(SERVER_ONLY_IMPORT);
    }
  });
  it('no "use client" file imports gemini, availability, rateLimit or handler', () => {
    const banned = /from\s+["'][^"']*\/(gemini|availability|rateLimit|handler)["']/;
    for (const p of srcFiles) {
      const text = read(p);
      if (!/^\s*["']use client["']/m.test(text)) continue;
      expect(text, rel(p)).not.toMatch(banned);
    }
  });
  it("no NEXT_PUBLIC_ name in src/, next.config.ts or .env.example contains GEMINI (R15.2)", () => {
    const files = [...walk(join(root, "src")), join(root, "next.config.ts"), join(root, ".env.example")].filter(existsSync);
    for (const p of files) {
      expect(read(p), rel(p)).not.toMatch(/NEXT_PUBLIC_\w*GEMINI/i);
    }
  });
});
