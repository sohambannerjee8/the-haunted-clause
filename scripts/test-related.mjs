#!/usr/bin/env node
// Runs the Vitest tests related to the saved source file(s).
// Used by the "Test on save" hook: Kiro passes the event JSON on STDIN.
// Can also be run by hand: node scripts/test-related.mjs src/lib/analyzer/splitter.ts
//
// Exit code 0 when the related tests pass (or there are none), otherwise the
// Vitest exit code. On failure the Vitest output goes to STDERR, which Kiro
// shows to the agent.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractPaths, readStdinJson, toRepoRelative } from "./lib/hook-input.mjs";
import { logHookRun } from "./lib/hook-log.mjs";

const SOURCE = /^src\/.*\.(ts|tsx)$/;

/** Keep only TypeScript source files under src/ (declaration files excluded). */
export function selectSourceFiles(paths, root) {
  return paths.map((p) => toRepoRelative(p, root)).filter((p) => SOURCE.test(p) && !p.endsWith(".d.ts"));
}

async function main(argv) {
  const root = process.cwd();
  let paths = argv;
  let event = null;
  if (paths.length === 0) {
    event = await readStdinJson();
    paths = event ? extractPaths(event) : [];
  }
  const files = selectSourceFiles(paths, root);
  const finish = (code) => {
    if (event) logHookRun(root, { hook: "test-on-save", exitCode: code, detail: files.join(", ") || "(no source file)" });
    return code;
  };
  if (files.length === 0) {
    console.log("test-related: no TypeScript source file under src/ was saved; nothing to run.");
    return finish(0);
  }
  const result = spawnSync("npx", ["vitest", "related", ...files, "--run", "--passWithNoTests"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (result.status === 0) {
    const summary = output.split("\n").filter((l) => /Test Files|Tests |No test files/.test(l)).join("\n");
    console.log(`test-related: tests for ${files.join(", ")} pass.\n${summary}`);
    return finish(0);
  }
  console.error(`test-related: tests for ${files.join(", ")} FAILED.\n${output}`);
  return finish(result.status ?? 1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
