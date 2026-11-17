# Completion report: The Haunted Clause

## 1. Status

**BUILD COMPLETE**, 17 November 2026.

Phases 0 to 7 are finished, and the last result of every gate is PASS. The final commit before this report, `6c047f6`, was cloned fresh from GitHub with no `.env.local` and `GEMINI_API_KEY` empty. In that clone `npm ci`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test:coverage` (809 passed) and `CI=1 npm run test:e2e` (85 passed) all exited 0, with no test skipped.

The app is **not deployed**, the video is **not recorded** and the entry is **not submitted**. Those are the author's steps (section 8).

## 2. What works

Each feature in the brief (PLAN.md section 2, `.kiro/steering/product.md`), with the tests that prove it. Every acceptance criterion behind these features is mapped to a named test in `.kiro/specs/traceability.md` (236 criteria; `npm run check:trace` passes).

| Feature | Proved by |
| --- | --- |
| Paste up to 50,000 characters; longer pastes are cut with a notice; empty input is refused | `src/components/InputScreen.test.tsx`, `e2e/edge.spec.ts`, `src/lib/analyzer/analyze.test.ts` (50,000 accepted, 50,001 refused) |
| Three fictional samples (mild, average, terrible) that score 14, 59 and 97 | `src/lib/samples/samples.test.ts`, `src/components/SampleCards.test.tsx`, `e2e/flow.spec.ts` |
| Clause splitter: joining the clauses gives the input exactly | `src/lib/analyzer/splitter.test.ts`, `splitter.property.test.ts`, `analyze.property.test.ts` |
| Rule-based classifier: eight rooms, severity 0 to 3, mitigations and the eight exception markers | `classifier.test.ts`, `rules.test.ts`, `mitigation.test.ts`, `mitigation-phrasing.test.ts`, `mitigation-texts.test.ts`, `heading.test.ts` (all in `src/lib/analyzer/`) |
| The house: eight rooms in order, one ghost per finding, "Quiet" rooms, room props | `src/components/house/House.test.tsx`, `Room.test.tsx`, `RoomProp.test.tsx`, `src/lib/ui/houseModel.test.ts`, `houseModel.property.test.ts`, `e2e/flow.spec.ts` |
| Ghost levels differ in size, shape, opacity, colour, motion and numeral; 44 px hit areas | `src/components/house/Ghost.test.tsx`, `e2e/flow.spec.ts` (computed styles), `e2e/layout.spec.ts` |
| Ghost detail panel: exact clause, explanation, why it matters, source badge, not legal advice | `src/components/house/DetailDialog.test.tsx`, `e2e/flow.spec.ts`, `e2e/keyboard.spec.ts` |
| Haunt Score: whole number, at most 97, per-room ceilings, shown as "N · band" | `src/lib/analyzer/score.test.ts`, `score.property.test.ts`, `src/components/house/ScoreBadge.test.tsx` |
| Lights on mode: the same findings as a plain list, with the reassurance line | `src/components/house/LightsOnList.test.tsx`, `src/components/house/Toolbar.test.tsx`, `e2e/lights.spec.ts` |
| Keyboard: one Tab stop per room, arrow keys between ghosts, Enter and Escape | `src/lib/ui/roving.test.ts`, `roving.property.test.ts`, `e2e/keyboard.spec.ts` |
| Reduced motion, flash limits, Lights on stops every repeating animation | `e2e/motion.spec.ts`, `src/components/HauntedApp.test.tsx` |
| Sound off by default, synthesised, no audio files | `src/lib/ui/sound.test.ts`, `scripts/assets.test.mts` |
| 360 px to desktop with no clipped text or overlapping controls | `e2e/layout.spec.ts` |
| Accessibility: no serious or critical axe issue in any state; focus ring; headings and landmarks | `e2e/a11y.spec.ts`, `e2e/shell.spec.ts`, `e2e/lights.spec.ts` |
| English-only notice for non-English text | `src/lib/analyzer/language.test.ts`, `e2e/edge.spec.ts` |
| Loading and error states with "Try again" that keeps the text | `e2e/loading.spec.ts`, `src/components/HauntedApp.test.tsx`, `src/lib/ui/retryableImport.test.ts` |
| Works fully with no API key | `e2e/optin-hidden.spec.ts`, `e2e/llm-guard.spec.ts`, `src/lib/llm/handler.test.ts` (no-key case), `src/app/api/explain/route.test.ts` |
| Optional medium: opt-in only, only flagged clauses sent, can raise or confirm but never lower a severity, falls back on bad output, timeout or no key | `e2e/optin.spec.ts`, `src/components/house/OptInPanel.test.tsx`, `src/lib/llm/merge.property.test.ts`, `handler.test.ts`, `handler.property.test.ts`, `request.property.test.ts`, `parse.property.test.ts`, `provider.test.ts`, `client.test.ts` |
| One server route with Origin check, body limits, Zod validation, 405s and `no-store` | `src/lib/llm/origin.test.ts`, `schema.test.ts`, `handler.test.ts`, `e2e/explain-route.spec.ts` |
| Rate limit: 10 a minute per IP, best-effort | `src/lib/llm/rateLimit.test.ts`, `rateLimit.property.test.ts` |
| The key never reaches the browser | `npm run check:bundle`, `src/lib/llm/server-only.test.ts`, `src/lib/llm/availability.test.ts` |
| No stored text, no logs of clause text | `src/lib/no-storage.test.ts`, `e2e/flow.spec.ts` (storage, cookies and IndexedDB empty), `handler.test.ts` (console spy) |
| Samples never call the API, and the build never calls Google | `e2e/flow.spec.ts`, `scripts/package-scripts.test.mts`, `scripts/precompute-samples.test.mts`, `src/lib/samples/explanations.test.ts` |
| "Not legal advice" in the footer and the detail panel | `src/components/Footer.test.tsx`, `DetailDialog.test.tsx`, `src/app/layout.test.tsx` |
| Fast first screen on a slow connection | `e2e/perf.spec.ts` (paste box usable after about 1.65 s; 142,493 bytes of first-load JavaScript, budget 204,800) |

## 3. Test results

From the fresh clone of `6c047f6` (section 1) and the Gate 6 rules-auditor run.

| Kind | Count | Result |
| --- | --- | --- |
| Unit tests (Vitest, including script and docs tests) | 771 | all pass |
| Property-based tests (fast-check) | 38 tests holding 36 `fc.assert` calls in 10 files | all pass |
| Unit and property total | 809 in 72 files | all pass, none skipped |
| End-to-end tests (Playwright, no-key and llm-ui projects) | 85 | all pass, none skipped or flaky, `retries: 0` |
| Screenshot tests (`npm run screenshots`, run separately) | 3 | passed at Task 32.0 |

- **Cases per property:** 1,000 for every property (`numRuns: 1000`). The test-verifier agent checked this at every gate.
- **Line coverage:** 96.86% overall (618 of 638 lines). By path, from the Gate 5 test-verifier report (no `src/` file changed after it): `src/lib/analyzer` 100% (target 90%), `src/lib/llm` 99.47% (target 90%), the rest of `src/` 93.14% (target 80%).
- **Other checks:** `npm run typecheck`, `npm run lint`, `npm run check:secrets` (240 tracked files), `npm run check:history`, `npm run check:rules`, `npm run check:bundle` and `npm run check:trace` all exit 0.

## 4. Gate history

Every report is saved unchanged in `docs/gate-reports/`.

| Gate | Agent | Verdict | Attempts |
| --- | --- | --- | --- |
| 0 (after Phase 0) | rules-auditor | PASS | 1 |
| 1 (after Phase 1, specs) | spec-reviewer | FAIL, FAIL, FAIL, then PASS | 4: the build stopped after attempt 3 and asked the user, who approved the traceability matrix and `check:trace` (PLAN_DECISIONS.md C10.21) |
| 2 (after Phase 2, analyzer) | test-verifier | PASS | 1 |
| 3 (after Phase 3, LLM explainer) | security-reviewer | PASS | 1 |
| 3 | test-verifier | PASS | 1 |
| 4 (after Phase 4, UI) | ui-a11y-reviewer | PASS | 1 |
| 4 | test-verifier | PASS | 1 (a first invocation was cut off before it reported and left no verdict) |
| 5 (after Phase 5, hardening) | spec-reviewer | FAIL, then PASS | 2 (attempt 1: R20 did not match the approved C14.7 screenshot) |
| 5 | security-reviewer | PASS | 1 |
| 5 | rules-auditor | PASS | 1 |
| 5 | ui-a11y-reviewer | PASS | 1 |
| 5 | test-verifier | PASS | 1 |
| 6 (final, after Phase 6) | rules-auditor | PASS | 1 |

## 5. Rules checklist (PLAN.md section 3)

Each item was answered Yes by the rules-auditor at Gate 6 (`docs/gate-reports/phase-6-rules-auditor-attempt-1.md`; auditor item IDs in brackets).

| Item | Result | Evidence |
| --- | --- | --- |
| All code is new, written 30 October to 4 December 2026 [R1] | PASS | Every commit is dated 16–17 November 2026 (`git log`); Gate 6 report R1 |
| Only standard resources reused, each listed in the README under "Pre-existing work" [R2] | PASS | README.md "Pre-existing work" and "Licenses" |
| /.kiro at the root with specs, hooks and steering [R3] | PASS | `git ls-files .kiro`: 3 specs, traceability.md, 6 steering files, 4 hooks, 5 agents, `settings/mcp.json` |
| .gitignore has no line matching .kiro [R4] | PASS | `npm run check:rules` (kiro-not-ignored), `git check-ignore` on `.kiro` and 7 subpaths |
| MIT LICENSE at the root [R5] | PASS | `LICENSE` (unmodified MIT text), `package.json` `"license": "MIT"` |
| README setup steps work on a clean machine [R6] | PASS | README.md "Setup" and "Tests"; fresh clone of `6c047f6` (section 1); BUILD_LOG.md Task 33.2 |
| All source code and assets in the repository [R7] | PASS | Fonts and OFL files in `src/app/fonts/`, `src/app/icon.svg`, inline SVG art; `e2e/shell.spec.ts` (no request to another origin) |
| No secrets in tracked files or history [R8] | PASS | `npm run check:secrets`, `npm run check:history`, the auditor's own `git log -G` search |
| Installs and runs consistently; behaves as the description and video say [A1] | PASS | Build, 809 unit and 85 E2E tests; sample scores 14, 59, 97 match `docs/DEVPOST_DESCRIPTION.md` and `docs/VIDEO_SCRIPT.md` |
| No login; free, unrestricted access [A2] | PASS | No auth code; `e2e/optin-hidden.spec.ts`; `docs/DEPLOY.md` step 6 (share the public production domain) |
| Third-party libraries and APIs used within their licences and terms; licences listed [A3] | PASS | README.md "Licenses" matches `npx license-checker --production --summary`; opt-in notice in `src/lib/llm/privacy.ts`; paid-tier note in `docs/DEPLOY.md` |
| Original; no copyright, trademark or privacy problems [A4] | PASS | BUILD_LOG.md "Sample name check"; no brand names in `src/` or `docs/`; project-made art |
| Text description in English [S1] | PASS | `docs/DEVPOST_DESCRIPTION.md` |
| Demo video script under 3 minutes, showing the app running [S2] | PASS | `docs/VIDEO_SCRIPT.md`: 2:30 in seven timed segments; `scripts/submission-docs.test.mts` |
| No third-party trademarks or copyrighted music in the video [S3] | PASS | `docs/VIDEO_SCRIPT.md` "No music", no brand names (checked against 19 brands by `scripts/submission-docs.test.mts`) |
| Kiro usage write-up covering features really used [S4] | PASS | `docs/KIRO_USAGE.md` (draft, with the failures C16.3 asks for) |
| Category stated as Costume Contest [S5] | PASS | `docs/DEVPOST_DESCRIPTION.md` line 3, README.md, `docs/VIDEO_SCRIPT.md` |
| Social post begins with #KiroweenHackathon26; blog says it was written for Kiroween 2026 [S6] | PASS | `docs/SOCIAL_POST.md` (post under "## Post"), `docs/BLOG_DRAFT.md` line 5 |
| Kiro is the main build tool [K1] | PASS | `.kiro/` contents; BUILD_LOG.md Phases 0–6 |
| BUILD_LOG.md records real use of specs, steering, hooks, MCP, custom agents and property tests [K2] | PASS | BUILD_LOG.md, each backed by a file (see section 6) |

## 6. Kiro usage summary

| Feature | Number | Files |
| --- | --- | --- |
| Specs | 3 (236 acceptance criteria) | `.kiro/specs/clause-analyzer/`, `.kiro/specs/llm-explainer/`, `.kiro/specs/haunted-house-ui/` (each `requirements.md`, `design.md`, `tasks.md`); `.kiro/specs/traceability.md` |
| Steering files | 6 | `.kiro/steering/product.md`, `tech.md`, `structure.md`, `hackathon-rules.md`, `design-language.md`, `testing.md` |
| Hooks | 4 | `.kiro/hooks/test-on-save.json`, `secret-guard.json`, `rules-guard.json`, `spec-sync.json` |
| Custom agents | 5 (each has no write tool; shell limited to build/test commands) | `.kiro/agents/spec-reviewer.md`, `test-verifier.md`, `security-reviewer.md`, `ui-a11y-reviewer.md`, `rules-auditor.md` |
| MCP servers | 2 configured; 1 used through Kiro (Playwright MCP). Context7 never connected in Kiro and was only reached from the shell | `.kiro/settings/mcp.json` |
| Property-based tests | 36 properties (`fc.assert`) in 10 files, 1,000 runs each | `src/lib/analyzer/{analyze,score,splitter}.property.test.ts`, `src/lib/llm/{handler,merge,parse,rateLimit,request}.property.test.ts`, `src/lib/ui/{houseModel,roving}.property.test.ts` |
| Gate reports | 17 | `docs/gate-reports/` |
| Kiro powers | none | |

The write-up is `docs/KIRO_USAGE.md`; the record is `BUILD_LOG.md`.

## 7. Known issues and anything not done

- **The sample readings are rule-based.** `src/lib/samples/sample-explanations.json` holds rule-based entries until the author runs `npm run precompute:samples` with a key (manual step 2). The samples work either way, and only the "Medium's reading" badge and wording change.
- **The real Gemini API was never called.** Every LLM test uses a mock, and the llm-ui E2E server runs behind a dead proxy. The default model ID `gemini-4-hydrogen` comes from Google's model docs (November 2026) but was not confirmed with a live `models.get` call. Manual step 2 makes that call first and stops with an ERROR if the model or key is rejected.
- **Context7 was never used through Kiro.** Its first download ran past Kiro's 60-second MCP connect timeout, and reconnecting did not bring its tools into the session. Library facts were read from `node_modules` and vendor docs instead.
- **Spec sync hook limits.** The original `PostTaskExec` trigger and the spec task panel route never worked (`spec-task-execution` was not in the agent registry, and a task started from the panel left no trace). The `PostFileSave` replacement fires on every save of a `tasks.md`, including saves that only add a task, and not when a script edits the file. Every task ticked before Task 31.4, and parent Tasks 31 and 33 (ticked by a script edit), were therefore logged by the builder without the hook.
- **The agents' shell allow-list is not enforced as written.** At Gate 5 the rules-auditor read files with `cat`, `sed`, `head` and `npx --no-install`, which its allow-list does not include. They only read. No agent has a write tool.
- **The rate limit is best-effort**: per server instance, reset on a cold start, not shared between instances (documented in `docs/DEPLOY.md`).
- **`npm audit`** reports 7 moderate advisories, all in dev-only packages (minimatch under `@typescript-eslint`); 0 high or critical in production dependencies.
- **`license-checker` lists this package as UNLICENSED** because it is marked `"private": true`. Its licence is MIT (`LICENSE`, `package.json`); the README explains this.
- **Performance was measured locally** against `next start` with network throttling, not on Vercel.
- **English only.** Non-English text gets a notice and is not analysed for other languages.
- **`docs/SOCIAL_POST.md`** has a draft note and a "## Post" heading above the post, as the author asked. Remove both before posting so the post starts with `#KiroweenHackathon26`.
- **`.env.local` exists and holds a non-empty `GEMINI_API_KEY`.** It was created or changed during Phase 6, not by the builder, and is ignored by git. The value was never printed. No build or test sent anything to Google, and the secret, history and bundle checks are clean.

