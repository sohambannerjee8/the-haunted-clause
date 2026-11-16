#!/usr/bin/env node
// Canary bundle check (llm-explainer R15.3). Builds the app with GEMINI_API_KEY set to a random,
// non-key-shaped canary, then searches every file under .next/static for the canary and for the
// variable name. Exit 0 when neither is found, 1 otherwise. The build makes no call to Google.
// Afterwards it rebuilds with no key, so later E2E runs use a no-key build.
//
// Usage:
//   node scripts/check-bundle.mjs                       build with a canary, scan, rebuild with no key
//   node scripts/check-bundle.mjs --scan <dir> [--canary <value>]   scan an existing folder only
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KEY_NAME = "GEMINI_API_KEY";

export function makeCanary() {
  return "hc-canary-" + randomUUID();
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** Search every file under `dir` for each needle. Throws if `dir` does not exist. */
export function scanDir(dir, needles) {
  const files = walk(dir);
  const hits = [];
  for (const file of files) {
    const text = readFileSync(file).toString("latin1"); // byte-for-byte, so binary files are searched too
    for (const needle of needles) if (text.includes(needle)) hits.push({ file: relative(dir, file), needle });
  }
  return { files: files.length, hits };
}

function build(env) {
  const r = spawnSync("npx", ["next", "build"], { stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, ...env } });
  return r.status ?? 1;
}

function report(dir, needles, label) {
  const { files, hits } = scanDir(dir, needles);
  if (hits.length) {
    console.error(`check-bundle: FAIL - ${hits.length} match(es) in ${label}:`);
    for (const h of hits) console.error(`  ${h.file}: ${h.needle === KEY_NAME ? KEY_NAME : "the canary value"}`);
    return 1;
  }
  console.log(`check-bundle: PASS - neither the canary nor ${KEY_NAME} found in ${files} files under ${label}`);
  return 0;
}

function main(argv) {
  const at = argv.indexOf("--scan");
  if (at !== -1) {
    const dir = argv[at + 1];
    const c = argv.indexOf("--canary");
    const needles = [KEY_NAME, ...(c !== -1 ? [argv[c + 1]] : [])];
    return report(resolve(dir), needles, dir);
  }
  const canary = makeCanary();
  console.log("check-bundle: building with a canary GEMINI_API_KEY (no call to Google is made)");
  if (build({ GEMINI_API_KEY: canary }) !== 0) {
    console.error("check-bundle: FAIL - next build failed");
    return 1;
  }
  const code = report(resolve(".next/static"), [canary, KEY_NAME], ".next/static");
  console.log("check-bundle: rebuilding with no key");
  if (build({ GEMINI_API_KEY: "" }) !== 0) {
    console.error("check-bundle: FAIL - the no-key rebuild failed");
    return 1;
  }
  return code;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
