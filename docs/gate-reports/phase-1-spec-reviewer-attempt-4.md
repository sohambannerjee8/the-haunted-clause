VERDICT: PASS
Gate: Gate 1 (end of Phase 1), spec-reviewer, attempt 4
Date: 16 November 2026

Evidence (one line per check):
1. Yes - `ls -la .kiro/specs/*`: `clause-analyzer/`, `llm-explainer/` and `haunted-house-ui/` each hold `requirements.md`, `design.md` and `tasks.md`. `.kiro/specs/traceability.md` (256 lines) sits beside them. `git status --short` is empty, so the working tree is HEAD 79cd546.
2. Yes - The criterion counts are 69 (clause-analyzer), 72 (llm-explainer) and 95 (haunted-house-ui), 236 in total, which matches `check:trace`. Every criterion starts with WHEN, WHILE, FOR or THE, or is a ubiquitous statement (EACH, EVERY, ALL, NOTHING, ROOMS, AN, "Tab…", "Enter…", "docs/DEPLOY.md…", "`npm run build`…"). The grep for numbered criteria without "SHALL" returned nothing. The new haunted-house-ui R10.5 is a WHILE criterion and R19.4 is an EVERY criterion.
3. Yes - Every criterion names an observable result. Timing and size limits are numbers:
   - clause-analyzer R6.3: 1 s.
   - llm-explainer R5.1 and R5.2: 15 s and 15.5 s.
   - haunted-house-ui R10.4: at least 1 s per repeating cycle, at most 300 ms for one-off animations.
   - haunted-house-ui R11.3: 600 ms.
   - haunted-house-ui R12.1: scroll, clipping and overlap measures.
   - haunted-house-ui R18: 5 s and 200 kB.
   
   A grep for vague words found only "logical order" (haunted-house-ui R9.7, defined by the list that follows it) and "loud error" (llm-explainer R16.13, defined by what the error must name).
4. Yes - Both conditions in C10.21 hold.
   - `npm run check:trace` exits 0: "check-traceability: all 236 criteria have a row with a named test or check listed in its task (236 rows)".
   - Spot check of 30 entries, 10 per spec. I read each entry's tasks by hand: every named test or check appears in one of the entry's tasks. The second column says whether the test also checks everything the criterion requires.

   | ID | Named test listed in task | Test checks the whole criterion? |
   | --- | --- | --- |
   | CA-R1.4 | `splitter.test.ts` in 11.2 | Yes |
   | CA-R1.10 | `splitter.test.ts` in 11.2 (11 abbreviations, capitalised forms, `zinc. Then`) | Yes |
   | CA-R1.12 | `splitter.property.test.ts` in 11.3 | Partly: P6 with `overCapString` covers R1.1, R1.2 and R1.5 over the cap, but no generator list runs P8 (the `c-<start>` IDs, R1.6) over the cap |
   | CA-R2.7 | `classifier.test.ts` in 12.2 | Yes: 28 positive and 16 negative examples, at least 3 and 2 per room |
   | CA-R3.9 | `mitigation.test.ts` in 12.3 | Yes: one row per marker, eight rows |
   | CA-R3.11 | `mitigation.test.ts` in 12.3, `analyze.property.test.ts` (P10) in 14.3 | Yes |
   | CA-R5.5 | `analyze.property.test.ts` (P2) in 14.3 | Yes |
   | CA-R6.3 | `analyze.test.ts` in 14.2 | Yes: realistic text and one clause with no terminators |
   | CA-R7.4 | `purity.test.ts` in 14.4 | Yes: relative imports, text modules import only analyzer types, `meta.ts` imports nothing, `index.ts` rule |
   | CA-R11.2 | `samples.test.ts` in 15.2, plus `agent:rules-auditor` item A4 | Yes |
   | LE-R1.1 | `route.test.ts` in 20.3 | Yes: exactly one `route.ts` under `src/app`, and it is the only file there that imports `gemini.ts` |
   | LE-R1.3 | `route.test.ts` and `explain-route.spec.ts` in 20.3 | Yes |
   | LE-R2.4 | `origin.test.ts` in 20.1, `handler.test.ts` in 20.2 | Yes: ten cases, plus 403 with no provider call |
   | LE-R5.2 | `provider.test.ts` in 18.1 | Yes, checked at the `withTimeout` level |
   | LE-R9.3 | `rateLimit.test.ts` in 19.1 | Yes |
   | LE-R9.5 | `rateLimit.test.ts` in 19.1, `docs.test.mts` in 22.2 | Partly: the docs test looks for "best-effort" and "cold start", but not "instances do not share counts" |
   | LE-R10.2 | `handler.test.ts` in 20.2, plus `agent:security-reviewer` item 13 | Yes, together with the agent check |
   | LE-R11.1 | `no-storage.test.ts` in 23.2, plus `agent:security-reviewer` item 14 | Partly; see Problems |
   | LE-R13.4 | `request.property.test.ts` (E6) in 17.4 | Yes |
   | LE-R16.6 | `precompute-samples.test.mts` in 21.1 | Yes: regex match and no finding quotes |
   | HU-R2.6 | `InputScreen.test.tsx` in 24.1 | Yes |
   | HU-R5.4 | `Ghost.test.tsx` in 25.2 | Partly; see Problems |
   | HU-R6.7 | `keyboard.spec.ts` in 27.3 | Yes: Tab stays inside the dialog, and `:modal` implies the rest of the page is inert |
   | HU-R8.1 | `LightsOnList.test.tsx` in 28.1 | No: wrong file; see Problems |
   | HU-R10.5 | `motion.spec.ts` in 30.1 | Yes |
   | HU-R11.4 | `assets.test.mts` in 23.2 | Yes |
   | HU-R17.2 | `loading.spec.ts` in 32.2, `flow.spec.ts` in 24.2 | Yes |
   | HU-R17.5 | `loading.spec.ts` in 32.2 | Partly; see Problems |
   | HU-R19.3 | `shell.spec.ts` in 23.2, `flow.spec.ts` in 25.3 | Partly; see Problems |
   | HU-R19.4 | `keyboard.spec.ts` in 27.3 | Yes |

   The "Partly" and "No" entries do not fail item 4 as C10.21 defines it. They are listed as TRACEABILITY problems below.
