VERDICT: FAIL
Gate: Gate 5 (Phase 5: hardening and polish), spec-reviewer, attempt 1
Date: 17 November 2026

Evidence (one line per check):
1. Yes - `ls -la .kiro/specs/*`: `clause-analyzer/`, `llm-explainer/` and `haunted-house-ui/` each hold `requirements.md`, `design.md` and `tasks.md`. `traceability.md` (256 lines) sits beside them. `git status --short` is empty and HEAD is ad3702c (the same as origin/main).
2. Yes - There are 69 criteria in clause-analyzer, 72 in llm-explainer and 95 in haunted-house-ui, 236 in total, the same count as Gate 1 and as `check:trace`. A grep for numbered criteria without "SHALL" returned nothing. All the reworded criteria keep an EARS lead word:
   - clause-analyzer R4.2: "FOR every finding … WHEN the clause starts with a heading line …"
   - clause-analyzer R4.5: "FOR every finding with no applied mitigation …"
   - haunted-house-ui R8.2: "THE Lights on list SHALL …"
3. Yes - The C12–C15 changes keep every criterion measurable:
   - clause-analyzer R4.2 (C14.6) defines a heading line exactly: at most 60 characters, followed by a line break and more text, not ending in `.`, `;`, `:`, `?` or `!` unless the line is a bare list number. `heading.test.ts` checks it: the quote, the slice, the ID, CRLF, the bare number, heading-only words, and five cases that must be left alone.
   - clause-analyzer R4.5 (C13) names the source of the texts by `mitigationId` and limits each text to 1–400 characters.
   - haunted-house-ui R8.2 (C13) names the exact reassurance line.
   - C12.2 changed only rule data: 45 rules, 62 examples. R2.6 and R2.7 still apply as written.
   - A vague-word grep over the numbered criteria found no hits.
4. Yes - Both conditions in C10.21 hold.
   - `npm run check:trace` exits 0: "check-traceability: all 236 criteria have a row with a named test or check listed in its task (236 rows)".
   - I checked 30 entries by hand, 10 from each spec. In each one, the named test is listed in one of that entry's tasks.
   - The changed and new rows:
     - CA-R2.2: `classifier.test.ts` is in 12.2. 16.4 adds the examples (21 negative examples in `examples.test-util.ts`).
     - CA-R2.7: `classifier.test.ts` is in 12.2. It runs `it.each` over all of `POSITIVE_EXAMPLES` and `NEGATIVE_EXAMPLES` (62 rows) and checks the per-room minimums.
     - CA-R3.2: `mitigation.test.ts` is in 12.3. `mitigation-phrasing.test.ts` is in 16.3 and includes "covers every mitigation in the table".
     - CA-R4.2: `analyze.property.test.ts` is in 14.3, `classifier.test.ts` in 12.2 and `heading.test.ts` in 16.6. The `flow.spec.ts` line 179 assertion "no clause heading in the quote (C14.6)" is also named in 16.6.
     - CA-R4.5: `rules.test.ts` is in 12.1. `classifier.test.ts` is in 12.2 and 16.5. `mitigation-texts.test.ts` is in 16.5 and includes "a cancelled mitigation … keeps the rule's texts".
     - HU-R8.2: `LightsOnList.test.tsx` is in 28.1 and 28.3. Line 59 is "shows the reassurance line for a mitigated finding, and only there (R8.2, C13)".
     - HU-R5.4: `Ghost.test.tsx` is in 25.2 and 32.0. `flow.spec.ts` is in 25.3 and checks computed size, opacity and colour per level (lines 93–96).
   - The other 23 entries:
     - CA-R1.6: `splitter.property.test.ts`, 11.3. "P8 over the cap" uses `overCapString`, so this Gate 1 gap is closed.
     - CA-R1.12: 11.3.
     - CA-R3.9: 12.3.
     - CA-R6.3: 14.2.
     - CA-R11.6: 15.2.
     - LE-R1.1: `route.test.ts`, 20.3.
     - LE-R2.4: `origin.test.ts` 20.1 and `handler.test.ts` 20.2.
     - LE-R3.3: `purity.test.ts` 14.4 and `flow.spec.ts` 24.2.
     - LE-R4.5: `gemini.test.ts` and `server-only.test.ts`, 18.3. The test now checks that only `gemini.ts` and `availability.ts` contain the key name, so this Gate 1 gap is closed.
     - LE-R5.2: `provider.test.ts`, 18.1.
     - LE-R9.5: `rateLimit.test.ts` 19.1 and `docs.test.mts` 22.2. `docs.test.mts` line 51 checks "not shared", so this Gate 1 gap is closed.
     - LE-R11.1: `rateLimit.test.ts` 19.1 and `no-storage.test.ts` 23.2. `no-storage.test.ts` lines 36–38 reject `"use cache"`, `unstable_cache` and `cacheTag`, so this Gate 1 gap is closed.
     - LE-R12.4: `merge.property.test.ts`, 17.3.
     - LE-R13.4: `request.property.test.ts`, 17.4.
     - LE-R16.6: `precompute-samples.test.mts`, 21.1.
     - HU-R4.5: `Room.test.tsx`, 25.2.
     - HU-R8.1: `Toolbar.test.tsx` 28.1 (line 16 checks `aria-pressed`) and `lights.spec.ts` 28.2. This Gate 1 naming problem is fixed.
     - HU-R10.3: `motion.spec.ts` and `HauntedApp.test.tsx` (line 46 checks `MotionConfig`), both in 30.1.
     - HU-R16.6: `HauntedApp.test.tsx`, 32.1.
     - HU-R17.5: `HauntedApp.test.tsx`, 32.2 (line 79 checks the error boundary when `HouseView` throws). This Gate 1 problem is fixed.
     - HU-R18.2: `perf.spec.ts`, 33.1.
     - HU-R19.3: `shell.spec.ts` 23.2, `flow.spec.ts` 25.3, `lights.spec.ts` 28.2 (`h2`) and `DetailDialog.test.tsx` 26.1. This Gate 1 problem is fixed.
     - HU-R2.3: `InputScreen.test.tsx` 24.1 and `edge.spec.ts` 32.1.
   - One of these tests no longer supports its criterion. HU-R20.3 (`screenshots.spec.ts`, 31.3) is contradicted by the test itself; see item 15 and Problems.
