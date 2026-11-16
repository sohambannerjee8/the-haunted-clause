// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { logHookRun, takeHookFlag } from "./lib/hook-log.mjs";

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("takeHookFlag", () => {
  it("removes --hook and reports that it was present", () => {
    expect(takeHookFlag(["--hook", "src/a.ts"])).toEqual({ hook: true, args: ["src/a.ts"] });
  });

  it("leaves other arguments alone when the flag is absent", () => {
    expect(takeHookFlag(["src/a.ts"])).toEqual({ hook: false, args: ["src/a.ts"] });
  });
});

describe("logHookRun", () => {
  it("appends one tab-separated line per run, with time, hook, exit code and detail", () => {
    const root = mkdtempSync(join(tmpdir(), "hc-hooklog-"));
    dirs.push(root);
    logHookRun(root, { hook: "secret-guard", exitCode: 1, detail: "src/a.ts" }, new Date("2026-11-16T15:00:00Z"));
    logHookRun(root, { hook: "rules-guard", exitCode: 0, detail: ".gitignore" }, new Date("2026-11-16T15:01:00Z"));
    const lines = readFileSync(join(root, ".hook-runs/hook-runs.log"), "utf8").trim().split("\n");
    expect(lines).toEqual([
      "2026-11-16T15:00:00.000Z\tsecret-guard\texit=1\tsrc/a.ts",
      "2026-11-16T15:01:00.000Z\trules-guard\texit=0\t.gitignore",
    ]);
  });

  it("never writes clause text or secrets: detail is cut to 200 characters on one line", () => {
    const root = mkdtempSync(join(tmpdir(), "hc-hooklog-"));
    dirs.push(root);
    logHookRun(root, { hook: "x", exitCode: 0, detail: "a\nb".repeat(300) }, new Date(0));
    const line = readFileSync(join(root, ".hook-runs/hook-runs.log"), "utf8");
    expect(line.split("\n").filter(Boolean)).toHaveLength(1);
    expect(line.split("\t")[3].trim().length).toBeLessThanOrEqual(200);
  });

  it("does not throw when the log folder cannot be written", () => {
    expect(() => logHookRun("/dev/null/not-a-dir", { hook: "x", exitCode: 0, detail: "" })).not.toThrow();
  });
});