5. Yes - The five abilities are covered:
   - Paste or pick a sample: haunted-house-ui R2, R3 and R15; clause-analyzer R11.
   - Ghosts in eight rooms: haunted-house-ui R4 and R5.
   - Click a ghost for the quote, explanation and why it matters: haunted-house-ui R6.2.
   - Haunt Score: clause-analyzer R5; haunted-house-ui R7.
   - Lights on: haunted-house-ui R8.
6. Yes - The Glossary "Room" table in `clause-analyzer/requirements.md` matches PLAN.md section 2 word for word for all eight rooms and clause types. haunted-house-ui (Glossary "Room") and llm-explainer (design "Prompt", which uses `ROOMS`) take the names from that table.
7. Yes - `clause-analyzer/design.md` lines 365–370 link each property to requirements:
   - P1 → R5.2
   - P2 → R5.5
   - P3 → R4.1, R4.2
   - P4 → R6.1, R6.2
   - P5 → R7.1, R7.3
   - P6 → R1.1, R1.2, R1.5, R1.12, R1.13
   
   Line 352 sets `fc.assert(property, { numRuns: 1000 })`, and `tasks.md` line 3 repeats it. All 7 `numRuns` hits in specs and steering are 1000.
8. Yes - Both decisions are covered with the tests they ask for:
   - C1.10 abbreviations: R1.10 and R1.11. Task 11.2 has one test per abbreviation mid-sentence, the capitalised forms, and `etc.` before a paragraph break.
   - C1.7 and C10.2 markers: all eight are in the Glossary and in R3.2–R3.11. The 19-row "Mitigation and exception-marker tests" table covers each marker, a marker before the mitigation, a marker in another clause, the C10.2 sentence (R3.10 b) and the three C10.8 cases. Task 12.3 implements it.
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
11. Yes - `llm-explainer/design.md` lines 399–402 list E1 (never lowers a severity), E2 (never changes a quote), E3 (same IDs) and E4 (`fc.anything()` falls back without throwing). Line 395 sets `numRuns: 1000`. Tasks 17.2, 17.3 and 20.2 implement them.
12. Yes - Each item maps to a haunted-house-ui requirement:
    - Input screen: R2
    - House and eight rooms: R4
    - Four ghost levels: R5.4
    - Detail panel: R6
    - Score and bands: R7, Glossary "Band"
    - Lights on: R8
    - Roving tabindex: R9
    - Reduced motion: R10.2, R10.3, R10.5
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
    - Only OFL fonts committed locally, art made in the project, Web Audio sound and no audio files: haunted-house-ui R1.4, R1.5, R11.4.
    - English only: clause-analyzer R9; haunted-house-ui R16.3.
    - Only flagged clauses sent: llm-explainer R13.4, E6.
    - Samples never call the API: haunted-house-ui R15.2; llm-explainer R16.8.
    - Test hosts are `.example` and `example.vercel.app` names.
    - The `llm-ui` server runs behind a dead proxy (C10.18).