5. Yes - The five abilities in PLAN.md section 2 (lines 26–30) are covered:
   - Paste or pick a sample: haunted-house-ui R2, R3 and R15; clause-analyzer R11.
   - Ghosts in eight rooms: haunted-house-ui R4 and R5.
   - Click a ghost for the quote, explanation and why it matters: haunted-house-ui R6.2.
   - Haunt Score: clause-analyzer R5; haunted-house-ui R7.
   - Lights on: haunted-house-ui R8.
6. Yes - The `clause-analyzer/requirements.md` Glossary "Room" table matches PLAN.md lines 36–43 word for word for all eight rooms and clause types. C12–C15 renamed nothing.
7. Yes - The `clause-analyzer/design.md` "Correctness properties" table links each property to requirements:
   - P1 → R5.2
   - P2 → R5.5
   - P3 → R4.1, R4.2
   - P4 → R6.1, R6.2
   - P5 → R7.1, R7.3
   - P6 → R1.1, R1.2, R1.5, R1.12, R1.13
   
   The design sets "fc.assert(property, { numRuns: 1000 })". All 7 `numRuns` hits in specs and steering are 1000. `splitter.property.test.ts` line 6 has `RUNS = { numRuns: 1000 }`.
8. Yes - Both decisions are covered with the tests they ask for:
   - C1.10 abbreviations: R1.10 and R1.11, Task 11.2 (one test per abbreviation, the capitalised forms, `etc.` before a paragraph break).
   - C1.7 and C10.2 markers: all eight are in the Glossary and in R3.2–R3.11, with the 19-row table in the design. C12.1 widened the `NOT` macro but kept marker cancellation, and `mitigation-phrasing.test.ts` includes "an exception after the new forms still cancels the reassurance (R3.11)".
9. Yes - All three are covered:
   - Cap: R8.1–R8.3 and R6.2, with P4 using `overCapString`.
   - Non-English flag: R9.1–R9.6.
   - Determinism: R7.1–R7.3 and P5.
   
   C14.6 adds no state: the heading check is a pure function of the clause span (`classifier.ts` line 112).
10. Yes - `llm-explainer/requirements.md` has not changed since Gate 1 (`git diff 79cd546 HEAD` touches only the llm-explainer design and tasks). Every item is covered:
    - Single route: R1.1–R1.4.
    - Zod on input and output: R2.3, R6.1.
    - 15-second timeout: R5.1, R5.2.
    - Fallback on no key, timeout, invalid output and errors: R3.1, R5.1, R6.3, R7.1.
    - Rate limit with the C1.4 header order: R9.3.
    - No logging of user text: R10.
    - Pasted-text opt-in: R14.3.
    - Flagged clauses only: R13.
    - Precompute (C1.3 as changed by C10.14): R16.1–R16.15.
