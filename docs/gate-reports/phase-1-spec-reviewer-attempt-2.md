VERDICT: FAIL
Gate: Gate 1 (end of Phase 1), spec-reviewer, attempt 2
Date: 16 November 2026

Evidence (one line per check):
1. Yes - `git ls-files .kiro/specs` lists 9 tracked files: `requirements.md`, `design.md` and `tasks.md` in each of `clause-analyzer/`, `llm-explainer/` and `haunted-house-ui/`. `git status --short` is empty, so the working tree matches HEAD 71ca9a6.
2. Yes - Every numbered criterion starts with THE, WHEN, WHILE, IF, WHERE or FOR, or is a ubiquitous "<subject> SHALL …" statement. The grep of lead words outside that set returned only EACH, EVERY, ALL, NOTHING, AN, ROOMS, "Tab and Shift+Tab", "Enter and Space", "docs/DEPLOY.md" and "`npm run build`", all in ubiquitous SHALL form (for example clause-analyzer line 184, haunted-house-ui lines 95–100 and 161, llm-explainer lines 81 and 193). The attempt 1 lead words OTHERWISE, AT, BECAUSE and WITH no longer appear (grep exit 1).
3. Yes - Each criterion names an observable result. The attempt 1 vague wordings are now measured: llm-explainer R3.3 (line 59: no import from `src/lib/llm/`, plus a no-key `flow.spec.ts` check); haunted-house-ui R12.1 (line 180: `scrollWidth <= clientWidth + 1`, viewport bounds, no intersecting control boxes); and R10.4 (line 161: each cycle at least 1 s, at most one opacity peak). Timing and size limits are numeric: clause-analyzer R6.3 (1 s), haunted-house-ui R11.3 (600 ms), R18 (5 s, 200 kB). See Problems for an inconsistency in R10.4.
4. No - Some criteria are in a task's `_Requirements:_` range, but none of that task's listed tests checks them:
   - llm-explainer R16.6 (line 197, summary line per sample with no clause text): Task 21.1 and the `precompute-samples.test.mts` row (`design.md` line 419) check only the model line.
   - haunted-house-ui R1.1 (line 45): no test checks the `h1` text "The Haunted Clause", `lang="en"` or the title value. Task 23.2 lists only footer, skip link, font requests, no-storage and axe.
   - haunted-house-ui R1.2 (line 46): no test checks the "automated and can be wrong" sentence. `Footer.test.tsx` (`design.md` line 249) checks only "Not legal advice".
   - haunted-house-ui R2.5 (line 62): no test checks the one-line description. `SampleCards.test.tsx` (line 242) checks only cards and button names.
   - haunted-house-ui R4.6 (line 87): no test checks that the frame is `aria-hidden`.
   - haunted-house-ui R5.6 (line 100): no test checks the focus ring. `Ghost.test.tsx` (line 243) does not cover it.
   
   All other criteria trace to a task and a named test, property or check.
5. Yes - The five abilities are covered:
   - Paste or pick a sample: haunted-house-ui R2, R15; clause-analyzer R11.
   - Ghosts in eight rooms: haunted-house-ui R4, R5.
   - Click a ghost for the quote, explanation and why it matters: haunted-house-ui R6.2.
   - Haunt Score: clause-analyzer R5; haunted-house-ui R7.
   - Lights on: haunted-house-ui R8.
6. Yes - The `clause-analyzer/requirements.md` Glossary "Room" table has all eight names and clause types exactly as in PLAN.md section 2. The other two specs take them from `ROOMS`: haunted-house-ui Glossary "Room", and llm-explainer `design.md` "Prompt".
7. Yes - `clause-analyzer/design.md` "Correctness properties" links P1→R5.2, P2→R5.5, P3→R4.1/4.2, P4→R6.1/6.2, P5→R7.1/7.3 and P6→R1.1/1.2/1.5/1.13. Line 351 sets `fc.assert(property, { numRuns: 1000 })`, and `tasks.md` line 3 repeats it.
8. Yes - Abbreviations (C1.10) are in R1.10 and R1.11, and Task 11.2 has one test per abbreviation plus `etc.` before a paragraph break. Exception markers (C1.7, C10.2) are in the Glossary (all eight) and R3.2–R3.11. The "Mitigation and exception-marker tests" table has 19 rows (awk count), with one row per marker, marker-before-mitigation, marker in another clause, the C10.2 sentence and the three C10.8 cases. Task 12.3 implements them.
9. Yes - The cap is R8.1–R8.3 (typed `too-long`, exactly 50,000 accepted) plus R6.2 (no throw). The non-English flag is R9.1–R9.6. Determinism is R7.1–R7.3 and P5. All are in Tasks 14.1–14.4.
10. Yes - Every listed item is covered in `llm-explainer/requirements.md`:
    - Single route: R1.1.
    - Zod on input and output: R2.3, R6.1.
    - 15-second timeout: R5.1, R5.2.
    - Fallback on no key, timeout, invalid output and errors: R3.1, R5.1, R6.3, R7.1.
    - Rate limit with the C1.4 header order: R9.3.
    - No logging of user text: R10.
    - Pasted-text opt-in: R14.3, plus haunted-house-ui R14.
    - Flagged clauses only: R13.
    - Precompute (C1.3 as changed by C10.14): R16.1–R16.15.
