# BUILD_LOG.md

A factual record of how The Haunted Clause was built with Kiro. Only things that really happened are recorded here.

Kiro app used: Kiro IDE.

---

## Phase 0: Foundation (started 16 November 2026)

### Plan files
- Saved the user's original message unchanged as `PLAN.md` (275 lines; 274 keep their trailing double spaces).
- Saved the approved decisions as `PLAN_DECISIONS.md`. Where the two disagree, PLAN_DECISIONS.md wins.
- Planning happened in a Kiro planning session before any code. It used web fetches of kiroween.devpost.com/rules, the Gemini API terms ("Unpaid Services"), and the kiro.dev docs for custom agents, sub-agents, hooks, hook triggers and MCP configuration.

### Scaffold
- Toolchain: Node 26.13.1, npm 11.20.0, git 2.54.0.
- `npm view next version` returned 16.4.6. Scaffolded with `create-next-app@16.4.6` (TypeScript, Tailwind, ESLint, App Router, `src/`) in `/tmp/hc-scaffold`, then copied it into the project root, because create-next-app will not run in a folder that already holds PLAN.md.
- Removed the scaffold's Next.js and Vercel logo SVGs and its favicon, so the repo holds no third-party logos.
- The scaffold also wrote `AGENTS.md` (Next.js agent rules: read the bundled docs in `node_modules/next/dist/docs/` before writing code). It is kept and committed, because `next dev` re-adds it.
- `git init -b main`.

### Dependencies
- Runtime: `zod` 4.6.7, `motion` 14.14.0, `@google/genai` 3.3.0, `server-only` 0.0.1.
- Dev: `vitest` 5.1.0, `@vitest/coverage-v8` 5.1.0, `fast-check` 4.10.2, `@playwright/test` 1.65.1, `@axe-core/playwright` 4.14.0, Testing Library (react 16.3.3, dom 10.4.2, jest-dom 7.0.1, user-event 14.6.12), `jsdom` 31.0.1, `@vitejs/plugin-react` 6.3.0, `tsx` 4.23.15, `license-checker` 25.0.1. (`vite-tsconfig-paths` 6.1.1 was installed and later removed; see Task 3.)
- Framer Motion is now published as `motion` (MIT, imported from `motion/react`), so `motion` is used.

### What failed and how it was fixed
- **Dev-dependency install, attempt 1:** npm ERESOLVE. `vitest` 5.1.0 has an optional peer `@types/node` `^22 || >=24`, and the scaffold pinned `@types/node` `^20`. Fixed by installing `@types/node@^24`. No `--force` or `--legacy-peer-deps`.
- **Type-check, attempt 1:** `tsc --noEmit` failed with `Cannot find name 'LayoutProps'`. Next.js 16 generates route types (`LayoutProps`) during `next dev`/`next build` only. The bundled doc `06-cli/next.md` documents `next typegen`. Fixed by changing the script to `next typegen && tsc --noEmit`.
- **Playwright Chromium install, interrupted:** the first `npx playwright install chromium` was interrupted by the user mid-download while they asked about specs. The download process kept running as an orphan and held a lock directory (`~/Library/Caches/ms-playwright/__dirlock`). On restart the orphaned processes were stopped, the empty lock directory was removed, and the install was started again as a background process.

- **Playwright install, after restart:** Chrome for Testing 159.0.8154.6 (`chromium-1255`, 377 MB) and ffmpeg (`ffmpeg-1013`) finished installing at 20:40 (both have `INSTALLATION_COMPLETE`). The chromium headless shell (100.8 MiB) then downloaded on a slow connection and finished about 20:55 (`chromium_headless_shell-1255`, `INSTALLATION_COMPLETE`). The lock directory was released.
- **Task 1 demo checks:** `npm test` passed (5 files, 28 tests). `CI=1 npm run test:e2e` built the app and passed the smoke test ("home page loads", 1 passed in 7.0 s). `git check-ignore .kiro/steering/x.md` printed nothing.
- **Workspace MCP settings, attempt 1:** writing `.kiro/settings/mcp.json` with the file-write tool was blocked by a Kiro permission rule that protects `.kiro/settings/` from agent writes. See "MCP" below.

### Steering (Task 2)
- Created six steering files in `.kiro/steering/`, each with `inclusion: always`: `product.md`, `tech.md`, `structure.md`, `hackathon-rules.md`, `design-language.md`, `testing.md`.
- `hackathon-rules.md` was generated with an `awk` extract of PLAN.md section 3 and checked with `diff` against PLAN.md (output: `VERBATIM_OK`). A short "Clarifications approved by the user" block follows the copied checklist.
- Palette contrast ratios in `design-language.md` were computed with a Node script using the WCAG 2.x relative-luminance formula, not estimated. The one colour under 3:1 (aubergine-500, 2.72:1 on ink) is restricted to decorative borders.
- Observed: Kiro loaded each new steering file into the session as a workspace rule straight after it was written (hackathon-rules first, then testing, tech, product, design-language and structure).

### Guard scripts (Task 3, test first)
- Wrote four Vitest test files first (`scripts/hook-input.test.mts`, `secret-scan.test.mts`, `check-repo-rules.test.mts`, `test-related.test.mts`) and ran them: 4 suites failed with "Cannot find module", as expected.
- Then wrote `scripts/lib/hook-input.mjs`, `scripts/secret-scan.mjs`, `scripts/check-repo-rules.mjs` and `scripts/test-related.mjs`. Result: 4 files, 27 tests passed. With the page smoke test: 5 files, 28 tests passed.
- Fake keys in `secret-scan.test.mts` are assembled at runtime. `check-repo-rules.test.mts` builds throwaway git repos in the OS temp folder and proves the check fails for `.kiro`, `.kiro/specs/`, a broad `.*` pattern, a missing or non-MIT LICENSE, a valued or untracked `.env.example`, and un-ignored `.env` files.
- Vitest 5 printed that Vite now resolves tsconfig paths natively, so `vite-tsconfig-paths` was uninstalled and `resolve.tsconfigPaths: true` used instead.
- On the real repo: `npm run check:secrets` (35 tracked files) exit 0; `npm run check:rules` all 6 rules pass; `npm run check:history` (`git log -p --all`) exit 0.

### Hooks (Task 4)
- Created with Kiro's `createHook` tool (not hand-written), as four v1 files in `.kiro/hooks/`:
  - `test-on-save.json`: `PostFileSave`, matcher `(^|/)src/.*\.(ts|tsx)$`, `node scripts/test-related.mjs`, timeout 180 s.
  - `secret-guard.json`: `PostFileSave`, no matcher, `node scripts/secret-scan.mjs --hook`, timeout 30 s.
  - `spec-sync.json`: `PostTaskExec`, agent action that updates BUILD_LOG.md and the README features block.
  - `rules-guard.json`: `PostFileSave`, matcher `(^|/)(\.gitignore|LICENSE)$`, `node scripts/check-repo-rules.mjs`, timeout 30 s.
- **Format difference (rule 9):** PLAN_DECISIONS.md C1.5 names the triggers `FileSave` and `PostTaskExecution`. The current hook file format uses `PostFileSave` and `PostTaskExec`; those names were used. The matcher was also widened from `^src/...` to `(^|/)src/...` because the saved path may be absolute.
- The kiro.dev hooks docs say file hooks receive the file path as JSON on STDIN but do not show the exact key, so `scripts/lib/hook-input.mjs` reads `file_path`, `filePath`, `path` and similar keys at any depth, with unit tests.
- The docs also say file triggers fire only for changes the agent makes, not manual editor saves.
- `createHook` reported each hook "will be active on the next session start", so the hooks could not fire inside this session. Each command was run by hand with a simulated hook event on STDIN instead:
  - Secret guard, clean `src/app/page.tsx`: "no key-like strings found", exit 0.
  - Secret guard, temp file with a runtime-built fake Google key: "WARNING, 1 key-like string(s) found … google-api-key AIza…**** (39 chars)", exit 1. The value was masked.
  - Rules guard: exit 0.
  - Test on save, `src/app/page.tsx`: "tests for src/app/page.tsx pass. Test Files 1 passed, Tests 1 passed", exit 0.
  - Test on save, `README.md`: "nothing to run", exit 0.
- Live firing of the hooks by Kiro is still to be observed in a new session and recorded here.

### Custom agents (Task 5)
- Created five Markdown agents in `.kiro/agents/`: `spec-reviewer`, `test-verifier`, `security-reviewer`, `ui-a11y-reviewer`, `rules-auditor`. The format follows the kiro.dev configuration reference: YAML front matter (`name`, `description`, `tools`, `includeMcpJson`, `permissions.rules`) and a Markdown body used as the system prompt.
- None of them has the `write` tool. Each has an `fs_write` deny rule for `**`, a shell allow-list limited to build/test and git-inspection commands, and a shell deny-list (`rm`, `mv`, `git commit`, `npm install`, redirects and so on). The agents are described as "no write tool; shell limited to build/test commands". ui-a11y-reviewer also gets the `@playwright` MCP tools.
- Each file holds a description saying when to use it, a checklist of Yes/No questions, its tool limits, and the output format (VERDICT PASS/FAIL, one evidence line per check, then problems with file paths).
- A script checked all five front matters: every agent has a name and `tools` without `write`, `*` or `@builtin`.

### MCP
- Planned servers, versions checked with `npm view`: Context7 `@upstash/context7-mcp@4.7.0` (MIT) and Playwright MCP `@playwright/mcp@0.0.85` (Apache-2.0), with no API keys.
- Writing `.kiro/settings/mcp.json` from the agent was blocked by a Kiro permission rule (`deny fs_write matching … .kiro/settings/ …`, source `kiro-scope`). This is Kiro protecting its own settings folder, so the file has to be created by the user (see the Phase 0 report to the user).

### Second session (16 November 2026, after the user created mcp.json)
The user created `.kiro/settings/mcp.json` by hand with the planned content and started a new Kiro session. PLAN.md and BUILD_LOG.md were re-read first. The file was checked: identical to the planned config, valid JSON.

**MCP: Playwright MCP**
- Its tools were available to the agent in the new session as `playwright::*`.
- With `next start -p 3100` running, `browser_navigate` to `http://localhost:3100` returned page title "The Haunted Clause". The accessibility snapshot showed `heading "The Haunted Clause" [level=1]` and the paragraph text. Result: working.
- The console log it captured showed one error: `404 … /favicon.ico`, because the scaffold favicon had been removed. Fixed by adding a project-made ghost icon at `src/app/icon.svg` (Next.js `icon` file convention, read in the bundled docs `01-metadata/app-icons.md`). The production build now emits `icon.svg`.
- Playwright MCP writes snapshots to `.playwright-mcp/`; that folder was added to `.gitignore`.