11. Yes - `llm-explainer/design.md` lists E1 (never lowers a severity), E2 (never changes a quote), E3 (same IDs) and E4 (`fc.anything()` falls back without throwing), with `numRuns: 1000`. Tasks 17.2, 17.3 and 20.2 implement them.
12. Yes - Each item maps to a haunted-house-ui requirement:
    - Input screen: R2
    - House and eight rooms: R4
    - Four ghost levels: R5.4
    - Detail panel: R6
    - Score and bands: R7 and the Glossary "Band"
    - Lights on: R8
    - Roving tabindex: R9
    - Reduced motion: R10.2, R10.3, R10.5
    - Sound off by default: R11.1, R11.2
    - 360 px layout: R12
    - "Not legal advice": R13
    - Opt-in UI: R14
    - Static sample explanations: R15
    - Edge states (empty, 50,000 characters, non-English, no risky clauses): R16.1–R16.4
13. Yes - Nothing in C12–C15 breaks a scope limit:
    - The new rules and examples use generic wording ("one of our clubs", "the branch") and no company names.
    - The C14 night scene, room props and fog are project-made inline SVG and CSS. `assets.test.mts` still allows only `src/app/icon.svg` and the OFL fonts.
    - No login, database or storage is added. `no-storage.test.ts` is extended.
    - The samples still never call the API (HU R15.2), and only flagged clauses are sent (LE R13).
14. Yes - Top-level task headings are 11–16 in `clause-analyzer/tasks.md`, 17–22 in `llm-explainer/tasks.md` and 23–33 in `haunted-house-ui/tasks.md`, matching PLAN_DECISIONS.md section D. The added sub-tasks sit under existing top-level tasks and create no new task number, so they stay inside the ranges: 16.3–16.6 under Task 16, 28.3 under 28, 31.6 under 31, and 32.0 under 32.
15. No - C12, C13 and C14.6 are carried into the requirements, design, tasks and matrix. C15 is in Task 32.0. But C14.7 is not reflected in haunted-house-ui R20:
    - C14.7 adds a 13th screenshot "with motion on (`house-terrible-motion-1440.png`, made by its own `@screenshots` test)".
    - `haunted-house-ui/requirements.md` line 279 (R20.3) still says "EACH screenshot SHALL be taken with reduced motion on". R20.1 (line 277) still says "(12 files)".
    - `e2e/screenshots.spec.ts` lines 47–58 use `reducedMotion: "no-preference"`, and `docs/screenshots/` holds 13 PNGs.
    - So the spec criterion, the approved decision and the committed work disagree.
    
    The checks against PLAN.md overrides that passed at Gate 1 still hold: C10.6 (maximum 97, no "/100", R7.1 unchanged by the C14.4 hero score), C10.10, C10.14, C10.18 and C10.21.

Commands run:
- `ls -la .kiro/specs/*` -> exit 0; 9 spec files plus `traceability.md`.
- `git log --oneline -15` -> exit 0; HEAD ad3702c "Task 33.2: clean clone of 6ba3320 …".
- `git status --short` -> exit 0; empty.
- `wc -l` on PLAN.md, PLAN_DECISIONS.md, the 9 specs and the matrix -> 3,304 lines in total.
- `npm run check:trace` -> exit 0; "all 236 criteria have a row with a named test or check listed in its task (236 rows)".
- `git diff --stat 79cd546 HEAD -- .kiro/specs .kiro/steering` -> exit 0; 10 files, 286 insertions and 177 deletions. The llm-explainer requirements are unchanged.
- `git log --oneline 79cd546..HEAD -- .kiro/specs` -> exit 0; spec commits for C12 (c2bcaca, 1b66fc7), C13 (afbd461, 193d844), C14 (17f1b0c, 411f6f7, e72da36) and C15 (dffaa62).
- `git diff 79cd546 HEAD` on the requirements files, the haunted-house-ui and llm-explainer designs, and tech.md -> exit 0; reviewed every change.
- Criterion count per `requirements.md` and a grep for criteria without SHALL -> 69, 72 and 95; nothing lacks SHALL.
- Vague-word grep over the numbered criteria -> no hits.
- Task-heading grep -> 11–16, 17–22 and 23–33. Sub-task grep -> 16.3–16.6, 28.3, 31.6 and 32.0 are under existing top-level tasks.
- `numRuns` grep -> 7 hits, all 1000.
- `grep` in PLAN.md -> rooms on lines 36–43 and abilities on lines 26–30. PLAN.md has no screenshot text.
- `grep` and reads of `heading.test.ts`, `mitigation-texts.test.ts`, `mitigation-phrasing.test.ts`, `classifier.test.ts`, `examples.test-util.ts`, `splitter.property.test.ts`, `LightsOnList.test.tsx`, `Ghost.test.tsx`, `Toolbar.test.tsx`, `HauntedApp.test.tsx`, `no-storage.test.ts`, `docs.test.mts`, `flow.spec.ts`, `lights.spec.ts`, `screenshots.spec.ts` and `classifier.ts` -> these back the evidence above.
- `ls docs/screenshots` -> 13 PNGs, including `house-terrible-motion-1440.png`.
- `grep` in `.kiro/hooks/spec-sync.json` -> trigger `PostFileSave` with matcher `\.kiro/specs/[^/]+/tasks\.md$`, as C12.4 says.
- Not run: Vitest and Playwright, which are outside this agent's allow-list. BUILD_LOG.md reports 769 unit tests and 71 E2E tests passing.

