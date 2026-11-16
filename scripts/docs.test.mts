// Required statements in README.md (Task 17.5) and docs/DEPLOY.md (Task 22.2)
// (llm-explainer design, "Testing"; haunted-house-ui R14.8).
import { existsSync, readFileSync } from "node:fs";
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

describe("docs/DEPLOY.md (llm-explainer R5.3, R9.5, R17.2, R17.3; haunted-house-ui R14.8)", () => {
  const path = "docs/DEPLOY.md";
  const deploy = existsSync(join(process.cwd(), path)) ? read(path) : "";
  const flat = deploy.replace(/\s+/g, " ");
  const lower = flat.toLowerCase();

  it("exists", () => {
    expect(deploy.length).toBeGreaterThan(0);
  });
  it('says the rate limit is best-effort: per instance, reset on a cold start, "not shared" (R9.5)', () => {
    expect(lower).toContain("best-effort");
    expect(lower).toContain("cold start");
    expect(lower).toContain("not shared");
  });
  it("explains store: false and cites Google's logs-datasets page (R17.3)", () => {
    expect(flat).toContain("store: false");
    expect(flat).toContain("https://ai.google.dev/gemini-api/docs/logs-datasets");
    expect(lower).toMatch(/request logging only/);
  });
  it("links the Gemini API terms and says they still apply (R17.3)", () => {
    expect(flat).toContain(GEMINI_TERMS_URL);
    expect(lower).toMatch(/terms[^.]*still apply/);
  });
  it("recommends a paid-tier (billing-enabled) key", () => {
    expect(lower).toMatch(/billing-enabled|paid tier|paid-tier/);
  });
  it('says a timed-out call may still be "billed" (R5.3)', () => {
    expect(lower).toContain("billed");
    expect(lower).toMatch(/timed[- ]out|stopped waiting/);
  });
  it("says to run npm run precompute:samples and commit the file before deploying", () => {
    expect(flat).toContain("npm run precompute:samples");
    expect(flat).toContain("src/lib/samples/sample-explanations.json");
    expect(lower).toMatch(/commit/);
  });
  it('says a key change on Vercel needs a "redeploy", because llmAvailable is read at build time (HU R14.8)', () => {
    expect(flat).toContain("llmAvailable");
    expect(lower).toContain("redeploy");
    expect(lower).toMatch(/build time|when the page is built/);
  });
  it("names the environment variables", () => {
    expect(flat).toContain("GEMINI_" + "API_KEY");
    expect(flat).toContain("GEMINI_MODEL");
  });
  it.each(["Google does not store", "Google keeps nothing", "deleted", "never used"])(
    "makes no claim like %j (R17.2)",
    (claim) => {
      expect(lower).not.toContain(claim.toLowerCase());
    },
  );
});
