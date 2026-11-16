VERDICT: FAIL
Gate: Gate 1 (end of Phase 1), spec-reviewer, attempt 3
Date: 16 November 2026

Evidence (one line per check):
1. Yes - `git ls-files .kiro/specs` lists 9 tracked files: `requirements.md`, `design.md` and `tasks.md` in each of `clause-analyzer/`, `llm-explainer/` and `haunted-house-ui/`. `git status --short` is empty, so the working tree matches HEAD 25fe5b6.
2. Yes - The criterion counts are 69 (clause-analyzer), 93 (haunted-house-ui) and 72 (llm-explainer). Every criterion opens with WHEN, WHILE, FOR or THE, or is a ubiquitous statement (EACH, EVERY, ALL, NOTHING, ROOMS, AN, "Tab…", "Enter…", "`npm run build`…", "docs/DEPLOY.md…"). The grep for numbered criteria lines that lack "SHALL" returned exit 1, meaning every one contains SHALL.
3. Yes - Each criterion names an observable result, and timing and size limits are numeric:
   - clause-analyzer R6.3: 1 s.
   - llm-explainer R5.1 and R5.2: 15 s and 15.5 s.
   - haunted-house-ui R10.4 (`requirements.md` line 161): ≥ 1 s per cycle for repeating animations, ≤ 300 ms for one-off ones.
   - haunted-house-ui R11.3 (600 ms), R12.1 (scroll, clipping and overlap measures), R18 (5 s, 200 kB).
   
   No vague words are left unmeasured. See Problems for R19.3's undefined "house heading".
4. No - Five haunted-house-ui criteria, or parts of them, are in a task's `_Requirements:_` range, but no named test, property or check verifies them:
   - R2.6 (line 63): counter not announced on each keystroke.
   - R6.7 (line 114): focus kept inside the dialog, rest of the page inert.
   - R11.4 (line 172): no audio files shipped.
   - R17.2 (line 237): "Opening the house…" with `aria-busy`.
   - R19.3 (line 267): one `main` landmark and room heading level.
   
   Details are under Problems. None of these lines changed in commit 25fe5b6, so these gaps were already there at attempt 2; the fixes did not introduce them. All other criteria in the three specs trace to a task and a named test, property or check.
5. Yes - The five abilities are covered:
   - Paste or pick a sample: haunted-house-ui R2, R3, R15; clause-analyzer R11.
   - Ghosts in eight rooms: haunted-house-ui R4, R5.
   - Click a ghost for the quote, explanation and why it matters: haunted-house-ui R6.2.
   - Haunt Score: clause-analyzer R5; haunted-house-ui R7.
   - Lights on: haunted-house-ui R8.
6. Yes - The `clause-analyzer/requirements.md` Glossary "Room" table lists all eight names and clause types exactly as in PLAN.md section 2. haunted-house-ui (Glossary "Room") and llm-explainer (`design.md` "Prompt", which uses `ROOMS`) take them from that list.
7. Yes - `clause-analyzer/design.md` "Correctness properties" table links each property to requirements:
   - P1 → R5.2
   - P2 → R5.5
   - P3 → R4.1, R4.2
   - P4 → R6.1, R6.2
   - P5 → R7.1, R7.3
   - P6 → R1.1, R1.2, R1.5, R1.12, R1.13
   
   Line 351 sets `fc.assert(property, { numRuns: 1000 })`, and `tasks.md` line 3 repeats it.
8. Yes - Both decisions are covered with the tests they ask for:
   - C1.10 abbreviations: R1.10 and R1.11. Task 11.2 has one test per abbreviation mid-sentence, the capitalised forms, and `etc.` before a paragraph break. The `design.md` Testing row for `splitter.test.ts` matches.
   - C1.7 and C10.2 markers: all eight are in the Glossary and in R3.2–R3.11. The 19-row "Mitigation and exception-marker tests" table has one row per marker, a marker before the mitigation, a marker in another clause, the C10.2 sentence and the three C10.8 cases. Task 12.3 implements it.
9. Yes - All three are covered:
   - Cap: R8.1–R8.3 (typed `too-long`, exactly 50,000 accepted) and R6.2 (no throw), with P4 using `overCapString`.
   - Non-English flag: R9.1–R9.6.
   - Determinism: R7.1–R7.3 and P5.
   
   Tasks 14.1–14.3 implement them.
