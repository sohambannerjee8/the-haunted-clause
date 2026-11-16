#!/usr/bin/env node
// Re-checks the repository rules from PLAN.md section 3 that a script can prove:
//   - nothing inside .kiro is ignored by git (including broad patterns such as .*)
//   - an MIT LICENSE is at the root
//   - .env files are ignored, no .env file is tracked, .env.example is tracked with no values
//
// Usage: node scripts/check-repo-rules.mjs [repo-dir]
// Exit code 0 when every check passes, 1 otherwise.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function git(dir, args, input) {
  try {
    const out = execFileSync("git", args, { cwd: dir, encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] });
    return { status: 0, out };
  } catch (err) {
    return { status: err.status ?? 1, out: String(err.stdout ?? "") };
  }
}

/** Every path under .kiro, plus each folder (with a trailing slash), plus representative paths. */
function kiroCandidates(dir) {
  const out = new Set([
    ".kiro",
    ".kiro/",
    ".kiro/steering/",
    ".kiro/steering/x.md",
    ".kiro/specs/",
    ".kiro/specs/x/requirements.md",
    ".kiro/hooks/",
    ".kiro/hooks/x.json",
    ".kiro/agents/",
    ".kiro/agents/x.md",
    ".kiro/settings/",
    ".kiro/settings/mcp.json",
  ]);
  const walk = (rel) => {
    const abs = join(dir, rel);
    if (!existsSync(abs)) return;
    for (const entry of readdirSync(abs, { withFileTypes: true })) {
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        out.add(`${child}/`);
        walk(child);
      } else {
        out.add(child);
      }
    }
  };
  walk(".kiro");
  return [...out];
}

function ignored(dir, paths) {
  const { status, out } = git(dir, ["check-ignore", "--no-index", "--stdin"], paths.join("\n") + "\n");
  if (status === 0) return out.split("\n").filter(Boolean);
  return [];
}

/** Run all checks. Returns [{ name, ok, detail }]. */
export function checkRepo(dir = process.cwd()) {
  const results = [];
  const add = (name, ok, detail) => results.push({ name, ok, detail });

  const hidden = ignored(dir, kiroCandidates(dir));
  add("kiro-not-ignored", hidden.length === 0, hidden.length ? `ignored by git: ${hidden.join(", ")}` : "no path inside .kiro is ignored");

  const licensePath = join(dir, "LICENSE");
  const license = existsSync(licensePath) ? readFileSync(licensePath, "utf8") : "";
  const isMit =
    /^MIT License/m.test(license) &&
    license.includes("Permission is hereby granted, free of charge") &&
    license.includes('THE SOFTWARE IS PROVIDED "AS IS"');
  add("mit-license", isMit, isMit ? "LICENSE holds the MIT text" : license ? "LICENSE is not the MIT text" : "LICENSE is missing");

  const envIgnored = ignored(dir, [".env", ".env.local", ".env.production"]);
  add("env-files-ignored", envIgnored.length === 3, `ignored: ${envIgnored.join(", ") || "none"}`);

  const exampleIgnored = ignored(dir, [".env.example"]).length > 0;
  const tracked = git(dir, ["ls-files", "--error-unmatch", ".env.example"]).status === 0;
  add("env-example-tracked", tracked && !exampleIgnored, tracked ? (exampleIgnored ? ".env.example is tracked but matches an ignore rule" : ".env.example is tracked") : ".env.example is not tracked");

  const examplePath = join(dir, ".env.example");
  const valued = existsSync(examplePath)
    ? readFileSync(examplePath, "utf8")
        .split(/\r?\n/)
        .filter((l) => /^\s*[A-Za-z_][A-Za-z0-9_]*\s*=\s*\S/.test(l) && !/^\s*#/.test(l))
    : [];
  add("env-example-empty", existsSync(examplePath) && valued.length === 0, valued.length ? `values set for: ${valued.map((l) => l.split("=")[0].trim()).join(", ")}` : "every variable is empty");

  const trackedEnv = git(dir, ["ls-files"]).out.split("\n").filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".env.example"));
  add("no-env-tracked", trackedEnv.length === 0, trackedEnv.length ? `tracked: ${trackedEnv.join(", ")}` : "no .env file is tracked");

  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = resolve(process.argv[2] ?? process.cwd());
  const results = checkRepo(dir);
  const failed = results.filter((r) => !r.ok);
  const lines = results.map((r) => `${r.ok ? "PASS" : "FAIL"}  ${r.name}: ${r.detail}`).join("\n");
  if (failed.length) {
    console.error(`check-repo-rules: ${failed.length} rule(s) failed\n${lines}`);
    process.exit(1);
  }
  console.log(`check-repo-rules: all ${results.length} rules pass\n${lines}`);
}
