// @vitest-environment node
import { describe, expect, it } from "vitest";
import { selectSourceFiles } from "./test-related.mjs";

describe("selectSourceFiles", () => {
  it("keeps TypeScript source files under src", () => {
    expect(selectSourceFiles(["src/lib/a.ts", "src/app/page.tsx"], "/repo")).toEqual([
      "src/lib/a.ts",
      "src/app/page.tsx",
    ]);
  });

  it("accepts absolute paths inside the repo", () => {
    expect(selectSourceFiles(["/repo/src/lib/a.ts"], "/repo")).toEqual(["src/lib/a.ts"]);
  });

  it("drops non-source files and files outside src", () => {
    expect(
      selectSourceFiles(["README.md", "scripts/x.mjs", "src/app/globals.css", "e2e/a.spec.ts"], "/repo"),
    ).toEqual([]);
  });
});