10. Yes - Every item is in `llm-explainer/requirements.md`:
    - Single route: R1.1–R1.4.
    - Zod on input and output: R2.3, R6.1.
    - 15-second timeout: R5.1, R5.2.
    - Fallback on no key, timeout, invalid output and errors: R3.1, R5.1, R6.3, R7.1.
    - Rate limit with the C1.4 header order: R9.3.
    - No logging of user text: R10.
    - Pasted-text opt-in: R14.3, plus haunted-house-ui R14.
    - Flagged clauses only: R13.
    - Precompute (C1.3 as changed by C10.14): R16.1–R16.15.
11. Yes - `llm-explainer/design.md` "Correctness properties" lists E1 (never lowers a severity), E2 (never changes a quote), E3 (same IDs) and E4 (`fc.anything()` falls back without throwing). Line 389 sets `numRuns: 1000`. Tasks 17.2, 17.3 and 20.2 implement them.
12. Yes - Each item maps to a haunted-house-ui requirement:
    - Input screen: R2
    - House and eight rooms: R4
    - Four ghost levels: R5.4
    - Detail panel: R6
    - Score and bands: R7, Glossary "Band"
    - Lights on: R8
    - Roving tabindex: R9
    - Reduced motion: R10.2, R10.3
    - Sound off by default: R11.1, R11.2
    - 360 px layout: R12
    - "Not legal advice": R13
    - Opt-in UI: R14
    - Static sample explanations: R15
    - Edge states (empty, 50,000 characters, non-English, no risky clauses): R16.1–R16.4
13. Yes - Nothing breaks a scope limit:
    - No login or database in any spec.
    - Nothing stored: haunted-house-ui R1.6, R3.4; llm-explainer R11.
    - Fictional samples: clause-analyzer R11.2, R11.8.
    - Only OFL fonts committed locally, art made in the project, and Web Audio sound: haunted-house-ui R1.4, R1.5, R11.4.
    - English only: clause-analyzer R9; haunted-house-ui R16.3.
    - Only flagged clauses sent: llm-explainer R13.4, E6.
    - Samples never call the API: haunted-house-ui R15.2; llm-explainer R16.8.
    - Test hosts are `.example` and `example.vercel.app` names.
    - The `llm-ui` server sits behind a dead proxy (C10.18).
14. Yes - The task-heading grep gives 11–16 in `clause-analyzer/tasks.md`, 17–22 in `llm-explainer/tasks.md` and 23–33 in `haunted-house-ui/tasks.md`. These match PLAN_DECISIONS.md section D.
15. Yes - Every C10.20 point is reflected:
    - R7.4 narrowed: `clause-analyzer/requirements.md` line 142, `tasks.md` line 104, `design.md` line 391.
    - Named tests for R16.6 and R9.5: the `precompute-samples.test.mts` and `rateLimit.test.ts` rows.
    - Named tests for R1.1, R1.2, R2.5, R4.6 and R5.6: `flow.spec.ts`, `Footer.test.tsx`, `SampleCards.test.tsx`, `House.test.tsx`, `keyboard.spec.ts`.
    - R10.4 split, with 200 ms fades: haunted-house-ui `design.md` "Ghost art and motion".
    - R12.1 state list matches `layout.spec.ts` and Task 31.1.
    - `overCapString`: clause-analyzer `design.md` line 357 and Task 11.3.
    - Explicit 405 handlers: llm-explainer R1.2–R1.4 and R8.2.
    
    The earlier overrides still hold: C10.1, C10.2, C10.6 (97 maximum, no "/100"), C10.8, C10.10–C10.16, C10.18 and C10.19.

Commands run:
- `ls -la .kiro .kiro/* docs/gate-reports` and `wc -l` on PLAN.md, PLAN_DECISIONS.md, BUILD_LOG.md, the 9 spec files, steering and agents -> exit 0; 2,298 spec lines
- `git log --oneline -6` -> exit 0; HEAD 25fe5b6 "Gate 1 attempt 2: spec-reviewer FAIL; narrow R7.4, add named checks, split R10.4, explicit 405 handlers"
- `git status --short` -> exit 0, empty
- `git ls-files .kiro/specs` -> exit 0; 9 files
- `git diff --stat HEAD~1 HEAD` -> exit 0; 9 spec files, BUILD_LOG.md, PLAN_DECISIONS.md and the attempt 2 report changed
- `git show HEAD -- .kiro/specs` (changed lines only) -> exit 0; reviewed every attempt 2 fix line by line
- Lead-word count over the three `requirements.md` files -> 69 / 93 / 72 criteria; the grep for criteria without "SHALL" -> exit 1 (no match)
- Task-heading grep -> 11–16, 23–33, 17–22
- `grep -rn "numRuns: [0-9]+"` -> 6 hits, all `numRuns: 1000` (three designs, three task lists)
- `grep` for "Opening the house", "aria-busy", "inert", "focus containment", "R6.7" in haunted-house-ui -> design lines 135 and 185 only; no test row or task test names them
- `grep` for "audio", "aria-live", "landmark" in `.kiro/**/*.md` -> R11.4 design line 179 ("No audio files are shipped"), design line 100 (`aria-live="off"`); no test row checks either; no landmark check
- `grep -n` in `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md` -> lines 87–124: "When Cache Components is enabled, `GET` Route Handlers … can be prerendered when they don't access uncached or runtime data"
- `grep -n` for `Exports .POST. and .maxDuration` -> llm-explainer `design.md` line 90 (stale row)
- `awk` on BUILD_LOG.md from "attempt 2" -> exit 0; lists the C10.20 fixes

