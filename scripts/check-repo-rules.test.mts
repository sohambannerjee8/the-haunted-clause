// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkRepo } from "./check-repo-rules.mjs";

const realLicense = readFileSync(new URL("../LICENSE", import.meta.url), "utf8");
const goodGitignore = "/node_modules\n.env*\n!.env.example\n.next\n";
const dirs: string[] = [];

function makeRepo(opts: { gitignore?: string; license?: string | null; envExample?: string; track?: boolean } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "hc-rules-"));
  dirs.push(dir);
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "pipe" });
  git("init", "-q");
  mkdirSync(join(dir, ".kiro/steering"), { recursive: true });
  writeFileSync(join(dir, ".kiro/steering/product.md"), "# product\n");
  writeFileSync(join(dir, ".gitignore"), opts.gitignore ?? goodGitignore);
  if (opts.license !== null) writeFileSync(join(dir, "LICENSE"), opts.license ?? realLicense);
  writeFileSync(join(dir, ".env.example"), opts.envExample ?? "GEMINI_API_KEY=\nGEMINI_MODEL=\n");
  if (opts.track !== false) git("add", "-A");
  return dir;
}

function failed(dir: string) {
  return checkRepo(dir).filter((c) => !c.ok).map((c) => c.name);
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("checkRepo", () => {
  it("passes a clean repository", () => {
    expect(failed(makeRepo())).toEqual([]);
  });

  it("fails when .gitignore ignores .kiro directly", () => {
    expect(failed(makeRepo({ gitignore: goodGitignore + ".kiro\n" }))).toContain("kiro-not-ignored");
  });

  it("fails when .gitignore ignores a folder inside .kiro", () => {
    expect(failed(makeRepo({ gitignore: goodGitignore + ".kiro/specs/\n" }))).toContain(
      "kiro-not-ignored",
    );
  });

  it("fails when a broad pattern like .* hides .kiro", () => {
    expect(failed(makeRepo({ gitignore: goodGitignore + ".*\n" }))).toContain("kiro-not-ignored");
  });

  it("fails when the LICENSE is missing", () => {
    expect(failed(makeRepo({ license: null }))).toContain("mit-license");
  });

  it("fails when the LICENSE is not MIT", () => {
    expect(failed(makeRepo({ license: "Apache License\nVersion 2.0\n" }))).toContain("mit-license");
  });

  it("fails when .env.example holds a value", () => {
    expect(failed(makeRepo({ envExample: "GEMINI_API_KEY=abc123\n" }))).toContain(
      "env-example-empty",
    );
  });

  it("fails when .env.example is not tracked", () => {
    expect(failed(makeRepo({ track: false }))).toContain("env-example-tracked");
  });

  it("fails when .env files are not ignored", () => {
    expect(failed(makeRepo({ gitignore: "/node_modules\n" }))).toContain("env-files-ignored");
  });
});
