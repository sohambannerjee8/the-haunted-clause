// Records each hook run in .hook-runs/hook-runs.log (git-ignored), so it is
// possible to prove that Kiro really fired a hook. One line per run:
//   <ISO time> TAB <hook> TAB exit=<code> TAB <detail>
// The detail is a file path or a short summary. It is cut to 200 characters on
// one line and must never hold clause text or secret values.
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/** Split off a leading or trailing --hook flag. */
export function takeHookFlag(argv) {
  const args = argv.filter((a) => a !== "--hook");
  return { hook: args.length !== argv.length, args };
}

/** Append one line to the hook run log. Never throws. */
export function logHookRun(root, { hook, exitCode, detail = "" }, now = new Date()) {
  try {
    const dir = join(root, ".hook-runs");
    mkdirSync(dir, { recursive: true });
    const clean = String(detail).replace(/\s+/g, " ").trim().slice(0, 200);
    appendFileSync(join(dir, "hook-runs.log"), `${now.toISOString()}\t${hook}\texit=${exitCode}\t${clean}\n`);
  } catch {
    // Logging must never break a hook.
  }
}