14. Yes - The task-heading grep gives 11–16 in `clause-analyzer/tasks.md`, 17–22 in `llm-explainer/tasks.md` and 23–33 in `haunted-house-ui/tasks.md`. These match PLAN_DECISIONS.md section D.
15. Yes - Every C10.22 item is reflected:
    - Named checks for R2.6, R6.7, R11.4, R17.2 and R19.3.
    - Heading structure: haunted-house-ui `design.md` line 154.
    - `await connection()` in `methodNotAllowed()`, plus the production E2E test: llm-explainer design "Keeping the 405 dynamic", Task 20.3. The bundled `15-route-handlers.md` line 124 says that calling `connection()` stops prerendering.
    - R10.5 and R19.4 added, and the design-language steering updated to match.
    - `shell.spec.ts` named.
    - `meta.ts` in clause-analyzer Task 15.2, importing nothing, per R7.4.
    - Files row for `route.ts` fixed.
    - One-route test in `route.test.ts`.
    - security-reviewer item 6 updated.
    - `server-only.test.ts`, `assets.test.mts`, `HauntedApp.test.tsx` and the extended `no-storage.test.ts` added.
    
    C10.21 (the matrix and `check:trace`) and the earlier overrides still hold: C10.1, C10.2, C10.6 (maximum 97, no "/100"), C10.8, C10.10–C10.20.

Commands run:
- `ls -la .kiro/specs .kiro/specs/* .kiro/steering .kiro/agents docs/gate-reports` -> exit 0; 9 spec files plus `traceability.md`.
- `git log --oneline -8` -> exit 0; HEAD 79cd546 "Gate 1 prep for attempt 4: traceability matrix + check:trace, named checks for every criterion, connection() for 405 handlers".
- `git status --short` -> exit 0; empty.
- `wc -l` on PLAN.md, PLAN_DECISIONS.md, BUILD_LOG.md, the 9 specs and the matrix -> 3,558 lines in total.
- `npm run check:trace` -> exit 0; "check-traceability: all 236 criteria have a row with a named test or check listed in its task (236 rows)".
- `git show --stat HEAD` and `git diff --stat 2e5813c HEAD` -> exit 0; 20 files changed, 624 insertions and 50 deletions.
- `git diff 2e5813c HEAD -- .kiro/agents .kiro/steering` -> exit 0; reviewed the agent and steering changes.
- Criterion counts and lead words per `requirements.md` (grep, uniq) -> 69, 72, 95; no criterion without SHALL.
- Vague-word grep -> two hits, both defined in their criterion.
- Task-heading grep -> 11–16, 17–22, 23–33. `numRuns` grep -> 7 hits, all 1000.
- `grep` in `node_modules/next/dist/docs/.../connection.md` and `15-route-handlers.md` -> line 124: prerendering stops when a `GET` handler calls `connection()`.
- `grep` for `h2`, `aria-pressed`, "render error" and `ErrorBoundary` in the haunted-house-ui specs -> the evidence for the Problems below.
- `grep` in `.kiro/agents/rules-auditor.md` -> item A4 exists. `security-reviewer.md` items 6, 7, 13 and 14 exist.
- `grep` and `tail` on BUILD_LOG.md -> the attempt 3 stop, the user's decision and the attempt 4 fix list.
- Not run: `scripts/check-traceability.test.mts`. Vitest is outside this agent's allow-list. BUILD_LOG.md says its 12 tests passed.

Problems:
- `.kiro/specs/traceability.md` line 251, HU-R19.3 (TRACEABILITY): two parts of `haunted-house-ui/requirements.md` R19.3 have no named check. The `shell.spec.ts` row checks one `main` and one `h1` on the input screen. The `flow.spec.ts` row and Task 25.3 check the `h2` "Inside the house" and the `h3` room headings. Neither checks:
  - the `h2` "Lights on" in Lights on mode;
  - the detail panel title being an `h2` inside the dialog.
  
  `lights.spec.ts`, `DetailDialog.test.tsx` and `keyboard.spec.ts` do not mention heading levels either.