11. Yes - `llm-explainer/design.md` "Correctness properties" lists E1 (never lowers severity), E2 (never changes quote), E3 (same IDs) and E4 (`fc.anything()` falls back without throwing), and line 388 sets `numRuns: 1000`. They are implemented in Tasks 17.2, 17.3 and 20.2.
12. Yes - Each item maps to a haunted-house-ui requirement:
    - Input screen: R2
    - House and eight rooms: R4
    - Four ghost levels: R5.4
    - Detail panel: R6
    - Score and bands: R7, Glossary "Band"
    - Lights on: R8
    - Roving tabindex: R9
    - Reduced motion: R10.2–R10.3
    - Sound off by default: R11.1–R11.2
    - 360 px layout: R12
    - "Not legal advice": R13
    - Opt-in UI: R14
    - Static sample explanations: R15
    - Edge states (empty, 50,000 characters, non-English, no risky clauses): R16.1–R16.4
13. Yes - Nothing breaks a scope limit:
    - No login or database anywhere.
    - Nothing stored: haunted-house-ui R1.6, R3.4; llm-explainer R11.
    - Fictional samples: clause-analyzer R11.2, R11.8.
    - Only OFL fonts committed locally, art made in the project, and Web Audio sound: haunted-house-ui R1.4, R1.5, R11.4.
    - English only: clause-analyzer R9; haunted-house-ui R16.3.
    - Only flagged clauses sent: llm-explainer R13.4, E6.
    - Samples never call the API: haunted-house-ui R15.2; llm-explainer R16.8.
    - Test hosts use `.example` and `example.vercel.app` names. The `llm-ui` server cannot reach Google, because its outbound traffic goes to a dead proxy (C10.18).
14. Yes - Task headings are 11–16 in `clause-analyzer/tasks.md`, 17–22 in `llm-explainer/tasks.md` and 23–33 in `haunted-house-ui/tasks.md`. These match PLAN_DECISIONS.md section D.
15. No - `clause-analyzer/requirements.md` line 142 (R7.4) says "the sample modules (`src/lib/samples/*.ts`) SHALL import nothing except analyzer types", and `purity.test.ts` must enforce it (Task 14.4, `design.md` Testing table). That conflicts with:
    - PLAN_DECISIONS.md C1.3 (line 28: "The JSON is validated against the Zod schema when it is imported");
    - llm-explainer `design.md` line 92 and Task 21.3: `src/lib/samples/explanations.ts` imports the JSON and Zod;
    - the samples `index.ts`, which re-exports `./mild`, `./average` and `./terrible`;
    - `samples.test.ts` and `explanations.test.ts`, which also match `src/lib/samples/*.ts`.
    
    C10.19 approved only "Relative imports for analyzer and sample modules", not the extra clause. The other overrides are reflected correctly: C10.1, C10.2, C10.6 (97 maximum, no "/100"), C10.8, C10.10 (including R5.3 "billed"), C10.11, C10.12, C10.14, C10.15, C10.16 and C10.18 (`haunted-house-ui/design.md` "E2E setup", Task 23.3, `testing.md` line 26, C8 line 161).

