// Nothing is stored (haunted-house-ui R1.6, R3.4; llm-explainer R11.1).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const source = (dir: string) =>
  walk(join(root, dir)).filter((p) => /\.(ts|tsx|mts|js|mjs)$/.test(p) && !/\.test\.(ts|tsx|mts)$/.test(p) && !/\.test-util\.ts$/.test(p));
const rel = (p: string) => relative(root, p).split("\\").join("/");

describe("no client-side storage in src/ (R1.6)", () => {
  const files = source("src");
  it("checks the app's source files", () => {
    expect(files.length).toBeGreaterThan(10);
  });
  it.each(["localStorage", "sessionStorage", "document.cookie", "indexedDB"])("no file uses %s", (api) => {
    for (const p of files) expect(readFileSync(p, "utf8"), rel(p)).not.toContain(api);
  });
});

describe("no storage in the llm and api code (llm-explainer R11.1)", () => {
  const files = [...source("src/lib/llm"), ...source("src/app/api")];
  it("checks the llm and api files", () => {
    expect(files.map(rel)).toContain("src/app/api/explain/route.ts");
  });
  it.each([
    ["an fs import", /from\s+["'](node:)?fs(\/promises)?["']|require\(\s*["'](node:)?fs/],
    ["a cookies() call", /\bcookies\s*\(/],
    ['"use cache"', /["']use cache["']/],
    ["unstable_cache", /\bunstable_cache\b/],
    ["cacheTag", /\bcacheTag\b/],
  ])("no file has %s", (_name, pattern) => {
    for (const p of files) expect(readFileSync(p, "utf8"), rel(p)).not.toMatch(pattern);
  });
});