Problems:
- `.kiro/specs/haunted-house-ui/requirements.md` line 63 (R2.6): no test checks that the counter is not a live region and does not announce on each keystroke. The design sets `aria-live="off"` (`design.md` line 100). But the `InputScreen.test.tsx` row (line 241) and Task 24.1 check only the counter format. Breaks item 4.
- `.kiro/specs/haunted-house-ui/requirements.md` line 114 (R6.7): no test checks that focus stays inside the open dialog or that the rest of the page is inert. `DetailDialog.test.tsx` covers fields, notes, plain text and Close focus return. `keyboard.spec.ts` (line 262) covers Enter, Escape and focus return, but no Tab inside the open dialog. Task 26.1 lists R6.7 but none of its tests checks it. Breaks item 4.
- `.kiro/specs/haunted-house-ui/requirements.md` line 237 (R17.2): no test checks the "Opening the house…" text or `aria-busy="true"` on `main`:
  - Task 24.2 lists R17.2, but its tests are the `flow.spec.ts` flow checks.
  - `loading.spec.ts` covers the blocked-chunk error and the retry.
  - `layout.spec.ts` visits the loading state but checks only layout.
  
  Breaks item 4.
- `.kiro/specs/haunted-house-ui/requirements.md` line 172 (R11.4): no check covers "SHALL ship no audio files":
  - `sound.test.ts` checks only the Web Audio synthesis (mocked `AudioContext`).
  - The `flow.spec.ts` request listener catches only other-origin requests, so a same-origin audio file would pass.
  
  The same kind of partial gap failed R1.2 at attempt 2. Breaks item 4.
- `.kiro/specs/haunted-house-ui/requirements.md` line 267 (R19.3): `flow.spec.ts` checks one `h1`, but nothing checks "one `main` landmark" or "room headings at one level below the house heading". `a11y.spec.ts` fails only on serious or critical issues, and axe rates `landmark-one-main`, `page-has-heading-one` and `heading-order` as moderate. Also, the design never defines a house heading: rooms are `h3` (`design.md` "House and rooms") and the dialog title is `h2`, so the reference level is undefined. Breaks item 4.
- `.kiro/specs/llm-explainer/design.md` lines 202–205 (new, from the attempt 2 fix): `route.ts` now exports a `GET` handler bound to `methodNotAllowed()`, which reads nothing from the request. Two facts make this a risk:
  - `next.config.ts` enables `cacheComponents`.
  - The bundled Next.js 16 docs (`15-route-handlers.md` lines 87–124) say that under Cache Components, a `GET` handler that reads no request or runtime data is prerendered at build time.
  
  The design does not say whether this `GET` is prerendered or dynamic. So it does not show that the 405 status, `Allow: POST` and `Cache-Control: no-store` (R1.3, R1.4) survive in production. `e2e/explain-route.spec.ts` would catch a failure, so the requirements stay testable. This does not fail an item, but it is an open design risk in the fix.
- `.kiro/specs/llm-explainer/design.md` line 90: the Files row for `route.ts` still says "Exports `POST` and `maxDuration = 30`". This is stale against R1.2 and the handler section (GET, PUT, PATCH and DELETE are also exported). Minor.
- `.kiro/specs/haunted-house-ui/tasks.md` line 17: Task 23.2 checks R1.1 in an unnamed "E2E shell check", while `design.md` line 261 puts the R1.1 check in `flow.spec.ts`. The shell E2E, which also holds the skip-link test for R1.3, has no row in the design's Testing table. Minor.
- `.kiro/specs/clause-analyzer/requirements.md` line 142 (R7.4) names `meta.ts` as a sample text module, but `meta.ts` comes from another spec:
  - It is created only by haunted-house-ui (`design.md` line 52, Task 24.1), and is not in the clause-analyzer Files table or Task 15.2.
  - R7.4 lets `meta.ts` import `mild.ts`, `average.ts` and `terrible.ts`. Doing so would pull the policy texts into the first-load chunk through `SampleCards`, against haunted-house-ui `design.md` line 192 ("sample texts stay out of the first load").
  - Task 24.1 checks only that `meta.ts` holds no policy text, not what it imports.
  
  Minor.
