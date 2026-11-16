// Required statements in README.md (Task 17.5). The docs/DEPLOY.md part is added in Task 22.2,
// when DEPLOY.md is drafted (llm-explainer design, "Testing").
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GEMINI_TERMS_URL, OPT_IN_NOTICE } from "../src/lib/llm/privacy";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

/** The text of a "## <title>" section, up to the next "## " heading. */
function section(md: string, title: string): string | null {
  const lines = md.split("\n");
  const at = lines.findIndex((l) => l.trim() === `## ${title}`);
  if (at === -1) return null;
  const rest = lines.slice(at + 1);
  const next = rest.findIndex((l) => l.startsWith("## "));
  return (next === -1 ? rest : rest.slice(0, next)).join("\n");
}

describe("README.md privacy section (llm-explainer R17)", () => {
  const privacy = section(read("README.md"), "Privacy");
  it("has a Privacy section", () => {
    expect(privacy).not.toBeNull();
  });
  it("contains OPT_IN_NOTICE word for word (R17.4)", () => {
    expect(privacy!.replace(/\s+/g, " ")).toContain(OPT_IN_NOTICE);
  });
  it("links to the Gemini API terms (R17.1)", () => {
    expect(privacy).toContain(GEMINI_TERMS_URL);
  });
  it.each(["Google does not store", "Google keeps nothing", "deleted", "never used"])(
    "makes no claim like %j (R17.2)",
    (claim) => {
      expect(privacy!.toLowerCase()).not.toContain(claim.toLowerCase());
    },
  );
});
