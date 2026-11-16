VERDICT: FAIL
Gate: Gate 1 (end of Phase 1), spec-reviewer
Date: 16 November 2026

Evidence (one line per check):
1. Yes - `git ls-files .kiro/specs` lists 9 tracked files: `requirements.md`, `design.md` and `tasks.md` for each of `clause-analyzer/`, `llm-explainer/` and `haunted-house-ui/`.
2. Yes - Every acceptance criterion in the three `requirements.md` files is a SHALL statement with a system subject, introduced by WHEN, IF, WHILE, FOR, or written as ubiquitous THE … SHALL (e.g. clause-analyzer R1.1, llm-explainer R2.4, haunted-house-ui R4.2 WHILE). A few use non-standard lead words; they are listed under Problems as minor.
3. No - haunted-house-ui `requirements.md` R12.1 (line 180) says "no clipped text and no overlapping controls" but gives no measure (only `scrollWidth <= clientWidth` is defined). llm-explainer `requirements.md` R3.3 (line 59) says "every analyzer feature SHALL still work", which names no observable result.
4. No - llm-explainer R3.3 appears in no task's `_Requirements:_` line in `llm-explainer/tasks.md`. haunted-house-ui R15.3 ("say which sample is open … fictional company", line 215) appears in no task and no named test; only `design.md` line 172 mentions it. haunted-house-ui R1.6 (no storage or analytics, line 50), R10.4 (flash limit, line 161) and the clipped/overlap part of R12.1 are traced to Tasks 23.2, 30.1 and 31.1, but none of those tasks' listed tests checks them. All other requirements trace to a task and a named test or property.
5. Yes - The five abilities are covered. (1) Paste or pick a sample: haunted-house-ui R2, R15; clause-analyzer R11. (2) Ghosts in eight rooms: haunted-house-ui R4, R5. (3) Click a ghost for quote, explanation and why it matters: haunted-house-ui R6.2. (4) Haunt Score: clause-analyzer R5; haunted-house-ui R7. (5) Lights on: haunted-house-ui R8.
6. Yes - The `clause-analyzer/requirements.md` Glossary "Room" table has all eight room names and clause types exactly as in PLAN.md section 2. haunted-house-ui and llm-explainer take the rooms from `ROOMS` (haunted-house-ui Glossary "Room"; llm-explainer `design.md` "Prompt").
7. Yes - `clause-analyzer/design.md` "Correctness properties" (lines 345–362): P1→R5.2, P2→R5.5, P3→R4.1/4.2, P4→R6.1/6.2, P5→R7.1/7.3, P6→R1.1/1.2/1.5/1.13. Line 347 sets `numRuns: 1000`, and `tasks.md` line 3 repeats it.
8. Yes - Abbreviations: R1.10 and R1.11, Task 11.2 (one test per abbreviation, plus `etc.` before a paragraph break), matching C1.10. Exception markers: the Glossary lists all eight (C10.2); R3.2–R3.11; the `design.md` "Mitigation and exception-marker tests" table has 19 rows (counted with awk), including one row per marker, marker-before-mitigation, marker-in-another-clause, the C10.2 sentence, and the three C10.8 cases.
9. Yes - The cap is in R8.1–R8.3 (typed `too-long` error, exactly 50,000 accepted) and R6.2 (no throw). The non-English flag is R9.1–R9.6. Determinism is R7.1–R7.3 and P5. All are in Tasks 14.1–14.4.
10. Yes - Every item is covered in `llm-explainer/requirements.md`. Single route: R1.1. Zod on input and output: R2.3, R6.1. 15-second timeout: R5. Fallback on no key, timeout, invalid output and errors: R3.1, R5.1, R6.3, R7.1. Rate limit with the C1.4 header order: R9.3. No logging of user text: R10. Opt-in: R14.3, plus haunted-house-ui R14. Flagged clauses only: R13. Precompute (C1.3 as changed by C10.14): R16.1–R16.15.
11. Yes - `llm-explainer/design.md` lines 391–394 (E1 never lowers severity, E2 never changes quote, E3 same IDs, E4 `fc.anything()` falls back without throwing) at 1,000 runs (line 387). Tasks 17.2, 17.3 and 20.2 implement them.
12. Yes - Every item maps to a haunted-house-ui requirement:
    - Input screen: R2
    - House and eight rooms: R4
    - Four ghost levels: R5.4
    - Detail panel: R6
    - Score and bands: R7, Glossary "Band"
    - Lights on: R8
    - Roving tabindex: R9
    - Reduced motion: R10.2–R10.3
    - Sound off by default: R11.1–R11.2
    - 360 px: R12
    - "Not legal advice": R13
    - Opt-in UI: R14
    - Static sample explanations: R15
    - Edge states (empty, 50,000 characters, non-English, no risky clauses): R16.1–R16.4
