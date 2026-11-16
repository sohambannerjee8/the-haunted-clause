#!/usr/bin/env node
// Secret scanner for The Haunted Clause.
//
// Usage:
//   node scripts/secret-scan.mjs --tracked        scan every file git tracks
//   node scripts/secret-scan.mjs --history        scan the full git history (git log -p --all)
//   node scripts/secret-scan.mjs --staged         scan the staged diff
//   node scripts/secret-scan.mjs --stdin          scan text piped on STDIN
//   node scripts/secret-scan.mjs --hook           read a Kiro hook event on STDIN and scan the saved file
//   node scripts/secret-scan.mjs <file> [...]     scan the named files
//
// Exit code 0 means nothing found. Exit code 1 means at least one finding; a
// warning is printed on STDERR. Secret values are never printed in full.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractPaths, readStdinJson, toRepoRelative } from "./lib/hook-input.mjs";
import { logHookRun } from "./lib/hook-log.mjs";

const RULES = [
  { rule: "google-api-key", re: /AIza[0-9A-Za-z_-]{35}/g },
  { rule: "sk-style-key", re: /\bsk-(?:proj-|ant-|live-|test-)?[A-Za-z0-9_-]{20,}/g },
  { rule: "private-key-block", re: /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----/g },
  { rule: "github-token", re: /\bgh[pousr]_[A-Za-z0-9]{36,}/g },
  { rule: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/g },
];

const ENV_ASSIGNMENT =
  /^\s*(?:export\s+)?([A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASSWD)[A-Z0-9_]*)\s*[=:]\s*["']?([^\s"'#]*)/;
const PLACEHOLDER = /^(?:$|<|\$\{|\$[A-Z_]|your|xxx|changeme|example|placeholder|none|null|undefined|todo)/i;

function mask(value) {
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}…${"*".repeat(4)} (${value.length} chars)`;
}

/** Scan a block of text. Returns findings with 1-based line numbers. */
export function scanText(text, source = "<text>") {
  const findings = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const { rule, re } of RULES) {
      re.lastIndex = 0;
      for (const m of line.matchAll(re)) {
        findings.push({ source, line: i + 1, rule, preview: mask(m[0]) });
      }
    }
    const env = ENV_ASSIGNMENT.exec(line);
    if (env) {
      const value = env[2];
      if (value.length >= 12 && !PLACEHOLDER.test(value)) {
        findings.push({ source, line: i + 1, rule: "env-secret-assignment", preview: `${env[1]}=${mask(value)}` });
      }
    }
  });
  return findings;
}

const SKIP = [/^node_modules\//, /^\.next\//, /(^|\/)package-lock\.json$/, /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|zip|pdf)$/i];

/** Scan a file on disk. Binary and very large files are skipped. */
export function scanFile(path, root = process.cwd()) {
  const rel = toRepoRelative(path, root);
  const abs = resolve(root, rel);
  if (SKIP.some((re) => re.test(rel)) || !existsSync(abs)) return [];
  const st = statSync(abs);
  if (!st.isFile() || st.size > 2_000_000) return [];
  const buf = readFileSync(abs);
  if (buf.includes(0)) return [];
  return scanText(buf.toString("utf8"), rel);
}

function git(args, root) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
}

function report(findings, label) {
  if (findings.length === 0) {
    console.log(`secret-scan: no key-like strings found (${label}).`);
    return 0;
  }
  console.error(`secret-scan: WARNING, ${findings.length} key-like string(s) found (${label}):`);
  for (const f of findings) console.error(`  ${f.source}:${f.line}  ${f.rule}  ${f.preview}`);
  console.error("Remove the secret, rotate it if it was real, and keep keys in .env.local only.");
  return 1;
}

async function readStdinText() {
  let data = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

async function main(argv) {
  const root = process.cwd();
  const [mode, ...rest] = argv;
  if (mode === "--tracked") {
    const files = git(["ls-files", "-z"], root).split("\0").filter(Boolean);
    return report(files.flatMap((f) => scanFile(f, root)), `${files.length} tracked files`);
  }
  if (mode === "--history") {
    const log = git(["log", "-p", "--all", "--no-color"], root);
    return report(scanText(log, "git history"), "git log -p --all");
  }
  if (mode === "--staged") {
    return report(scanText(git(["diff", "--cached", "--no-color"], root), "staged diff"), "staged diff");
  }
  if (mode === "--stdin") {
    return report(scanText(await readStdinText(), "stdin"), "stdin");
  }
  if (mode === "--hook") {
    const event = await readStdinJson();
    const paths = event ? extractPaths(event) : [];
    const label = paths.map((p) => toRepoRelative(p, root)).join(", ");
    const code =
      paths.length === 0
        ? (console.log("secret-scan: hook event had no file path; nothing to scan."), 0)
        : report(paths.flatMap((p) => scanFile(p, root)), label);
    const keys = event && typeof event === "object" ? Object.keys(event).join(",") : "none";
    logHookRun(root, { hook: "secret-guard", exitCode: code, detail: `${label || "(no path)"} keys=${keys}` });
    return code;
  }
  const files = [mode, ...rest].filter(Boolean);
  if (files.length === 0) {
    console.error("usage: secret-scan.mjs --tracked | --history | --staged | --stdin | --hook | <file>...");
    return 2;
  }
  return report(files.flatMap((f) => scanFile(f, root)), files.join(", "));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
