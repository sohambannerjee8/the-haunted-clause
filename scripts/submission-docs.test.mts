// Phase 6 submission pack (PLAN.md section 6, Phase 6; PLAN_DECISIONS.md C16; rules-auditor R2, R6, S1–S6).
// These check the statements the rules require. They do not judge the writing.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => (existsSync(join(process.cwd(), p)) ? readFileSync(join(process.cwd(), p), "utf8") : "");
const firstLine = (md: string) => md.split("\n").find((l) => l.trim() !== "") ?? "";
const DRAFT_NOTE = /^> \*\*Draft\.\*\*/;
const AGENT_WORDING = "no write tool; shell limited to build/test commands";

const docs = {
  devpost: read("docs/DEVPOST_DESCRIPTION.md"),
  video: read("docs/VIDEO_SCRIPT.md"),
  kiro: read("docs/KIRO_USAGE.md"),
  blog: read("docs/BLOG_DRAFT.md"),
  social: read("docs/SOCIAL_POST.md"),
};

describe("all five submission drafts", () => {
  it.each(Object.entries(docs))("%s exists and never calls the agents read-only (S4)", (_name, md) => {
    expect(md.length).toBeGreaterThan(0);
    expect(md.toLowerCase()).not.toContain("read-only");
  });
  it.each(Object.entries(docs))("%s states no score of 100 as possible", (_name, md) => {
    expect(md).not.toContain("/100");
  });
});

describe("drafts the user rewrites are marked at the top (C16.3)", () => {
  it.each(["kiro", "blog", "social"] as const)("%s starts with the draft note", (name) => {
    expect(firstLine(docs[name])).toMatch(DRAFT_NOTE);
  });
});

