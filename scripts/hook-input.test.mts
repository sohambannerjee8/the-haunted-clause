// @vitest-environment node
import { describe, expect, it } from "vitest";
import { extractPaths, toRepoRelative } from "./lib/hook-input.mjs";

describe("extractPaths", () => {
  it("reads common single-path field names", () => {
    expect(extractPaths({ file_path: "src/a.ts" })).toEqual(["src/a.ts"]);
    expect(extractPaths({ filePath: "src/b.ts" })).toEqual(["src/b.ts"]);
    expect(extractPaths({ path: "src/c.ts" })).toEqual(["src/c.ts"]);
  });

  it("reads nested tool_input and arrays of files", () => {
    expect(
      extractPaths({ tool_input: { path: "src/d.ts" }, files: ["e.md", "f.md"] }),
    ).toEqual(["src/d.ts", "e.md", "f.md"]);
  });

  it("ignores cwd and unrelated string fields", () => {
    expect(
      extractPaths({ cwd: "/repo", session_id: "abc", hook_event_name: "PostFileSave" }),
    ).toEqual([]);
  });

  it("returns an empty list for non-objects", () => {
    expect(extractPaths(null)).toEqual([]);
    expect(extractPaths("text")).toEqual([]);
  });

  it("removes duplicates", () => {
    expect(extractPaths({ path: "a.ts", file_path: "a.ts" })).toEqual(["a.ts"]);
  });
});

describe("toRepoRelative", () => {
  it("turns an absolute path inside the root into a relative one", () => {
    expect(toRepoRelative("/repo/src/a.ts", "/repo")).toBe("src/a.ts");
  });

  it("keeps a relative path as is", () => {
    expect(toRepoRelative("src/a.ts", "/repo")).toBe("src/a.ts");
  });
});
