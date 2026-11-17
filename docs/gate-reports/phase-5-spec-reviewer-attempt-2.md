VERDICT: PASS
Gate: Gate 5 (Phase 5: hardening and polish), spec-reviewer, attempt 2
Date: 17 November 2026

Evidence (one line per check):
1. Yes - `.kiro/specs/clause-analyzer/`, `llm-explainer/` and `haunted-house-ui/` each hold `requirements.md`, `design.md` and `tasks.md`. HEAD is 4ff469e (same as origin/main) and `git status --short` is empty.
2. Yes - The criterion counts are 69 (clause-analyzer), 72 (llm-explainer) and 95 (haunted-house-ui), 236 in total. A grep for numbered criteria without "SHALL" returns nothing. The reworded CA R2.2 and R2.4 and HU R20.1 and R20.3 keep the WHEN/EACH … SHALL form (HU requirements.md lines 277 and 279).
3. Yes - A vague-word grep (fast, nice, appropriate, quickly, reasonable, adequate, properly, easily, intuitive, good) over the numbered criteria finds nothing. The new R20.3 names something you can observe: "SHALL check that animations are running", which `e2e/screenshots.spec.ts` lines 56–57 check with `getAnimations()` and running > 0.
4. Yes - `npm run check:trace` exits 0 with "all 236 criteria have a row … (236 rows)". In all 30 spot-checked rows, the named test appears in one of the row's tasks (tasks.md line numbers checked by grep). IDs: CA-R1.3, CA-R1.10, CA-R2.4, CA-R3.3, CA-R3.11, CA-R4.1, CA-R5.2, CA-R7.1, CA-R8.2, CA-R9.2, LE-R1.3, LE-R2.3, LE-R3.1, LE-R5.1, LE-R6.1, LE-R7.1, LE-R9.3, LE-R10.1, LE-R13.1, LE-R14.3, HU-R2.6, HU-R4.6, HU-R6.2, HU-R7.1, HU-R9.2, HU-R10.5, HU-R12.1, HU-R15.2, HU-R16.4, HU-R20.3. The rewritten HU-R20.3 row now describes what `screenshots.spec.ts` does (line 15 `reducedMotion: "reduce"` for the 12; line 49 `"no-preference"` plus the running-animation check for the extra one), and it names 31.3 and 31.6, both of which mention the file (tasks.md lines 175 and 199).
5. Yes - The five abilities in PLAN.md lines 26–30 are covered: paste or pick a sample (HU R2, R3, R15; CA R11), ghosts in eight rooms (HU R4, R5), the detail panel (HU R6.2), the Haunt Score (CA R5; HU R7), and Lights on (HU R8).
6. Yes - The clause-analyzer requirements Glossary (lines 22–29) matches PLAN.md lines 36–43 word for word for all eight rooms and clause types.
7. Yes - The clause-analyzer design (lines 394–399) links P1→R5.2, P2→R5.5, P3→R4.1/R4.2, P4→R6.1/R6.2, P5→R7.1/R7.3 and P6→R1.1/R1.2/R1.5/R1.12/R1.13. Line 381 sets `numRuns: 1000`. All 7 `numRuns` values in specs and steering are 1000, and no `numRuns` in `src` or `scripts` uses another value.
8. Yes - C1.10 is covered by R1.10 and R1.11 with Task 11.2 (one test per abbreviation). C1.7 is covered by R3.2–R3.11 with the 19-row table, and `mitigation-phrasing.test.ts` keeps the marker cancellation after C12.1. Both are unchanged since attempt 1.
9. Yes - The cap is covered by R8.1–R8.3, R6.2 and P4 with `overCapString`. The non-English flag is covered by R9.1–R9.6. Determinism is covered by R7.1–R7.3 and P5.
10. Yes - `git diff --stat 79cd546 HEAD -- .kiro/specs/llm-explainer/requirements.md` is empty, so the requirements are the same as at Gate 1. They cover the single route (R1), Zod on input and output (R2.3, R6.1), the 15 s timeout (R5), the fallbacks (R3.1, R5.1, R6.3, R7.1), the C1.4 header order (R9.3), no logging of user text (R10), the opt-in (R14.3), flagged clauses only (R13) and the precompute (R16).
11. Yes - The llm-explainer design lines 399–402 state E1 (no lowering), E2 (quote unchanged), E3 (same IDs, same order) and E4 (`fc.anything()` falls back without throwing).
12. Yes - Every listed item maps to a haunted-house-ui requirement: R2 (input), R4 (house and eight rooms), R5.4 (four levels), R6 (detail panel), R7 (score and bands), R8 (Lights on), R9 (roving tabindex), R10.2/R10.3/R10.5 (reduced motion), R11.1/R11.2 (sound off), R12 (360 px), R13 (not legal advice), R14 (opt-in UI), R15 (static sample explanations) and R16.1–R16.4 (edge states).
13. Yes - The 4ff469e changes add no login, storage, real names or third-party assets. The new design-pass text (HU design lines 161–167) describes inline SVG and CSS made in the project. R15.2 (samples never call the API) and LE R13 (flagged clauses only) are unchanged.
14. Yes - The top-level tasks are 11–16 (clause-analyzer), 17–22 (llm-explainer) and 23–33 (haunted-house-ui), matching PLAN_DECISIONS.md section D.
15. Yes - The approved decisions are now reflected in the specs:
    - C14.7: R20.1 says "13 files in all" and R20.3 splits the 12 reduced-motion screenshots from the motion-on one. The HU design (line 303) and Task 31.6 (line 199) agree, and `docs/screenshots/` holds 13 PNGs.
    - C14.1–C14.5 and C15: the HU design's "Design pass (C14, C15)" section; movement stays inside the house frame, as C14.5 requires.
    - C13: CA design lines 68–69, and the HU design Lights on section (line 172).
    - C12.4: the haunted-house-ui `tasks.md` header (line 7).
    - C14.6: the heading step is now step 1b, before any rule is read (CA design line 113), matching `classifier.ts` line 112.
    - The C10.6, C10.10, C10.14, C10.18 and C10.21 checks from attempt 1 still hold.

