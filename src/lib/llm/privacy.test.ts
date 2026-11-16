import { describe, expect, it } from "vitest";
import { GEMINI_TERMS_URL, OPT_IN_NOTICE } from "./privacy";

describe("OPT_IN_NOTICE (R17)", () => {
  it.each(["does not store", "flagged clauses", "Google", "terms"])("contains %j (R17.1, R17.4)", (phrase) => {
    expect(OPT_IN_NOTICE).toContain(phrase);
  });
  it("says this app does not store the text and that only the flagged clauses go to Google Gemini (R17.1)", () => {
    expect(OPT_IN_NOTICE).toMatch(/This app does not store your text/);
    expect(OPT_IN_NOTICE).toMatch(/only the flagged clauses are sent to Google Gemini/);
    expect(OPT_IN_NOTICE).toMatch(/under its own terms/);
  });
  it.each(["Google does not store", "Google keeps nothing", "deleted", "never used"])(
    "makes no claim like %j (R17.2, R17.4)",
    (claim) => {
      expect(OPT_IN_NOTICE.toLowerCase()).not.toContain(claim.toLowerCase());
    },
  );
  it("links to the Gemini API terms (R17.1)", () => {
    expect(GEMINI_TERMS_URL).toBe("https://ai.google.dev/gemini-api/terms");
  });
});