## 8. Your manual steps, in order

| # | Step | Prepared files |
| --- | --- | --- |
| 1 | Get a Gemini API key (paid tier recommended) and put it in `.env.local`. (`.env.local` already holds a key line; check that it is the one you intend.) | `.env.example`; `docs/DEPLOY.md` "Environment variables" |
| 2 | Run `npm run precompute:samples`. It prints `precompute: model=<id>` first; if it stops with an ERROR, set `GEMINI_MODEL` to a current model ID and run it again. Check that each entry in `src/lib/samples/sample-explanations.json` says `"source": "llm"` and names the model, record the model name in BUILD_LOG.md, then commit and push the file. | `scripts/precompute-samples.mts`; `docs/DEPLOY.md` "Before you deploy" |
| 3 | The public GitHub repository already exists and everything is pushed (`origin/main`). Push again after step 2. | `README.md` |
| 4 | Deploy to Vercel: import the repository, set `GEMINI_API_KEY` (and `GEMINI_MODEL` if wanted), deploy, and share only the production domain. Redeploy after any key change. | `docs/DEPLOY.md` "Deploy on Vercel" and "A key change needs a redeploy" |
| 5 | Record the demo video (about 2:30, no music) and upload it to YouTube. | `docs/VIDEO_SCRIPT.md` |
| 6 | Rewrite the Kiro write-up in your own words. | `docs/KIRO_USAGE.md` (draft) |
| 7 | Fill in and submit the Devpost form (category: Costume Contest), adding the app and video links. | `docs/DEVPOST_DESCRIPTION.md` |
| 8 | Rewrite and publish the blog post and the social post. Remove the draft notes first. | `docs/BLOG_DRAFT.md`, `docs/SOCIAL_POST.md` (both drafts) |
