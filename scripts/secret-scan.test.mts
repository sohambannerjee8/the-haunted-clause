// @vitest-environment node
import { describe, expect, it } from "vitest";
import { scanText } from "./secret-scan.mjs";

// Fake keys are assembled at runtime so this file never holds a key-shaped literal.
const fakeGoogleKey = "AI" + "za" + "Sy" + "x".repeat(33);
const fakeSkKey = "s" + "k-" + "proj-" + "a1B2c3D4".repeat(4);
const fakePrivateKey =
  "-----BEGIN " + "RSA PRIVATE" + " KEY-----\nabc\n-----END " + "RSA PRIVATE" + " KEY-----";
const fakeGithubToken = "gh" + "p_" + "A".repeat(36);
const fakeAwsKey = "AK" + "IA" + "ABCDEFGHIJKLMNOP";

describe("scanText", () => {
  it("finds a Google API key", () => {
    const findings = scanText(`const k = "${fakeGoogleKey}";`, "a.ts");
    expect(findings.map((f) => f.rule)).toContain("google-api-key");
    expect(findings[0].line).toBe(1);
  });

  it("finds an sk- style key", () => {
    expect(scanText(`token: ${fakeSkKey}`, "a.ts").map((f) => f.rule)).toContain(
      "sk-style-key",
    );
  });

  it("finds a private key block", () => {
    expect(scanText(fakePrivateKey, "id_rsa").map((f) => f.rule)).toContain(
      "private-key-block",
    );
  });

  it("finds GitHub and AWS access keys", () => {
    const rules = scanText(`${fakeGithubToken}\n${fakeAwsKey}`, "x").map((f) => f.rule);
    expect(rules).toContain("github-token");
    expect(rules).toContain("aws-access-key");
  });

  it("finds a key-like env assignment and reports the right line", () => {
    const text = "# comment\nGEMINI_API_KEY=" + "q9".repeat(10) + "\n";
    const findings = scanText(text, ".env.local");
    expect(findings.map((f) => f.rule)).toContain("env-secret-assignment");
    expect(findings.find((f) => f.rule === "env-secret-assignment")?.line).toBe(2);
  });

  it("does not flag empty or placeholder env values", () => {
    const text = [
      "GEMINI_API_KEY=",
      "GEMINI_MODEL=",
      "GEMINI_API_KEY=your-key-here",
      "GEMINI_API_KEY=<your Gemini key>",
      "API_TOKEN=${API_TOKEN}",
      "const key = process.env.GEMINI_API_KEY;",
    ].join("\n");
    expect(scanText(text, ".env.example")).toEqual([]);
  });

  it("never echoes the secret value in full", () => {
    const [finding] = scanText(fakeGoogleKey, "a.ts");
    expect(finding.preview).not.toContain(fakeGoogleKey);
    expect(finding.preview.length).toBeLessThan(fakeGoogleKey.length);
  });

  it("returns nothing for ordinary code", () => {
    expect(scanText("export const answer = 42;\n// sk is short", "a.ts")).toEqual([]);
  });
});