- `.kiro/specs/traceability.md` line 200, HU-R8.1 (TRACEABILITY, naming): the row names `LightsOnList.test.tsx` for the toggle's `aria-pressed`. But the toggle is in the Toolbar (`design.md` component tree: "Toolbar.tsx: Read another policy · Lights on · Sound"). The design's `LightsOnList.test.tsx` row (line 249) checks only the list. Task 28.1 says "`aria-pressed` toggles" without naming a file. The `Toolbar.test.tsx` design row (line 256) still lists only the sample line, even though Tasks 28.1 and 30.1 extend that test with the toggles.
- `.kiro/specs/traceability.md` line 187, HU-R5.4 (TRACEABILITY): R5.4 requires each ghost's drawn size, opacity and colour to follow the design-language table. `Ghost.test.tsx` checks only "the level class", and jsdom does not apply `globals.css`, so no test checks the size, opacity or colour values the class produces. No E2E row checks them either. The ui-a11y-reviewer's "ghost matches its severity" check at Gate 4 is not named in the matrix.
- `.kiro/specs/traceability.md` line 246, HU-R17.5 (TRACEABILITY): Task 32.2 says "A render error shows the error boundary message" in `loading.spec.ts`. But the design's `loading.spec.ts` row (line 274) covers only the delayed and blocked chunk. No design section says how a production-build E2E test would cause a render error in the house view.
- `.kiro/specs/traceability.md` line 121, LE-R11.1 (TRACEABILITY): `llm-explainer/requirements.md` R11.1 forbids writing request or response content to "files, databases, caches, cookies or any store". It also requires the rate limiter to hold only IP keys and timestamps. Neither named check covers caches or the rate-limiter contents:
  - `no-storage.test.ts` (`design.md` line 253) checks only `fs`, `node:fs` and `cookies()`.
  - `security-reviewer.md` item 14 lists file writes, databases, storage, IndexedDB and cookies.
  
  This matters because Cache Components is on, so a `"use cache"` scope in llm or api code would be a store.
- `.kiro/specs/traceability.md` line 214, HU-R10.3 (TRACEABILITY): `motion.spec.ts` checks `animation-name: none` only on `.hc-ghost` under reduced motion. R10.3 requires every CSS animation to be disabled by the media query, and the animated parts to be wrapped in `MotionConfig reducedMotion="user"`. No named check covers either beyond ghosts.
- `.kiro/specs/traceability.md` line 101, LE-R4.5 (TRACEABILITY): R4.5 says the Gemini provider is the only module that reads `GEMINI_API_KEY`, apart from `isLlmAvailable`. `server-only.test.ts` (llm-explainer `design.md` line 421) checks only that every file containing the key name imports `server-only`. It does not check which files read the key.
- `.kiro/specs/traceability.md` line 22, CA-R1.12 (TRACEABILITY, minor): P8 (the `c-<start>` IDs, R1.6) is not run with `overCapString`, so R1.6 over the cap has no check. The clause-analyzer Task 11.3 and design generator lists do not include it.
- `.kiro/specs/llm-explainer/requirements.md` R9.5 and `design.md` `scripts/docs.test.mts` row (TRACEABILITY, minor): the docs test looks for "best-effort" and "cold start", but not for the required statement that instances do not share counts.
- `.kiro/specs/haunted-house-ui/design.md` testing tables (MINOR): the design lags behind the tasks and the matrix.
  - The `flow.spec.ts` row does not include the R17.2 loading check that Task 24.2 assigns to it.
  - The `Toolbar.test.tsx` row lacks the Lights on and Sound toggles (R8.1, R11.2).
  - The `loading.spec.ts` row lacks the render error (R17.5).
