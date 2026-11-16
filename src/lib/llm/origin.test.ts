import { describe, expect, it } from "vitest";
import { sameOrigin } from "./origin";

function req(url: string, headers: Record<string, string>): Request {
  return new Request(url, { method: "POST", headers });
}

// The ten cases in the llm-explainer design, "Origin check" table (R2.4).
describe("sameOrigin (R2.4)", () => {
  const preview = "the-haunted-clause-git-main-example.vercel.app";
  it.each([
    ["localhost, match", "http://localhost:3000/api/explain", { origin: "http://localhost:3000", host: "localhost:3000" }, true],
    ["localhost, mismatch", "http://localhost:3000/api/explain", { origin: "http://localhost:4000", host: "localhost:3000" }, false],
    ["Vercel preview, match", `https://${preview}/api/explain`, { origin: `https://${preview}`, host: preview }, true],
    ["Vercel preview, mismatch", `https://${preview}/api/explain`, { origin: "https://other-app.vercel.app", host: preview }, false],
    ["production, match", "https://haunted-clause.example/api/explain", { origin: "https://haunted-clause.example", host: "haunted-clause.example" }, true],
    ["production, mismatch", "https://haunted-clause.example/api/explain", { origin: "https://evil.example", host: "haunted-clause.example" }, false],
    ["upper-case host", "https://haunted-clause.example/api/explain", { origin: "https://Haunted-Clause.example", host: "haunted-clause.example" }, true],
    ["Origin: null", "https://haunted-clause.example/api/explain", { origin: "null", host: "haunted-clause.example" }, false],
    ["no Origin header", "https://haunted-clause.example/api/explain", { host: "haunted-clause.example" }, true],
  ] as const)("%s", (_name, url, headers, expected) => {
    expect(sameOrigin(req(url, headers))).toBe(expected);
  });

  it("no Host header: falls back to the request URL's host", () => {
    // `Request` in this runtime may not let a Host header be set, so build the headers by hand.
    const r = { url: "http://localhost:3000/api/explain", headers: new Headers({ origin: "http://localhost:3000" }) } as Request;
    expect(r.headers.get("host")).toBeNull();
    expect(sameOrigin(r)).toBe(true);
    const bad = { url: "http://localhost:3000/api/explain", headers: new Headers({ origin: "http://localhost:3001" }) } as Request;
    expect(sameOrigin(bad)).toBe(false);
  });

  it("refuses an Origin that is not a valid URL", () => {
    expect(sameOrigin(req("http://localhost:3000/api/explain", { origin: "not a url", host: "localhost:3000" }))).toBe(false);
  });

  it("treats a default port the same as no port", () => {
    expect(sameOrigin(req("https://haunted-clause.example/api/explain", { origin: "https://haunted-clause.example:443", host: "haunted-clause.example" }))).toBe(true);
  });

  it("uses the Host header, not a hard-coded domain, when the URL differs", () => {
    const r = req("http://internal:8080/api/explain", { origin: "https://haunted-clause.example", host: "haunted-clause.example" });
    expect(sameOrigin(r)).toBe(true);
  });
});
