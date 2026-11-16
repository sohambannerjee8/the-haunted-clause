// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkTraceability, criterionIds, parseMatrix, taskBlocks } from "./check-traceability.mjs";

const REQS = `# Requirements: demo

### Requirement 1: One

#### Acceptance Criteria

1. THE thing SHALL do A.
2. WHEN B, THE thing SHALL do C.
    - a sub-bullet that is not a criterion

### Requirement 2: Two

1. THE thing SHALL do D.
`;

const TASKS = `# Implementation Plan

- [ ] 11. Build it
- [ ] 11.1 Write \`a.test.ts\`, then a.ts
  - more text mentioning \`b.spec.ts\`
- [ ] 11.2 Write \`c.test.ts\`
`;

const dirs: string[] = [];
function repo(matrix: string, extra: { agents?: string[] } = {}) {
  const root = mkdtempSync(join(tmpdir(), "hc-trace-"));
  dirs.push(root);
  mkdirSync(join(root, ".kiro/specs/demo"), { recursive: true });
  mkdirSync(join(root, ".kiro/agents"), { recursive: true });
  writeFileSync(join(root, ".kiro/specs/demo/requirements.md"), REQS);
  writeFileSync(join(root, ".kiro/specs/demo/tasks.md"), TASKS);
  for (const a of extra.agents ?? ["rules-auditor"]) writeFileSync(join(root, `.kiro/agents/${a}.md`), "x");
  writeFileSync(join(root, ".kiro/specs/traceability.md"), matrix);
  return root;
}
const opts = { specs: { DM: "demo" } };
const good = `| ID | Verified by | Tasks |
| --- | --- | --- |
| DM-R1.1 | \`a.test.ts\` | 11.1 |
| DM-R1.2 | \`b.spec.ts\` and \`agent:rules-auditor\` | 11.1 |
| DM-R2.1 | \`c.test.ts\` | 11.2 |
`;

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("parsers", () => {
  it("lists criterion IDs and ignores sub-bullets", () => {
    expect(criterionIds(REQS)).toEqual(["R1.1", "R1.2", "R2.1"]);
  });

  it("splits tasks.md into blocks per task number", () => {
    const blocks = taskBlocks(TASKS);
    expect([...blocks.keys()]).toEqual(["11", "11.1", "11.2"]);
    expect(blocks.get("11.1")).toContain("b.spec.ts");
    expect(blocks.get("11.2")).not.toContain("b.spec.ts");
  });

  it("reads matrix rows", () => {
    expect(parseMatrix(good).map((r) => r.id)).toEqual(["DM-R1.1", "DM-R1.2", "DM-R2.1"]);
  });
});

describe("checkTraceability", () => {
  it("passes a complete matrix", () => {
    expect(checkTraceability(repo(good), opts).problems).toEqual([]);
  });

  it("fails when a criterion has no row", () => {
    const m = good.replace("| DM-R2.1 | `c.test.ts` | 11.2 |\n", "");
    expect(checkTraceability(repo(m), opts).problems.join("\n")).toContain("DM-R2.1: no row");
  });

  it("fails when a row names a criterion that does not exist", () => {
    const m = good + "| DM-R9.9 | `a.test.ts` | 11.1 |\n";
    expect(checkTraceability(repo(m), opts).problems.join("\n")).toContain("DM-R9.9: no such criterion");
  });

  it("fails on duplicate rows", () => {
    const m = good + "| DM-R1.1 | `a.test.ts` | 11.1 |\n";
    expect(checkTraceability(repo(m), opts).problems.join("\n")).toContain("DM-R1.1: duplicate row");
  });

  it("fails when a row names no test or check", () => {
    const m = good.replace("| DM-R1.1 | `a.test.ts` | 11.1 |", "| DM-R1.1 | a test | 11.1 |");
    expect(checkTraceability(repo(m), opts).problems.join("\n")).toContain("DM-R1.1: names no test or check");
  });

  it("fails when a listed task does not exist", () => {
    const m = good.replace("| DM-R2.1 | `c.test.ts` | 11.2 |", "| DM-R2.1 | `c.test.ts` | 11.7 |");
    expect(checkTraceability(repo(m), opts).problems.join("\n")).toContain("DM-R2.1: task 11.7 does not exist");
  });

  it("fails when a named test is not listed in any of the row's tasks", () => {
    const m = good.replace("| DM-R2.1 | `c.test.ts` | 11.2 |", "| DM-R2.1 | `c.test.ts` | 11.1 |");
    expect(checkTraceability(repo(m), opts).problems.join("\n")).toContain("DM-R2.1: `c.test.ts` is not listed in task 11.1");
  });

  it("fails when a named agent does not exist", () => {
    const m = good.replace("agent:rules-auditor", "agent:nobody");
    expect(checkTraceability(repo(m), opts).problems.join("\n")).toContain("DM-R1.2: agent `nobody` does not exist");
  });

  it("counts criteria and rows", () => {
    const r = checkTraceability(repo(good), opts);
    expect(r.criteria).toBe(3);
    expect(r.rows).toBe(3);
  });
});