13. Yes - No login or database anywhere. Nothing is stored: haunted-house-ui R1.6, R3.4; llm-explainer R11. Samples are fictional: clause-analyzer R11.2, R11.8. Assets are OFL fonts committed locally, art made in the project, and Web Audio only: haunted-house-ui R1.4, R1.5, R11.4. English only: clause-analyzer R9; haunted-house-ui R16.3. Only flagged clauses are sent: llm-explainer R13.4, E6. Samples never call the API: haunted-house-ui R15.2; llm-explainer R16.8. Provider and host names (Google, Gemini, Vercel) appear only as infrastructure, as C1.1 and C1.4 require.
14. Yes - `clause-analyzer/tasks.md` has Tasks 11–16, `llm-explainer/tasks.md` has Tasks 17–22, and `haunted-house-ui/tasks.md` has Tasks 23–33 (headings at the lines shown by grep). These match PLAN_DECISIONS.md section D.
15. No - Three conflicts with PLAN_DECISIONS.md:
    - `llm-explainer/requirements.md` line 181 (R15.1) still says "the build-time precompute script", which contradicts C10.14.
    - C10.10.6 (DEPLOY.md must say a timed-out call may still be billed) appears only in `llm-explainer/design.md` line 172. No requirement covers it, and it is missing from the Task 22.2 DEPLOY.md draft list (`tasks.md` line 122).
    - `haunted-house-ui/design.md` line 223 builds the `llm-ui` E2E server with `GEMINI_API_KEY=placeholder-e2e-not-a-real-key`. C8 (PLAN_DECISIONS.md line 161) and `testing.md` line 26 say E2E runs "with no key", and no C10 entry records this change. BUILD_LOG.md line 285 shows the design containing it was approved, but the decision files were not updated.

    These overrides are reflected correctly in the specs: C10.1 approval stops (BUILD_LOG.md lines 154–156, 182–220), eight markers (C10.2), Option B score with a highest score of 97 and no "/100" (C10.6), the R3.11 masking rule (C10.8), the Origin check (C10.11), privacy wording (C10.12), the manual-only precompute (C10.14), the redeploy note (C10.16), the Gate 4 screenshots (C10.15) and no `runtime` export (C10.10.3).

Commands run:
- `ls -la .kiro .kiro/agents .kiro/specs .kiro/specs/*` and `wc -l PLAN.md PLAN_DECISIONS.md .kiro/specs/*/*.md` -> exit 0; three spec folders with three files each, 2,861 lines in total
- `git ls-files .kiro/specs` -> exit 0; 9 files tracked
- `git log --oneline -12` -> exit 0; HEAD 3c429fb "Phase 1: haunted-house-ui approved and tasks…"; earlier commits show separate approval commits for each spec
- `grep -rn -i "billed\|bill it" .kiro/specs` -> exit 0; only `llm-explainer/design.md` lines 25 and 172
- `grep -rn "16\.6" .kiro/specs` -> exit 0; `llm-explainer/tasks.md` line 13 and `design.md` lines 77, 92, 354, 423
- `grep -n "15\.3\|fictional company" .kiro/specs/haunted-house-ui/*.md` -> exit 0; only `requirements.md` line 215 and `design.md` line 172, nothing in `tasks.md`
- `grep -rn -i "build-time\|prebuild\|lenient" .kiro/specs` -> exit 0; `llm-explainer/requirements.md` line 181 "build-time precompute script"; no "lenient" anywhere
- `grep -rn "/100\|75–100\|75-100" .kiro/specs .kiro/steering` -> exit 0; only "no /100" statements and the note on the old band text
- `grep -n -i "relative\|@/" .kiro/specs/clause-analyzer/*.md` -> exit 1 (no match)
- `grep -n -i "placeholder\|llm-ui\|3101" BUILD_LOG.md PLAN_DECISIONS.md .kiro/steering/*.md` -> exit 0; only BUILD_LOG.md line 285
- `grep -n "no key\|no LLM key" PLAN_DECISIONS.md .kiro/steering/testing.md` -> exit 0; PLAN_DECISIONS.md line 161, `testing.md` line 26
- `grep -c '| Pos |'` / `grep -c '| Neg |'` on `clause-analyzer/design.md` -> 28 / 16
- awk plus grep count of the mitigation table rows -> 19
- `grep -n` on `package.json` scripts -> exit 0; placeholder `prebuild` still at line 10 (Task 21.3 is meant to remove it)

