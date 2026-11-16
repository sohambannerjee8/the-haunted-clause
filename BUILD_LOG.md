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