Problems:
- `.kiro/specs/haunted-house-ui/requirements.md` lines 277 and 279 (R20.1, R20.3); `.kiro/specs/haunted-house-ui/design.md` lines 280–292; `.kiro/specs/traceability.md` row HU-R20.3 (CONFLICT, breaks item 15):
  - R20.3 requires every screenshot to be taken with reduced motion on. R20.1 counts 12 files, and the design says "The 12 PNGs are committed".
  - PLAN_DECISIONS.md C14.7 approves a 13th screenshot with motion on. `e2e/screenshots.spec.ts` lines 47–58 make it, and it is committed in `docs/screenshots/`.
  - The matrix names `screenshots.spec.ts` as the check for R20.3, but that file now breaks R20.3. This goes against testing.md rule 6: a named test must check what its matrix row says.
  - R20 and the design were not changed when C14.7 was approved.
- `.kiro/specs/clause-analyzer/design.md` line 119 (MINOR): step "4b", which removes the heading line, comes after step 4, which chooses the room. Steps 2–4 read `input.slice(s, e)`, so in this order the heading would already have been classified. R4.2 says "the classifier reads only the rest", and `classifier.ts` line 112 removes the heading before classifying. The design's step order disagrees with the requirement and the code.
- `.kiro/specs/clause-analyzer/requirements.md` R2.2 and R2.4 (MINOR): these say what happens when rules "match a clause", without leaving out the heading line that R4.2 now excludes. `heading.test.ts` "does not let heading words alone create a finding" expects `null` for "3. Selling your data\nYou can read this policy at any time.". `cellar.sell` matches that clause's full text, so read literally, R2.4 would require a finding. R4.2 is the more specific criterion and decides the case, but R2.4 was not changed to match.
- `.kiro/specs/clause-analyzer/design.md` (MINOR, the design lags behind the tasks and matrix):
  - The Testing table's `classifier.test.ts` row says "The 44 room examples" (now 62).
  - The Testing table has no rows for `mitigation-phrasing.test.ts`, `mitigation-texts.test.ts` and `heading.test.ts`.
  - `policyLike` and P2 still say "the 28 positive and 16 negative" examples. `arbitraries.test-util.ts` now uses all 41 and 21.
  - The `Finding` type comment at line 69 still says `whyItMatters` comes "from the rule", which no longer holds after C13.
- `.kiro/specs/haunted-house-ui/design.md` (MINOR, the design lags behind C13, C14 and C15; the requirements and tasks do carry them):
  - The Lights on section (line 163) and the `LightsOnList.test.tsx` row leave out the C13 reassurance line.
  - The component tree, the "House and rooms" section and the testing table do not mention `NightScene.tsx`, `RoomProp.tsx` (or `RoomProp.test.tsx`), ghost shapes by severity, the hero score layout, or the fog and candlelight (C14.1–C14.5).
  - The `Ghost.test.tsx` row does not mention the C15 `data-face` checks.
- `.kiro/specs/haunted-house-ui/tasks.md` (MINOR):
  - Line 7 still gives instructions "for any agent started from Kiro's spec task panel (PLAN_DECISIONS.md C12.3)". C12.4 replaced that route.
  - Task 33.3 says the specs changed since Gate 1 "by C12" only, but C13, C14 and C15 also changed them.
  - Task 31.6 sits before 31.5 in the file.
  - The parent Task 31 is unticked although all of its sub-tasks are ticked.

Gate 1 problems: every TRACEABILITY and MINOR item from `phase-1-spec-reviewer-attempt-4.md` is now resolved, apart from the spec-reviewer `git diff` item, which I did not re-check against C8 (`spec-reviewer.md` line 25 now lists `git diff` and `npm run check:trace`, so the Tool limits text and the front matter now match):
- HU-R19.3, HU-R8.1, HU-R5.4, HU-R17.5, HU-R10.3, LE-R11.1, LE-R4.5, CA-R1.12/R1.6 and LE-R9.5 are resolved; see the item 4 evidence.
- The HU-R12.1 state count: the row now reads "every state listed in R12.1".
- The quiet-room accessible name: the design now puts `<section aria-label={roomLabel(model)}>` on every room.

The only CONFLICT is R20 against C14.7. Under C10.21, a conflict with PLAN_DECISIONS.md means the builder stops and asks the user.