Problems:
- `.kiro/specs/llm-explainer/requirements.md` R3.3 (line 59): no task lists it, and "every analyzer feature SHALL still work" names no observable result. Breaks items 3 and 4.
- `.kiro/specs/haunted-house-ui/requirements.md` R15.3 (line 215): no task in `haunted-house-ui/tasks.md` lists it, and no named test (component, `flow.spec.ts` or otherwise) checks the "Sample: <company> (a fictional company)" text. Breaks item 4.
- `.kiro/specs/haunted-house-ui/requirements.md` R12.1 (line 180): "no clipped text and no overlapping controls" is not measured, and `layout.spec.ts` (`design.md` Testing table; Task 31.1) checks only horizontal scroll and grid columns. Breaks items 3 and 4.
- `.kiro/specs/haunted-house-ui/tasks.md` Task 23.2 and Task 30.1: they list R1.6 (no `localStorage`, `sessionStorage`, cookies, IndexedDB or analytics) and R10.4 (flash limit), but none of their listed tests checks either. Breaks item 4.
- `.kiro/specs/llm-explainer/requirements.md` line 181 (R15.1): "except the build-time precompute script" contradicts C10.14 (manual only; the build never runs it). Breaks item 15.
- `.kiro/specs/llm-explainer/` (requirements.md, tasks.md line 122): approved decision C10.10.6 (DEPLOY.md notes that a timed-out call may still be billed) has no requirement and is missing from the Task 22.2 DEPLOY.md list. It exists only as a design note (`design.md` line 172). Breaks item 15.
- `.kiro/specs/haunted-house-ui/design.md` line 223 ("E2E setup"): the `llm-ui` Playwright project builds with a placeholder `GEMINI_API_KEY`. That contradicts PLAN_DECISIONS.md C8 (line 161) and `.kiro/steering/testing.md` line 26 ("with no key"), and no C10 entry records it. The browser-side guard test does not cover a server-side call: if a `page.route` stub misses, the `llm-ui` server would call Google with the placeholder key, which `testing.md` line 49 forbids ("No test makes a real network call"). Breaks item 15.
- `.kiro/specs/llm-explainer/tasks.md` line 13 and `design.md` lines 77, 92, 423: these cite R16.6 for the sample-file schema and the consistency test, but R16.6 is the summary-line criterion. The right references are R16.7 and R16.8. This is a traceability error and does not fail an item by itself.
- `.kiro/specs/llm-explainer/design.md`: the client options are named `{ fetch, timeoutMs }` in the Files table but `{ fetchImpl = fetch, timeoutMs = 20_000 }` in the "Client" section. The handler factory deps are `{ provider, rateLimiter, now }` in the requirements Glossary and C5, but `{ provider, rateLimiter, now, log, isKeySet }` in the Files table. `src/lib/samples/explanations.test.ts` appears twice in the Testing table. These are inconsistencies inside one spec.
- `.kiro/specs/haunted-house-ui/design.md` line 230: it says "the clause-analyzer design already requires" relative imports for the analyzer and sample modules. The clause-analyzer spec has no such rule (grep for "relative" and "@/" found nothing), and R7.2 does not cover `src/lib/samples/`. Also, llm-explainer E6 (`design.md` line 396) and haunted-house-ui U1/U4 (`design.md` line 214) reuse "the analyzer's `policyLike` generator", but clause-analyzer names no shared module that exports it. These are cross-spec inconsistencies in file and module names.
- `.kiro/specs/llm-explainer/tasks.md` Task 17.5: the C10.12 test that the README matches `OPT_IN_NOTICE` word for word is put off to Task 34, which is in none of the three `tasks.md` files (Phase 6). It is not covered inside the reviewed specs.
- Minor, does not fail item 2: some criteria use lead words that are not EARS keywords. These are "OTHERWISE" (`clause-analyzer/requirements.md` line 163), "AT" (`haunted-house-ui/requirements.md` lines 180, 181, 275; `llm-explainer/requirements.md` line 198), "BECAUSE" (`haunted-house-ui` line 205) and "WITH" (`haunted-house-ui` line 248).
- Process and document requirements are checked only by reading BUILD_LOG.md, README or DEPLOY.md, with no named test: clause-analyzer R11.2 and R11.8, llm-explainer R9.5 and R17.3, haunted-house-ui R14.8 and R20.4. They have tasks, but the spec does not say which check verifies them. This adds to item 4.
