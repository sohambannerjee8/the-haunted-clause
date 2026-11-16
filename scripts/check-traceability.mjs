#!/usr/bin/env node
// Checks the traceability matrix in .kiro/specs/traceability.md against the
// three specs (PLAN_DECISIONS.md C10.21). It fails when:
//   - a criterion in any requirements.md has no row, or a row names a criterion that does not exist;
//   - a row appears twice;
//   - a row names no test or check (at least one backticked token);
//   - a row lists a task number that is not a task heading in any tasks.md;
//   - a named test file is not mentioned in the text of any of the row's tasks;
//   - a named agent (`agent:<name>`) has no file in .kiro/agents/.
// Usage: node scripts/check-traceability.mjs   (exit 0 = complete, 1 = problems)
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SPECS = { CA: "clause-analyzer", LE: "llm-explainer", HU: "haunted-house-ui" };

/** Criterion IDs ("R<req>.<n>") in a requirements.md, in order. Only top-level numbered lines count. */
export function criterionIds(text) {
  const ids = [];
  let req = null;
  for (const line of text.split(/\r?\n/)) {
    const h = /^### Requirement (\d+):/.exec(line);
    if (h) {
      req = h[1];
      continue;
    }
    const c = /^(\d+)\. /.exec(line);
    if (c && req) ids.push(`R${req}.${c[1]}`);
  }
  return ids;
}

/** Map of task number -> text of that task's block (heading line plus following lines until the next heading). */
export function taskBlocks(text) {
  const blocks = new Map();
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const h = /^- \[[ x-]\] (\d+(?:\.\d+)?)\.? /.exec(line);
    if (h) {
      current = h[1];
      blocks.set(current, line + "\n");
    } else if (current) {
      blocks.set(current, blocks.get(current) + line + "\n");
    }
  }
  return blocks;
}

/** Rows of the matrix: { id, verifiedBy, tasks: string[], line }. Header and separator rows are skipped. */
export function parseMatrix(text) {
  const rows = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const m = /^\|\s*([A-Z]{2}-R\d+\.\d+)\s*\|(.*)\|(.*)\|\s*$/.exec(line);
    if (!m) return;
    const tasks = m[3].split(/[,;\s]+/).map((t) => t.trim()).filter((t) => /^\d+(\.\d+)?$/.test(t));
    rows.push({ id: m[1], verifiedBy: m[2].trim(), tasks, line: i + 1 });
  });
  return rows;
}

const FILE_TOKEN = /\.(test|spec|property\.test)\.(ts|tsx|mts)$|\.(mts|mjs|ts|tsx|md|json)$/;

/**
 * @param {string} [root] repository root
 * @param {{ specs?: Record<string, string> }} [options] map of ID prefix -> spec folder name
 */
export function checkTraceability(root = process.cwd(), { specs = SPECS } = {}) {
  const problems = [];
  const known = new Set();
  const blocks = new Map();
  for (const [prefix, dir] of Object.entries(specs)) {
    const req = readFileSync(join(root, ".kiro/specs", dir, "requirements.md"), "utf8");
    for (const id of criterionIds(req)) known.add(`${prefix}-${id}`);
    const tasksPath = join(root, ".kiro/specs", dir, "tasks.md");
    if (existsSync(tasksPath)) for (const [n, body] of taskBlocks(readFileSync(tasksPath, "utf8"))) blocks.set(n, body);
  }
  const rows = parseMatrix(readFileSync(join(root, ".kiro/specs/traceability.md"), "utf8"));
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.id)) problems.push(`${row.id}: duplicate row (line ${row.line})`);
    seen.add(row.id);
    if (!known.has(row.id)) problems.push(`${row.id}: no such criterion (line ${row.line})`);
    const tokens = [...row.verifiedBy.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
    if (tokens.length === 0) problems.push(`${row.id}: names no test or check`);
    if (row.tasks.length === 0) problems.push(`${row.id}: lists no task`);
    for (const t of row.tasks) if (!blocks.has(t)) problems.push(`${row.id}: task ${t} does not exist`);
    const existingTasks = row.tasks.filter((t) => blocks.has(t));
    for (const tok of tokens) {
      if (tok.startsWith("agent:")) {
        const name = tok.slice(6).split(/\s+/)[0];
        if (!existsSync(join(root, ".kiro/agents", `${name}.md`))) problems.push(`${row.id}: agent \`${name}\` does not exist`);
      } else if (FILE_TOKEN.test(tok)) {
        const base = tok.split("/").pop();
        if (existingTasks.length && !existingTasks.some((t) => blocks.get(t).includes(base))) {
          problems.push(`${row.id}: \`${tok}\` is not listed in task ${existingTasks.join(" or ")}`);
        }
      }
    }
  }
  for (const id of known) if (!seen.has(id)) problems.push(`${id}: no row`);
  return { problems, criteria: known.size, rows: rows.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { problems, criteria, rows } = checkTraceability();
  if (problems.length) {
    console.error(`check-traceability: ${problems.length} problem(s) (${criteria} criteria, ${rows} rows)`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(`check-traceability: all ${criteria} criteria have a row with a named test or check listed in its task (${rows} rows)`);
}