- `.kiro/specs/traceability.md` line 221 (MINOR): HU-R12.1 says "(15 states)", but R12.1 lists 16 when each sample and each opt-in state is counted, or 12 as written.
- `.kiro/specs/haunted-house-ui/design.md` "House and rooms" (MINOR): C1.8 requires a quiet room's "Quiet" status to be in its accessible name, and R4.5 gives "The Trapdoor, quiet". But the room `<section>` takes its name from the `h3` alone, and the design says only that the labelled `role="group"` "holds the buttons", while a quiet room "has no buttons". The design does not say whether quiet rooms render the labelled group.
- `.kiro/agents/spec-reviewer.md` line 25 (MINOR): the "Tool limits" text lists `git log`, `git ls-files`, `git show`, `git check-ignore`, grep, ls and wc. The front-matter allow-list also has `git diff*` and `npm run check:trace*`. PLAN_DECISIONS.md C8's shell list does not include `git diff`.

Attempt 3 problems:
- haunted-house-ui R2.6 (counter not announced on every keystroke): **resolved**. The `InputScreen.test.tsx` row (`design.md` line 241) checks `aria-live="off"` and that no ancestor is a live region. Task 24.1 lists it, and so does matrix row HU-R2.6.
- haunted-house-ui R6.7 (focus kept inside the dialog, rest of the page inert): **resolved**. `keyboard.spec.ts` presses Tab and Shift+Tab 10 times, checks that `document.activeElement` stays inside the dialog, and checks that the dialog matches `:modal`. Task 27.3 lists 6.7.
- haunted-house-ui R17.2 ("Opening the house…" with `aria-busy`): **resolved**. `loading.spec.ts` (design line 274, Task 32.2) and Task 24.2's `flow.spec.ts` part check both. The design `flow.spec.ts` row does not list it (minor, above).
- haunted-house-ui R11.4 (no audio files): **resolved**. `scripts/assets.test.mts` checks `git ls-files` for eight audio extensions and checks `src/` for `new Audio(` and `<audio`. Task 23.2 lists it.
- haunted-house-ui R19.3 (one `main`, heading levels, undefined house heading): **partly resolved**.
  - The heading structure is now defined (`design.md` line 154; R19.3 rewritten).
  - `shell.spec.ts` checks the single `main`, and `flow.spec.ts` checks the `h2` and `h3` levels on the house.
  - The Lights on `h2` and the dialog `h2` still have no check (TRACEABILITY, above).
- llm-explainer `GET` prerender risk under Cache Components: **resolved**. `methodNotAllowed()` now awaits `connection()` (llm-explainer `design.md` "Keeping the 405 dynamic"). The bundled docs (`15-route-handlers.md` line 124) say this stops prerendering. `route.test.ts` checks that `connection()` is awaited. `e2e/explain-route.spec.ts` checks the 405 status, `Allow: POST` and `no-store` against `next start`. Task 20.3 holds both tests.
- Stale `route.ts` Files row: **resolved**. llm-explainer `design.md` Files table: "Exports `POST`, `GET`, `PUT`, `PATCH`, `DELETE` and `maxDuration = 30`".
- Task 23.2's unnamed shell E2E test: **resolved**. `e2e/shell.spec.ts` is named in Task 23.2 and has its own row in the design's E2E table.
- clause-analyzer R7.4 `meta.ts` came from another spec and could import the sample texts: **resolved**.
  - R7.4 says `meta.ts` "SHALL import nothing at all".
  - It is in the clause-analyzer Files table and created in Task 15.2.
  - `purity.test.ts` (Task 14.4) fails on any import in it.
  - The haunted-house-ui design and Task 24.1 point to clause-analyzer Task 15.2.
- design-language focus ring "on every focusable element": **resolved**. New haunted-house-ui R19.4, checked by `keyboard.spec.ts` (every control reached by Tab on both screens), Task 27.3.
- design-language 5-second motion rule: **resolved**. New haunted-house-ui R10.5 and the design's "Stopping motion" section. `motion.spec.ts` checks that Lights on leaves no repeating animation running (Task 30.1). The steering line 70 now names Lights on as the way to stop motion.
- llm-explainer R1.1 had no one-route test: **resolved**. `route.test.ts` checks that `src/app` holds exactly one `route.ts` and that it is the only file under `src/app` that imports `gemini.ts` (Task 20.3).
- security-reviewer item 6 mentioned a build-time script: **resolved**. Item 6 now exempts only `scripts/precompute-samples.mts`, "which runs only by hand … and is never run by the build (PLAN_DECISIONS.md C10.14)".

None of the problems in this report is a CONFLICT or a SCOPE problem. The open items are TRACEABILITY and MINOR. Under C10.21, the builder logs them in BUILD_LOG.md and adds them to the relevant tasks.