Commands run:
- `ls -la .kiro .kiro/* docs/gate-reports` and `wc -l PLAN.md PLAN_DECISIONS.md BUILD_LOG.md .kiro/specs/*/*.md .kiro/agents/spec-reviewer.md` -> exit 0; three spec folders with three files each, 2,291 spec lines
- `git log --oneline -8` -> exit 0; HEAD 71ca9a6 "Gate 1 attempt 1: spec-reviewer FAIL; fix traceability, measurability and the llm-ui E2E key guard"
- `git status --short` -> exit 0, empty; `git diff --stat HEAD` -> empty
- `git ls-files .kiro/specs` -> exit 0; 9 files
- `git show --stat 71ca9a6` -> exit 0; 9 spec files, `testing.md`, BUILD_LOG.md, PLAN_DECISIONS.md and the attempt 1 report changed
- `grep -rn "16\.6" .kiro/specs` -> exit 0; only llm-explainer `design.md` line 355 (summary lines, correct) and the haunted-house-ui R16.6 references
- `grep -rn -i "build-time\|prebuild\|lenient" .kiro/specs` -> exit 0; only "no prebuild" statements; no "build-time precompute", no "lenient"
- `grep -rn "{ fetch,\|fetchImpl\|rateLimiter, now }" .kiro/specs PLAN_DECISIONS.md` -> exit 0; `fetchImpl` only (llm-explainer `design.md` lines 81, 295, 297); no three-field deps
- `grep -rn -i "billed\|bill it" .kiro/specs` -> exit 0; llm-explainer `tasks.md` line 127, `design.md` lines 25, 173, 424
- `grep -rnE "^[0-9]+\. (OTHERWISE|AT|BECAUSE|WITH)\b" .kiro/specs` -> exit 1 (no match)
- lead-word grep over the three `requirements.md` files -> only the ubiquitous subjects listed in item 2; criteria counts 69 / 72 / 93
- `grep -c "explanations.test.ts" llm-explainer/design.md` -> 1
- `grep -c '| Pos |'` / `'| Neg |'` on `clause-analyzer/design.md` -> 28 / 16; awk count of the mitigation table rows -> 19
- `grep -rn "numRuns" .kiro/specs` -> all three designs and tasks state `numRuns: 1000`
- task-heading grep -> 11–16, 17–22, 23–33
- `grep -n "samples/(\*|index|explanations|meta)|R7\.4|sample modules"` -> R7.4 line 142; purity rule in clause-analyzer `tasks.md` line 104 and `design.md` Testing table; `explanations.ts` in llm-explainer `design.md` line 92 and `tasks.md` line 108
- `grep -n -i "R1\.12\|over the cap"` on clause-analyzer -> only `tasks.md` line 29
- `grep -n "Toolbar" haunted-house-ui/tasks.md` -> lines 58 (25.2 test) and 103 (28.1 "Toolbar toggle")
- `grep -n -i "fade\|duration\|transition" haunted-house-ui/design.md` -> lines 8, 130: fade-ins, with no duration given
- `grep -n -i "reads the source\|summary line"` on llm-explainer -> R9.5 (line 123) names the source check; no task or design row lists it; no test for R16.6
- `grep -n "llm-ui\|no LLM key" .kiro/steering/testing.md` -> line 26 records the C10.18 exception

Problems:
- `.kiro/specs/clause-analyzer/requirements.md` line 142 (R7.4), `clause-analyzer/tasks.md` line 104, `clause-analyzer/design.md` `purity.test.ts` row: the rule "sample modules SHALL import nothing except analyzer types", applied to `src/lib/samples/*.ts`, cannot hold. llm-explainer's `src/lib/samples/explanations.ts` (`design.md` line 92, Task 21.3) imports the JSON and the Zod schema, which C1.3 requires. `src/lib/samples/index.ts` imports the three sample files. The sample test files are not excluded from the scan. `purity.test.ts` would fail as designed, and loosening it later is barred by `testing.md` rule 2. C10.19 approved relative imports only. This conflict was introduced by the attempt 1 fix. Breaks item 15 (and makes R7.4 impossible to pass).
- `.kiro/specs/llm-explainer/requirements.md` line 197 (R16.6): no named test checks the per-sample summary line or that it holds no clause text. Task 21.1 and `design.md` line 419 check only the model line. Breaks item 4.
- `.kiro/specs/haunted-house-ui/requirements.md` R1.1 (line 45), R1.2 second sentence (line 46), R2.5 description (line 62), R4.6 (line 87) and R5.6 (line 100): each is in a task's range (23.2, 24.1, 25.2), but no listed test checks it:
  - the `h1` text, `lang="en"` and title values;
  - the "automated and can be wrong" sentence;
  - the one-line sample description;
  - `aria-hidden` on the frame;
  - the 3 px / 2 px focus ring.
  
  Breaks item 4.
