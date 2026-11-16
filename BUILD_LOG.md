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
- Dev: `vitest` 5.1.0, `@vitest/coverage-v8` 5.1.0, `fast-check` 4.10.2, `@playwright/test` 1.65.1, `@axe-core/playwright` 4.14.0, Testing Library (react 16.3.3, dom 10.4.2, jest-dom 7.0.1, user-event 14.6.12), `jsdom` 31.0.1, `@vitejs/plugin-react` 6.3.0, `vite-tsconfig-paths` 6.1.1, `tsx` 4.23.15, `license-checker` 25.0.1.
- Framer Motion is now published as `motion` (MIT, imported from `motion/react`), so `motion` is used.

### What failed and how it was fixed
- **Dev-dependency install, attempt 1:** npm ERESOLVE. `vitest` 5.1.0 has an optional peer `@types/node` `^22 || >=24`, and the scaffold pinned `@types/node` `^20`. Fixed by installing `@types/node@^24`. No `--force` or `--legacy-peer-deps`.
- **Type-check, attempt 1:** `tsc --noEmit` failed with `Cannot find name 'LayoutProps'`. Next.js 16 generates route types (`LayoutProps`) during `next dev`/`next build` only. The bundled doc `06-cli/next.md` documents `next typegen`. Fixed by changing the script to `next typegen && tsc --noEmit`.
- **Playwright Chromium install, interrupted:** the first `npx playwright install chromium` was interrupted by the user mid-download while they asked about specs. The download process kept running as an orphan and held a lock directory (`~/Library/Caches/ms-playwright/__dirlock`). On restart the orphaned processes were stopped, the empty lock directory was removed, and the install was started again as a background process.

- **Playwright install, after restart:** Chrome for Testing 159.0.8154.6 (`chromium-1255`, 377 MB) and ffmpeg (`ffmpeg-1013`) finished installing at 20:40 (both have `INSTALLATION_COMPLETE`). The chromium headless shell (100.8 MiB) then kept downloading on a slow connection; its status is recorded below when it finishes.
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

### Kiro features used so far
- Kiro planning session with web fetch (rules, Gemini terms, Kiro docs).
- Steering: AGENTS.md from the scaffold was loaded by Kiro as a workspace rule and was followed (bundled Next.js docs read before writing config and scripts).
