import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { makeCanary, scanDir } from "./check-bundle.mjs";

const KEY_NAME = "GEMINI" + "_API_KEY";
const dirs: string[] = [];
function tree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "hc-bundle-"));
  dirs.push(root);
  for (const [rel, content] of Object.entries(files)) {
    const p = join(root, rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, content);
  }
  return root;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("check-bundle scanDir (llm-explainer R15.3)", () => {
  it("passes a clean tree and counts its files", () => {
    const root = tree({ "chunks/a.js": "console.log(1)", "css/b.css": "body{}", "media/c.woff2": "\u0000\u0001" });
    expect(scanDir(root, ["hc-canary-x", KEY_NAME])).toEqual({ files: 3, hits: [] });
  });
  it("finds the canary in a nested file", () => {
    const root = tree({ "chunks/a.js": "ok", "chunks/deep/b.js": "var k='hc-canary-x';" });
    expect(scanDir(root, ["hc-canary-x", KEY_NAME]).hits).toEqual([{ file: join("chunks", "deep", "b.js"), needle: "hc-canary-x" }]);
  });
  it("finds the key name", () => {
    const root = tree({ "a.js": `process.env.${KEY_NAME}` });
    expect(scanDir(root, ["hc-canary-x", KEY_NAME]).hits).toEqual([{ file: "a.js", needle: KEY_NAME }]);
  });
  it("throws when the folder does not exist, so a missing build cannot pass", () => {
    expect(() => scanDir(join(tmpdir(), "hc-does-not-exist-" + Date.now()), [KEY_NAME])).toThrow();
  });
});

describe("makeCanary", () => {
  it("is fresh each time and not key-shaped", () => {
    const a = makeCanary();
    const b = makeCanary();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^hc-canary-[0-9a-f-]{36}$/);
    expect(a.startsWith("AI")).toBe(false);
  });
});