describe("docs/SOCIAL_POST.md (S6)", () => {
  it("the post, under its heading, begins with #KiroweenHackathon26", () => {
    const after = docs.social.split(/^## Post\s*$/m)[1] ?? "";
    expect(firstLine(after).startsWith("#KiroweenHackathon26")).toBe(true);
  });
});

describe("docs/BLOG_DRAFT.md (S6)", () => {
  it("says it was written for the Kiroween 2026 hackathon", () => {
    expect(docs.blog).toContain("written for the Kiroween 2026 hackathon");
  });
  it("uses the approved agent wording", () => {
    expect(docs.blog).toContain(AGENT_WORDING);
  });
});

describe("docs/KIRO_USAGE.md (S4, C16.3)", () => {
  it("uses the approved agent wording", () => {
    expect(docs.kiro).toContain(AGENT_WORDING);
  });
  it("records what did not work: the spec task panel, Context7 and the Gate 1 loop", () => {
    expect(docs.kiro).toContain("spec-task-execution");
    expect(docs.kiro).toContain("Failed to connect");
    expect(docs.kiro).toContain("check:trace");
    expect(docs.kiro.toLowerCase()).toContain("traceability");
  });
  it("never says Context7 was used through Kiro", () => {
    const sentences = docs.kiro.replace(/\s+/g, " ").split(/(?<=[.!?])\s/);
    for (const s of sentences.filter((s) => s.includes("Context7") && /through Kiro|in Kiro/.test(s))) {
      expect(s, s).toMatch(/\bnot\b|\bnever\b|n't\b/);
    }
  });
  it("answers the powers question", () => {
    expect(docs.kiro.toLowerCase()).toMatch(/powers?[^.]*\b(none|not used|no )/);
  });
});

describe("docs/DEVPOST_DESCRIPTION.md (S1, S5)", () => {
  it("states the category and the main features", () => {
    expect(docs.devpost).toContain("Costume Contest");
    for (const f of ["Haunt Score", "Lights on", "eight rooms", "Not legal advice"]) expect(docs.devpost).toContain(f);
  });
});

describe("docs/VIDEO_SCRIPT.md (S2, S3, C16.2)", () => {
  const toSec = (m: string, s: string) => Number(m) * 60 + Number(s);
  const parts = docs.video.split(/^### /m).slice(1);
  const segments = parts
    .map((p) => {
      const m = p.match(/^(\d):(\d\d)–(\d):(\d\d)/);
      return m ? { start: toSec(m[1], m[2]), end: toSec(m[3], m[4]), body: p } : null;
    })
    .filter((s) => s !== null);

  it("is timed in back-to-back segments from 0:00", () => {
    expect(segments.length).toBeGreaterThan(3);
    expect(segments[0].start).toBe(0);
    for (let i = 1; i < segments.length; i++) expect(segments[i].start).toBe(segments[i - 1].end);
    for (const s of segments) expect(s.end).toBeGreaterThan(s.start);
  });
  it("runs about 2:30 and never past 2:50", () => {
    const total = segments.at(-1)!.end;
    expect(total).toBeGreaterThanOrEqual(140);
    expect(total).toBeLessThanOrEqual(160);
    expect(total).toBeLessThanOrEqual(170);
  });
  it('shows "97 · Run" within the first 20 seconds', () => {
    const first = segments.find((s) => s.body.includes("97 · Run"));
    expect(first).toBeDefined();
    expect(first!.end).toBeLessThanOrEqual(20);
  });
  it("includes a ghost detail panel, Lights on and the keyboard path", () => {
    expect(segments.some((s) => s.body.includes("Why it matters"))).toBe(true);
    expect(segments.some((s) => s.body.includes("Lights on"))).toBe(true);
    expect(segments.some((s) => s.body.includes("Tab") && /arrow keys/i.test(s.body))).toBe(true);
  });
  it("ends on how Kiro was used", () => {
    expect(segments.at(-1)!.body).toContain("Kiro");
  });
  it("states that there is no music", () => {
    expect(docs.video).toMatch(/No music/);
  });
  it("names no third-party brand", () => {
    const brands = [
      "Google", "Gemini", "Vercel", "GitHub", "Chrome", "YouTube", "Devpost", "Next.js", "React",
      "Playwright", "Microsoft", "Apple", "macOS", "Windows", "Facebook", "Netflix", "Spotify", "Amazon", "AWS",
    ];
    for (const b of brands) expect(docs.video, b).not.toMatch(new RegExp(`\\b${b.replace(".", "\\.")}\\b`));
  });
});

describe("README.md (R2, R6)", () => {
  const readme = read("README.md");
  it("is no longer a stub", () => {
    expect(readme.toLowerCase()).not.toContain("stub");
  });
  it.each(["Setup", "Tests", "Architecture", "Privacy", "Pre-existing work", "Licenses"])("has a %s section", (h) => {
    expect(readme).toMatch(new RegExp(`^## ${h}\\s*$`, "m"));
  });
  it("gives install, environment, run and test commands", () => {
    for (const c of ["npm ci", "cp .env.example .env.local", "npm run dev", "npm test", "npm run test:e2e", "npx playwright install chromium"]) {
      expect(readme).toContain(c);
    }
  });
  it("lists every direct dependency and dev dependency in Licenses", () => {
    const pkg = JSON.parse(read("package.json"));
    const licenses = readme.split(/^## Licenses\s*$/m)[1] ?? "";
    const names = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)];
    // Display names used in the README for packages it groups.
    const alias: Record<string, string> = {
      typescript: "TypeScript", tailwindcss: "Tailwind CSS", eslint: "ESLint", vitest: "Vitest",
      "@playwright/test": "Playwright", "@testing-library/dom": "Testing Library",
      "@testing-library/jest-dom": "Testing Library", "@testing-library/react": "Testing Library",
      "@testing-library/user-event": "Testing Library",
    };
    for (const n of names) expect(licenses, n).toContain(alias[n] ?? n);
  });
});

describe("docs/SUBMISSION_PACK.md (C20)", () => {
  const pack = read("docs/SUBMISSION_PACK.md");
  it("exists and fills every Devpost field", () => {
    for (const h of ["Project name", "Tagline", "About the project", "Built with", "Try it out", "Video demo", "Category", "Kiro usage"]) {
      expect(pack, h).toMatch(new RegExp(`^## ${h}\\s*$`, "m"));
    }
  });
  it("uses the live URL, the repository URL and the category", () => {
    expect(pack).toContain("https://the-haunted-clause.vercel.app");
    expect(pack).toContain("https://github.com/sohambannerjee8/the-haunted-clause");
    expect(pack).toContain("Costume Contest");
  });
  it("leaves blanks only for the video link and the student details", () => {
    const blanks = pack.match(/_\(blank: [^)]+\)_/g) ?? [];
    expect(blanks.length).toBeGreaterThan(0);
    for (const b of blanks) expect(b, b).toMatch(/video|student/i);
  });
  it("never calls the agents read-only and never shows /100", () => {
    expect(pack.toLowerCase()).not.toContain("read-only");
    expect(pack).not.toContain("/100");
  });
});