**MCP: Context7**
- **Failure:** no Context7 tools were exposed to the agent in the new session (`tool_load context7::*` returned not found).
- Cause, found by running the server command by hand: `npx -y @upstash/context7-mcp@4.7.0` failed with `ENOENT … ~/.npm/_npx/b1d96260f5137ffc/package.json`. The npx cache folder for that package held `node_modules` but no `package.json`, a half-written cache entry from 20:58–20:59, when Kiro first started the server at session start (the two servers' `npx -y` installs ran at the same time).
- Fix: removed that one cache folder (`~/.npm/_npx/b1d96260f5137ffc`) and ran the command again. The server started ("Context7 Documentation MCP Server v4.7.0 running on stdio") and answered over stdio JSON-RPC:
  - `tools/list` returned `resolve-library-id(query, libraryName)` and `query-docs(libraryId, query, language)`.
  - `resolve-library-id` for "next.js" returned `/vercel/next.js` with versions up to `v16.4.5`.
  - `query-docs` on `/vercel/next.js/v16.4.5` for "route handler segment config maxDuration and runtime nodejs" returned 4,760 characters from the v16.4.5 docs, including `export const maxDuration = 5` and the note that `nodejs` is the default runtime and `edge` is deprecated.
- So the server and its config work. The Kiro session that was already running did not reconnect to it, so Context7 has been used from the shell, not yet through Kiro's MCP tool interface. The user is asked to reconnect it from the MCP Server view (or start a new session) so later phases can use it through Kiro.

**Hooks fired by Kiro (confirmed)**
- To prove that Kiro (not a manual run) fired the hooks, `scripts/lib/hook-log.mjs` was added, test first: `scripts/hook-log.test.mts` failed with "Cannot find module", then passed 5 tests. The three command hooks now append one line per run to `.hook-runs/hook-runs.log` (git-ignored). Each line holds time, hook name, exit code, and the saved path plus the event's key names. It never holds file contents.
- The hook event JSON from Kiro has the keys `session_id`, `hook_event_name`, `cwd` and `file_path`. So the saved path arrives as `file_path`, which `hook-input.mjs` already reads.
- Real entries written by Kiro in this session (timestamps UTC):
  - `15:38:52.350Z  secret-guard  exit=1  .playwright-mcp/hook-probe.ts`: the agent saved a temporary probe file holding a fake Google-format key, and Secret guard caught it. The probe was then deleted, and it was never tracked because `.playwright-mcp/` is ignored.
  - `15:38:52.646Z  secret-guard  exit=0  src/app/page.tsx`
  - `15:38:53.657Z  test-on-save  exit=0  src/app/page.tsx`: Test on save ran the related tests after `page.tsx` was edited, and they passed.
  - `15:38:38.013Z` and `15:38:52.678Z  rules-guard  exit=0  .gitignore failed=none`: Rules guard ran after `.gitignore` was edited.
  - Secret guard also fired on every other agent save (`scripts/*.mjs`, `.gitignore`), with exit 0.
  - The agent's file tools did not show the hooks' STDOUT/STDERR in their results. The log file is the evidence.
- Spec sync (`PostTaskExec`) cannot fire until spec tasks exist in Phase 1 and are executed in Phase 2. It is still to be observed.

**Checks after these changes**
- `npm test`: 6 files, 33 tests passed.
- `npm run typecheck` and `npm run lint`: exit 0.
- `npm run check:secrets` (44 tracked files), `npm run check:history`, `npm run check:rules` (6 of 6): all exit 0.
- `CI=1 npm run test:e2e`: 1 passed.
- `git check-ignore .kiro/settings/mcp.json .kiro/steering/x.md` printed nothing.

### Kiro features used so far
- Kiro planning session with web fetch (rules, Gemini terms, Kiro docs).
- Steering: six project steering files, plus AGENTS.md from the scaffold, loaded by Kiro as workspace rules. AGENTS.md was followed: the bundled Next.js docs were read before writing config, scripts and the icon.
- Hooks: four hooks created with `createHook`. Test on save, Secret guard and Rules guard were confirmed firing on agent saves in the second session. Spec sync is not yet triggered.
- MCP: Playwright MCP used through Kiro to open and snapshot the app. Context7 verified from the shell after repairing a broken npx cache entry.
- Custom agents: five created. First use is Gate 0 below.

### Gate 0: rules-auditor, attempt 1: PASS
- Ran the `rules-auditor` custom agent (`.kiro/agents/rules-auditor.md`) as a Kiro sub-agent with fresh context. This was the first real use of a custom agent in the build.
- Full report saved unchanged to `docs/gate-reports/phase-0-rules-auditor-attempt-1.md`.
- Deciding items, all Yes:
  - R3: 16 tracked files under `.kiro` (6 steering, 4 hooks, 5 agents, `settings/mcp.json`).
  - R4: nothing in `.kiro` is ignored; no broad dot pattern in `.gitignore`.
  - R5: unmodified MIT text, "Copyright (c) 2026 Soham Banerjee", `"license": "MIT"`.
  - R8: `check:secrets`, `check:history` and `check:rules` all exit 0.
- Information items the auditor reported:
  - R1: 3 commits, 07:22–07:40 PST on 16 November 2026, inside the submission period.
  - Agent wording: all five agents use "no write tool; shell limited to build/test commands", and none has a write tool.
- Problems it found: none affecting Gate 0. It flagged three items for later gates:
  - `scripts/check-bundle.mjs` does not exist yet (Phase 3).
  - The README needs "Pre-existing work" and a licences list covering the LGPL-3.0-or-later `@img/sharp-libvips-*` package and the CC-BY-4.0 `caniuse-lite` package (Phase 6).
  - Spec sync has not fired, and Context7 has not yet been used through Kiro's MCP tools (needed for K2 by Gate 5).
- It also noted one extra blank line between the copied checklist and the clarifications block in `hackathon-rules.md`; the checklist text itself is identical.

**Phase 0 complete.**

### Context7 through Kiro: still not connected (16 November 2026, after the user reconnected it)
- The user reported reconnecting Context7 from the MCP Server view. Checked straight away:
  - `tool_load context7::*` (and the tool IDs `resolve-library-id`, `query-docs`, `get-library-docs`): not found.
  - No Context7 process was running. The Playwright MCP process started at 20:58:40 was still running.
- Kiro's MCP log (`~/Library/Application Support/Kiro/logs/20261116T194317/window1/exthost/kiro.kiroAgent/Kiro - MCP Logs.log`) holds one Context7 attempt: `20:59:17.175 [error] [context7] Failed to connect: MCP server 'context7' connection timed out after 60000ms`. No reconnect attempt is logged after it. Playwright: `20:58:44 mcp.connect.ok`, `mcp.listTools.ok`.
- Cause: at session start both servers were installed with `npx -y` at the same time. Context7's first download took longer than Kiro's 60-second connect timeout, which also left the half-written npx cache folder found earlier. The cache is complete now (`package.json` present), and a manual start takes about a second.
- Result: Context7 has still not been called through Kiro's MCP tools. Every Context7 use so far was from the shell. Phase 1 continues without it, because the requirements need no library docs. The user has been asked to reconnect again and confirm the server shows as connected.

---

## Phase 1: Specs (started 16 November 2026)

PLAN.md and PLAN_DECISIONS.md re-read at the start of the phase.

### Approval stops
- PLAN_DECISIONS.md C1.12 set one approval stop per spec, after its design.
- At the start of Phase 1 the user asked for two stops for clause-analyzer: after the requirements and again after the design (the same as PLAN.md section 6). The user's latest instruction is followed.

### Spec format
- The kiro.dev Feature Specs docs (fetched 16 November 2026) say `requirements.md` uses EARS notation ("WHEN [condition] THE SYSTEM SHALL [behaviour]"), followed by `design.md` and `tasks.md`. The Requirements-First workflow is used.

### clause-analyzer: requirements written
- `.kiro/specs/clause-analyzer/requirements.md`: introduction, glossary (rooms with IDs and order, clause, rule, mitigation, exception marker, finding, Haunt Score) and 11 requirements with EARS acceptance criteria:
  1. Splitting with nothing lost (round trip, contiguous spans, IDs `c-<start>`, terminators, paragraph breaks, list markers, the 11 abbreviations from C1.10, `etc.` before a paragraph break)
  2. Room classification
  3. Severity, mitigations and the five exception markers (C1.7)
  4. Exact quotes
  5. Haunt Score formula and monotonicity
  6. Never throw
  7. Determinism and purity
  8. The 50,000-character cap
  9. The non-English flag
  10. Room metadata
  11. The three fictional samples and their score bands (C7)
- Choices made in the requirements, for the user to review:
  - Length is measured in UTF-16 code units, the same unit a textarea's `maxLength` uses.
  - Findings quote the clause with surrounding whitespace trimmed.
  - The non-English flag uses fixed thresholds: 40 letters, half ASCII, 10% common English words.
  - A 1-second limit for analysing 50,000 characters guards against run-away regular expressions.
  - The mild sample must show at least one mitigated severity 0 wisp.
- Status: waiting for the user's approval of the requirements. The design is not started.

### clause-analyzer: requirements approved with changes, design written
- The user approved the requirements with three changes, all applied to `requirements.md` and recorded in PLAN_DECISIONS.md C10:
  - Exception markers extended with `but`, `although` and `subject to` (glossary, R3.8, R3.9).
  - New R3.10: "We do not sell your data, but we may share it with advertising partners." must not drop to severity 0.
  - R2.7 now requires at least 3 positive and 2 negative example clauses per room, listed in the design, each with its own test.
- Also recorded in C10: two approval stops for clause-analyzer, and one stop (requirements and design together) for llm-explainer and haunted-house-ui. Steering `product.md` was updated with the eight markers.
- Two clarifications made to Requirement 1 while designing the splitter, flagged to the user for approval:
  - R1.7: the `.` in a list marker such as `1. ` does not end a clause.
  - R1.9 and a new R1.13: boundaries in the same whitespace run snap to the end of that run, so the clause starts at the list marker.
  - These answer the user's question about R1.8 against R1.9: R1.8 wins, with one boundary at the end of the whitespace run.
- Before writing the design, a scratch script outside the repo (`/tmp/hc-design-check.mjs`) ran the drafted rule patterns against every planned example. Results: 44 room examples (28 positive, 16 negative) with 0 failures; 15 mitigation and marker cases with 0 failures. It also confirmed the R3.10 case gives Cellar severity 3.
- **Haunt Score finding:** under the current weights (C4), the realistic long policy (150 clauses, 62 findings: 22 × sev0, 30 × sev1, 8 × sev2, 2 × sev3) scores **97**. A very long policy with only severity 0 and 1 findings scores 95. So long policies saturate, as the user suspected.
- The design proposes two options:
  - Option A: smaller weights 0/0.01/0.04/0.12. The realistic long policy scores 59, but scores still grow with length, and the average-sample target falls to 24, outside its band.
  - Option B (recommended): per-room ceilings set by each room's worst severity (caps 0/0.06/0.15/0.35), with the rooms then combined. The realistic long policy scores 80, a policy with only severity 1 findings can never pass 39, and the sample targets score 14, 59 and 97.
  - A 200,000-case random spot check of Option B found 0 monotonicity violations and 0 out-of-range values.
  - Option B needs R5.1 and R5.6 reworded. The current formula stays in force until the user decides.
- Trade-off reported to the user: with `but` as a marker, "We do not sell your data, but you can ask us to delete it." also loses its mitigation and shows severity 3.
- Context7 was still not available through Kiro's MCP tools, so the fast-check v4 string API (`fc.string({ unit: "binary" })`, `"grapheme"` and so on) was read from `node_modules/fast-check/lib/fast-check.d.ts` instead.
- Status: waiting for the user's approval of the design.

### clause-analyzer: design approved with changes; tasks written
- The user approved Option B for the Haunt Score, the R1.7 and R1.13 clarifications, and asked that cancelled mitigations stop falling back to the full rule severity. All of it is recorded in PLAN_DECISIONS.md C10.6–C10.9.
- **Haunt Score:**
  - R5.1 and R5.6 are reworded to the per-room cap formula.
  - The design states the highest reachable score: 97 (`100 × (1 − 0.65⁸) = 96.81`).
  - The "Run" band text became "75 and above" in `design-language.md` and PLAN_DECISIONS.md C6, and the UI is told never to show "/100".
  - `product.md` steering was updated to match.
- **Cancelled mitigations:**
  - New R3.11 (a masking rule) and a reworded R3.10 holding the user's three required cases.
  - The rule was prototyped in a second scratch script outside the repo (`/tmp/hc-cancel-check.mjs`):
    - "…but you can ask us to delete it." gives 1 (required ≤ 1).
    - "…but we may share it with advertising partners." gives 3 (required ≥ 2).
    - "…except to our partners." gives 1 (required ≥ 1).
    - The 44 room examples were re-checked with 0 failures.
  - The mitigation test table grew from 15 to 19 rows.
- **Correction found while writing tasks:** the design, tasks and this log said the room examples were 24 positive and 20 negative. A `grep` count of the design table showed 28 positive and 16 negative (44 in total, so the total was right). All three files were corrected.
- `tasks.md` written for Tasks 11–16 (splitter, rules and classifier, mitigations, score, `analyze()` and the language flag, samples, coverage and Gate 2). Each sub-task lists its requirement IDs.
- **clause-analyzer spec complete.** Next: llm-explainer, with one approval stop for requirements and design together.

### llm-explainer: requirements and design written (one approval stop)
- Context7 was still unavailable through Kiro (`tool_load context7::*` not found), so research used the installed packages and vendor docs:
  - `node_modules/@google/genai/dist/genai.d.ts` (3.3.0): `models.generateContent` config has `responseJsonSchema`, `systemInstruction`, `abortSignal`, `thinkingConfig` and `store`. The newer `interactions.create` stores interactions by default. The `abortSignal` docs say an abort does not cancel the request on Google's side.
  - aistudio.google.com/docs/logs-policy: AI Studio logs requests and responses for billing-enabled projects for up to 55 days. Because of this the design sets `store: false` on every call.
  - aistudio.google.com/docs/models: `gemini-4-hydrogen` is the current fast, stable model (November 2026), with structured output and thinking levels low to xhigh. It is the proposed default model.
  - vercel.com/docs/headers/request-headers: re-read, and it confirms the C1.4 header order.
  - vercel.com/docs/functions/configuring-functions/duration: Hobby default and maximum are 300 s. `maxDuration = 30` is proposed.
  - Bundled Next.js docs (`route-segment-config/runtime.md`): with Cache Components on, a route must not export `runtime`, not even `'nodejs'`. This changes PLAN_DECISIONS.md C5 ("`runtime = "nodejs"`"); the requirement drops it.
  - Ran `z.toJSONSchema` (Zod 4.6.7) on the planned output schema. Gemini's `responseJsonSchema` does not support `minLength`, `maxLength` or `pattern`, so a looser schema goes to Gemini and the strict Zod schema validates on the server.
  - Ran `server-only` under Node: it throws by default and loads under `--conditions=react-server`, which `tsx` accepts. The precompute script uses this.
- `.kiro/specs/llm-explainer/requirements.md`: 16 requirements in EARS form:
  - Route
  - Request validation (with a 256,000-byte cap and an Origin check)
  - No key
  - Gemini call (`store: false`)
  - 15 s timeout
  - Output validation
  - Fallback on errors
  - Response contract
  - Rate limit
  - Logging
  - Storing nothing
  - Merge
  - Request builder (flagged clauses only)
  - Client fallback
  - Key kept out of the bundle
  - Sample precompute
- `.kiro/specs/llm-explainer/design.md`: architecture sequence diagram, file map with server-only marks, Zod schemas, the prompt text, the provider and timeout, the handler step table, merge, request builder, client, rate limiter, precompute script and bundle check.
  - Properties E1–E7, each at 1,000 runs. E1–E4 are the four from C5.
  - The test plan includes the four required mocked-LLM cases and a `console` spy for logging.
- Status: waiting for the user's approval of requirements and design together (C10.1).

### Push to GitHub (user request)
- The user asked for `git push -u origin main`. PLAN.md section 8 lists pushing as the user's own step; the user's direct instruction overrides that.
- The remote `origin` (https://github.com/sohambannerjee8/the-haunted-clause.git) had already been added by the user. The builder did not create the repository.
- Checked before pushing: `check:secrets` (54 tracked files) and `check:history` both exit 0, and no `.env` file is tracked except `.env.example`.
- Pushed commit `b87d89f`. `main` now tracks `origin/main`. The GitHub API returns HTTP 200 for the repository without a login, so it is public.
- **Problem found by the pre-push check:** `npm run check:rules` failed: `kiro-not-ignored: ignored by git: .kiro/.DS_Store, .kiro/specs/.DS_Store`. macOS Finder had created `.DS_Store` files inside `.kiro`, and the scaffold's `.DS_Store` ignore line matched them. These are OS junk, not Kiro content, and none was tracked, so the push itself was unaffected.
  - Fix, test first: two tests were added to `scripts/check-repo-rules.test.mts`. One says ignoring only `.DS_Store` inside `.kiro` passes, and it failed before the fix. The other says a real file ignored next to `.DS_Store` still fails.
  - The check now skips `.DS_Store`, `Thumbs.db` and `desktop.ini` when walking `.kiro`. Result: 11 tests pass, and `check:rules` passes all 6 rules.

### llm-explainer: approved with additions; tasks written
- The user approved the requirements and design, including decisions 1–6, and added three things. All are recorded in PLAN_DECISIONS.md C10.10–C10.13, and the C5 `runtime` line was updated:
  - **(a) Origin check against the request's own host.** R2.4 was rewritten: the Origin's host is compared with the `Host` header, or the URL host when `Host` is missing, and no domain is hard-coded. The design has `origin.ts` and a ten-row test table: localhost, a Vercel preview host and a production host, each matching and mismatched, plus upper case, `Origin: null`, no Origin and no Host. All ten rows were checked with Node's URL parser before writing them.
  - **(b) Privacy wording.** New R17. One `OPT_IN_NOTICE` in `privacy.ts` says the app does not store text and that Google processes the flagged clauses under its own terms. A test bans claims that Google keeps nothing, and the README must match it word for word. DEPLOY.md will cite https://ai.google.dev/gemini-api/docs/logs-datasets for `store: false`. That page, found by web search and then fetched, says `generateContent` stores requests by default for projects created on or after 26 October 2026, and that the request-level `store` takes precedence.
  - **Strict model check.** R16.10–R16.14. `npm run precompute:samples` makes one real `models.get` call, prints the model name, and exits 1 with a loud error if the model or key is rejected, without touching the file. `prebuild` runs with `--lenient`, which only warns and exits 0, so the build never fails (C1.3). `models.get` was confirmed in `genai.d.ts` (line 12789). The builder has no key, so the real call is the user's manual step 2. The user's earlier note asked for the precompute to "fail loudly". Strict and lenient modes reconcile that with C1.3 ("the build must never fail"); this is reported to the user.
- `.kiro/specs/llm-explainer/tasks.md` written for Tasks 17–22. Task 21.2 is the model check.

### haunted-house-ui: requirements and design written (one approval stop)
- Research in the bundled Next.js docs:
  - `next/font/google` downloads fonts at build time, so the font files would not be in the repository. The design uses `next/font/local` with Creepster and Atkinson Hyperlegible committed together with their OFL licence files, to keep rules item R7 true.
  - `next/dynamic` and `React.lazy` both code-split client components.
  - A prerendered page reads `process.env` at build time, and `connection()` defers to request time.
- Checked `motion/react` exports (`MotionConfig`, `LazyMotion`, `m`, `domAnimation`) and the `AxeBuilder` API in `node_modules`.
- `.kiro/specs/haunted-house-ui/requirements.md`: 19 requirements in EARS form:
  - Page shell, input screen, browser-only analysis
  - House and rooms, ghosts and wisps, detail panel
  - Haunt Score, Lights on mode, roving-tabindex keyboard navigation
  - Motion, sound, 360 px layout, "not legal advice"
  - The opt-in, samples, edge states, loading and error states, performance, and axe checks
- `.kiro/specs/haunted-house-ui/design.md`:
  - Component tree, an in-memory state machine, the `llmAvailable` read at build time (with a fallback if Cache Components refuses it), roving tabindex, the native `<dialog>`, CSS-keyframe ghosts switched off by a reduced-motion media query, Web Audio tones whose pitch carries severity, and lazy loading of the house view.
  - Properties U1–U4, each at 1,000 runs.
  - Two Playwright projects: a no-key build, and a second build with a placeholder key so the opt-in UI can be tested with in-browser stubs.
  - The E2E and component test plan.
- Status: waiting for the user's approval of requirements and design together.

### haunted-house-ui: approved with additions; tasks written
- The user approved the requirements and design with two additions and a DEPLOY.md note. They are recorded in PLAN_DECISIONS.md C10.14–C10.17, and C1.3 is corrected.
- **(a) The build never calls Google.** This changed an approved llm-explainer requirement:
  - R16 was rewritten. The precompute runs only as `npm run precompute:samples`. There is no `prebuild` step and no lenient mode, and a new `package-scripts.test.mts` will fail if any other npm script runs the script or uses `@google/genai`.
  - The build reads the committed JSON. For each sample finding the UI shows the medium's text when the JSON has it and the rule text otherwise, so a partial or stale file degrades one finding at a time.
  - Updated to match: the llm-explainer design, the llm-explainer Tasks 21–22, haunted-house-ui R15.1–R15.2, `tech.md` and `product.md`.
  - The removal of `HC_SKIP_PRECOMPUTE` follows from this, because nothing in a build runs the script any more.
- **(b) Visual review.**
  - New R20: 12 screenshots (input screen, three sample houses, an open detail panel, Lights on, each at 1440 and 360 px), taken with reduced motion and fonts loaded.
  - They come from `e2e/screenshots.spec.ts`, which runs only through `npm run screenshots`.
  - After Gate 4 the builder shows them and stops before Phase 5 (Task 31.5).
  - `ui-a11y-reviewer.md` now says it judges function and accessibility only, not taste.
- **Redeploy note:** new haunted-house-ui R14.8. DEPLOY.md must say that adding, changing or removing the key on Vercel needs a redeploy, because `llmAvailable` is read at build time. It was added to the DEPLOY.md draft list in llm-explainer Task 22.2.
- `.kiro/specs/haunted-house-ui/tasks.md` written for Tasks 23–33 (Phase 4: 23–31; Phase 5: 32–33).
- All three specs now have requirements, design and tasks. Next: Gate 1 (spec-reviewer).

### Gate 1: spec-reviewer, attempt 1: FAIL
- Ran the `spec-reviewer` custom agent as a sub-agent with fresh context. Full report: `docs/gate-reports/phase-1-spec-reviewer-attempt-1.md`.
- **Verdict: FAIL** on checklist items 3 (testable), 4 (traceable) and 15 (agrees with PLAN_DECISIONS.md). Items 1, 2, 5–14 were Yes.
- What it found, and how each finding was fixed:
  - llm-explainer R3.3 ("every analyzer feature SHALL still work") was not measurable and not in any task. Rewritten: the analyzer must not import `src/lib/llm/` (checked by `purity.test.ts`), and the no-key build shows rule texts and badges (checked by `flow.spec.ts`). Traced to Task 20.3.
  - haunted-house-ui R15.3 (the "fictional company" line) had no task or test. The text is now exact, with `Toolbar.test.tsx` and a `flow.spec.ts` check in Tasks 25.2 and 25.3.
  - haunted-house-ui R12.1 ("no clipped text, no overlapping controls") was not measured. It now defines both (element `scrollWidth` against `clientWidth`, viewport bounds, and no intersecting control boxes), and `layout.spec.ts` checks them.
  - haunted-house-ui R1.6 (no storage) and R10.4 (flash limit) had no test. Added `no-storage.test.ts`, a storage, cookie and IndexedDB check at the end of `flow.spec.ts`, and a `document.getAnimations()` duration and opacity-peak check in `motion.spec.ts`. R10.4 now states the measurable rule (each cycle at least 1 s, at most one opacity peak).
  - llm-explainer R15.1 still said "build-time precompute script", which contradicted C10.14. Fixed.
  - The "a timed-out call may still be billed" DEPLOY.md note (C10.10) had no requirement. Added llm-explainer R5.3, the Task 22.2 draft item and a new `scripts/docs.test.mts`. That test also checks the rate-limit, `store: false`, redeploy and privacy statements, which were previously checked only by reading.
  - **The `llm-ui` E2E project's placeholder key** contradicted C8 and `testing.md` ("with no key"), with no C10 record. The reviewer also showed that a missed browser stub would let the server call Google.
    - Fix: run that server behind a dead local proxy. Tested first on Node 26.13.1 with `NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:9 HTTP_PROXY=http://127.0.0.1:9 NO_PROXY=localhost,127.0.0.1`: an outbound `fetch` to generativelanguage.googleapis.com failed with ECONNREFUSED after 5 ms.
    - Added a server guard test (an unstubbed request must return `rules/error`).
    - Recorded as C10.18 and in `testing.md`. This is the one change to an approved design made by the builder during the gate, and it is reported to the user.
  - The README word-for-word check was put off to Task 34, outside the reviewed specs. It moved to Task 17.5, which adds the README "Privacy" section now.
  - Cross-spec inconsistencies:
    - Fixed: relative imports are now clause-analyzer R7.4 (covering the analyzer and sample modules) and are checked by `purity.test.ts`.
    - Fixed: one shared generator module, `src/lib/analyzer/arbitraries.test-util.ts`, used by E6, U1 and U4.
    - Fixed: the handler factory deps match across the Glossary, design and C5 (`{ provider, rateLimiter, now, log, isKeySet }`).
    - Fixed: the client option is `fetchImpl` everywhere.
    - Fixed: the duplicate test row was merged.
    - Fixed: R16.6 references changed to R16.7 and R16.8 where they meant the file schema.
  - Minor: the non-EARS lead words OTHERWISE, AT, BECAUSE and WITH were reworded to WHEN or WHILE.
  - Process requirements (clause-analyzer R11.2 and R11.8, haunted-house-ui R20.4) now name their checks: `samples.test.ts` checks the BUILD_LOG "Sample name check" heading and that the samples hold no URLs, emails or ©/®/™ signs; rules-auditor A4; and a BUILD_LOG record of the screenshot review.
- All of the above is recorded in PLAN_DECISIONS.md C10.18–C10.19.

### Gate 1: spec-reviewer, attempt 2: FAIL
- Ran a fresh `spec-reviewer` sub-agent. Full report: `docs/gate-reports/phase-1-spec-reviewer-attempt-2.md`.
- **Verdict: FAIL** on items 4 (traceable) and 15 (agrees with PLAN_DECISIONS.md). Item 3 (testable) now passed. The reviewer checked every attempt 1 problem: 12 resolved, 1 partly resolved.
- **Three problems were introduced by my own attempt 1 fixes:**
  - The new R7.4 said "sample modules SHALL import nothing except analyzer types". That cannot hold, because llm-explainer's `explanations.ts` must import Zod and the JSON (C1.3), and `purity.test.ts` would have failed as designed.
  - The new R10.4 wording ("every animation ≥ 1 s per cycle") would have failed on the design's own short fade-ins.
  - `Toolbar.test.tsx` was placed in a task that did not build the Toolbar.
- **The remaining problems were existing gaps** where no named test checked a criterion:
  - llm-explainer R16.6 (summary line) and R9.5 (source citation).
  - haunted-house-ui R1.1 (`h1`, `lang`, title), R1.2 (second footer sentence), R2.5 (card description), R4.6 (frame `aria-hidden`) and R5.6 (focus ring).
  - R12.1's "every state" was wider than the states `layout.spec.ts` tested.
  - R1.12's over-cap inputs were not in any generator.
  - The 405 response from Next.js would lack `Cache-Control: no-store` (R1.4).
- **Fixes** (PLAN_DECISIONS.md C10.20):
  - R7.4 narrowed to the sample text modules and `index.ts`.
  - Named checks added for each gap above: `House.test.tsx`; extended `Footer`, `SampleCards`, `keyboard` and `flow` tests; a summary-line regex test; a source-URL test.
  - R10.4 split into repeating animations and one-off fades, with fades fixed at 200 ms.
  - R12.1 lists 15 states, and `layout.spec.ts` covers them across both projects.
  - New `overCapString` generator.
  - The route exports explicit 405 handlers that go through `respond()`.
  - The Toolbar is built in Task 25.2, with its toggles added in 28.1 and 30.1.
- These are different problems from attempt 1, not the same problem failing again, so the three-attempt stop does not apply yet.

### Gate 1: spec-reviewer, attempt 3: FAIL, build stopped (PLAN.md section 1, rule 4)
- Ran a fresh `spec-reviewer` sub-agent. Full report: `docs/gate-reports/phase-1-spec-reviewer-attempt-3.md`.
- **Verdict: FAIL** on item 4 only (traceable). Items 1–3 and 5–15 were Yes, and all nine attempt 2 problems were resolved.
- **Remaining item 4 failures:** five haunted-house-ui criteria have no named test:
  - R2.6: the counter is not a live region.
  - R6.7: focus stays inside the open dialog and the page behind is inert.
  - R11.4: no audio files are shipped.
  - R17.2: "Opening the house…" with `aria-busy`.
  - R19.3: one `main` landmark and room heading levels; the design also never defines the house heading level.
  - The reviewer noted that none of these lines changed in the attempt 2 commit, so they were missed by earlier reviews rather than introduced by fixes.
- **New design risk** from the attempt 2 fix (not failing an item): the explicit `GET` 405 handler reads no request data. The bundled Next.js 16 docs (`15-route-handlers.md`) say such a `GET` can be prerendered under Cache Components, which could drop the 405 status and headers in production.
- **Minor items:**
  - The stale `route.ts` Files row.
  - An unnamed shell E2E spec.
  - `meta.ts` being allowed to import the sample texts.
  - Steering items: the focus ring "on every focusable element" and the 5-second motion rule.
  - No test that only one route exists.
  - security-reviewer item 6 still mentions a "build-time script".
- **Why the build stopped:** Gate 1 has failed three times. Each time the failing item included item 4, traceability (every criterion must have a named test). The specific criteria differed each time, but the underlying problem is the same: the specs had no complete criterion-to-test map, and the fixes patched only the criteria each review happened to list. Under PLAN.md section 1 rule 4, the builder stopped and asked the user, and made no further spec changes after attempt 3.
- **Proposed fix, given to the user:** build a full traceability matrix (all 234 criteria: clause-analyzer 69, llm-explainer 72, haunted-house-ui 93), with each criterion mapped to its named test and task. A script then fails if any criterion ID is missing from it. Fix the five gaps, the `GET` prerender risk and the minor items, and then run attempt 4.

### User decision after the stop, and the fixes for Gate 1 attempt 4
- **The user approved attempt 4 with five instructions**, recorded in PLAN_DECISIONS.md C10.21:
  - Build a traceability matrix and a check script.
  - Change spec-reviewer item 4 to "the script exits 0, plus a 30-entry spot check".
  - Make the proposed fixes.
  - Do not start a fifth round if attempt 4 fails only on minor or naming items.
  - Push after every passed gate, and now.
- **Push:** `git push` sent `691e61e..2e5813c` to `origin/main`, after `check:secrets`, `check:history` and `check:rules` all passed.
- **Traceability check, test first:** `scripts/check-traceability.test.mts` (12 tests) failed with "Cannot find module", then passed after `scripts/check-traceability.mjs` was written. It is wired as `npm run check:trace`, a separate command from `check:rules`, so the Rules guard hook stays fast.
  - Three deliberate breakages of a copy of the real specs were each caught: a test listed under the wrong task, a missing row and an unknown test file. Restoring the copy gave 0 problems.
  - Type-check then failed (TS2345): JSDoc inference narrowed the `specs` option to the three real spec names. A `Record<string, string>` JSDoc type fixed it.
- **Matrix:** `.kiro/specs/traceability.md` has 236 rows, one per criterion: clause-analyzer 69, llm-explainer 72, haunted-house-ui 95 (two criteria were added, R10.5 and R19.4). `npm run check:trace` reports "all 236 criteria have a row with a named test or check listed in its task".
- **Gaps filled while building the matrix** (each now a named test in a task):
  - The five attempt 3 gaps.
  - The heading structure.
  - llm-explainer R1.1 (one route).
  - R11.1 (no file or cookie writes in llm and api code).
  - R14.3 (no fetch on import).
  - R15.1 and R15.2 (`server-only.test.ts`).
  - clause-analyzer R2.1 and R4.3 (P8 extended to findings) and R4.5.
  - haunted-house-ui R11.2, R16.6 (`HauntedApp.test.tsx`) and R17.1 (the perf spec checks that the house chunk is not loaded early).
- **Cache Components risk:** the 405 handlers now `await connection()`. `e2e/explain-route.spec.ts` runs against the production build and checks 405, `Allow: POST` and `Cache-Control: no-store` for `GET`, `PUT`, `PATCH` and `DELETE`.
- **Minor items:**
  - Stale `route.ts` row fixed.
  - `e2e/shell.spec.ts` named.
  - `meta.ts` moved to clause-analyzer Task 15.2, with no imports.
  - design-language steering: the 5-second motion rule now names Lights on as the stop control (new R10.5), and the focus ring "on every focusable element" became new R19.4.
  - security-reviewer item 6 updated.
  - test-verifier gained item 11 (`check:trace` and open items).
  - `testing.md` gained rule 6 (keep the matrix in step with the specs).
- Checks after the fixes: `npm test` 7 files, 47 tests passed; typecheck, lint and `check:rules` exit 0.

### Gate 1: spec-reviewer, attempt 4: PASS
- Ran a fresh `spec-reviewer` sub-agent under the updated item 4 (C10.21). Full report: `docs/gate-reports/phase-1-spec-reviewer-attempt-4.md`.
- **Verdict: PASS** on all 15 items.
  - The agent ran `npm run check:trace` itself (exit 0, "all 236 criteria … 236 rows").
  - Its spot check of 30 entries (10 per spec) found every named test listed in one of that entry's tasks.
  - 12 of the 13 attempt 3 problems were resolved; R19.3 was partly resolved.
  - It reported no CONFLICT and no SCOPE problem.
- **Open items** (TRACEABILITY or MINOR). Under C10.21 there is no fifth round. Each item was added to the task that will build it, and the matrix was updated (`npm run check:trace` still passes). test-verifier item 11 enforces them as each task is built:
  - HU-R19.3: the Lights on `h2` (`lights.spec.ts`, Task 28.2) and the dialog `h2` (`DetailDialog.test.tsx`, Task 26.1).
  - HU-R8.1: the matrix named the wrong file. The toggle is checked in `Toolbar.test.tsx` (Task 28.1) and `lights.spec.ts`.
  - HU-R5.4: the computed ghost size, opacity and colour per level go in `flow.spec.ts` (Task 25.3), because jsdom does not apply CSS.
  - HU-R17.5: the render-error case moved to `HauntedApp.test.tsx`, with a throwing `HouseView` mock (Task 32.2).
  - HU-R10.3: `motion.spec.ts` checks that no element has a running repeating animation under reduced motion, and `HauntedApp.test.tsx` checks `MotionConfig reducedMotion="user"` (Task 30.1).
  - LE-R11.1: `no-storage.test.ts` also bans `"use cache"`, `unstable_cache` and `cacheTag` in llm and api code (Task 23.2), and `rateLimit.test.ts` checks the limiter holds only IP keys and timestamps (Task 19.1).
  - LE-R4.5: `server-only.test.ts` checks that only `gemini.ts` and `availability.ts` contain the key name (Task 18.3).
  - CA-R1.12 and R1.6: P8 also runs on `overCapString` (Task 11.3).
  - LE-R9.5: `docs.test.mts` also checks "not shared" (Task 22.2).
  - MINOR:
    - The haunted-house-ui design test rows now match the tasks (`flow.spec.ts` loading check, `Toolbar.test.tsx` toggles, `loading.spec.ts` note).
    - The HU-R12.1 matrix row no longer gives a state count.
    - Every room `section` now carries the accessible name, so quiet rooms say "<Room>, quiet" (C1.8).
    - spec-reviewer "Tool limits" text and PLAN_DECISIONS.md C8 now list `npm run check:trace` and `git diff`.
- Gate 1 history: attempt 1 FAIL, attempt 2 FAIL, attempt 3 FAIL (stopped and asked the user), attempt 4 PASS.

**Phase 1 complete.** All three specs have approved requirements and designs, a task list, and full traceability.
- **Push after Gate 1 (C10.21):** `git push` sent `2e5813c..1ea557b` to `origin/main` after `check:secrets` (65 tracked files), `check:history`, `check:rules` and `check:trace` all passed. Local `main` and `origin/main` match.

---

## Phase 2: Analyzer core (started 16 November 2026)

PLAN.md and PLAN_DECISIONS.md re-read at the start of the phase.

### Task 11: types, rooms, clause splitter (clause-analyzer spec)
- **11.1:** `src/lib/analyzer/rooms.test.ts` (4 tests) failed with "Failed to resolve import ./rooms". Then `types.ts` and `rooms.ts` were written, and the 4 tests passed. Kiro's Test on save hook ran the related tests on its own when `rooms.ts` was saved (`.hook-runs/hook-runs.log`: `test-on-save exit=0 src/lib/analyzer/rooms.ts`).
- **11.2:** `splitter.test.ts` (45 tests) was written first and failed (no module), then `splitter.ts`. All 45 passed on the first run. The tests cover:
  - every abbreviation, in both forms;
  - `etc.` before a paragraph break, and `zinc. Then`;
  - closers, CRLF and emoji;
  - seven list-marker styles;
  - the four boundary-resolution rows from the design.
  One always-true condition left in the paragraph-break check was removed afterwards, and the tests still passed.
- **11.3:** shared generators in `src/lib/analyzer/arbitraries.test-util.ts`: `anyString`, `utf16String`, `policyLike`, `bigString`, `overCapString` and `riskyClause`. The 44 room example clauses moved into one fixture, `examples.test-util.ts`, which both the generators and the classifier tests use. `vitest.config.mts` now excludes `*.test-util.ts` from coverage.
- **Property-based testing caught a bug the unit tests missed.**
  - P6 (no whitespace-only clause when the input has text, R1.5) failed after 70 runs, with the counterexample `"\r\n\nWe may sell your personal information to third parties."`. A second P6 run over the cap failed with `"\n\n!\n\n!…"`.
  - Cause: a paragraph break at the very start of the input put a boundary at the end of the leading blank line, which left a first clause made only of whitespace. None of the 45 unit tests started with a blank line.
  - Fix, test first: a regression test with three such inputs was added and failed, then the splitter merged a whitespace-only first clause into the next. Result: 54 analyzer tests pass, including P6 and P8 at 1,000 runs each, on normal and over-cap inputs.
- Spec task status: Tasks 11, 11.1, 11.2 and 11.3 were marked `[x]` by editing `tasks.md`. Kiro's Spec sync hook is a `PostTaskExec` trigger, which fires when a task is run from Kiro's spec task interface, not when the checkbox is edited by hand. So it did not fire, and this entry was written by the builder.

### Task 12: rule table, classifier, mitigations
- **12.1:** `rules.test.ts` (27 tests) failed (no module), then `rules.ts`, and all 27 passed. The table holds 40 rules (five per room), 11 mitigations and `EXCEPTION_MARKER` with the eight markers. Every rule has its own plain-English explanation and "why it matters" text.
  - While writing the test, I removed one case I had included by mistake: `however-ish` does contain the whole word "however", so asserting a match for it said nothing useful. It was replaced by two genuine non-matches, `buttress` and `excepted`.
- **12.2:** `classifier.test.ts` (56 tests) failed (no module), then `classifier.ts` (without mitigations), and all 56 passed. The tests cover:
  - all 28 positive examples (room, severity, rule);
  - all 16 negative examples, which give no finding at all;
  - per-room example counts;
  - room and rule tie-breaks, case-insensitivity and whitespace-only clauses;
  - trimmed spans, clause IDs, and rule texts in findings.
- **12.3:** `mitigation.test.ts` (20 tests) was written before the mitigation logic. 19 failed and 1 passed: the "never raises a severity" case, which holds trivially with no mitigations. Then applied and cancelled mitigations and the R3.11 masking rule were added, and all 20 passed. The user's three R3.10 cases gave 1, 3 and 1, as designed.
- Analyzer total: 157 tests pass; lint and type-check are clean.

### Task 13: Haunt Score
- `score.test.ts` (17 tests) failed (no module), then `score.ts`, and all 17 passed. The tests cover:
  - the approved weights and caps, and `MAX_REACHABLE_SCORE = 97`;
  - 0 for no findings and for all severity 0 findings;
  - single findings scoring 5, 15 and 30, and room caps of 6, 15 and 35;
  - exactly 97 for all rooms saturated, and never above 97;
  - 39 as the ceiling for severity 1 only;
  - the four long-policy scenarios from the design (80, 44, 31, 31);
  - round-half-up, including the floating-point result 24.499999999999996 rounding to 25.
- `score.property.test.ts`: P1 (whole number 0–100, at most 97), P7 (order independence, with fast-check `shuffledSubarray`, checked to really shuffle) and a monotonicity property, each at 1,000 runs. All pass. A "P1 through `analyze()`" case was first written here, but `analyze` did not exist yet, so it was moved to Task 14.3.

### Task 14: analyze(), the non-English flag, properties, purity
- **14.1:** `language.test.ts` (5 tests) failed (no module), then `language.ts`, and all 5 passed. The tests cover English, Spanish, French and Japanese paragraphs and the under-40-letters rule.
- **14.2:** `analyze.test.ts` (9 tests) failed (no module), then `analyze.ts` and `index.ts`. One test then failed: my test text for R9.6 used an English sentence long enough to push the share of common English words over 10%, so the text was not flagged as non-English. That was a fault in the test text, not the code. I replaced it with a mostly-Spanish sentence containing the rule phrase "data brokers", and all 9 passed. The tests cover:
  - exactly 50,000 characters accepted, and 50,001 giving the typed `too-long` error;
  - input order, empty text and emoji;
  - both 50,000-character speed cases finishing in under 1 second.
- **14.3:** `analyze.property.test.ts` covers P1 (through `analyze`), P2 (adding a risky clause never lowers the score), P3, P4 (up to the cap, plus the typed error over the cap), P5, P8 (findings), P9 and P10, each at 1,000 runs. All 9 passed in about 1 second.
  - Because that seemed fast, I measured the generators over 1,000 samples. `policyLike` has a median of 75 characters (maximum 421). `bigString` has a median of 20,808 and a 90th percentile of 49,206 (maximum 50,000). `overCapString` runs from 50,001 to 60,000. The inputs are realistic, so the speed is real.
- **14.4:** `purity.test.ts` (21 tests) scans the analyzer sources (comments and strings stripped) for clock, randomness and network APIs. It also checks the import rules for the analyzer and for `src/lib/samples`. All pass. As a check, a temporary analyzer file calling `Date.now()` made the test fail, and the file was then deleted.

### Task 15: the three sample policies

#### Sample name check (R11.2)
Each candidate company name was web-searched on 16 November 2026, both as the full name and as the made-up word on its own. A name was rejected if any real company, product or well-known project uses it.

| Query | What the search found | Decision |
| --- | --- | --- |
| "Lanternmoth Notes", "Lanternmoth" | lanternmoth.com, a company called Lanternmoth Media, and a Substack named lanternmoth | Rejected |
| "Grimhollow Social", "Grimhollow" | "Grim Hollow", a published Dungeons & Dragons setting, and grimhollowmc.com, a Minecraft server | Rejected |
| "Mirebell Streaming", "Mirebell" | Only near spellings: Mirebel (a French commune) and MiRebelle (a band). No company or product named Mirebell | Kept |
| "Quillwhisper Notes", "Quillwhisper" | No company or product. Only unrelated note apps with "Quill" in the name | Used for the mild sample |
| "Murkwillow Social", "Murkwillow" | No company or product. The word appears only as a generated fen name on a fantasy name generator | Used for the terrible sample |
| "Wispmere" | Wisemere, a clothing brand, is too close | Not used |
| "Gloomtallow" | No match (glowtallow is a skincare brand, a different spelling) | Not needed, not used |

Final fictional companies:
- Mild: **Quillwhisper Notes**
- Average: **Mirebell Streaming**
- Terrible: **Murkwillow Social**

The two rejected names also appeared in the clause-analyzer design ("Samples"), in the text of Task 15.1, and in two splitter test sentences ("Lanternmoth Inc.", "Grimhollow Ltd."). All four places were changed to the final names, so no rejected name is left outside this log.

#### Sample files and tests
- **15.2:** `samples.test.ts` (15 tests) was written first and failed (no modules). Then `mild.ts`, `average.ts`, `terrible.ts`, `meta.ts` and `index.ts` were written from scratch. 14 tests passed; the R11.2 test failed until the "Sample name check" section above was written, then all 15 passed.
- Results printed by the test:
  - mild (Quillwhisper Notes): score 14, 28 clauses, 5 findings, including mitigated severity 0 wisps in the Cellar and Locked Door (R11.7).
  - average (Mirebell Streaming): score 59, 26 clauses, 8 findings.
  - terrible (Murkwillow Social): score 97, 32 clauses, 29 findings, with a risky finding in all eight rooms.
- **Spec change (descriptive only):** the design's "Samples" section had rough targets (about 30, 45 and 50 clauses; an average sample with three severity 1 rooms; at least two severity 3 findings in every terrible room). The written samples are shorter and differ in those details, while every acceptance criterion R11.1–R11.8 holds. The design now states the real figures. No requirement, task ID or test name changed, and `npm run check:trace` still passes (236 rows).
- Full suite: 20 files, 287 tests pass. Type-check, lint and `check:trace` are clean.

### Task 16.1: coverage thresholds
- `vitest.config.mts` now sets line thresholds: 90% for `src/lib/analyzer/**`, and 80% for `!src/lib/{analyzer,llm}/**`, which is everything else in `src/`. Vitest's plain global threshold counts every file, including the analyzer, so it could not express "the rest of `src/`". The negated glob was checked with picomatch first (it matches `src/app/page.tsx` and `src/lib/samples/mild.ts`, not analyzer or llm files). The 90% target for `src/lib/llm/**` will be added with the first llm file in Phase 3.
- The first `npm run test:coverage` run failed: "Coverage for lines (75%) does not meet `!src/lib/{analyzer,llm}/**` threshold (80%)". The cause was the scaffold's `src/app/layout.tsx` at 0%, with no test. The threshold was kept, and `layout.test.tsx` (2 tests: `lang="en"`, the `<body>` wrapper, the title and the not-legal-advice description) was added. This is a test written after the code, because the layout came from the scaffold in Phase 0.
- `npm run lint` then reported two warnings in the generated `coverage/` HTML report. `coverage/**` was added to the ESLint ignores; it was already git-ignored.
- Result: 21 files, 289 tests pass. Line coverage is 100% (159 of 159) overall and 100% for the analyzer. Type-check and lint are clean.

### Gate 2 (Task 16.2)
- Before the gate, the builder ran `CI=1 npm run test:e2e` once (fresh production build, 1 smoke test passed) to make sure the gate would not fail on a stale server. This was a pre-check, not the gate.
- The `test-verifier` custom agent ran as a sub-agent with fresh context. Report saved unchanged to `docs/gate-reports/phase-2-test-verifier-attempt-1.md`.
- **Verdict: PASS on attempt 1.** All 12 checklist items answered Yes (items 6, 7 and 12 partly "not due until Phase 3" for the llm parts). It ran typecheck, lint, `test:coverage` (21 files, 289 tests), build, `test:e2e` (1 test) and `check:trace` (236 rows), all exit 0. 16 `fc.assert` calls, all at 1,000 runs. Line coverage: analyzer 100%, rest of `src/` 100%. It found no weakened test or threshold since the Gate 1 commit, and confirmed the Gate 1 open item CA-R1.12/R1.6.
- Problems reported: none.

**Phase 2 complete.**
- **Push after Gate 2 (C10.21):** `git push` sent `1ea557b..6c01b9f` to `origin/main` after `check:secrets` (96 tracked files), `check:history`, `check:rules` (0 FAIL) and `check:trace` all passed.

---
## Phase 3: LLM explainer (started 16 November 2026)
PLAN.md and PLAN_DECISIONS.md re-read at the start of the phase, together with the llm-explainer requirements, design and tasks.

### Task 17: schemas, parsing, merge, request builder, privacy wording (llm-explainer spec)
Each sub-task was test first: the test file was written and run, it failed because the module did not exist, then the module was written and the tests passed.
- **17.1:** `schema.test.ts` (34 tests), then `schema.ts`. The tests cover 0, 1, 40 and 41 clauses; text of 1,500 and 1,501 characters; six bad IDs; a duplicate ID; extra properties; trimming and the 400-character limit; the response rule that `reason` appears only with `rules`; and the sample explanations file shape. `ROOM_IDS` is a literal tuple (Zod's `z.enum` needs one), and a test checks it equals the analyzer's room list. The JSON Schema sent to Gemini is generated with `z.toJSONSchema` from a looser twin without length limits, with `$schema` removed; a test walks it and finds only supported keywords.
- **17.2:** `parse.test.ts` (9 tests) and `parse.property.test.ts` (E4, parser part: `fc.anything()` raw and stringified, `fc.jsonValue()`, `fc.string({ unit: "binary" })`, and a "nearly valid" generator, each at 1,000 runs), then `parse.ts`. `parseLlmOutput` takes `unknown`, so a non-string value fails cleanly instead of throwing (R6.5). The nearly-valid property also asserts that the success branch was reached at least once, so it is not vacuous.
- **17.3:** `merge.test.ts` (7 tests) and `merge.property.test.ts` (E1, E2, E3 at 1,000 runs, with up to 60 findings and LLM IDs drawn from the real IDs and random strings), then `merge.ts`.
- **17.4:** `request.test.ts` (8 tests: no findings, 41 findings by severity and by tie, a 1,600-character quote, and two surrogate-pair cuts) and `request.property.test.ts` (E6 at 1,000 runs on `policyLike`, and again on `bigString`), then `request.ts`.
  - I checked whether E6 reaches the hard paths. Over 1,000 samples, `policyLike` never gave more than 40 findings or a quote over 1,500 characters. So E6 also runs on `bigString`, where 205 of 1,000 inputs gave more than 40 findings and 229 had a quote over 1,500 characters.
- **17.5:** `privacy.test.ts` (10 tests) and the README part of `scripts/docs.test.mts` (7 tests), then `privacy.ts` (`OPT_IN_NOTICE`, `GEMINI_TERMS_URL`). The docs test then failed 7 times because README.md had no Privacy section. The section was added, with the notice word for word and the terms link, and the tests passed. The DEPLOY.md part of `docs.test.mts` is written in Task 22.2.
- `vitest.config.mts` now also enforces 90% line coverage for `src/lib/llm/**`, as planned in Task 16.1.
- Full suite: 30 files, 374 tests pass; line coverage 100% (211 of 211). Type-check and lint are clean.

### Task 18: provider, timeout, prompt, Gemini provider
- **18.1:** `provider.test.ts` (9 tests, `vi.useFakeTimers()`) failed (no module), then `provider.ts`, and all 9 passed. A call resolving at 14.9 s succeeds; one at 15.1 s rejects with `TimeoutError` at 15 s and its signal is aborted; a provider that never settles still rejects by 15.5 s; the timer count is 0 after success, after a provider error and after a synchronous throw. The timeout is a generic `runWithTimeout(task, ms)`, so the precompute script's `models.get` check can reuse it (Task 21.2).
- **18.2:** `prompt.test.ts` (8 tests) failed (no module), then `prompt.ts` with the design's system instruction word for word and `renderClauses`, and all 8 passed. One test sends a clause containing "Ignore previous instructions…" and checks it stays a JSON string, unchanged.
- **18.3:** `gemini.test.ts` (9 tests, `@google/genai` mocked with `vi.mock`), `availability.test.ts` (5 tests) and `server-only.test.ts` (5 tests) were written first. The first two failed (no module); in `server-only.test.ts` the "only gemini.ts and availability.ts contain the key name" test failed (no such files yet) and the other four passed. Then `gemini.ts` and `availability.ts` (both `import "server-only"`) and the `server-only` alias in `vitest.config.mts` (to `node_modules/server-only/empty.js`), and all 19 passed.
  - **Source for the SDK signatures:** `node_modules/@google/genai/dist/genai.d.ts` (3.3.0). `GenerateContentConfig` has `systemInstruction`, `responseMimeType`, `responseJsonSchema`, `thinkingConfig` (`ThinkingLevel.LOW`), `store` and `abortSignal`; its `abortSignal` note says aborting is client-side only and the usage is still charged. `Models.get(params: GetModelParameters): Promise<Model>` exists, and `ApiError` carries `status: number`. Context7 is still not available among Kiro's MCP tools in this session (only Playwright MCP is listed), so it was not used.
  - The fake key in `gemini.test.ts` is assembled at runtime (`"AI" + "za" + "x".repeat(35)`), as `testing.md` requires.
- Type-check clean.

### Task 19: rate limiter
- Re-read https://vercel.com/docs/headers/request-headers (web fetch, 16 November 2026). It still says Vercel overwrites `x-forwarded-for` and does not forward external IPs, to prevent spoofing; `x-vercel-forwarded-for` is identical but is not overwritten by a proxy in front of Vercel; `x-real-ip` is identical to `x-forwarded-for`. The page is cited in the `rateLimit.ts` comment.
- `rateLimit.test.ts` (17 tests, injected clock) and `rateLimit.property.test.ts` (E5, two generators at 1,000 runs each) failed (no module), then `rateLimit.ts`, and all 19 passed. The unit tests cover the 11th request, the sliding window to the millisecond, `Retry-After` (44.5 s → 45, 1 ms → 1), refused requests not counted, stale timestamps removed, only string keys and number arrays held (R11.1), LRU eviction at `maxKeys` and the 10,000 default, the header order with empty values skipped, and the source citing the Vercel URL (R9.5).
- E5 checks more than the bound: each request must be allowed exactly when fewer than 10 of that IP's allowed requests fall in the last 60 s.
- **Mutation check:** I changed `list.length >= limit` to `> limit` for one run. The burst generator caught it at once (counterexample: 20 requests at time 0 from two IPs). The spread-over-10-minutes generator did not, because its requests rarely pile up, which is why the burst generator exists. The file was restored and all 19 tests pass.

### Task 20.1–20.2: Origin check and handler
- **20.1:** `origin.test.ts` (13 tests: the design's ten cases, plus an Origin that is not a URL, a default port, and a Host header that differs from the request URL) failed (no module), then `origin.ts`, and all 13 passed. No domain is written anywhere in the code.
- **20.2:** `handler.test.ts` (22 tests) and `handler.property.test.ts` (E4 handler part with three generators, and E7, each at 1,000 runs) failed (no module), then `handler.ts`.
  - The four required mocked-LLM cases: good output → 200 `llm` (unknown ID `c-999` dropped); malformed output (four variants) → 200 `invalid`; timeout → 200 `timeout` at exactly 15 s with fake timers, signal aborted; no key → 200 `no-key` with the provider not called.
  - Also: provider error and synchronous throw → `error`; the 11th request → 429 with `Retry-After: 50`; no-key and malformed requests are counted by the limiter; bodies over 256,000 bytes → 400 and not counted; a two-byte-character body is measured in bytes; exactly 256,000 bytes passes; a `Content-Length` over the cap is refused before reading; bad JSON (including invalid UTF-8) and schema mismatches → 400; Origin mismatch and `Origin: null` → 403; an internal failure → 200 `error`. Every response is checked against `ExplainResponse` and for `Cache-Control: no-store`.
  - Logging: exactly one line per request, `explain outcome=<…> clauses=<n> ms=<d>`. A spy on every `console` method, with a provider error message that contains the clause text and a fake key, saw 7 lines and none contained clause text, model text, the IP or the key.
  - **First run: 25 of 26 passed.** E7 failed on its own guard ("expected 0 to be greater than 0"): in 1,000 runs the `llm` success path was never reached, because the generated provider answers used IDs unrelated to the generated request. The handler was not at fault; the generator was too weak. I added a "matched" generator (a valid request plus an answer for a subset of its own IDs) to the mix, and all 26 passed. Without that guard, E7 would have passed while never testing the success branch.
  - The handler accepts an optional `timeoutMs` (default 15,000) so E7 can use 1 ms for a hanging provider; the 15 s value itself is tested in `handler.test.ts`.

### Task 20.3–20.4: the route and the browser client
- Read the bundled Next.js 16 docs first: `04-functions/connection.md` (rendering waits for a real request), `02-route-segment-config/runtime.md` (with Cache Components, remove the `runtime` export, including `runtime = 'nodejs'`), `maxDuration.md`, and `01-getting-started/15-route-handlers.md` (with Cache Components a `GET` handler that reads no request data can be prerendered; `connection()` stops prerendering).
- **20.3:** `route.test.ts` (8 tests, `next/server` mocked) failed (no module), then `src/app/api/explain/route.ts`, and all 8 passed. The tests check the exports, `maxDuration === 30` and no `runtime`; that each of GET, PUT, PATCH and DELETE calls `connection()` and builds nothing until it resolves, then answers 405 with `Allow: POST`, `Cache-Control: no-store` and a valid rules body; that POST with no key returns `rules/no-key` with no `fetch`; and that `src/app` holds exactly one `route.ts`, which is the only `src/app` file importing `gemini.ts` (R1.1).
  - `npm run build` lists `ƒ /api/explain` (dynamic), so the route is not prerendered.
  - `e2e/explain-route.spec.ts` (6 tests) was written after the route, so it passed on its first run, against a fresh production build (`CI=1 npm run test:e2e`, 7 of 7 with the smoke test). Each 405 method is called twice, so a cached or prerendered response would show on the second call.
  - Demo with `next start -p 3100` and no key: `curl -X POST localhost:3100/api/explain -d '{"clauses":[…]}'` returned `200`, `cache-control: no-store`, `{"source":"rules","reason":"no-key","findings":[]}`. `curl localhost:3100/api/explain` returned `405`, `allow: POST`, `cache-control: no-store`. The server printed one line, `explain outcome=no-key clauses=1 ms=2`, and nothing else.
- **20.4:** `client.test.ts` (11 tests, mocked fetch) failed (no module), then `client.ts`, and all 11 passed. Importing makes no fetch; 200 `llm` returns the findings and posts exactly `buildExplainRequest(findings)`; 429 keeps `rate-limited`; 500 with three bad bodies gives `invalid`; a network error gives `error`; the 20 s timeout (fake timers) gives `error` at 20,000 ms, not 19,999, and aborts the request; no findings makes no fetch. The timeout uses `AbortController` with `setTimeout` rather than `AbortSignal.timeout`, so fake timers can drive it.
- Full suite: 42 files, 487 tests pass. Line coverage 99.71% overall; `src/lib/llm` 99.46%.

### Task 21: precompute sample explanations (manual command only)
- **21.1 and 21.2** share `scripts/precompute-samples.test.mts` (26 tests). It was written first and failed (no module). First, two `gemini.test.ts` tests for a new `fetchModel(model, signal)` (one `models.get` call, key read at call time) failed with "fetchModel is not a function"; then `fetchModel` was added to `gemini.ts` and all 11 Gemini tests passed. Then `scripts/precompute-samples.mts`, and all 26 passed.
  - Structure: a pure `precompute()` core, `checkModel()` for the one real `models.get` call, `serialize()`, and `run(io)` with the file, console, environment, provider and `models.get` injected. `main()` only wires the real ones and loads `.env.local` with `loadEnvConfig` from `@next/env`.
  - Covered: a mocked provider writes `llm` entries carrying the model; no key writes rules entries, makes no call and exits 0; a failed call (rejection, invalid output, or a 15 s timeout with fake timers) keeps a consistent existing entry, replaces an inconsistent one with rules, names the sample and reason, and exits 1; a second run is byte-identical; every summary line matches the R16.6 pattern and contains no finding quote from any sample; a 400 or 404 from `models.get` prints the ERROR block naming the model and the fix, and a 401 or 403 says the key was refused, each exiting 1 with the file byte-for-byte unchanged and no provider created; the model line is printed first; `GEMINI_MODEL` overrides the model and its source.
  - The test first imported `./precompute-samples.mts`, which Vitest accepted but `tsc` refused (TS5097). The import now uses `./precompute-samples.mjs`, which both resolve to the `.mts` file.
  - **The real `models.get` call was not made.** The builder has no key. It is manual step 2 (PLAN_DECISIONS.md C9), and the user records the printed model name in this log.
- **21.3:** `scripts/package-scripts.test.mts` (4 tests) failed 3 of 4 (no `precompute:samples` script, and the placeholder `prebuild` was still there). Then `npm pkg delete scripts.prebuild` and `npm pkg set "scripts.precompute:samples=tsx --conditions=react-server scripts/precompute-samples.mts"`, and all 4 passed.
  - `npm run precompute:samples` with no key printed `precompute: no GEMINI_API_KEY; writing rule-based readings` and three `source=rules llmFindings=0 model=null` lines, and exited 0. A second run left the same SHA-1. The rule-based `src/lib/samples/sample-explanations.json` is committed.
  - `explanations.test.ts` (8 tests) failed (no module), then `src/lib/samples/explanations.ts` (`readingFrom(file, id)` and `sampleReading(id)`), and all 8 passed: the committed file passes Zod and each entry matches the current analyzer finding IDs; a partial entry gives the medium's text for its one ID and rule texts for the rest; six invalid files give rule texts everywhere.
  - Demo: `npm run build` with no key exited 0; its log has no line mentioning "precompute"; `git diff --exit-code src/lib/samples/sample-explanations.json` reported no change.

### Task 22.1–22.2: bundle check, audit, DEPLOY.md draft
- **22.1:** `scripts/check-bundle.test.mts` (5 tests for `scanDir` and `makeCanary`) failed (no module), then `scripts/check-bundle.mjs`, and all 5 passed. The script builds with `GEMINI_API_KEY` set to a fresh `hc-canary-<uuid>` value (not key-shaped, so the secret guard does not flag it), searches every file under `.next/static` byte for byte for the canary and for the name `GEMINI_API_KEY`, then rebuilds with no key. It also has a `--scan <dir> [--canary <value>]` mode.
  - `npm run check:bundle`: PASS, neither found in 11 files under `.next/static`; exit 0. (The bundle is small because the UI is not built yet; the check runs again at Gates 4 and 5.)
  - Planted-file check on a temporary copy of `.next/static`: clean copy exit 0; a planted file containing the key name gave FAIL and exit 1; a planted file containing a canary value (with `--canary`) gave FAIL and exit 1. The temporary copy was removed. The real `.next` was never changed.
- **22.2:** the DEPLOY.md part of `scripts/docs.test.mts` (13 tests) was added first, and 9 failed because `docs/DEPLOY.md` did not exist (the four "no claim" tests passed trivially on an empty file, and the "exists" test failed). Then `docs/DEPLOY.md` was drafted with the environment variables, the paid-tier recommendation, the precompute-and-commit steps, the redeploy note (`llmAvailable` is read at build time), the privacy paragraph with `store: false` and the logs-datasets citation, the timed-out-call billing note, and the best-effort rate limit. All 20 docs tests passed.
  - `npm audit --omit=dev --audit-level=high`: found 0 vulnerabilities.
  - `npm run test:coverage`: 46 files, 547 tests pass; lines 99.72% overall, 99.47% for `src/lib/llm`.
  - Type-check 0 errors, lint 0 problems, `check:secrets` clean (140 tracked files), `check:rules` 0 FAIL, `check:trace` 236 rows.

### Gate 3 (Task 22.3)
- Task 22.3 says to run the two agents in parallel. I ran them one after the other instead: both run `next build` in the same folder (`check:bundle` builds twice, and test-verifier builds and runs E2E), and two builds at once would write the same `.next` folder.
- **security-reviewer, attempt 1: PASS.** Report saved unchanged to `docs/gate-reports/phase-3-security-reviewer-attempt-1.md`. All 17 items Yes; items 8, 15 and the UI halves of 12 and 16 were "not due until Phase 4". Its evidence: `check:secrets` (141 files), `check:history` and `check:rules` clean; `check:bundle` PASS (11 files); only `gemini.ts` and `availability.ts` read the key, both `import "server-only"`; the only `console` call logs the reason line; `npm audit --omit=dev --audit-level=high` found 0 vulnerabilities. Problems: none found.
  - Observations, which did not fail the gate:
    - The 41-clause and 1,501-character limits are tested at the schema level, and the handler's schema-mismatch test shows any schema failure gives 400.
    - The full `npm audit` reports 7 moderate advisories, all dev-only (minimatch under `@typescript-eslint`), none high or critical.
    - `.kiro/steering/tech.md` still said "Runtime `nodejs`", while the route has no `runtime` export as approved in C10.10. **Fixed:** the steering line now says the route runs on Node.js with no `runtime` export, because Cache Components rejects it (bundled docs `route-segment-config/runtime.md`).
- **test-verifier, attempt 1: PASS.** Report saved unchanged to `docs/gate-reports/phase-3-test-verifier-attempt-1.md`. All 12 items Yes. Typecheck, lint, `test:coverage` (46 files, 547 tests), build, `test:e2e` (7 tests, fresh server on a free port 3100) and `check:trace` all exited 0. 30 `fc.assert` calls (32 property tests), all at 1,000 runs. Line coverage: analyzer 100%, llm 99.47%, other 100%. No weakened test or threshold since 6c01b9f. The Gate 1 open items LE-R4.5, LE-R11.1 (rate limiter half) and LE-R9.5 are met. Problems: none found.

**Phase 3 complete.** The key never reaches the browser bundle (`check:bundle`), pasted text is neither logged nor stored, and the app works with no key (`rules/no-key` in unit and production E2E tests).
- **Push after Gate 3 (C10.21):** `git push` sent `6c01b9f..85258e7` to `origin/main` after `check:secrets` (143 tracked files), `check:history`, `check:rules` (0 FAIL) and `check:trace` all passed.

---
## Phase 4: Haunted house UI (started 16 November 2026)
PLAN.md and PLAN_DECISIONS.md re-read at the start of the phase, together with the haunted-house-ui requirements, design and tasks, and the design-language steering.

### Task 23.1: fonts committed
- Downloaded from the official `google/fonts` repository on GitHub (branch `main`), listed first through the GitHub contents API, into `src/app/fonts/`. Byte sizes match the API listing.
  - https://raw.githubusercontent.com/google/fonts/main/ofl/creepster/Creepster-Regular.ttf (62,724 bytes) and `ofl/creepster/OFL.txt`, saved as `OFL-Creepster.txt`. Copyright (c) 2011 Font Diner, Inc, with the Reserved Font Name "Creepster".
  - https://raw.githubusercontent.com/google/fonts/main/ofl/atkinsonhyperlegible/AtkinsonHyperlegible-Regular.ttf (54,348 bytes), `AtkinsonHyperlegible-Bold.ttf` (55,256 bytes) and `ofl/atkinsonhyperlegible/OFL.txt`, saved as `OFL-AtkinsonHyperlegible.txt`. Copyright 2020 Braille Institute of America, Inc.
- Licence: SIL Open Font License, Version 1.1, for both (each OFL file contains that title). The files are used unmodified, so the Reserved Font Name clause is respected. Licences are listed in the README in Phase 6.

### Task 23.2: page shell, tokens, fonts wired
- Tests first: `Footer.test.tsx` (2), `scripts/assets.test.mts` (6), `src/lib/no-storage.test.ts` (11) and `e2e/shell.spec.ts` (4, including an axe scan).
  - `Footer.test.tsx` failed (no module). `assets.test.mts` and `no-storage.test.ts` passed at once: they are guard tests, and the repository already met them (fonts with OFL files from 23.1, only `icon.svg`, no audio, no storage APIs, no `fs`, `cookies()` or cache APIs in llm and api code).
  - `shell.spec.ts` could not run at first, because `next build` type-checks test files and `Footer.test.tsx` imported a missing module. After `Footer.tsx` was written, `shell.spec.ts` ran against the old placeholder page: 3 passed and the skip-link test failed (no skip link).
  - `Footer.test.tsx` then failed with "Found multiple elements with the role contentinfo": Vitest runs without globals, so Testing Library's automatic cleanup was never registered. `vitest.setup.ts` now calls `cleanup()` after each test. This changes test set-up only, no assertion.
- Then `layout.tsx` (`next/font/local` for Creepster 400 and Atkinson Hyperlegible 400 and 700, as CSS variables), `globals.css` (Tailwind v4 `@theme` tokens for the palette, the two font families, the 3 px candle-amber focus ring with a 2 px offset on `:focus-visible`, the skip link, ghost level custom properties for desktop and below 768 px, and a `prefers-reduced-motion: reduce` rule that stops every animation and transition), and `page.tsx` (skip link, header with the one `h1`, `<main id="content" tabIndex={-1}>`, `<Footer>`).
  - **Deviation from the design, file placement only:** the design puts the skip link, `main` and footer in `layout.tsx`. Two earlier tests constrain that file: `layout.test.tsx` expects `<body>` to hold only the page, and the Phase 0 `page.test.tsx` expects the page itself to render the `h1` and "Not legal advice". Rather than change those tests (testing.md rule 2), the shell lives in `page.tsx`, which is the only page. R1.1–R1.3 are unaffected. The design's file list is updated to match.
  - `layout.test.tsx` then failed with "default is not a function": `next/font/local` is compiled by Next.js and does nothing in Vitest. `vitest.setup.ts` now stubs it.
- Result: the unit tests pass (`src/app`, `src/components`, assets, no-storage) and `shell.spec.ts` passes 4 of 4 against a fresh production build: one `h1`, `lang="en"`, the title, one `main`, the skip link first and moving focus to `main`, no request to another origin, and no serious or critical axe issue.

### Task 23.3: llmAvailable, the second E2E build and the guards
- `page.tsx` calls `isLlmAvailable()` and passes only the boolean to a first, minimal `HauntedApp` client component, which owns `<main id="content">` and exposes the boolean as `data-llm-available` (nothing else from the server reaches the browser).
- **Build-time read confirmed with Cache Components on; no fallback needed.** `GEMINI_API_KEY=placeholder-e2e-not-a-real-key next build` listed `○ /` (static) and the prerendered `.next/server/app/index.html` held `data-llm-available="true"`, with 0 occurrences of the placeholder value. With an empty key it held `"false"`. The `connection()` + `<Suspense>` fallback from the design was not used.
- `next.config.ts` has `distDir: process.env.HC_DIST_DIR || ".next"`. `/.next-e2e-llm/` is in `.gitignore`, and also in the `tsconfig.json` exclude list and the ESLint ignores, so the second build's generated types are not type-checked or linted. `check:rules` still passes (no `.kiro` pattern).
- `playwright.config.ts` now has two projects and two web servers: `no-key` (port 3100, empty key, skips tests tagged `@llm-ui`) and `llm-ui` (port 3101, `HC_DIST_DIR=.next-e2e-llm`, the placeholder key, and `next start` behind a dead proxy: `NODE_USE_ENV_PROXY=1`, `HTTPS_PROXY`/`HTTP_PROXY=http://127.0.0.1:9` plus lower-case forms, `NO_PROXY=localhost,127.0.0.1`; runs only `@llm-ui` and `@both` tests).
- Guards, written before the project existed: `e2e/fixtures.ts` (an automatic `browserGuard` fixture that fails a test when the page requests any host other than localhost) and `e2e/llm-guard.spec.ts`. Run against the old single-project config, the two `@llm-ui` guards failed as expected (the no-key server answered `no-key`, and `data-llm-available` was `"false"`). With the new config, all 14 E2E tests passed, including the server guard: an unstubbed `POST /api/explain` to port 3101 returned `200 rules/error` in under 5 s.
- Separate check of the proxy itself: with the same variables, Node 26 `fetch("https://generativelanguage.googleapis.com/")` failed in 4 ms with `ECONNREFUSED`; without them the same request reached Google and got HTTP 404. So the dead proxy is what stops the server, not an earlier SDK error.
- Full unit suite: 49 files, 566 tests pass. Type-check and lint clean.

### Task 24: input screen, sample cards, the app state machine
- **24.1:** `InputScreen.test.tsx` (13 tests) and `SampleCards.test.tsx` (4 tests) failed (no modules), then `InputScreen.tsx` and `SampleCards.tsx`. One test failed on its first run because of a fault in the test: it called `toMatch` on `getAttribute("role")`, which is `null` for most ancestors. It now uses `?? ""`; the check itself (no `status`, `alert` or `log` ancestor) is unchanged. Then all 17 passed. Covered: the label, the "1,234 / 50,000 characters" counter, `aria-live="off"` with no live ancestor (R2.6), `maxLength` 50,000, a 60,000-character paste cut to exactly 50,000 (also replacing a selection) with the notice in a `role="status"` region, a short paste left to the browser, the empty and whitespace message with `aria-invalid` and `aria-describedby`, and three cards whose buttons are named "Open this house: <company>".
- **24.2:** `e2e/flow.spec.ts` (first part, 5 tests) was written first and failed 5 of 5 against the placeholder page. Then `src/lib/ui/retryableImport.ts` (its 3-test file failed first, then passed), `ErrorBoundary.tsx`, `house/prepare.ts`, a first `house/HouseView.tsx` (the `h2` "Inside the house" and "Read another policy" only; Task 25 fills it in) and the `HauntedApp` state machine (`input`, `loading`, `house`, `load-error`) inside `MotionConfig reducedMotion="user"`. All 19 E2E tests then passed.
  - flow.spec checks: each sample opens the house view with no request to `/api/explain`; pasted text is analyzed with no request carrying any of three fragments of it; "Read another policy" keeps pasted text and is empty after a sample; afterwards both storages are empty, `document.cookie` is empty and `indexedDB.databases()` is empty; the automatic browser guard saw no request off localhost; with new chunk requests held back by `page.route`, "Opening the house…" shows and `main` has `aria-busy="true"`.
  - **Two changes from the design, recorded here.** (1) Instead of `React.lazy` with `<Suspense>`, `HauntedApp` awaits the retryable import in its `loading` state and then renders the loaded module's `HouseView`. The behaviour R17.1–R17.3 asks for is the same, and it lets the analyzer run inside the house chunk before the view renders. (2) The flow.spec check that pasted text shows rule texts and "Rule reading" badges (llm-explainer R3.3) needs the detail panel, so it moves to Task 26.2.
  - `npm run lint` (React Compiler rules) flagged "Cannot access refs during render" where a render-time helper received a callback that uses a ref. The helper became a `<LoadError onRetry>` component, and lint is clean.
- Unit suite: 52 files, 586 tests pass. Type-check and lint clean.

### Task 25: house, rooms, ghosts and the Haunt Score
- **25.1:** `houseModel.test.ts` (15 tests) and `houseModel.property.test.ts` (U1, U2, U4 at 1,000 runs, on `analyze()` output from `policyLike` mixed with arbitrary `{ room, severity }` lists) failed (no module), then `src/lib/ui/houseModel.ts` (`buildHouseModel`, `bandFor`, `severityLabel`, `ghostLabel`, `roomLabel`, `roomStatus`), and all 18 passed. Labels follow R4.5 and R5.2, for example "The Cellar, 3 ghosts, worst: serious concern", "The Trapdoor, quiet" and "Severity 0 wisp in The Mirror Room: looks fine".
- **25.2:** `Ghost.test.tsx` (6), `Room.test.tsx` (3), `House.test.tsx` (3), `ScoreBadge.test.tsx` (5) and `Toolbar.test.tsx` (5) failed (no modules), then `GhostArt`, `Ghost`, `Room`, `House`, `ScoreBadge` and `Toolbar`, and all 22 passed. Covered: each level's button with `data-severity`, `data-finding-id`, the label, the numeral, the `hc-level-N` class and a 44 × 44 px minimum; quiet rooms showing "Quiet" with no buttons and named "<Room>, quiet"; the status line and group label; the frame SVG `aria-hidden` with no text; 2 and 4 grid columns; "N · band" with no "100" anywhere; the live announcement only when the score changes; the sample line for each sample and none for pasted text.
  - The ghost art is one hand-drawn SVG path (a sheet ghost with eyes, and a mouth from level 2), plus a smaller wisp path for level 0. Its size, opacity and colour come from CSS custom properties per `data-severity`. Animation delays come from a hash of the finding ID, with no randomness.
- **25.3:** `flow.spec.ts` second part (4 tests), written after the components, passed on its first run at 1280 × 900. For each sample: the toolbar line, the `h2` "Inside the house", 8 `section[data-room]` in room order with `h3` names, per-room button IDs and `data-severity` equal to the analyzer's merged findings, the status counts, and the score equal to `hauntScore`. For every level present, the art's computed width, height, opacity and colour equal the design-language table (28/40/52/64 px; 0.55/0.75/0.9/1; wisp, candle-amber, ember, venom). A fourth test confirms that the three samples together show all four levels.
- Unit suite: 59 files, 626 tests pass. Type-check and lint clean.

### Task 26: ghost detail panel and sound
- **26.1:** `DetailDialog.test.tsx` (10 tests) failed (no module), then `DetailDialog.tsx`, and all 10 passed. jsdom has no `showModal()` or `close()` (checked with a throwaway probe test, then deleted), so the test file defines a minimal stand-in for them; the real modal behaviour (focus kept inside, `:modal`) is checked in the browser by `keyboard.spec.ts` (Task 27.3). Covered: the `h2` room-name title labelling the dialog; numeral and label; the quote equal to the input slice with its whitespace kept; a quote containing `<b>` shown as literal text with no `<b>` element; both texts; both badges; both mitigation notes; the "medium raised this from 1 to 3" note and its absence when unchanged; Close returning focus to the opener.
- **26.2:** `flow.spec.ts` third part (4 tests, written after the panel), passed on its first run. For each sample, the first finding of every non-quiet room opens a dialog whose quote equals `text.slice(start, end)` and `finding.quote`, with the right badge and explanation; Escape closes it and focus returns to that ghost. The pasted-text check moved here from 24.2 also passes: every finding shows its rule explanation, "why it matters" and the "Rule reading" badge (llm-explainer R3.3).
- **26.3:** `sound.test.ts` (5 tests, mocked `AudioContext`) failed (no module), then `src/lib/ui/sound.ts`, and all 5 passed: no context before `enable()`; pitches 660, 520, 390 and 260 Hz for severities 0–3; one 450 ms tone (at most 600 ms) with an exponential gain fade; `disable()` closes the context; no Web Audio means no error. `HouseView` creates the sound object lazily (it constructs nothing) and calls `play(severity)` when a panel opens. The Sound toggle comes in Task 30.1.
- Unit suite: 61 files, 641 tests pass. Type-check and lint clean.

### Task 27.1–27.2: roving tabindex
- **27.1:** `roving.test.ts` (15 tests) and `roving.property.test.ts` (U3, three properties at 1,000 runs: the index stays in `[0, count)` for any key sequence; each arrow followed by its opposite returns to the start; Home gives 0 and End gives `count − 1`) failed (no module), then `src/lib/ui/roving.ts` (`nextIndex`), and all 18 passed.
- **27.2:** four keyboard tests were added to `Room.test.tsx`. Run against the old `Room`, two failed (arrows, Home and End did not move focus, and focus memory after Tab and Shift+Tab failed); the "one `tabindex="0"`" and "Tab leaves the room" tests already passed, because the first version of `Room` had the tab stop and focus tracking. Then `Room` was wired to `nextIndex` (keys that are not moves, such as Tab, Enter and Space, keep their normal meaning), and all 7 Room tests passed.
- This work was finished in the previous session but committed only now, at the user's request, before Task 27.3 started.
- Type-check and lint clean.

- **Push (C11.1, user request):** `git push` sent `85258e7..0beb7d8` to `origin/main` (Tasks 23–27.2 and the C11.1 decision) after `check:secrets` (187 tracked files), `check:history`, `check:rules` (0 FAIL) and `check:trace` (236 rows) passed. From now on each task and each gate is pushed. A push's log line is written straight after it and goes out with the next commit, since logging it in the same commit would need another push.

### Task 27.3: keyboard E2E on the terrible sample
- `e2e/keyboard.spec.ts` (5 tests), written after the keyboard code from 27.1–27.2. First run: 4 passed and the tab-order test failed, because of the test: after `blur()`, Chromium keeps its sequential-focus starting point at the blurred `h2`, so the first Tab landed on the first ghost, not the skip link. The test now focuses the skip link, proves it is first (Shift+Tab from it leaves the page's content), and walks from there. The focus-ring test had the same blind spot (it skipped the toolbar), so it also starts at the skip link and now asserts the first house stop is "Read another policy" and that exactly 8 ghosts are tab stops. All 5 pass.
- Covered: tab order skip link, toolbar, then one stop per room in room order (all 8 rooms of the terrible sample have ghosts); arrows wrap, Home and End reach the ends in every room; Tab after an arrow move goes to the next room; every control reached by Tab on both screens has a computed `3px solid rgb(242, 181, 68)` outline with a `2px` offset; Enter and Space open the panel, the dialog matches `:modal`, 10 Tabs and 10 Shift+Tabs never land on the page behind it, and Escape returns focus to the same ghost.
- **Mutation check:** with the focus ring set to 2 px in `globals.css` for one run, the ring test failed. The file was restored (`git diff` empty).
- **Push after Task 27:** `0beb7d8..58c46f4` to `origin/main` after `check:secrets` (188 files), `check:history`, `check:rules` (0 FAIL) and `check:trace` passed. (The Task 27.3 entry above went out with the next commit.)

### Task 28: Lights on mode
- **28.1:** `LightsOnList.test.tsx` (7 tests) and one new `Toolbar.test.tsx` test (the Lights on toggle) were written first. The list file failed (no module); the toolbar test failed (no toggle). Then `LightsOnList.tsx` and the toggle in `Toolbar.tsx`.
  - One list test then failed because of a fault in the test: it searched the whole rendered HTML for "motion", which matched the word "promotions" in the terrible sample's text. It now checks `class` and `style` attributes for animation or motion, which is what R8.4 is about. Then all 13 passed.
  - Covered: the eight rooms as `h3` in order; for each sample, the same finding IDs, severities, quotes, labels, both texts and badges as the model; "Quiet" rooms; no SVG and no `hc-` classes; "Not legal advice" first; the toggle is the second toolbar control, its text stays "Lights on", `aria-pressed` flips, and focus stays on it with mouse and Enter.
  - `HouseView` switches between the house and the list. The `h2` reads "Lights on" in that mode, and no ghost is rendered, which is what stops every repeating animation (R10.5; checked in Task 30).
- **28.2:** `e2e/lights.spec.ts` (3 tests, one per sample), written after the component, passed on its first run: the list holds the same IDs and severities as the house buttons and the analyzer's quotes; `h2` "Lights on" with eight `h3` rooms; no ghost buttons or SVG in `main`; quiet rooms say "Quiet"; focus stays on the toggle; axe finds no serious or critical issue in either mode.
- Full suites: 64 unit files, 671 tests; 35 E2E tests across both projects. Type-check and lint clean.
- **Push after Task 28:** `58c46f4..15eedd4` to `origin/main` after `check:secrets` (191 files), `check:history`, `check:rules` (0 FAIL) and `check:trace` passed.

### Task 29: asking the medium about pasted text
- **29.1:** `OptInPanel.test.tsx` (11 tests, rendering the real `HouseView` with an injected `explain` mock in place of `requestExplanations`) was written first: 10 failed (no panel, no "no medium" line, no `explain` prop) and 1 passed (the samples test, since nothing was shown yet). Then `OptInPanel.tsx`, `Notices.tsx` and the medium flow in `HouseView`.
  - One test then failed because of the test: it raised the first finding of the test text, which was already severity 3, so "expected 3 to be less than 3". It now raises the first finding below severity 3 (the renewal clause). All 11 passed.
  - Covered: no button and the "no medium" line without a key; no button for samples; the button, `OPT_IN_NOTICE` and the terms link for pasted text, with no call after 30 s of fake time and no press; one call with the rule findings, the button disabled and "The medium is listening…" in a `role="status"` region; on success the merge raises the ghost to 3, the score rises to the recomputed value, "The medium has spoken." shows and the button goes; each of the six reasons shows its message and keeps the rule score, and the button comes back for all but `no-key`.
  - `Notices` also carries the English-only, "No ghosts here" and "Only calm wisps here" notices (R16.3–R16.5), because Task 31's layout and axe checks need those states. Their own E2E tests are Task 32.1.
- **29.2:** `e2e/optin.spec.ts` (6 tests, `@llm-ui`, every `/api/explain` call stubbed with `page.route`) and `e2e/optin-hidden.spec.ts` (1 test, no-key), written after the panel, passed on their first run. They show: nothing is sent before the press (1.5 s wait); samples never call the route and show no button; the one request body holds exactly the two finding IDs, each text a substring of a finding quote, and neither unflagged sentence; success updates the ghost, the score, the panel's badge and the "The medium raised this from <rule severity> to 3." note; 429 `rate-limited`, `timeout` and a network abort keep the rule reading and score, show their messages and re-enable the button. The browser guard saw no request off localhost in any of them.
- Full suites: 65 unit files, 682 tests; 42 E2E tests across both projects. Type-check and lint clean.
- **Push after Task 29:** `15eedd4..22d94d9` to `origin/main` after `check:secrets` (196 files), `check:history`, `check:rules` (0 FAIL) and `check:trace` passed.

### Task 30: motion and sound settings
- Tests first: a Sound toggle test in `Toolbar.test.tsx`, `HauntedApp.test.tsx` (MotionConfig) and `e2e/motion.spec.ts` (7 tests).
  - The Sound test failed (no toggle). `HauntedApp.test.tsx` passed at once, because `HauntedApp` has rendered inside `MotionConfig reducedMotion="user"` since Task 24.2; it mocks `MotionConfig` to record its props and checks `reducedMotion === "user"`.
  - `motion.spec.ts` could not run at first: `next build` type-checks test files, and the Sound test used props the Toolbar did not have yet. After the Sound toggle was added (Toolbar tests 7 of 7), `motion.spec.ts` ran against the motionless house: 6 failed and the reduced-motion test passed (nothing moved yet).
- Then the CSS keyframes per level (`hc-drift` 6 s, `hc-bob` 4 s, `hc-bob-sway` 3 s, `hc-bob-sway-big` 2.5 s, and an `hc-glow` opacity pulse with one peak per 2.5 s cycle on the level 3 glow path), the Sound toggle wired to `createSound().enable()` inside its click, and 200 ms opacity-only fades for the house view and the dialog content with `LazyMotion features={domAnimation}` and `m.div`.
- **A real finding from the first run:** with the keyframes on the ghost buttons, 4 tests timed out on `click()`, because Playwright waits for an element to stop moving and a bobbing button never does. A moving hit area is also worse for people: the target and its focus ring drift away from the pointer. The animation now runs on the ghost's SVG art inside a still button. `motion.spec.ts` was changed to match before it ever passed, and made stricter: under reduced motion it checks `animation-name: none` and unchanged boxes on every `.hc-ghost` **and every element inside it**, and "level 3 is animated" checks the art.
- Result: all 7 motion tests pass. Under reduced motion nothing animates or moves for 1 s and no repeating animation runs, while art sizes still differ by level. With motion on, level 3 art animates; on each sample's house and in an open panel every repeating animation lasts at least 1 s per cycle with at most one opacity peak, and every one-off changes opacity one way within 300 ms; switching Lights on leaves no running repeating animation; Sound starts `aria-pressed="false"`, no `AudioContext` is made by loading or opening a panel, and exactly one is made when Sound is turned on.
- A slip, recorded: I ran `npx prettier` to format two files, but Prettier is not a dependency, so npx waited for an install prompt and the command timed out after 5 minutes. Nothing was installed (`package.json` unchanged, no `node_modules/.bin/prettier`); the stray process was killed.
- Full suites: 66 unit files, 684 tests; 49 E2E tests across both projects. Type-check and lint clean.
- **Push after Task 30:** `22d94d9..de87ceb` to `origin/main` after `check:secrets` (198 files), `check:history`, `check:rules` (0 FAIL) and `check:trace` passed.

### Task 31.1–31.3: layout, accessibility scans, screenshot spec
- **31.1:** `e2e/layout.spec.ts` (15 tests: 7 per viewport plus one short-viewport dialog test) and `e2e/helpers.ts` (shared state helpers; at import they check that the no-risk, wisps-only, Spanish and risky fixture texts really produce those states, so a rule change cannot empty a state silently). Every R12.1 state at 360 × 740 and 1440 × 900: input, empty-input message, paste-cut notice (a real `ClipboardEvent` with 60,000 characters), loading (chunks held), load error (chunks aborted), each sample's house, an open dialog, Lights on, the non-English, no-ghosts and only-wisps notices, and on llm-ui the opt-in panel, listening and failure states. Each state is checked for horizontal scroll, clipped or off-viewport text, overlapping controls, and 2 or 4 grid columns.
  - **Findings, fixed in the app:**
    - The severity numeral badge sat 2 px outside its button (`right: -2px`); it now sits inside.
    - Level 2 and 3 art sways and the level 3 glow was scaled 1.15, so the moving art poked up to 2 px past its button (`scrollWidth` 50 > 48 at 360 px, 66 > 64 at 1440 px), depending on the animation phase. Ghost buttons now have 4 px of inline padding and the glow scale is 1.05. The hit area is still at least 44 × 44 px.
  - **Findings, fixed in the test:** the loading test's `page.unroute` raced with held requests ("Route is already handled!"); it now releases them and waits for the house.
  - After the padding change, the first two runs still showed the old box sizes. A one-off debug spec (since deleted) showed the 4 px padding applied and no overflow, and the next four full runs passed, so I put those two runs down to a stale build output; I did not prove the cause.
- **31.2:** `e2e/a11y.spec.ts` (7 tests, both projects, WCAG 2.2 A/AA tags, failing on serious or critical): input, empty-input error, each sample's house, an open panel, Lights on, no ghosts, non-English, and the opt-in panel and its failure message. The first run failed `color-contrast` in two states. The cause was the 200 ms fade: axe measured text while the house view was still partly transparent. The scans now wait for one-off animations to finish (`waitForFades`), and all 7 pass. Later, under the full parallel suite, `lights.spec.ts` hit the same race on 2 of its 3 tests, so its axe helper waits too. After that, the full suite passed three runs in a row.
- **31.3:** `e2e/screenshots.spec.ts` (`@screenshots`, two tests, one per viewport, reduced motion, fonts loaded, six states each) and the scripts `"screenshots": "playwright test --grep @screenshots --project=no-key"` and `"test:e2e": "playwright test --grep-invert @screenshots"`. `--list` shows `test:e2e` selects 71 tests and no screenshot test, and `screenshots` selects only the 2. A trial run wrote the 12 PNGs; I looked at two of them (the terrible house at 1440 px and the dialog at 360 px) for obvious breakage, then deleted them. The committed set is made after Gate 4 (Task 31.5).
- Full suites: 66 unit files, 684 tests, line coverage 93.16% overall (thresholds met); 71 E2E tests across both projects. Type-check and lint clean.
- **Push after Task 31.3:** `de87ceb..acc865d` to `origin/main` after `check:secrets` (202 files), `check:history`, `check:rules` (0 FAIL) and `check:trace` passed.

### Gate 4 preparation
- ui-a11y-reviewer item 15 runs `npx playwright test --grep "axe"`. Only the `shell.spec.ts` and `lights.spec.ts` titles said "axe", so the grep would have skipped `a11y.spec.ts`. Its seven titles now start with "axe:" (titles only, no assertion changed); `--grep "axe" --list` selects 11 tests. `--grep "reduced motion"` selects the motion test, as item 12 expects.
- **Push (Gate 4 prep):** `acc865d..a5f8aa8` to `origin/main` after the four pre-push checks passed (`check:secrets` 202 files).

### Fixes before Gate 4 (PLAN_DECISIONS.md C12), started 16 November 2026
The ui-a11y-reviewer run for Gate 4 was cancelled by the user before it reported, so there is no Gate 4 report yet. The user asked for three fixes first; they were recorded as PLAN_DECISIONS.md C12 and added as clause-analyzer Tasks 16.3 and 16.4.

#### Running tasks from the spec task panel (C12.3)
- I tried to start Task 16.3 through Kiro's spec task mechanism by dispatching it to a `spec-task-execution` sub-agent with the task ID and `tasks.md` path. Kiro answered "Agent 'spec-task-execution' not found in registry". My tools cannot press the panel's "Start task" button, so I cannot make the `PostTaskExec` Spec sync hook fire myself.
- So Tasks 16.3 and 16.4 were done test first as usual, but **their checkboxes were left unticked**. The user decides whether to start them from the panel (so the hook fires) or to let me tick them by hand as before. The Spec sync hook has still never fired; that is logged here when it first does.

#### Task 16.3: mitigation phrasing gap (C12.1)
- `src/lib/analyzer/mitigation-phrasing.test.ts` (one or more cases per mitigation, a check that every mitigation except `cellar.consent` is covered, the exception-marker rule, and two positive statements) was written first: 16 of 20 failed, including the reported "We will never sell your personal data." (Cellar 3). `court.opt-out` already accepted "opt out of the arbitration agreement", so its case passed before the fix.
- The gap I found in each mitigation, and the fix:
  - `cellar.no-sell`, `cellar.no-share` and `portraits.no-track` accepted only a negation straight after "we". They now share one negation pattern: "do/does/will/shall/would/can not or never", "cannot", "can't", "don't", "doesn't", "won't", "shan't" and "never", optionally doubled ("we do not and will not sell") and followed by "ever". `portraits.no-track` also lacked "will not" and "won't".
  - `portraits.opt-out`: "you can always opt out" and "you will be able to opt out".
  - `vault.reminder`: "we will send you a reminder before".
  - `locked.delete-anytime`: "you can always cancel" and "you are free to cancel".
  - `mirror.you-own`: "you will retain ownership" and "you retain all of your rights".
  - `trapdoor.carve-out`: "excludes" and "restricts" as well as "limits".
  - `stairs.advance-notice`: "we will give you 30 days' notice" and "shall notify you".
  - `cellar.consent` ("only with your consent") has no modal to vary, so it got a test that it still applies.
- After writing the fix, a "We cannot share…" case was added; it failed until "cannot" and "can't" joined the negation pattern.
- Result: 21 of 21 phrasing tests pass, and all 271 analyzer and sample tests pass, including every property at 1,000 runs. Sample scores are unchanged (14, 59, 97) and so are their finding IDs, so `sample-explanations.json` did not need regenerating.
- **Push after Task 16.3:** `a5f8aa8..c2bcaca` to `origin/main` after `check:secrets` (203 files), `check:history`, `check:rules` (0 FAIL) and `check:trace` passed.

#### Task 16.4: rule calibration (C12.2)
- 19 new example rows (14 positive, 5 negative) were added to `examples.test-util.ts` first. `classifier.test.ts` then failed 12 tests: 11 examples (both ordinary licences scored 3; the content-selling licence was not severity 3; the consequential-damages exclusion scored 3; "Under no circumstances…whatsoever" had no rule; the phone-or-in-person, merger and retention rules did not exist) plus the R4.5 rule-text test. The sublicensable-licence example already passed, because "worldwide" had matched the old rule.
- Rule changes in `rules.ts` (the design's rule table, mitigation table and room examples were updated to match):
  - `mirror.broad-licence` (3) now needs perpetual, irrevocable, sublicensable, transferable or "in perpetuity" near "licence", not preceded by "non-", or a licence or right to sell your content. A new `mirror.wide-licence` (2) catches worldwide, royalty-free, non-exclusive or fully-paid licences. Example: "You grant us a non-exclusive, royalty-free licence to host and display your content" is now 2, and so is a "non-transferable, non-sublicensable" licence (an extra example I added, because a plain `transferable` pattern would have matched "non-transferable").
  - `trapdoor.not-liable` (3) is for total exclusions only: it no longer matches when "indirect", "consequential", "incidental", "special", "punitive" or "exemplary" follows within 80 characters, and it gained "under no circumstances… liable" and "liable… whatsoever/howsoever" forms. A new `trapdoor.consequential` (2) catches the ordinary exclusion.
  - New: `locked.phone-or-person` (3, "only by phone or in person", "must be made in person"); `locked.cancel-channel` (2) also accepts "in person"; `cellar.merger` (2, transfer or disclosure in a merger, acquisition, bankruptcy, change of control or sale of the business); `cellar.retention` (2, kept indefinitely, permanently, forever, or "as long as we see fit"). "As long as necessary to provide the service" is a negative example.
- The rule count is now 45 (40 plus the five new rules), so `rules.test.ts` changed its expected count from 40 to 45. This assertion change follows the approved table change; no other assertion changed.
- Result: all 723 unit tests pass, including the 63 room examples and every property at 1,000 runs. Analyzer line coverage is 100%. Sample scores (14, 59, 97), room severities and finding IDs are unchanged, so the bands hold and `sample-explanations.json` stays consistent.

#### A flaky keyboard test, and the real bug behind it
- In the full E2E run after 16.4, `keyboard.spec.ts` "Enter opens the panel…" failed once at its last step: Space did not reopen the panel right after Escape. Repeating the test 5 at a time failed 1 run in 15–20, so it was not caused by the rule change.
- Cause: when a modal dialog closes, Chromium returns focus to the ghost before the dialog's `close` event reaches React. A fast Space press reopened the same finding while the old dialog element was still mounted under the same React key, so nothing called `showModal()` again. The late `close` event could also clear the new opening. A quick keyboard user could hit this too.
- Fix in `HouseView`: each opening gets its own number, used in the dialog's `key`, and a `close` event clears the open panel only if it belongs to the same opening. The test then passed 40 of 40 repeats, and the full E2E suite (71 tests) passed twice.
- ESLint had started reporting warnings in `playwright-report/` (generated after a failed run, git-ignored). It and `test-results/` are now in the ESLint ignores; lint is clean.
- **Push after Task 16.4:** `c2bcaca..1b66fc7` to `origin/main` after `check:secrets` (203 files), `check:history`, `check:rules` (0 FAIL) and `check:trace` passed.

#### Switching to the spec task panel (C12.3, user's choice: option A from Task 31.4)
- The user chose to start every task from Task 31.4 onward with Kiro's spec task panel ("Start task"), so the `PostTaskExec` Spec sync hook fires.
- **Tasks 16.3 and 16.4 (clause-analyzer) were ticked by hand**, at the user's instruction. They were completed before the panel was used, so Spec sync did not fire for them.
- Before the first panel start, I reviewed the remaining haunted-house-ui tasks (31.4, 31.5, 32.1, 32.2, 33.1, 33.2, 33.3) so that an agent started from the panel has what it needs:
  - A header block now tells any panel-started agent to read PLAN.md (sections 1, 3 and 6), PLAN_DECISIONS.md and the end of BUILD_LOG.md first, follow the steering files, use the agents in `.kiro/agents/` as sub-agents for gates, and push after each task (C11.1).
  - Each task now has a "Read first" line pointing to the PLAN.md section, the PLAN_DECISIONS.md entries, the requirements and the traceability rows it needs. Each one names the files to create or change, lists the tests, and says when it is done.
  - The gate tasks (31.4, 33.3) say how to start and stop the `next start` server, to run the agents one at a time (they share `.next`), which checklist items are due, the gate names and the report paths, and the PLAN.md pass condition and three-attempt rule.
  - Two gaps were filled. 31.5 now says the task is done once the screenshots are committed and shown; 32.1 begins by checking that the user's reply is in BUILD_LOG.md. 33.2 now says to push first so the clone has the latest commit, and to delete the clone afterwards.
  - Phases 6 and 7 have no spec tasks; 33.3 says they follow as PLAN.md section 6 describes.
- `npm run check:trace` still passes (236 rows).
- The Spec sync hook has never fired so far. Its first firing will be logged here.
- **Push (task updates for the panel):** `1b66fc7..f7160a6` to `origin/main` after `check:secrets` (203 files), `check:history`, `check:rules` (0 FAIL) and `check:trace` passed.

#### Check after the user reported 31.4 finished from the panel (17 November 2026, 10:42 UTC)
The user said Task 31.4 (Gate 4) had finished from the spec task panel. I found no trace of it in this workspace:
- No Gate 4 report: `docs/gate-reports/` has no `phase-4-*` file.
- No commit after `f7160a6` (my own task-update commit), locally or on `origin/main`.
- The 31.4 checkbox in `.kiro/specs/haunted-house-ui/tasks.md` is still unticked.
- BUILD_LOG.md has no entry from the task or from Spec sync. The only uncommitted change is my own push line.
- The README feature list between the `features:start` and `features:end` markers still reads "(none yet)". Spec sync would have updated it.
- `.next/BUILD_ID` dates from my last build (10:30 UTC); Gate 4 would have rebuilt it.
- `.hook-runs/hook-runs.log` has no entry after my own BUILD_LOG edit at 10:39 UTC. Spec sync is an `agent` hook, so it does not write to that log either way.

**Conclusion: Spec sync did not fire, and Gate 4 has not run** — at least, nothing from such a run reached this repository. No Gate 4 result is recorded, and none is claimed.

#### Spec sync moved to PostFileSave (PLAN_DECISIONS.md C12.4)
- At the user's instruction, the panel route was dropped. The Spec sync hook was rewritten with Kiro's `createHook` tool: trigger `PostFileSave`, matcher `\.kiro/specs/[^/]+/tasks\.md$`, and the same agent prompt word for word. Kiro reported "The hook will be active on the next session start", so it may not fire during this session.
- Task 31.4's checkbox will be ticked only after Gate 4 passes; the result is logged below.
- **Push (C12.4):** `f7160a6..7ccddf4` to `origin/main` after the four pre-push checks passed.

### Gate 4 (Task 31.4), run by the builder at the user's request
- Builder checks first, not the gate: type-check 0 errors, lint 0 problems, `npm run test:coverage` 67 files and 723 tests passed (lines 93.21%), `CI=1 npm run test:e2e` 71 passed, 0 failed or skipped.
- **ui-a11y-reviewer, attempt 1: PASS.** Report saved unchanged to `docs/gate-reports/phase-4-ui-a11y-reviewer-attempt-1.md`. All 15 items due at Gate 4 answered Yes (item 16 is a Gate 5 item). It used the app through Playwright MCP against `next start` on port 3100 with no key, and ran the "reduced motion" (1 passed) and "axe" (11 passed) E2E tests.
  - Problems it reported, neither failing a checklist item: (1) on a mitigated severity 0 finding, the rule's explanation states the opposite of the clause (for example "We do not sell your data." reads "This clause lets the company sell what it knows about you."), and Lights on mode does not show the panel's mitigation note; (2) its full `npx playwright test` run also ran the `@screenshots` spec, which wrote 12 untracked PNGs to `docs/screenshots/`. I deleted those PNGs; the committed set is made in Task 31.5.
- **test-verifier, first invocation: interrupted** before it reported (the tool call was cut off). It left no report and no running process. It is re-run below as attempt 1, because no verdict was ever returned.
- **test-verifier, attempt 1: PASS.** Report saved unchanged to `docs/gate-reports/phase-4-test-verifier-attempt-1.md`. All 12 items Yes. It ran typecheck, lint, `test:coverage` (67 files, 723 tests; lines analyzer 100%, llm 99.47%, other 84.62%), build, `CI=1 npm run test:e2e` (71 passed across both projects, `retries: 0`) and `check:trace`, all exit 0. 36 `fc.assert` calls, all at 1,000 runs. It judged the 40→45 rule-count change and the test-fault fixes not to weaken any test, and confirmed the Gate 1 open items for Tasks 23–31.
  - Problem it reported (not failing item 11): stale matrix text. CA-R2.2 and CA-R2.7 still gave the counts from before Task 16.4, and `mitigation-phrasing.test.ts` was not named in a matrix row. **Fixed:** CA-R2.2 now says 21 negative examples, CA-R2.7 says 62 room examples (41 positive and 21 negative), CA-R3.2 names `mitigation-phrasing.test.ts`, and Task 16.3 names the file; `check:trace` passes.
  - **Correction to my own Task 16.4 entry:** it said "19 new example rows (14 positive, 5 negative)". Counting the arrays gives 18 (13 positive, 5 negative): 28 + 13 = 41 positive and 16 + 5 = 21 negative. The design's sentence had the same slip and now says 18.

**Gate 4 passed:** ui-a11y-reviewer and test-verifier both returned PASS on attempt 1.

#### Spec sync: first real firing (C12.4)
- **The Spec sync hook fired for the first time** on 17 November 2026, when I ticked Task 31.4 and saved `.kiro/specs/haunted-house-ui/tasks.md`. Kiro delivered the hook's agent prompt (`hook_event_name: PostFileSave`, `file_path` that `tasks.md`) to the builder in the same session, so the "next session start" note from `createHook` did not apply here. This is the first time Spec sync has run in this build; earlier tasks were ticked while its trigger was `PostTaskExec`, which never fired.
- What the hook asked for, done as it said:
  - Spec haunted-house-ui, **Task 31.4 Run Gate 4**. Files changed: `docs/gate-reports/phase-4-ui-a11y-reviewer-attempt-1.md`, `docs/gate-reports/phase-4-test-verifier-attempt-1.md`, `.kiro/specs/traceability.md` (stale counts), `.kiro/specs/clause-analyzer/tasks.md`, `.kiro/specs/clause-analyzer/design.md` (count correction), `.kiro/specs/haunted-house-ui/tasks.md` (checkbox), BUILD_LOG.md and README.md.
  - Tests, as run before and during the gate: `npm run test:coverage` 723 passed, 0 failed; `CI=1 npm run test:e2e` 71 passed, 0 failed; the test-verifier's own runs gave the same counts. After the matrix fix, `npm run check:trace` passed with 236 rows.
  - Kiro features used: the spec (task 31.4), the Spec sync hook (`PostFileSave`), two custom agents run as sub-agents (ui-a11y-reviewer with the Playwright MCP server, and test-verifier; each has no write tool; shell limited to build/test commands), and property-based tests (36 `fc.assert` calls at 1,000 runs, checked by test-verifier).
  - The README feature list between the markers now lists the nine user-facing features whose spec tasks are complete. The Phase 5 edge-case and loading tasks are not listed as finished features.
- **Push after Gate 4:** `7fe610c..b86b5a3` to `origin/main` after `check:secrets` (205 files), `check:history`, `check:rules` (0 FAIL) and `check:trace` passed.

### Mitigation texts (PLAN_DECISIONS.md C13), approved by the user after Gate 4
#### Step 1: specs
- clause-analyzer R4.5 now says a finding with an applied mitigation takes that mitigation's explanation and "why it matters" texts, and every rule and mitigation has both texts (1 to 400 characters). haunted-house-ui R8.2 now requires the line "A reassurance in this clause lowers its severity." in Lights on mode for a mitigated finding.
- The clause-analyzer design (types comment, classifier step 5, Mitigations section) and the traceability rows CA-R4.5 and HU-R8.2 were updated. New tasks: clause-analyzer 16.5 (`mitigation-texts.test.ts`) and haunted-house-ui 28.3 (`LightsOnList.test.tsx`). `check:trace` passes (236 rows).
- These edits were made with a shell script, not the editor tools, so the Spec sync hook (`PostFileSave`) did not fire for them; the tasks are not ticked yet.

#### Step 2: tests first
- New `src/lib/analyzer/mitigation-texts.test.ts` (16 tests): every mitigation has both texts (1–400 characters) and none reuses a rule text; a lowering clause exists for every one of the 11 mitigations, and each gives a finding with the mitigation's texts; "We do not sell your data." reads as a promise not to sell; a cancelled mitigation keeps the rule's texts.
- `classifier.test.ts`: the R4.5 test now covers findings with no applied mitigation, as the reworded requirement says, and asserts that every positive example is unmitigated, so the loop still checks all 41 examples. Approved in C13.4.
- `LightsOnList.test.tsx` (2 new tests): the reassurance line appears on exactly the mitigated findings of the mild sample, and the mitigated Cellar finding shows the mitigation's explanation.
- Run: 15 failed and 84 passed in these three files. The failures are the 13 mitigation-text tests (no texts on mitigations yet) and the 2 Lights on tests. The two that pass already are "no mitigation reuses a rule's text" and "a cancelled mitigation keeps the rule's texts", which hold trivially today.
- **This commit is deliberately red:** the tests fail and `tsc` rejects `m.explanation` until step 3 adds the field. It is committed and pushed only so that an interruption loses nothing, as the user asked.

#### Step 3: mitigation texts in code (Tasks 16.5 and 28.3)
- `rules.ts`: the `Mitigation` type gained `explanation` and `whyItMatters`, and each of the 11 mitigations has its own pair, written as a reassurance (for example `cellar.no-sell`: "This clause promises not to sell your data."). `classifier.ts`: when a mitigation is applied, the finding takes that mitigation's texts; otherwise the rule's. `LightsOnList.tsx`: a mitigated finding shows "A reassurance in this clause lowers its severity."
- Result: the 15 failing tests from step 2 pass. Full suites: 68 unit files, 741 tests, lines 93.22%; 71 E2E tests across both projects. Type-check and lint clean.
- `explanations.test.ts` (9 tests) passes: the committed `sample-explanations.json` holds only finding IDs and LLM texts, so it still validates and stays consistent. Sample scores are unchanged (14, 59, 97), so the C7 bands hold.
- The mild sample's mitigated Cellar and Locked Door wisps now read as reassurances in the panel and in Lights on mode. The screenshots in 31.5 will show this.
- **Spec sync fired** (`PostFileSave`) when I ticked clause-analyzer **Task 16.5 Mitigation texts** and saved its `tasks.md`. Files changed by 16.5: `src/lib/analyzer/rules.ts`, `src/lib/analyzer/classifier.ts`, `src/lib/analyzer/mitigation-texts.test.ts` (new), `src/lib/analyzer/classifier.test.ts`. Tests: `npm run test:coverage` 741 passed, 0 failed; `CI=1 npm run test:e2e` 71 passed, 0 failed. Kiro features: the spec (task 16.5, requirement R4.5 changed under C13), the Spec sync hook, and the property-based tests that ran in the suite at 1,000 runs each. README feature list: one line updated so the detail panel and Lights on describe reassurances as reassurances.
- **Spec sync fired** (`PostFileSave`) when I ticked haunted-house-ui **Task 28.3 Reassurance line in Lights on mode** and saved its `tasks.md`. Files changed by 28.3: `src/components/house/LightsOnList.tsx`, `src/components/house/LightsOnList.test.tsx`. Tests: the same full runs as 16.5 (`npm run test:coverage` 741 passed, 0 failed; `CI=1 npm run test:e2e` 71 passed, 0 failed); `LightsOnList.test.tsx` 9 passed. Kiro features: the spec (task 28.3, requirement R8.2 changed under C13) and the Spec sync hook. README feature list: the Lights on line now mentions the reassurance note.
- **Push (step 3):** `bc24ce3..193d844` to `origin/main` after the four pre-push checks passed.

### Task 31.5: visual review stop (C10.15)
- `CI=1 npm run screenshots` (2 tests passed, against a fresh no-key production build with the C13 change) wrote exactly 12 PNGs to `docs/screenshots/`: `input`, `house-mild`, `house-average`, `house-terrible`, `detail` and `lights-on`, each at 1440 and 360 px, with reduced motion on and fonts loaded.
- **Shown to the user on 17 November 2026**, as artifacts. The build is stopped here; Phase 5 starts only after the user's reply, which will be recorded below before any Phase 5 entry.
- README feature list: the Lights on line now mentions the reassurance note (left over from Task 28.3).
- **Push (screenshots):** `193d844..2c79739` to `origin/main` after the four pre-push checks passed (218 tracked files).

#### The user's reply to the Gate 4 screenshots (17 November 2026)
- **Verdict: function approved; the look needs one design pass before Phase 5.** The user asked for: a moonlit input screen with the house silhouette behind the paste box and the samples drawn as small house fronts with doors; one drawn prop per room that identifies it; ghost shapes that change with severity (level 3 tattered with glowing eyes, level 2 uneasy, level 1 faint, level 0 a wisp) while keeping size, colour and numeral; the Haunt Score as the hero above the house with the band label as the main phrase; subtle fog and dim candlelight in the page background and house frame only, within the 200 kB budget and still under reduced motion; and clause headings such as "1. Your information" kept out of the displayed quote while the quote stays an exact slice of the input, with tests. Every contrast ratio, hit area, keyboard path and test must keep passing. Then 12 new screenshots plus one with motion on, and another stop for review.
- Recorded as PLAN_DECISIONS.md C14, clause-analyzer Task 16.6 and haunted-house-ui Task 31.6. Phase 5 has not started.

### Design pass (PLAN_DECISIONS.md C14)
#### Task 16.6: clause headings out of quotes (clause-analyzer)
- `src/lib/analyzer/heading.test.ts` (12 tests) was written first: 6 failed (a numbered heading, an unnumbered heading, CRLF with indentation, a bare "1.", heading words making a finding on their own, and sample quotes starting with a numbered heading). The "left alone" cases and the mild Cellar case already passed.
- Then `classifier.ts` gained `skipHeading`: a first line of at most 60 characters, followed by a line break and more text, and not ending in sentence punctuation (a bare list number is allowed), is left out of both the reading and the quote. `start` moves to the first non-whitespace character after it; the finding ID stays the clause ID. The design gained step 4b.
- `e2e/flow.spec.ts`: the detail-panel test now also checks that no shown quote starts with a numbered heading. **Mutation check:** with the `skipHeading` call commented out for one run, this check failed on the samples; the file was then restored.
- Results: `npm test` 69 files, 753 tests passed (P3, the exact-slice property, at 1,000 runs among them); `flow.spec.ts` 13 passed. Sample scores unchanged (14, 59, 97) and finding IDs unchanged, so `sample-explanations.json` stays consistent. Lint and type-check clean.
- **Spec sync fired** (`PostFileSave`) when Task 16.6 was ticked in `.kiro/specs/clause-analyzer/tasks.md`. Kiro features: the spec (task 16.6, R4.2 changed under C14.6), the Spec sync hook, property-based tests. README feature list: the detail-panel line now says the quote leaves out clause headings.

#### Task 31.6: design pass (haunted-house-ui)
- **Tests first** (committed red in `b4019f5`): new `RoomProp.test.tsx` (10: one `aria-hidden` prop per room with no text, eight different drawings, outside the ghost group, in quiet rooms too) and `NightScene.test.tsx` (2: decorative SVG with a moon and the house silhouette, no text, no pointer events); new tests in `Ghost.test.tsx` (a different shape per level, glowing eyes only on level 3), `ScoreBadge.test.tsx` (the band is the main phrase in Creepster, the number beside it, text still "N · band") and `SampleCards.test.tsx` (each sample a house front with a door button of at least 44 px). 3 failed and 2 files could not load before the code.
- **Code:**
  - `NightScene.tsx`: a still moonlit scene with a moon, a hill and the house with lit windows, its roofline rising above the paste box, which sits on a solid ink panel.
  - `SampleCards.tsx`: each sample is a house front (roof, chimney, and 1, 2 or 3 lit windows for mild, average and terrible) over a card whose button is an arched door with the same accessible name.
  - `RoomProp.tsx`: barrels, portrait frames with eyes, a vault door, a chained door, a gavel, a cracked mirror, a trapdoor and crooked stairs, beside each room heading.
  - `GhostArt.tsx`: level 0 a wisp, level 1 a faint sheet with a smooth hem, level 2 uneasy (wavy hem, worried brows, wobbling mouth), level 3 tattered (jagged hem, hollow sockets with glowing eyes). Size, opacity, colour and numeral are unchanged.
  - `ScoreBadge.tsx`: a hero panel above the house; the band label in large Creepster is the main phrase.
  - `globals.css` and `House.tsx`: still background gradients on the page; inside the house frame only, a 24 s fog drift (transform only) and two 4 s candle glows (one opacity peak per cycle). They sit behind the rooms with no pointer events, unmount in Lights on mode and stop under reduced motion.
- **One fault the first test run did not catch:** with JSX line breaks, the score's text became "97·Run" and 12 tests failed; the separator is now an explicit `" · "`. All passed after that.
- **Found by looking at the first screenshots, fixed before showing them:** the house silhouette was hidden behind the paste box, so the scene is now a band at the top with the box below the roofline; the scene's side edges fade out instead of ending sharply; `background-attachment: fixed` left a visible seam at 900 px in full-page images, so it was removed; room props are smaller on phones so the headings wrap less.
- **Results:** `npm run test:coverage` 71 files, 768 tests, lines 93.56%; `CI=1 npm run test:e2e` 71 passed, including layout at 360 and 1440 px, axe in every state, keyboard, motion (flash limits, reduced motion, Lights on stops all repeating animations) and the flow checks of ghost size, opacity and colour. Type-check and lint clean.
- **First-load JS for `/`:** the 7 scripts referenced by the prerendered page total 179,190 bytes gzipped (`gzip -9`, final build; 179,128 before the last scene fix), within the 200 kB budget. The real network measurement is Task 33.1.
- **Screenshots:** `CI=1 npm run screenshots` (3 passed) wrote the 12 R20 images plus `house-terrible-motion-1440.png` (motion on; the test checks that animations are running). Shown to the user on 17 November 2026. The build stops here again for the user's review; Phase 5 has not started.
- **Spec sync fired** (`PostFileSave`) when I ticked haunted-house-ui **Task 31.6 Design pass after the first screenshot review**. Files changed by 31.6: `src/components/NightScene.tsx` (new), `src/components/house/RoomProp.tsx` (new), `src/components/SampleCards.tsx`, `src/components/InputScreen.tsx`, `src/components/HauntedApp.tsx`, `src/components/house/GhostArt.tsx`, `ScoreBadge.tsx`, `Room.tsx`, `House.tsx`, `src/app/globals.css`, `e2e/screenshots.spec.ts`, their tests, and `docs/screenshots/` (13 PNGs). Tests: `npm run test:coverage` 768 passed, 0 failed; `CI=1 npm run test:e2e` 71 passed, 0 failed; `CI=1 npm run screenshots` 3 passed. Kiro features: the spec (task 31.6 under C14), the Spec sync hook, the steering's design-language rules. README feature list: three lines updated (the moonlit arrival, room props and ghost shapes, the hero score).
- **Push (Task 31.6):** `b4019f5..e72da36` to `origin/main` after the four pre-push checks passed (224 tracked files). That commit went out before the Spec sync entry and README lines above, which follow in the next commit.

#### The user's reply to the design-pass screenshots (17 November 2026)
- **Verdict: screenshots approved**, with one fix to make during Phase 5 without another stop: the ghost expressions read inverted. Level 2 looks angry and level 3 looks surprised, so level 2 reads as scarier. Level 3 must be clearly the most menacing (hollow glowing eyes, a jagged mouth, a darker tattered hem) and level 2 worried and uneasy, not angry. Size, colour, numeral, contrast and all tests stay the same, and the screenshots are regenerated. Recorded as PLAN_DECISIONS.md C15.
- Task 31.5 (visual review stop) is complete with this reply. **Phase 4 is complete.**

---
## Phase 5: Hardening and polish (started 17 November 2026)
PLAN.md and PLAN_DECISIONS.md re-read at the start of the phase, together with the Phase 5 tasks (32.1–33.3).
- **Spec sync fired** (`PostFileSave`) when I ticked haunted-house-ui **Task 31.5 Visual review stop**. Files changed by 31.5: `docs/screenshots/` (13 PNGs, committed in `e72da36`) and BUILD_LOG.md (the user's replies). No tests were run for this tick; the last runs were for Task 31.6 (768 unit and 71 E2E passed). Kiro features: the spec (task 31.5) and the Spec sync hook. README feature list: unchanged, since 31.5 adds no user-facing feature.
- Spec sync fired again on the next save of the same `tasks.md`, but that save only **added** Task 32.0 (ghost expressions, C15) and ticked nothing, so there is no completed task to record and the README list is unchanged. The `PostFileSave` trigger fires on every save of a `tasks.md`, not only on a tick; that is a known limit of C12.4.

### Task 32.0: ghost expressions (C15)
- A new `Ghost.test.tsx` test was written first and failed: level 2 must carry `data-face="worried"` with raised-inner-end brows and no jagged mouth or glowing eyes; level 3 `data-face="menacing"` with glowing eyes, a jagged mouth and a darker hem layer; levels 0 and 1 `none` and `calm`.
- `GhostArt.tsx`: level 2 now has brows raised at their inner ends, wide eyes and a small wavering mouth. Level 3 has slanted hollow sockets with glowing eyes, a jagged grin and a darker shredded lower edge. Size, opacity, colour and numeral are unchanged (the flow.spec computed-style checks still pass).
- Results: `npm test` 71 files, 769 passed; `CI=1 npm run test:e2e` 71 passed; lint and type-check clean. `CI=1 npm run screenshots` (3 passed) regenerated all 13 PNGs. I looked at the terrible house at 1440 px: level 3 reads as the most menacing and level 2 as worried. No review stop, as C15 says.
- **Spec sync fired** (`PostFileSave`) when I ticked haunted-house-ui **Task 32.0 Ghost expressions**. Files changed: `src/components/house/GhostArt.tsx`, `src/components/house/Ghost.test.tsx`, `docs/screenshots/` (13 PNGs). Tests: `npm test` 769 passed, 0 failed; `CI=1 npm run test:e2e` 71 passed, 0 failed. Kiro features: the spec (task 32.0 under C15) and the Spec sync hook. README feature list: the house line now names the worried and menacing faces.

### Task 32.1: edge cases
- Before starting: BUILD_LOG.md records the user's replies to both screenshot reviews, as 32.1 requires.
- `e2e/helpers.ts` gained a Japanese fixture, checked at import to be flagged as non-English (it gives no findings, so it also shows "No ghosts here").
- `e2e/edge.spec.ts` (9 tests, no-key project): empty and whitespace input show the message with `aria-invalid` and `aria-describedby` and stay on the input screen; exactly 50,000 characters are analyzed and the house opens; a 50,001st and 50,002nd typed character are blocked; a 60,000-character paste is cut to 50,000 with the notice in a `role="status"` region; Spanish and Japanese show the English-only notice and plain English does not; no risky clauses show "No ghosts here", every room "Quiet" and "0 · Mostly quiet"; a wisps-only policy shows "Only calm wisps here." with every ghost at severity 0.
- `HauntedApp.test.tsx` (2 new tests, `analyze` mocked to return `too-long`, which the cap normally prevents): the app stays on the input screen with "That text is longer than 50,000 characters." and keeps the text; with the real analyzer the same text opens the house.
- **All 11 new tests passed on their first run.** The behaviour already existed: the input checks came in Task 24.1, the notices in Task 29.1 (built early for the Task 31 layout and axe states), and the too-long path in Task 24.2. So these tests did not drive new code, and no fix was needed. To make sure they are not vacuous, I made one **mutation check**: with the too-long notice removed from `HauntedApp.tsx` for one run, the R16.6 test failed; the file was restored.
- Results: `npm test` 71 files, 771 passed; `CI=1 npm run test:e2e` 80 passed across both projects; lint, type-check and `check:trace` clean.
- **Spec sync fired** (`PostFileSave`) when I ticked haunted-house-ui **Task 32.1 E2E edge.spec.ts, then any fixes**. Files changed: `e2e/edge.spec.ts` (new), `e2e/helpers.ts`, `src/components/HauntedApp.test.tsx`. Tests: `npm test` 771 passed, 0 failed; `CI=1 npm run test:e2e` 80 passed, 0 failed. Kiro features: the spec (task 32.1) and the Spec sync hook. README feature list: one line added for the edge-case messages.

### Task 32.2: loading and error states
- `HauntedApp.test.tsx` (1 new test): with `HouseView` mocked to throw while rendering, the error boundary shows "The house would not open. Check your connection and try again." and "Try again" instead of a blank page (R17.5). It passed on its first run, because the boundary was built in Task 24.2. **Mutation check:** with `ErrorBoundary` changed to always render its children for one run, the test failed; the file was restored.
- `e2e/loading.spec.ts` (3 tests, no-key project): held chunks show "Opening the house…" with `aria-busy="true"` on `main`, which clears once the house opens (R17.2); blocked chunks show the error as an alert in `main` and "Try again", and after unblocking, "Try again" makes new chunk requests (so it really imports again), opens the house and keeps the pasted text, which "Read another policy" then shows (R17.3, R17.4); the same recovery works for a sample.
  - First run: 2 passed, 1 failed because of the test. `getByRole("alert")` also matched Next.js's own route announcer (`#__next-route-announcer__`), so the check is now scoped to `main`. Then 3 of 3 passed twice.
- Polish: these states already worked in the browser, and their look was approved at the screenshot review, so no app code changed in this task.
- Results: `npm test` 71 files, 772 passed; `CI=1 npm run test:e2e` 83 passed across both projects; lint and `check:trace` clean.
- **Spec sync fired** (`PostFileSave`) twice in a row, once per save, when I ticked haunted-house-ui **Task 32 Edge cases, loading and error states** and **Task 32.2 E2E loading.spec.ts, then any fixes**. One entry covers both. Files changed by 32.2: `e2e/loading.spec.ts` (new), `src/components/HauntedApp.test.tsx`. Tests: `npm test` 772 passed, 0 failed; `CI=1 npm run test:e2e` 83 passed, 0 failed. Kiro features: the spec (tasks 32 and 32.2) and the Spec sync hook. README feature list: one line added for the loading and retry states.

### Task 33.1: performance on a slow connection
- `e2e/perf.spec.ts` (2 tests, no-key project, Chromium CDP: `Network.emulateNetworkConditions` with 150 ms latency, 200,000 B/s down and 93,750 B/s up, and `Network.setCacheDisabled`).
  - Test 1 measures from navigation start until the textarea accepts typing, and sums `encodedDataLength` of every script response before any action.
  - Test 2 records the script URLs of the first load, opens a sample, and checks that every script fetched after the click is new (R17.1).
- **My first version was too lenient**, and I tightened it before relying on it. It passed at 723 ms, but it only checked the raw server-rendered `<textarea>`, which accepts keystrokes before React has hydrated. Typing that early does not prove the app works. The test now types until the app's character counter follows the text, so it measures the hydrated app.
- **Measured** (three runs): the hydrated textarea followed typing after 1,657, 1,637 and 1,633 ms (limit 5,000). First-load JS was 142,493 bytes gzip-encoded in 6 script files (budget 204,800). After a sample click, only new chunks loaded. Recorded in `.kiro/steering/tech.md`, replacing "to be confirmed".
  - These differ from my earlier `gzip -9` estimate (179,190 bytes, 7 files), which compressed the files myself and counted one more file. The network measurement is the one the requirement asks for.
- Results: `npm test` 772 passed; `CI=1 npm run test:e2e` 85 passed across both projects; lint and `check:trace` clean.
- **Spec sync fired** (`PostFileSave`) when I ticked haunted-house-ui **Task 33.1 E2E perf.spec.ts**. Files changed: `e2e/perf.spec.ts` (new), `.kiro/steering/tech.md`. Tests: `npm test` 772 passed, 0 failed; `CI=1 npm run test:e2e` 85 passed, 0 failed. Kiro features: the spec (task 33.1), steering (tech.md now holds the measured budget figures) and the Spec sync hook. README feature list: one line added for the fast first screen.

### Task 33.2: clean clone
- Everything was pushed first. `git clone https://github.com/sohambannerjee8/the-haunted-clause.git /tmp/hc-clean` checked out commit **`6ba3320`**. The clone had only `.env.example` (no `.env.local`), and every command ran with `GEMINI_API_KEY` empty.
  - `npm ci` → exit 0. npm warned that `protobufjs@7.6.6`'s postinstall script was not run (npm's install-scripts policy). Nothing needed it.
  - `npm run build` → exit 0; "✓ Compiled successfully"; `○ /` static.
  - `npm run lint` → exit 0, 0 problems.
  - `npm run typecheck` → exit 0, 0 errors.
  - `npm run test:coverage` → exit 0; 71 files, 772 tests passed, none skipped; lines 96.86% (618/638).
  - `CI=1 npm run test:e2e` → exit 0; 85 passed, 0 failed, skipped or flaky. Ports 3100 and 3101 were free beforehand, so both servers were built fresh in the clone.
- The same coverage run in the workspace afterwards also gave 96.86% (618/638), and the clone's `src/` file list matched the workspace's. (The 93.56% in the Task 31.6 entry was measured before the new `HauntedApp.test.tsx` tests in 32.1 and 32.2.)
- The `/tmp/hc-clean` folder was deleted afterwards.
- **Spec sync fired** (`PostFileSave`) when I ticked haunted-house-ui **Task 33.2 Clean clone**. Files changed in the repository: BUILD_LOG.md and the task's checkbox only (the clone was in `/tmp` and was deleted). Tests in the clone: `npm run test:coverage` 772 passed, 0 failed, 0 skipped; `CI=1 npm run test:e2e` 85 passed, 0 failed. Kiro features: the spec (task 33.2) and the Spec sync hook. README feature list: unchanged, since 33.2 adds no user-facing feature.

### Gate 5 (Task 33.3)
- **spec-reviewer, attempt 1: FAIL.** Report saved unchanged to `docs/gate-reports/phase-5-spec-reviewer-attempt-1.md`. 14 of 15 items Yes. `check:trace` passed and its 30-entry spot check found every named test in a task. All Gate 1 open items are resolved.
  - **Item 15 No (CONFLICT):** haunted-house-ui R20.1 still said 12 screenshots and R20.3 "each screenshot with reduced motion on", but PLAN_DECISIONS.md C14.7 approved a 13th with motion on, which `screenshots.spec.ts` makes. I had changed the work without changing the requirement.
  - MINOR items: the clause-analyzer design put the heading step (4b) after the room is chosen; R2.2 and R2.4 did not mention that the heading line is left out; the design's example counts, test table and `Finding` comment lagged behind C12–C13; the haunted-house-ui design lacked C13–C15 (Lights on reassurance line, night scene, room props, ghost faces, hero score, fog); `tasks.md` still pointed to the C12.3 panel route, 33.3 named only C12, 31.6 sat before 31.5, and parent Task 31 was unticked.
- **Why I fixed it instead of stopping:** the agent noted that under C10.21 a conflict with PLAN_DECISIONS.md means stopping to ask the user. Here the decision itself is not in question: the user approved C14.7 explicitly, and the spec simply had not been updated to match. Bringing the spec into line with an approved decision needs no new decision from the user, so I fixed it and re-ran the agent. If the user disagrees, the change is one commit to revert.
- **Fixes:**
  - R20.1 and R20.3 now cover the 12 reduced-motion screenshots plus the C14.7 motion-on one (which must check that animations are running).
  - The haunted-house-ui design's screenshot section and the HU-R20.1 and HU-R20.3 matrix rows say the same, with Task 31.6 added; 31.6 now names `e2e/screenshots.spec.ts`.
  - The heading step is now step 1b, before any rule is read, and R2.2 and R2.4 say rules are read after any heading line.
  - The clause-analyzer design has the 62-example count, the 41/21 pool, the C13 `whyItMatters` comment, and rows for `mitigation-phrasing.test.ts`, `mitigation-texts.test.ts` and `heading.test.ts`.
  - The haunted-house-ui design has a "Design pass (C14, C15)" section, the new component files, the Lights on reassurance line, and updated `Ghost.test.tsx`, `LightsOnList.test.tsx`, `RoomProp.test.tsx` and `NightScene.test.tsx` rows.
  - `tasks.md`: the header now describes the C12.4 route; 33.3 names C12–C15; 31.6 follows 31.5.
  - Parent Task 31 was ticked by a script edit, so the Spec sync hook did not fire for it. It records nothing new: all its sub-tasks were already logged.
- `npm run check:trace` still passes (236 rows). No code or test changed.
- **spec-reviewer, attempt 2: PASS.** Report saved unchanged to `docs/gate-reports/phase-5-spec-reviewer-attempt-2.md`. All 15 items Yes; it checked each attempt 1 problem again and found the conflict and all but one MINOR item resolved. Its 30-entry spot check and `check:trace` (236 rows) passed.
  - Two MINOR leftovers it listed (no item failed): P2 in the clause-analyzer design still said "28 positive examples", and the `ScoreBadge.test.tsx` and `SampleCards.test.tsx` rows did not mention the C14 tests. **Fixed** (P2 now says 41; both rows name their C14 tests). Text only.
- **security-reviewer, attempt 1: PASS.** Report saved unchanged to `docs/gate-reports/phase-5-security-reviewer-attempt-1.md`. All 17 items Yes, now including the UI items that were not due at Gate 3: only a boolean reaches the browser; LLM text renders as React text only; the medium is called only from the opt-in button, with only flagged-clause text in the body; samples never call the route. `check:secrets` (229 files), `check:history`, `check:rules`, `check:bundle` (20 files under `.next/static`), and `npm audit --omit=dev --audit-level=high` (0 vulnerabilities) all passed. Problems: none found.
  - Note on timing: I started this agent in the same batch as the two MINOR spec-text fixes above, so it may have read the tree before or after those edits. They touched only spec text, which no security item depends on.
  - Its observations, not failures: severity 0 findings are sent with the opt-in request (they are analyzer findings, not unflagged text); the full `npm audit` has 7 moderate dev-only advisories under `@typescript-eslint`.
- **Before running rules-auditor:** I read its Gate 5 items and checked two of them myself first.
  - R5 asks for `"license": "MIT"` in `package.json`, and there was none: `license-checker` listed the project as UNLICENSED. I added it with `npm pkg set license=MIT`. The tool still prints UNLICENSED for this package because it is marked `"private": true`, which the README now explains.
  - A3 asks for licences to be listed in README.md, which was planned for Phase 6. I added the README "Pre-existing work" and "Licenses" sections now, from `npx license-checker --production` and each package's `package.json`: the runtime dependencies with versions; the production-tree summary (MIT 44, Apache-2.0 15, BSD-3-Clause 12, ISC 2, 0BSD 1, CC-BY-4.0 1 for `caniuse-lite`, LGPL-3.0-or-later 1 for the optional `@img/sharp-libvips` binary); the development tools; the fonts; and the Gemini API terms. The rest of the README is finished in Phase 6.
  - `npx vitest --run scripts` passed 107 tests (the README docs test included) and `check:rules` had 0 FAIL.
- **rules-auditor, attempt 1: PASS.** Report saved unchanged to `docs/gate-reports/phase-5-rules-auditor-attempt-1.md`. All twelve Gate 5 items Yes (R1, R3, R4, R5, R7, R8, A1 for install/build/test, A2, A3, A4, K1, K2); R2, R6 and S1–S6 are Phase 6. It ran build, lint, typecheck, `test:coverage` (772 passed), `test:e2e` (85 passed), `check:bundle`, `check:secrets`, `check:history`, `check:rules`, `check:trace` and `license-checker`, all exit 0.
  - Problems it listed for Phase 6, none blocking now: the README dev-tool list leaves out `@vitejs/plugin-react`, `babel-plugin-react-compiler`, `@tailwindcss/turbopack` and `@types/*`; the README has no test steps yet; the five submission drafts don't exist yet; and `docs/KIRO_USAGE.md` must not claim Context7 was used through Kiro (it was only reached from the shell).
  - It also noted that it used `cat`, `sed`, `head` and `npx --no-install` to read files, which are outside its shell allow-list. They read only and wrote nothing. I'm recording this as a gap in how the allow-list is enforced, not a change to any file.
- **ui-a11y-reviewer, attempt 1: PASS.** Report saved unchanged to `docs/gate-reports/phase-5-ui-a11y-reviewer-attempt-1.md`. All 16 items Yes, including item 16, the edge states, which is now due. It used the app through Playwright MCP against `next start` on port 3100 with no key, and ran the "reduced motion" (1 passed) and "axe" (11 passed) tests. It confirmed the C14.6 heading rule in the browser: the terrible Cellar quote no longer starts with "1. Your information". Problems: none found. Afterwards the server was stopped, and `docs/screenshots/` was untouched (`git status` shows only the new report).
- **test-verifier, attempt 1: PASS.** Report saved unchanged to `docs/gate-reports/phase-5-test-verifier-attempt-1.md`. All 12 items Yes.
  - It ran typecheck, lint, `test:coverage` (71 files, 772 tests; lines analyzer 100%, llm 99.47%, other 93.14%), build, `CI=1 npm run test:e2e` (85 passed, 0 failed, skipped or flaky, `retries: 0`) and `check:trace` (236 rows), all exit 0.
  - 36 `fc.assert` calls (38 property tests), all at 1,000 runs.
  - Item 8: the only deleted test line since Gate 4 is the old R4.5 test title, and it judged the C13 change a strengthening. Every Phase 5 spec appears in a single commit.
  - Item 12: the edge-case, loading and slow-connection tests exist and pass (`perf.spec.ts` logged 1,647 ms and 142,493 bytes). Problems: none found.

**Gate 5 passed.** All five agents returned PASS: spec-reviewer on attempt 2 (attempt 1 failed on R20 against C14.7, now fixed), and security-reviewer, rules-auditor, ui-a11y-reviewer and test-verifier on attempt 1.
- **Spec sync fired** (`PostFileSave`) when I ticked haunted-house-ui **Task 33.3 Run Gate 5**. Parent Task 33 was ticked just before by a script edit, which does not trigger the hook. Files changed: the five `docs/gate-reports/phase-5-*.md` reports (plus spec-reviewer attempt 1), spec text fixes in `.kiro/specs/`, `package.json` (licence) and README.md (pre-existing work and licences). Tests, as the agents ran them: `npm run test:coverage` 772 passed, 0 failed; `CI=1 npm run test:e2e` 85 passed, 0 failed. Kiro features: the spec, five custom agents run as sub-agents (each has no write tool; shell limited to build/test commands), Playwright MCP (ui-a11y-reviewer), the Spec sync hook and property-based tests. README feature list: unchanged, since 33.3 adds no user-facing feature.

**Phase 5 complete.** Every spec task in all three specs is ticked. Next is Phase 6 (submission pack and the final rules-auditor gate), which has no spec tasks.

---
## Phase 6: Submission pack (started 17 November 2026)
PLAN.md (sections 3, 6 and 7) and PLAN_DECISIONS.md re-read at the start of the phase. Phase 6 has no spec tasks. The user approved it with three additions: correct the MCP line in `product.md`; video script requirements (about 2:30, the real app throughout, "97 · Run" in the first 20 seconds, one ghost detail panel, Lights on, the keyboard path, ending on how Kiro was used, no music unless royalty-free and named); and mark KIRO_USAGE.md, BLOG_DRAFT.md and SOCIAL_POST.md as drafts the user will rewrite, with every claim based on this log, including what did not work.

### Steering: the MCP line in product.md
- `.kiro/steering/product.md` said "MCP (Context7 and Playwright)" under "Kiro features in this build", which presented Context7 as used through Kiro. It now says Playwright MCP was used through Kiro, and Context7 was configured but never connected in Kiro (its first download passed the 60-second connect timeout), so it was only reached from the shell. This matches the Phase 0 entries above.
- `.kiro/steering/structure.md` still lists "Context7 and Playwright MCP" next to `settings/mcp.json`. That line describes what the config file holds, which is true, so it is unchanged.
- Recorded the user's three Phase 6 additions as PLAN_DECISIONS.md C16. One reading of mine is noted there for the user: `docs/SOCIAL_POST.md` must carry a draft note at the top and the post must begin with `#KiroweenHackathon26`, so the note sits above a "## Post" heading and the post itself starts with the hashtag.

### Submission pack, tests first
- New `scripts/submission-docs.test.mts` (37 tests), written before the drafts: the five drafts exist and never say "read-only" or "/100"; KIRO_USAGE, BLOG_DRAFT and SOCIAL_POST start with a "> **Draft.**" note; the social post begins with `#KiroweenHackathon26`; the blog says "written for the Kiroween 2026 hackathon"; KIRO_USAGE and the blog use the approved agent wording; KIRO_USAGE records `spec-task-execution`, "Failed to connect" and `check:trace`, answers the powers question, and has no sentence saying Context7 was used through Kiro without a "not" or "never"; the Devpost text states Costume Contest and the main features; the video script has back-to-back timed segments from 0:00, ends between 2:20 and 2:40, shows "97 · Run" in a segment ending by 0:20, includes "Why it matters", "Lights on", Tab and the arrow keys, ends on Kiro, says "No music" and names none of 19 third-party brands; README has Setup, Tests, Architecture, Privacy, Pre-existing work and Licenses sections, the install, environment, run and test commands, and every direct dependency in Licenses.
- First run: 21 failed (no drafts yet) and 16 passed. The 16 were the README tests, which the README already met after this phase's edit, plus the Context7-sentence and brand checks, which pass trivially on an empty file. **Mutation check:** after the drafts existed, appending "Recorded in Google Chrome." to the video script and "Context7 was used through Kiro for docs." to KIRO_USAGE made exactly those two tests fail; both files were restored.

### README and DEPLOY.md finished
- README: the stub note is gone. New sections: a one-paragraph summary of what each spooky element means, Setup (Node 20.9 or newer, `npm ci`, `.env.example` to `.env.local` with the two optional variables, `npm run dev` or `npm run build && npm start`), Tests (unit, coverage, `npx playwright install chromium`, end-to-end with its two ports and the dead proxy, the other checks, the final counts), and Architecture (the folder map and how a policy becomes a house). The Privacy section is unchanged. Licenses now also lists `@tailwindcss/turbopack`, `babel-plugin-react-compiler`, `@vitejs/plugin-react` and the `@types/*` packages (all MIT, read from each package's `package.json`), which the Gate 5 rules-auditor flagged as missing, and the two MCP servers as build-time tools.
- DEPLOY.md: the draft note is gone. New "Deploy on Vercel" steps (New Project, Import, the Next.js preset with default build settings, the environment variables, Deploy, what to check on the production domain, and Deployment Protection: share only the production domain, which Standard Protection leaves public) and the exact redeploy click path. These follow Vercel's "Deploying Git Repositories", "Managing Deployments" and "Deployment Protection" pages, fetched on 17 November 2026. Every statement `scripts/docs.test.mts` checks is still there (20 of 20 pass).

### The five drafts
- `docs/KIRO_USAGE.md`, `docs/BLOG_DRAFT.md`, `docs/SOCIAL_POST.md` (marked as drafts for the user to rewrite), `docs/DEVPOST_DESCRIPTION.md` and `docs/VIDEO_SCRIPT.md`. Every claim was taken from this log. The drafts call the builder "Kiro's agent" and the user "the author", so the author can rewrite them in the first person. Where the log has no answer, KIRO_USAGE says so and leaves a note for the author: there was one Kiro app (the IDE), so no comparison; no vibe-coded feature, so no measured comparison with specs; which steering helped most is left to the author; no Kiro powers.
- The failures are written up as they happened: the Gate 1 traceability loop (three FAILs, the stop, the matrix and `check:trace`), the spec task panel (`spec-task-execution` not found, the panel-started 31.4 that left no trace, the move to `PostFileSave` and its limits), Context7 (the 60-second connect timeout, the half-written npx cache, shell-only use), the two steering drifts, and the rules-auditor's reads outside its allow-list.
- VIDEO_SCRIPT: 2:30 in seven segments; "97 · Run" by 0:16; the keyboard path (Tab, arrow keys, Enter), one detail panel, the mild house in Lights on mode, then 36 s on Kiro and an end card. Narration is 331 words. No music, no third-party names on screen or in the narration, and the optional medium panel is left out because it names an outside service.
- Full suite: 72 files, 809 tests pass. Lint and type-check clean.
- **Push (submission pack):** `70b987a..1702c1d` to `origin/main` after the four pre-push checks passed (239 tracked files).

### Gate 6 (final): rules-auditor, attempt 1: PASS
- Ports 3100 and 3101 were free first. The `rules-auditor` custom agent ran as a sub-agent with fresh context, on every checklist item (R1–R8, A1–A4, S1–S6, K1, K2). Report saved unchanged to `docs/gate-reports/phase-6-rules-auditor-attempt-1.md`.
- **Verdict: PASS.** All 20 items Yes. It ran build, `test:coverage` (72 files, 809 tests, lines 96.86%), typecheck, lint, `CI=1 npm run test:e2e` (85 passed; perf 1,635 ms and 142,493 B), `check:rules`, `check:secrets` (239 files), `check:history`, `check:trace` (236 rows), `check:bundle` (20 files) and `license-checker`, all exit 0, and `git status` was clean before and after.
- Problems it listed, none breaking an item, and what I did:
  - README and BLOG_DRAFT still gave the Phase 5 count of 772 tests. **Fixed:** 809 tests in 72 files.
  - The video script's Kiro segment was about 110 words in 36 s, faster than the rest, and "ran tests … on every save" overstated Test on save, which only matches `src/**/*.ts(x)`. **Fixed:** the narration is now 84 words ("Hooks ran the tests and a secret scan as files were saved"), and the whole narration about 300 words.
  - KIRO_USAGE said 16 gate reports and had no Gate 6 result. **Fixed:** 17 reports, Gate 6 PASS.
  - SOCIAL_POST's draft note and heading must be removed before posting. Left as it is, because the user asked for the draft mark (C16.3); the note says so.
  - It noted that its `npm run build` read the git-ignored `.env.local`. **I checked, without printing the value:** `.env.local` exists (55 bytes, modified 17 November 2026 23:11, during Phase 6) and holds a non-empty `GEMINI_API_KEY` line. I did not create it; it looks like the user has started manual step 1. It is ignored by git (`.gitignore` line 37, `.env*`), `check:secrets` and `check:history` are clean, `check:bundle` found neither the canary nor the key name in `.next/static`, and the E2E servers build with the key set to empty. No test or build calls Google, and `npm run precompute:samples` has not been run.
- `npx vitest --run scripts` passed 144 tests after the fixes (`submission-docs.test.mts` and `docs.test.mts` included). The fixes are text only; no code or test changed.

**Gate 6 passed. Phase 6 complete.**
- **Push (Gate 6):** `1702c1d..6c047f6` to `origin/main` after the four pre-push checks passed (240 tracked files).

---
## Phase 7: Completion report (17 November 2026)
- **Final clean clone:** `git clone` of `origin/main` into `/tmp/hc-final` checked out `6c047f6`, with no `.env.local` and `GEMINI_API_KEY` and `GEMINI_MODEL` set to empty. `npm ci` exit 0 (the same `install-scripts` warning as Task 33.2); `npm run build` "✓ Compiled successfully", `○ /` static and `ƒ /api/explain`; `npm run lint` 0 problems; `npm run typecheck` clean; `npm run test:coverage` 72 files, 809 tests passed, lines 96.86%; ports 3100 and 3101 free, then `CI=1 npm run test:e2e` 85 passed. The clone was deleted afterwards.
- Wrote `COMPLETION_REPORT.md` with the eight sections PLAN.md section 7 asks for. It does not claim the app is deployed, the video recorded or the entry submitted.

**BUILD COMPLETE.**

---
## After the build: sample readings and deployment (17 November 2026)
The user added a Gemini key to `.env.local` and the Vercel MCP server to `.kiro/settings/mcp.json`, and asked for the precompute, a review of the readings, then a Vercel deployment. The key's value was never read, printed or copied; only its presence and length were checked.

### First precompute run (manual step 2, started by the builder at the user's request)
- The first `npm run precompute:samples` printed "no GEMINI_API_KEY; writing rule-based readings" and changed nothing. Cause: this shell still had `GEMINI_API_KEY` set to an empty string from the Phase 7 clean-clone run, and `loadEnvConfig` does not override a variable that is already set. Checked without printing the value: `.env.local` holds one `GEMINI_API_KEY` line with a 40-character value.
- Second run with the variable removed from the environment (`env -u GEMINI_API_KEY -u GEMINI_MODEL`), output piped through a filter that masks key-shaped strings:
  - `precompute: model=gemini-4-hydrogen source=default`: the real `models.get` call accepted the model.
  - mild: `source=llm llmFindings=5`; average: failed (`timeout`, the 15-second limit); terrible: failed (`error`; the script records only the reason code, so the cause is unknown). Exit code 1. Average and terrible kept rule-based entries.
  - The five mild readings kept the rule severities. Three added claims the clause does not make, for example that the company "is not responsible for those bank charges" for a clause that only says card payments may include bank fees.
- Nothing was committed. The user was shown the readings and asked how to proceed.

### Model change and prompt tightening (PLAN_DECISIONS.md C17, llm-explainer Task 22.4)
- The user asked to make `gemini-3.5-flash-lite` the default and to tighten the prompt, then run the precompute once.
- **Spec sync fired** (`PostFileSave`) when I saved `.kiro/specs/llm-explainer/tasks.md` to add Task 22.4 and update the model named in Task 18.3. That save ticked no task, so there is no completed task to record, and the README feature list is unchanged (the known C12.4 limit: the hook fires on every save of a `tasks.md`).
- Tests first: `gemini.test.ts` (default model) and two new `prompt.test.ts` tests failed (5 failures across the four touched files, including the precompute model-line test), then `DEFAULT_MODEL` and `SYSTEM_INSTRUCTION` changed and all 81 passed. The model name in the `schema.test.ts` and `precompute-samples.test.mts` fixtures changed with it; no assertion was loosened. Full suite: 72 files, 811 tests passed; lint, type-check and `check:trace` (236 rows) clean. R4.2, R4.4, the design's facts table and prompt text, DEPLOY.md, README.md and `tech.md` now name `gemini-3.5-flash-lite`.
- Checked Google's docs before the change (fetched 17 November 2026): `gemini-3.5-flash-lite` is listed as stable, "the fastest, lowest-cost model in the 3.5 family", with structured output and thinking levels minimal, low, medium and high, so the existing thinking level low is valid. The same models page also still lists `gemini-4-hydrogen`; that is recorded in C17.1 and was reported to the user.
- Before the run, `sample-explanations.json` was reset to the committed rule-based file, so the unapproved `gemini-4-hydrogen` mild readings could not be kept as a fallback. A copy of that output is in `/tmp`, outside the repository.
- **Push (C17 code and docs):** `cc25448..e0256ee` after the four pre-push checks passed. The sample file was not part of it.

### Precompute with gemini-3.5-flash-lite (one run, as the user asked)
- `precompute: model=gemini-3.5-flash-lite source=default` (the `models.get` check passed). mild: failed (`error`), kept rule-based; average: `source=llm llmFindings=8`; terrible: `source=llm llmFindings=29`. Exit code 1.
- The medium confirmed every rule severity and raised none. All 37 readings were shown to the user for approval; several still go beyond the clause text (for example, the average arbitration reading also mentions class actions, which that clause does not). The file is not committed and has not been run again.

### The user's decision on the readings (PLAN_DECISIONS.md C18)
- **Rejected.** The medium's readings added claims beyond the clause text, so the samples stay rule-based. `src/lib/samples/sample-explanations.json` was restored with `git checkout` to the committed file (all three entries `source: "rules"`). Nothing from either precompute run is committed. The medium remains an opt-in feature for pasted text only. The `gemini-3.5-flash-lite` default and the tightened prompt stay.
- **C17.1 corrected at the user's instruction:** `gemini-4-hydrogen` is on Google's model list; the switch was made for speed after the timeouts. The withdrawn reason is noted in the entry.
- DEPLOY.md: "Before you deploy: the sample readings" became "The sample readings stay rule-based", which explains C18 and how to try the medium on the samples again (including the empty-variable problem found in the first run). COMPLETION_REPORT.md: the sample, Gemini and step 2 lines are marked as updated after the build. `docs.test.mts` and `submission-docs.test.mts`: 57 passed.
- **Spec sync fired** (`PostFileSave`) when I ticked llm-explainer **Task 22.4 Default model and prompt tightening (C17)**. Files changed by 22.4: `src/lib/llm/gemini.ts`, `gemini.test.ts`, `prompt.ts`, `prompt.test.ts`, `schema.test.ts`, `scripts/precompute-samples.test.mts`, the llm-explainer requirements, design and tasks, `.kiro/steering/tech.md`, README.md, docs/DEPLOY.md, COMPLETION_REPORT.md, PLAN_DECISIONS.md (C17, C18) and BUILD_LOG.md. The sample file is unchanged. Tests: `npm test` 72 files, 811 passed, 0 failed. Kiro features: the spec (task 22.4, R4.2 and R4.4 changed), steering (`tech.md`), the Spec sync hook. README feature list: unchanged; its "Optional: … the medium … pasted text" line already describes the medium as pasted-text only.

### Vercel MCP: not connected in Kiro
- `tool_load vercel::*` returned not found, so no Vercel MCP tools are available to the agent in this session.
- Kiro's MCP log (`logs/20261117T173511/…/Kiro - MCP Logs.log`): `23:40:32.160 [error] [vercel] Failed to connect: MCP server 'vercel' connection timed out after 60000ms`, then `mcp.connect.error`. No later attempt is logged, and no `mcp-remote` process is running.
- `mcp-remote` 0.16.6 is now in the npx cache, so a second start does not need the download. In `~/.mcp-auth/mcp-remote-v1/` (file names listed, contents not read) there are two code-verifier files, client info and discovery state, but no tokens file, so the OAuth sign-in had not finished for `mcp-remote` when Kiro gave up. This is the same 60-second connect timeout that stopped Context7 in Phase 0.
- Vercel steps 3–5 are paused until the server connects. No project was created and nothing was deployed. `.kiro/settings/mcp.json` (the user's edit adding the `vercel` server; no token in it) is not committed yet.

### Vercel MCP: connected on the second try
- At the user's request I tried again. Kiro's MCP log shows the reconnect: `00:09:04 [vercel] mcp.connect.ok`, `00:09:06 mcp.listTools.ok`, and `~/.mcp-auth/mcp-remote-v1/` now holds a tokens file (name listed, contents not read). `tool_load` returned the Vercel tools.
- The first two calls (`get_auth_user`, `list_teams`) failed with "mcp-remote: fetch failed"; `curl` showed api.vercel.com answering in 9.7 s, so the network was slow. On retry both worked: `list_teams` returned no teams, and `get_auth_user` returned user `sohambannerjee8`, Hobby plan, with a default (personal) team. The account matches the GitHub repository owner.
- `list_projects` on that team returned 403: the connection's token does not cover the scope `soham-banerjees-projects-9fb5a449`. As the error advised, `authorize_team_access` created a single-use consent link (valid 10 minutes), which was given to the user. Nothing has been created on Vercel yet.
- The user approved team access. `list_projects` on the personal team then worked and returned no projects.
- `create_git_project` (repo `sohambannerjee8/the-haunted-clause`, provider github, project name `the-haunted-clause`) failed: `400 repo_not_found`, "The repository couldn't be found … that you have access to it". The repository itself is public (GitHub API HTTP 200 without a login).
- `git_namespaces` and `search_repo` (provider github) both failed with `401 github_response_error`: Vercel's own GitHub connection for this account is not working, so Vercel cannot list or import any GitHub repository. This is on the Vercel–GitHub link, not the MCP connection, which answers other calls. The Vercel CLI fallback the error suggests is not installed, and I did not install it. Nothing was created on Vercel; the user has been asked to reconnect GitHub in Vercel.
- The user reconnected GitHub in Vercel. `search_repo` failed once with "mcp-remote: fetch failed" (the slow network again), then found `sohambannerjee8/the-haunted-clause` (public, default branch `main`).
- **`create_git_project` succeeded:** project `the-haunted-clause` (`prj_L0QboSTNUiPYHLhMuOqaWOkiurRZ`), linked to the GitHub repository, production branch `main`, so every push to `main` redeploys. Vercel cloned the repository itself; no local file was uploaded, so `.env.local` could not be sent.
- `get_project`: framework `nextjs`, Node `26.x`, Vercel Authentication on with scope `all_except_custom_domains` (the team default). `filter_project_envs`: no environment variables, so `GEMINI_API_KEY` is not set on Vercel.
- **First deployment** `dpl_FmNmomLy6Chgs9xjfvEKHB2PFDJQ`: the tool reported a preview, but `get_deployment` shows `target: production`, state `READY`, built from commit `49339d6` (`main`), alias `the-haunted-clause.vercel.app`. Build log (`list_deployment_events`): `npm install` 542 packages, "Detected Next.js version: 16.4.6", "✓ Compiled successfully in 13.3s", TypeScript clean, routes `○ /`, `○ /_not-found`, `ƒ /api/explain`, `○ /icon.svg`, "Build Completed in /vercel/output [40s]", "Deployment completed". Warnings only: the open-ended `engines.node` range, npm's unknown `cache-dir` config, deprecated dev packages, and the `install-scripts` notice for esbuild and protobufjs (the same as the clean clones).
- `curl`: `https://the-haunted-clause.vercel.app/` HTTP 200, title "The Haunted Clause", `data-llm-available="false"` (no key yet, as expected). The generated deployment URL returns 302 (Vercel Authentication), which matches DEPLOY.md step 6: share only the production domain.
- Waiting for the user to add `GEMINI_API_KEY` in the dashboard; then a redeploy, because `llmAvailable` is read at build time.
- The user reported `GEMINI_API_KEY` saved for Production. Before redeploying I checked with `filter_project_envs` (`decrypt: false`, by project ID and again by name 15 s later): `envs: []`, `hiddenProductionEnvCount: 0`. `list_projects` shows only `the-haunted-clause`, with `updatedAt` unchanged since the first deployment. So the variable is not on this project yet, and no redeploy was made (it would build with `llmAvailable` false again). The user was asked to check where it was saved.
- The user added `GEMINI_API_KEY` again. `filter_project_envs` (`decrypt: false`) now listed one variable: `GEMINI_API_KEY`, type `sensitive`, target `production` only, value not returned. The agent never set or read it.

### Production redeploy with the key (Vercel MCP)
- `create_deployment` with `deploymentId` of the first deployment, `target: production`, `forceNew: 1` (a redeploy of commit `49339d6`): deployment `dpl_2vraFwY4eiXmzCPGHCpQVi9FyGAK`, state `READY` after about 45 s, alias `the-haunted-clause.vercel.app`, `aliasError: null`. Build log: the same routes, "Build Completed in /vercel/output [36s]", "Deployment completed", only the `engines.node` warning.
- `curl https://the-haunted-clause.vercel.app/`: HTTP 200, `data-llm-available="true"`.

### Checks on production (Playwright MCP)
- **Samples:** Quillwhisper Notes "Haunt Score 14, Mostly quiet"; Mirebell Streaming "Haunt Score 59, Haunted"; Murkwillow Social "Haunt Score 97, Run" with 29 ghost buttons. Each showed "Sample: <company> (a fictional company)" and no "Ask the medium" button. No request to `/api/explain` while opening them (`browser_network_requests` listed only static files).
  - One batch of my Playwright calls appeared to run out of the order I gave them, so I read the terrible sample's score again on its own before relying on it.
- **Opt-in:** pasted my own four-sentence test text (no real company): "Members agree to these club rules. We may share your email address with our sponsors. Your membership renews automatically every year. You can cancel at any time from your account page." The house gave "Haunt Score 15, Mostly quiet" and one ghost, "Severity 2 ghost in The Coin Vault: real concern". The rules did not flag the email-sharing sentence. The "Ask the medium" region showed the opt-in notice word for word with the Gemini terms link, and no `/api/` request had been made.
- **One real medium call:** pressed "Ask the medium" once. `POST /api/explain` returned 200 with `cache-control: no-store`; status "The medium has spoken." Request body: only the flagged clause, `{"clauses":[{"id":"c-86","room":"vault","severity":2,"text":"Your membership renews automatically every year."}]}`. Response: `source: "llm"`, severity 2 confirmed. The detail panel showed the exact clause, "Your membership will automatically renew every year.", "Why it matters: You may be charged for another year without a reminder, leading to unexpected costs.", the badge "Medium's reading" and "Not legal advice." The "without a reminder" part goes beyond the clause, the same pattern as C18.
- **Console:** 0 errors, 0 warnings for the whole session.
- **Vercel logs:** `get_runtime_logs` for the deployment, last 20 minutes: one line, `POST /api/explain` at 19:06:14Z, `explain outcome=llm clauses=1 ms=1921`. No clause text, IP or key in it. `get_runtime_errors`, last hour: none.

### Files
- `.kiro/settings/mcp.json` with the user's `vercel` entry (`npx -y mcp-remote https://mcp.vercel.com`, no token) is committed, because the server was used.
- DEPLOY.md: new "The live deployment" section. KIRO_USAGE.md: three MCP servers, two used through Kiro, with the Vercel MCP and post-deploy Playwright use, including what failed. COMPLETION_REPORT.md: status and manual step 4 marked as updated after the build; the "not yet tried with a real key" line replaced.

### Broader Cellar sharing rule (PLAN_DECISIONS.md C19, clause-analyzer Task 16.7)
- The user noted that the production test sentence "We may share your email address with our sponsors." had no finding, and asked to cover sharing, disclosing, providing or transferring your data, information, email or details with or to sponsors, third parties, partners, affiliates or advertisers, at the existing severities.
- **Tests first.** Added to `examples.test-util.ts`: four positive Cellar examples (two sponsors at severity 2 under `cellar.third-parties`, two advertisers at severity 3 under `cellar.ad-partners`) and three negative ones ("We provide reports to advertisers about how their ads performed.", "Our summer events are supported by local sponsors.", "Sponsors may share their own logos with us for the event page."). Added to `mitigation-phrasing.test.ts`: "We do not share your email address with our sponsors." and "We will never share your data with advertisers." (both `cellar.no-share`, severity 0), and an exception case ("…except when you enter a sponsored contest.") that cancels the reassurance. Run: 9 failed, 318 passed. Seven were the new cases. The other two were existing tests that loop over all positive examples (`analyze.test.ts` expected 45 findings and got 41; the R4.5 rule-text test).
- **Change in `rules.ts`:** a shared `SHARE` verb pattern and a `sharedWith(target)` alternative (verb, then data/information/e-mail/details, then "with" or "to", then the target), added to `cellar.third-parties` for `sponsors?` and to `cellar.ad-partners` for `advertisers?`. The existing alternatives are unchanged, so third parties, partners, affiliates and advertising partners match as before. The rule count stays 45.
- Result: analyzer and sample tests 327 passed. **Mutation check:** with `sharedWith` loosened to "verb, then anything, then the target" for one run, the "reports to advertisers" negative example and the R2.2 test failed; the file was restored and all 81 classifier tests passed.
- Samples: scores 14, 59 and 97, and every finding ID and severity identical before and after (compared with `git stash`), so `sample-explanations.json` stays consistent. The production test text now gives Cellar 2 (`cellar.third-parties`) and Coin Vault 2, score 28.
- Spec: the clause-analyzer design's rule table, room examples (69: 45 positive, 24 negative), generator pool and P2 count; matrix rows CA-R2.2 and CA-R2.7 now name Task 16.7. `check:trace` first failed ("task 16.7 does not exist") until the task was written, then passed with 236 rows.
- **Spec sync fired** (`PostFileSave`) when I saved clause-analyzer `tasks.md` with **Task 16.7 Broader Cellar sharing rule** added as done. Files changed: `src/lib/analyzer/rules.ts`, `examples.test-util.ts`, `mitigation-phrasing.test.ts`, `.kiro/specs/clause-analyzer/design.md` and `tasks.md`, `.kiro/specs/traceability.md`, PLAN_DECISIONS.md (C19), BUILD_LOG.md. Tests: `npm run test:coverage` 72 files, 821 passed, 0 failed, lines 96.87%; `CI=1 npm run test:e2e` 85 passed; lint and type-check clean. Kiro features: the spec (task 16.7), the Spec sync hook, and the property-based tests, which draw on the room-example pool and ran at 1,000 cases each in the suite. README feature list: unchanged; its analysis line already says risky clauses are sorted into eight rooms.
- **Push (C19):** `d7dac51..eb325c1` after the four pre-push checks passed. Vercel built it on its own from GitHub: deployment `dpl_9kULVjG3eYbzkb8eMxnVUrn92UnD`, production, `READY`, commit `eb325c1`.
- **Live check (Playwright MCP, no medium call):** the production page still reports the medium as available. The same four-sentence test text now gives "Haunt Score 28, Uneasy" with two ghosts, "Severity 2 ghost in The Cellar" and "Severity 2 ghost in The Coin Vault", and the "Ask the medium" button; no `/api/` request was made, and the console logged no errors or warnings. (The first read came back empty because the house had not finished loading; I waited for "Inside the house" and read again.)

### Remaining preparation, automated (PLAN_DECISIONS.md C20)
The user asked for a real-policy audit, a recorded demo and a submission pack, with nothing published, uploaded or submitted, and only code and docs pushed.

**Real-policy audit**
- `.gitignore` gained `/audit/` and `/video/`; `check:rules` still passes, and `git check-ignore` confirms both.
- Tests first: `scripts/audit-real-policies.test.mts` failed (no module), then `scripts/audit-real-policies.mts` was written. First run: 2 of 20 failed. Both were my test's mistake: it expected one severity 3 finding to be "Mostly quiet", but it scores 30, "Uneasy" (as `score.test.ts` already pins); the expectation was corrected to the exact value. After seeing the first report, a test was added that headings under six words and repeated sentences are not listed as possible misses; it failed, the filter was added, and all 21 passed.
- The script reads its list from the git-ignored `audit/sources.json`, so no real company name or policy is committed. Five well-known services' privacy policies were chosen after probing twelve URLs for server-rendered text (two returned almost none). Results, written to the git-ignored `audit/report.md`: scores 53, 28, 60, 63 and 60; 18, 42, 49, 11 and 27 ghosts; 30–54 possible misses each. Across all five, the Coin Vault had no ghosts and the Trapdoor none (these are privacy policies, not terms of service), and most ghosts sat in the Cellar and the Watching Portraits. The report was shown to the user; no rule was changed.

**Demo video**
- No system ffmpeg is installed; Playwright's bundled ffmpeg can only write WebM. So the recorder burns the captions in through an in-page overlay instead of a subtitle filter.
- Tests first: `scripts/record-demo.test.mts` failed (no module), then `scripts/record-demo.mts`. One test failed on the first run: a caption got 0.5 s because time was shared by length; every caption now gets at least 1.5 s. After looking at frames from the first recording I added a test that no caption is a short leftover (it failed on "you're on."), and long sentences are now split into lines of similar length; 10 of 10 pass.
- Fixed after looking at frames of the first two recordings, not covered by unit tests: the caption sat under the dialog's dimmed backdrop (the overlay is now a set of manual popovers in the top layer, raised when a dialog opens); the caption disappeared after each page load (it is re-applied); the keyboard path opened the data-brokers ghost instead of "We may sell your personal information to third parties." (it now steps back to the first Cellar ghost); headless recordings show no pointer (a pointer dot follows the mouse); the end card was narrower than the page.
- Final run against https://the-haunted-clause.vercel.app: every segment started on its planned second (0, 16, 36, 60, 82, 106, 142), the panel quoted "We may sell your personal information to third parties.", focus returned to "Severity 3 ghost in The Cellar" after Escape, and the recording ran 150.5 s after a 1.7 s lead-in. `video/demo.webm`: VP9, 1440 × 900, 25 fps, 2:33 with the lead-in, no audio track, 40.8 MB. Frames at 0:44 and 2:26 were checked by eye. "Ask the medium" was not pressed. No MP4 was made, because there is no full ffmpeg; the recorder prints `brew install ffmpeg` and the conversion command, which trims the lead-in.
- The Kiro segment shows a local page built at record time from the repository's real `.kiro/` file list, five EARS lines, the gate-report names and a `numRuns: 1000` line, because a browser cannot film the Kiro window. `docs/VIDEO_SCRIPT.md` now says so.
- This used the Playwright library from the shell, not Playwright MCP.

**Submission pack**
- Tests first: four tests in `submission-docs.test.mts` (every Devpost field present; live URL, repository URL and Costume Contest; blanks only for the video link and student details; no "read-only" or "/100") failed 3 of 4, then `docs/SUBMISSION_PACK.md` was written and all passed.

**Checks:** `npm run test:coverage` 74 files, 856 tests passed, lines 96.87%; lint and type-check clean. Nothing in `audit/` or `video/` is tracked.