Commands run:
- `git log --oneline -15` -> exit 0; HEAD 4ff469e "Gate 5: spec-reviewer attempt 1 FAIL (R20 vs C14.7); specs brought into line with C12-C15".
- `git show 4ff469e --stat` and `git show 4ff469e -- .kiro BUILD_LOG.md` -> exit 0; 8 files changed, all spec, matrix, log or report text, with no code or test files; every hunk reviewed.
- `npm run check:trace` -> exit 0; "all 236 criteria have a row with a named test or check listed in its task (236 rows)".
- `git status --short` -> exit 0; empty.
- Criterion count, the SHALL grep and the vague-word grep over the three `requirements.md` files -> 69, 72 and 95; no hits.
- Task-heading grep -> 11–16, 17–22 and 23–33. The haunted-house-ui order is now 31.5 then 31.6, and parent Task 31 is ticked.
- `numRuns` grep in specs, steering, `src` and `scripts` -> all 1000.
- `git diff --stat 79cd546 HEAD -- .kiro/specs/llm-explainer/requirements.md` -> exit 0; empty.
- Greps of the tasks.md files for the 30 spot-check test names -> each one sits in a listed task.
- Reads or greps of `e2e/screenshots.spec.ts`, `classifier.ts` lines 95–140, `heading.test.ts`, `arbitraries.test-util.ts`, `examples.test-util.ts`, `ScoreBadge.test.tsx`, `SampleCards.test.tsx`, `NightScene.test.tsx`, `RoomProp.test.tsx`, `Ghost.test.tsx`, and `package.json` (`test:e2e` uses `--grep-invert @screenshots`) -> these back the evidence above.
- `ls docs/screenshots` -> 13 PNGs, including `house-terrible-motion-1440.png`.
- Not run: Vitest and Playwright, which are outside this agent's allow-list.

Attempt 1 problems re-checked:
- R20 vs C14.7 (CONFLICT): resolved. See items 4 and 15.
- Clause-analyzer design step "4b" order: resolved. It is now step 1b, "before any rule is read" (line 113), and it matches `classifier.ts` line 112.
- CA R2.2 and R2.4 heading wording: resolved. Both now say "after any heading line, Requirement 4.2".
- Clause-analyzer design lags: partly resolved.
  - Fixed: the 62-example count (line 413), the 41/21 `policyLike` pool (line 386), the `whyItMatters` comment (line 69), and rows for `mitigation-phrasing.test.ts`, `mitigation-texts.test.ts` and `heading.test.ts` (lines 415–417).
  - Not fixed: P2 (line 395); see Problems.
- Haunted-house-ui design lags: resolved. The C13 reassurance line, `NightScene.tsx`, `RoomProp.tsx`, ghost shapes and faces (`data-face`), the hero score, fog and candlelight, and rows for `RoomProp.test.tsx` and `NightScene.test.tsx` are all present.
- Haunted-house-ui `tasks.md` items: resolved. The header now describes the C12.4 route, Task 33.3 names C12–C15, 31.6 follows 31.5, and parent Task 31 is ticked.

Problems:
- `.kiro/specs/clause-analyzer/design.md` line 395 (MINOR, carried over from attempt 1 and not fixed; no checklist item fails): P2 still says r is "one of the 28 positive examples". `riskyClause` in `src/lib/analyzer/arbitraries.test-util.ts` line 47 draws from all 41 `POSITIVE_EXAMPLES`.
- `.kiro/specs/haunted-house-ui/design.md` Testing table (MINOR, no checklist item fails): the `ScoreBadge.test.tsx` and `SampleCards.test.tsx` rows do not mention the C14.4 hero test (`ScoreBadge.test.tsx` line 23) or the C14.1 house-front door test (`SampleCards.test.tsx` line 24). The "Design pass (C14, C15)" section and Task 31.6 do describe both.