- `.kiro/specs/haunted-house-ui/requirements.md` line 161 (R10.4) and `design.md` lines 8 and 130: R10.4 requires that *every* animation lasts at least 1 s per cycle, and `motion.spec.ts` checks every `document.getAnimations()` entry on each sample's house. The design adds Motion fade-ins of the house view and dialog, and gives them no duration. A normal sub-second fade that is still running when the spec samples would fail the test even though it is not a flash. The requirement and design need to agree: either state the fade durations or limit R10.4 to repeating animations. This was introduced by the attempt 1 rewording. It does not fail an item by itself.
- `.kiro/specs/haunted-house-ui/requirements.md` line 180 (R12.1) says "on every screen and state", but `layout.spec.ts` (`design.md` line 265, Task 31.1) covers only the input screen, the sample houses, an open dialog and Lights on. It misses loading, load error, the empty-input error, edge notices and the opt-in panel. This is a partial traceability gap (item 4).
- `.kiro/specs/haunted-house-ui/tasks.md` line 58: `Toolbar.test.tsx` is written in Task 25.2, but the Toolbar is not among the components that task builds (only Task 28.1 mentions "the Toolbar toggle"). Under the test-first rule, it is unclear which task makes this test pass. Minor.
- `.kiro/specs/llm-explainer/requirements.md` line 123 (R9.5) names "`rateLimit.test.ts` (reads the source for the URL)", but neither Task 19.1 nor the `design.md` `rateLimit.test.ts` row lists that check. Minor inconsistency.
- `.kiro/specs/clause-analyzer/tasks.md` line 29 says the splitter property generators include "inputs over the cap (R1.12)". The design's generators (`design.md` "Correctness properties": `anyString` and `utf16String` up to 2,000, `bigString` up to 50,000) never exceed the cap, and P6 does not list R1.12. Minor task/design mismatch.
- `.kiro/specs/llm-explainer/requirements.md` R1.4 ("`Cache-Control: no-store` on every response"): the design says Next.js generates the 405 for non-POST methods automatically (`design.md` "Handler"), so that response does not pass through `respond()`. No test checks the header on the 405. Minor.

Attempt 1 problems:
- llm-explainer R3.3 not measurable and not in a task: **resolved**. `requirements.md` line 59 now names `purity.test.ts` and `flow.spec.ts`, and Task 20.3 lists R3.3. Task 14.4 covers non-type imports from outside the analyzer.
- haunted-house-ui R15.3 had no task or test: **resolved**. It is in Task 25.2 (`Toolbar.test.tsx`), Task 25.3 and the `flow.spec.ts` row (`design.md` lines 251, 258). The sequencing nit above is new.
- haunted-house-ui R12.1 not measured: **resolved**. Line 180 defines the measures, and the `layout.spec.ts` row and Task 31.1 match them. A residual state-coverage gap is listed above.
- R1.6 and R10.4 had no checking test: **resolved**. `no-storage.test.ts` and `flow.spec.ts` storage checks are in Tasks 23.2 and 24.2, and the `motion.spec.ts` `getAnimations()` check is in Task 30.1. The new R10.4/fade inconsistency is listed above.
- llm-explainer R15.1 "build-time precompute script": **resolved**. Line 182 now reads "runs only by hand … never in the browser or the build".
- C10.10.6 "may still be billed" had no requirement: **resolved**. It is R5.3 (line 81), Task 22.2 (line 127) and `scripts/docs.test.mts` ("billed", `design.md` line 424).
- `llm-ui` placeholder key contradicted C8 and `testing.md`: **resolved**. It is recorded as C10.18 (PLAN_DECISIONS.md line 242), C8 line 161 is amended, and `testing.md` line 26 is amended. The dead-proxy setup, browser guard and server guard are in `haunted-house-ui/design.md` "E2E setup" and Task 23.3.
- Wrong R16.6 references: **resolved**. The only llm-explainer reference left is `design.md` line 355, which correctly refers to the summary lines.
- Internal llm-explainer inconsistencies: **resolved**. The client option is `fetchImpl` at lines 81 and 295. The handler deps `{ provider, rateLimiter, now, log, isKeySet }` match across the Glossary, the Files table and C5. `explanations.test.ts` appears once.
- Cross-spec relative imports and `policyLike`: **partly resolved**. The shared `src/lib/analyzer/arbitraries.test-util.ts` is used by E6, U1 and U4. The relative-import rule now exists (R7.4), but its extra clause "import nothing except analyzer types" creates the new item 15 conflict above.
- README word-for-word check deferred to Task 34: **resolved**. It moved to Task 17.5 (`tasks.md` lines 26–30).
- Non-EARS lead words: **resolved**. The grep found no match.
- Process requirements with no named check: **resolved**. clause-analyzer R11.2 and R11.8 are checked by `samples.test.ts` and rules-auditor A4. llm-explainer R9.5 and R17.3 are checked by `docs.test.mts` and `rateLimit.test.ts`. haunted-house-ui R14.8 is checked by `docs.test.mts`, and R20.4 by the BUILD_LOG record.
