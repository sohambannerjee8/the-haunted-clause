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
