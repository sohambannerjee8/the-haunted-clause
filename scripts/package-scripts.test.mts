// The build never calls Google (llm-explainer R16.1, R16.2; PLAN_DECISIONS.md C10.14).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const scripts: Record<string, string> = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")).scripts;

describe("package.json scripts", () => {
  it("has precompute:samples, run with tsx under the react-server condition", () => {
    expect(scripts["precompute:samples"]).toBe("tsx --conditions=react-server scripts/precompute-samples.mts");
  });
  it("no script other than precompute:samples mentions precompute-samples or @google/genai", () => {
    for (const [name, command] of Object.entries(scripts)) {
      if (name === "precompute:samples") continue;
      expect(command, name).not.toMatch(/precompute-samples|precompute:samples|@google\/genai/);
    }
  });
  it("has no prebuild, postbuild, preinstall, install, postinstall or prepare hook", () => {
    for (const hook of ["prebuild", "postbuild", "preinstall", "install", "postinstall", "prepare"]) {
      expect(scripts, hook).not.toHaveProperty(hook);
    }
  });
  it("build is plain `next build`", () => {
    expect(scripts.build).toBe("next build");
  });
});