- `.kiro/steering/design-language.md` line 28 puts the focus ring "on every focusable element", but haunted-house-ui R5.6 (line 100) and `keyboard.spec.ts` require and check it only on ghosts and wisps. Minor consistency gap with steering.
- `.kiro/steering/design-language.md` line 70 says "No motion lasts longer than 5 seconds without a way to stop it". Ghost animations loop indefinitely, and no haunted-house-ui criterion names the way to stop them. Lights on mode (R8.1, R8.4) does hide all motion, so the rule can be met, but no criterion links the two. Minor.
- `.kiro/specs/llm-explainer/requirements.md` R1.1 ("exactly one route that calls an LLM"): no named test checks that no other route exists. Only the security-reviewer's route review at Gate 3 covers it. Minor.
- `.kiro/agents/security-reviewer.md` item 6 (outside the specs) still accepts a file that "run[s] only as a build-time script". That conflicts with C10.14 (the precompute is manual only, and the build never runs it). Minor.

Attempt 2 problems:
- clause-analyzer R7.4 conflicted with `explanations.ts`, `index.ts` and the sample test files: **resolved**.
  - `requirements.md` line 142 now limits only `mild.ts`, `average.ts`, `terrible.ts`, `meta.ts` and `index.ts` to analyzer-type imports and each other.
  - `explanations.ts` is bound only by the relative-import rule.
  - `*.test.ts` and `*.test-util.ts` are excluded.
  - `tasks.md` line 104 and `design.md` line 391 match, and so does C10.20.
  - The new `meta.ts` note above is minor.
- llm-explainer R16.6 had no test: **resolved**. The `precompute-samples.test.mts` row requires each summary line to match `^precompute: (mild|average|terrible) source=(llm|rules) llmFindings=\d+ model=\S+$` and to contain no finding quote. Task 21.1 lists this test.
- haunted-house-ui R1.1, R1.2, R2.5, R4.6 and R5.6 had no test: **resolved**.
  - R1.1: `flow.spec.ts` "On load" (`design.md` line 261) and Task 23.2.
  - R1.2: `Footer.test.tsx` second sentence and Task 23.2.
  - R2.5: `SampleCards.test.tsx` description (line 242) and Task 24.1.
  - R4.6: `House.test.tsx` `aria-hidden` with no text nodes, Task 25.2.
  - R5.6: `keyboard.spec.ts` computed outline 3 px solid `rgb(242, 181, 68)` with 2 px offset (line 262), Task 27.3, which now lists 5.6.
  - The Task 23.2 versus `flow.spec.ts` naming nit above is minor.
- R10.4 conflicted with the untimed fade-ins: **resolved**. R10.4 (line 161) separates repeating animations (≥ 1 s per cycle) from one-off animations (one direction, ≤ 300 ms). The design fixes the fades at 200 ms, opacity only, one iteration. The `motion.spec.ts` row and Task 30.1 check both rules, on the house and in an open dialog.
- R12.1 "every screen and state" was wider than `layout.spec.ts`: **resolved**. R12.1 lists 15 states, and the `layout.spec.ts` row and Task 31.1 cover the same list across both projects.
- `Toolbar.test.tsx` was written in a task that did not build the Toolbar: **resolved**. Task 25.2 now builds the Toolbar (sample line and "Read another policy"). Tasks 28.1 and 30.1 add the toggles and extend the test.
- R9.5 named a source check that no task or design row listed: **resolved**. The `rateLimit.test.ts` row now includes the URL check, and Task 19.1 says "A unit test reads `rateLimit.ts` and checks the URL is in it (R9.5)".
- Task 11.3 claimed over-cap generators that the design lacked (R1.12): **resolved**. `overCapString` (50,001–60,000) is in `design.md` line 357. P6 lists R1.12, and Tasks 11.3 and 14.3 use the generator.
- The Next.js-generated 405 lacked `Cache-Control: no-store` (R1.4): **resolved in the spec text**.
  - R1.2–R1.4 and R8.2 are updated.
  - `route.test.ts` and `e2e/explain-route.spec.ts` check 405, `Allow: POST` and `no-store`.
  - Task 20.3 lists 1.1–1.4 and 8.2.
  
  The fix brings the new Cache Components prerendering risk and the stale Files row listed above.
