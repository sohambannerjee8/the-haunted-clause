# Traceability matrix

Every acceptance criterion in the three specs, with the named test, property or check that verifies it and the task(s) that write that check. `npm run check:trace` (`scripts/check-traceability.mjs`) fails when a criterion has no row, a row has no backticked test or check, a task does not exist, a named test file is not mentioned in one of the row's tasks, or a named agent does not exist (PLAN_DECISIONS.md C10.21).

IDs: `CA` = clause-analyzer, `LE` = llm-explainer, `HU` = haunted-house-ui; `R3.11` = Requirement 3, criterion 11. Property names (P1–P10, E1–E7, U1–U4) are defined in each spec's design.

## clause-analyzer

| ID | Verified by | Tasks |
| --- | --- | --- |
| CA-R1.1 | `splitter.property.test.ts` (P6) | 11.3 |
| CA-R1.2 | `splitter.property.test.ts` (P6) | 11.3 |
| CA-R1.3 | `splitter.test.ts` (empty input) | 11.2 |
| CA-R1.4 | `splitter.test.ts` (whitespace only) | 11.2 |
| CA-R1.5 | `splitter.property.test.ts` (P6) | 11.3 |
| CA-R1.6 | `splitter.property.test.ts` (P8, including `overCapString`) | 11.3 |
| CA-R1.7 | `splitter.test.ts` (terminators with closers) | 11.2 |
| CA-R1.8 | `splitter.test.ts` (paragraph breaks, CRLF) | 11.2 |
| CA-R1.9 | `splitter.test.ts` (list markers) | 11.2 |
| CA-R1.10 | `splitter.test.ts` (one test per abbreviation, `zinc. Then`) | 11.2 |
| CA-R1.11 | `splitter.test.ts` (`etc.` before a paragraph break) | 11.2 |
| CA-R1.12 | `splitter.property.test.ts` (P6 with `overCapString`) | 11.3 |
| CA-R1.13 | `splitter.test.ts` (boundary-resolution rows), `splitter.property.test.ts` (P6) | 11.2, 11.3 |
| CA-R2.1 | `analyze.property.test.ts` (P8, findings) | 14.3 |
| CA-R2.2 | `classifier.test.ts` (30 negative examples) | 12.2, 16.4, 16.7, 16.8 |
| CA-R2.3 | `classifier.test.ts` (whitespace-only clause) | 12.2 |
| CA-R2.4 | `classifier.test.ts` (room tie-break) | 12.2 |
| CA-R2.5 | `classifier.test.ts` (rule tie-break) | 12.2 |
| CA-R2.6 | `rules.test.ts` | 12.1 |
| CA-R2.7 | `classifier.test.ts` (84 room examples: 54 positive and 30 negative, of which 18 came from C12.2, 7 from C19 and 15 from C21) | 12.2, 16.4, 16.7, 16.8 |
| CA-R2.8 | `classifier.test.ts` (case-insensitivity) | 12.2 |
| CA-R3.1 | `mitigation.test.ts`, `analyze.property.test.ts` (P10) | 12.3, 14.3 |
| CA-R3.2 | `mitigation.test.ts` (plain mitigation rows), `mitigation-phrasing.test.ts` (each mitigation's wordings, C12.1) | 12.3, 16.3 |
| CA-R3.3 | `mitigation.test.ts` (eight marker rows) | 12.3 |
| CA-R3.4 | `mitigation.test.ts` (marker before mitigation) | 12.3 |
| CA-R3.5 | `mitigation.test.ts` (marker in another clause) | 12.3 |
| CA-R3.6 | `mitigation.test.ts` (`mitigationId`, `cancelledMitigationId`) | 12.3 |
| CA-R3.7 | `mitigation.test.ts` (plain severity 0 finding) | 12.3 |
| CA-R3.8 | `mitigation.test.ts` (word-boundary rows), `rules.test.ts` | 12.1, 12.3 |
| CA-R3.9 | `mitigation.test.ts` (one row per marker) | 12.3 |
| CA-R3.10 | `mitigation.test.ts` (three R3.10 rows) | 12.3 |
| CA-R3.11 | `mitigation.test.ts`, `analyze.property.test.ts` (P10) | 12.3, 14.3 |
| CA-R4.1 | `analyze.property.test.ts` (P3) | 14.3 |
| CA-R4.2 | `analyze.property.test.ts` (P3), `classifier.test.ts` (trimmed span), `heading.test.ts` (heading lines left out, C14.6) | 12.2, 14.3, 16.6 |
| CA-R4.3 | `analyze.property.test.ts` (P8, findings) | 14.3 |
| CA-R4.4 | `analyze.test.ts` (input order) | 14.2 |
| CA-R4.5 | `rules.test.ts` (text lengths), `classifier.test.ts` (rule texts when no mitigation applies), `mitigation-texts.test.ts` (mitigation texts when one applies, C13) | 12.1, 12.2, 16.5 |
| CA-R5.1 | `score.test.ts` | 13.1 |
| CA-R5.2 | `score.property.test.ts` (P1) | 13.2 |
| CA-R5.3 | `score.test.ts` (no findings) | 13.1 |
| CA-R5.4 | `score.test.ts` (all severity 0) | 13.1 |
| CA-R5.5 | `analyze.property.test.ts` (P2) | 14.3 |
| CA-R5.6 | `score.property.test.ts` (P7) | 13.2 |
| CA-R6.1 | `analyze.property.test.ts` (P4) | 14.3 |
| CA-R6.2 | `analyze.property.test.ts` (P4 with `overCapString`), `analyze.test.ts` (50,001) | 14.2, 14.3 |
| CA-R6.3 | `analyze.test.ts` (under 1 second) | 14.2 |
| CA-R7.1 | `analyze.property.test.ts` (P5) | 14.3 |
| CA-R7.2 | `purity.test.ts` | 14.4 |
| CA-R7.3 | `analyze.property.test.ts` (P5) | 14.3 |
| CA-R7.4 | `purity.test.ts` | 14.4 |
| CA-R8.1 | `analyze.test.ts` | 14.2 |
| CA-R8.2 | `analyze.test.ts` | 14.2 |
| CA-R8.3 | `analyze.test.ts` (exactly 50,000) | 14.2 |
| CA-R9.1 | `analyze.test.ts`, `language.test.ts` | 14.1, 14.2 |
| CA-R9.2 | `language.test.ts` | 14.1 |
| CA-R9.3 | `language.test.ts` (Japanese) | 14.1 |
| CA-R9.4 | `language.test.ts` (Spanish, French) | 14.1 |
| CA-R9.5 | `language.test.ts` (English paragraph) | 14.1 |
| CA-R9.6 | `analyze.test.ts` | 14.2 |
| CA-R10.1 | `rooms.test.ts` | 11.1 |
| CA-R10.2 | `analyze.property.test.ts` (P9) | 14.3 |
| CA-R11.1 | `samples.test.ts` | 15.2 |
| CA-R11.2 | `samples.test.ts` (BUILD_LOG heading), `agent:rules-auditor` (A4) | 15.1, 15.2 |
| CA-R11.3 | `samples.test.ts` | 15.2 |
| CA-R11.4 | `samples.test.ts` | 15.2 |
| CA-R11.5 | `samples.test.ts` | 15.2 |
| CA-R11.6 | `samples.test.ts` | 15.2 |
| CA-R11.7 | `samples.test.ts` | 15.2 |
| CA-R11.8 | `samples.test.ts` (no URL, email or marks), `agent:rules-auditor` (A4) | 15.2 |

## llm-explainer

| ID | Verified by | Tasks |
| --- | --- | --- |
| LE-R1.1 | `route.test.ts` (one route; only it imports `gemini.ts`) | 20.3 |
| LE-R1.2 | `route.test.ts` (exports) | 20.3 |
| LE-R1.3 | `route.test.ts`, `explain-route.spec.ts` (production build) | 20.3 |
| LE-R1.4 | `handler.test.ts`, `route.test.ts`, `explain-route.spec.ts` | 20.2, 20.3 |
| LE-R2.1 | `handler.test.ts` (body over 256,000 bytes) | 20.2 |
| LE-R2.2 | `handler.test.ts` (bad JSON) | 20.2 |
| LE-R2.3 | `schema.test.ts`, `handler.test.ts` (schema mismatch) | 17.1, 20.2 |
| LE-R2.4 | `origin.test.ts` (ten cases), `handler.test.ts` (Origin mismatch) | 20.1, 20.2 |
| LE-R2.5 | `handler.test.ts` (provider not called on rejected paths) | 20.2 |
| LE-R3.1 | `handler.test.ts` (no key) | 20.2 |
| LE-R3.2 | `availability.test.ts` | 18.3 |
| LE-R3.3 | `purity.test.ts` (no import from `src/lib/llm/`), `flow.spec.ts` (no-key rule texts) | 14.4, 24.2 |
| LE-R4.1 | `handler.test.ts` (good output) | 20.2 |
| LE-R4.2 | `gemini.test.ts` | 18.3 |
| LE-R4.3 | `prompt.test.ts` | 18.2 |
| LE-R4.4 | `prompt.test.ts` | 18.2 |
| LE-R4.5 | `gemini.test.ts` (key read at call time), `server-only.test.ts` (only two files contain the key name) | 18.3 |
| LE-R5.1 | `provider.test.ts`, `handler.test.ts` (timeout) | 18.1, 20.2 |
| LE-R5.2 | `provider.test.ts` (provider ignores the signal) | 18.1 |
| LE-R5.3 | `docs.test.mts` ("billed") | 22.2 |
| LE-R6.1 | `parse.test.ts` | 17.2 |
| LE-R6.2 | `parse.test.ts` (unknown IDs, duplicates) | 17.2 |
| LE-R6.3 | `parse.test.ts`, `handler.test.ts` (malformed output) | 17.2, 20.2 |
| LE-R6.4 | `handler.test.ts` (good output) | 20.2 |
| LE-R6.5 | `parse.property.test.ts` (E4) | 17.2 |
| LE-R7.1 | `handler.test.ts` (provider error) | 20.2 |
| LE-R7.2 | `handler.property.test.ts` (E4, E7) | 20.2 |
| LE-R8.1 | `schema.test.ts`, `handler.property.test.ts` (E7) | 17.1, 20.2 |
| LE-R8.2 | `handler.test.ts` (status codes), `route.test.ts` (405) | 20.2, 20.3 |
| LE-R9.1 | `rateLimit.test.ts`, `rateLimit.property.test.ts` (E5) | 19.1 |
| LE-R9.2 | `rateLimit.test.ts` (`Retry-After`), `handler.test.ts` (429) | 19.1, 20.2 |
| LE-R9.3 | `rateLimit.test.ts` (header order) | 19.1 |
| LE-R9.4 | `rateLimit.test.ts` (stale entries, LRU) | 19.1 |
| LE-R9.5 | `rateLimit.test.ts` (source cites the URL), `docs.test.mts` ("best-effort", "cold start", "not shared") | 19.1, 22.2 |
| LE-R10.1 | `handler.test.ts` (one log line) | 20.2 |
| LE-R10.2 | `handler.test.ts` (`console` spy), `agent:security-reviewer` (item 13) | 20.2 |
| LE-R11.1 | `no-storage.test.ts` (no `fs`, `cookies()` or cache APIs in llm and api code), `rateLimit.test.ts` (only IP keys and timestamps), `agent:security-reviewer` (item 14) | 19.1, 23.2 |
| LE-R11.2 | `gemini.test.ts` (`store: false`) | 18.3 |
| LE-R12.1 | `merge.property.test.ts` (E3) | 17.3 |
| LE-R12.2 | `merge.test.ts`, `merge.property.test.ts` (E1) | 17.3 |
| LE-R12.3 | `merge.test.ts` | 17.3 |
| LE-R12.4 | `merge.property.test.ts` (E2) | 17.3 |
| LE-R12.5 | `merge.test.ts` (unknown ID) | 17.3 |
| LE-R13.1 | `request.test.ts`, `request.property.test.ts` (E6) | 17.4 |
| LE-R13.2 | `request.test.ts` (41 findings) | 17.4 |
| LE-R13.3 | `request.test.ts`, `client.test.ts` (no findings, no fetch) | 17.4, 20.4 |
| LE-R13.4 | `request.property.test.ts` (E6) | 17.4 |
| LE-R14.1 | `client.test.ts` | 20.4 |
| LE-R14.2 | `client.test.ts` | 20.4 |
| LE-R14.3 | `client.test.ts` (no fetch on import), `OptInPanel.test.tsx` (no call without a press) | 20.4, 29.1 |
| LE-R15.1 | `server-only.test.ts`, `agent:security-reviewer` (items 6, 7) | 18.3 |
| LE-R15.2 | `server-only.test.ts` (no `NEXT_PUBLIC_` with `GEMINI`) | 18.3 |
| LE-R15.3 | `check-bundle.mjs` (`npm run check:bundle`) | 22.1 |
| LE-R16.1 | `package-scripts.test.mts` | 21.3 |
| LE-R16.2 | `package-scripts.test.mts` | 21.3 |
| LE-R16.3 | `precompute-samples.test.mts` (mocked provider) | 21.1 |
| LE-R16.4 | `precompute-samples.test.mts` (provider failure) | 21.1 |
| LE-R16.5 | `precompute-samples.test.mts` (no key) | 21.1 |
| LE-R16.6 | `precompute-samples.test.mts` (summary-line regex, no quotes) | 21.1 |
| LE-R16.7 | `precompute-samples.test.mts`, `explanations.test.ts` (consistency) | 21.1, 21.3 |
| LE-R16.8 | `explanations.test.ts` (partial and invalid files) | 21.3 |
| LE-R16.9 | `precompute-samples.test.mts` (rules entries) | 21.1 |
| LE-R16.10 | `explanations.test.ts` (committed file valid and consistent) | 21.3 |
| LE-R16.11 | `precompute-samples.test.mts` (byte-identical second run) | 21.1 |
| LE-R16.12 | `precompute-samples.test.mts` (model line) | 21.2 |
| LE-R16.13 | `precompute-samples.test.mts` (404 and 403) | 21.2 |
| LE-R16.14 | `precompute-samples.test.mts` (failed sample call) | 21.2 |
| LE-R16.15 | `precompute-samples.test.mts` (entries carry the model) | 21.2 |
| LE-R17.1 | `privacy.test.ts`, `docs.test.mts` (README "Privacy") | 17.5 |
| LE-R17.2 | `privacy.test.ts` (banned claims), `docs.test.mts` | 17.5, 22.2 |
| LE-R17.3 | `docs.test.mts` (DEPLOY.md) | 22.2 |
| LE-R17.4 | `privacy.test.ts`, `docs.test.mts` (README contains the notice) | 17.5 |

## haunted-house-ui

| ID | Verified by | Tasks |
| --- | --- | --- |
| HU-R1.1 | `shell.spec.ts` | 23.2 |
| HU-R1.2 | `Footer.test.tsx` | 23.2 |
| HU-R1.3 | `shell.spec.ts` (skip link) | 23.2 |
| HU-R1.4 | `shell.spec.ts` (no other-origin font), `assets.test.mts` (fonts and OFL files) | 23.2 |
| HU-R1.5 | `shell.spec.ts` (no other-origin image), `assets.test.mts` (only `icon.svg`) | 23.2 |
| HU-R1.6 | `no-storage.test.ts`, `flow.spec.ts` (storage, cookie, IndexedDB, hosts) | 23.2, 24.2 |
| HU-R2.1 | `InputScreen.test.tsx` | 24.1 |
| HU-R2.2 | `InputScreen.test.tsx` (`maxLength`), `edge.spec.ts` (50,001st blocked) | 24.1, 32.1 |
| HU-R2.3 | `InputScreen.test.tsx`, `edge.spec.ts` (60,000-character paste) | 24.1, 32.1 |
| HU-R2.4 | `InputScreen.test.tsx`, `edge.spec.ts` (empty input) | 24.1, 32.1 |
| HU-R2.5 | `SampleCards.test.tsx` | 24.1 |
| HU-R2.6 | `InputScreen.test.tsx` (`aria-live="off"`, no live ancestor) | 24.1 |
| HU-R3.1 | `flow.spec.ts` (pasted text) | 24.2 |
| HU-R3.2 | `flow.spec.ts` (no request carries pasted text), `optin.spec.ts` (no request before the press) | 24.2, 29.2 |
| HU-R3.3 | `flow.spec.ts` (samples, no `/api/explain`) | 24.2 |
| HU-R3.4 | `no-storage.test.ts`, `flow.spec.ts` | 23.2, 24.2 |
| HU-R4.1 | `houseModel.property.test.ts` (U1), `House.test.tsx` | 25.1, 25.2 |
| HU-R4.2 | `layout.spec.ts` (2 and 4 columns) | 31.1 |
| HU-R4.3 | `Room.test.tsx` (quiet room) | 25.2 |
| HU-R4.4 | `Room.test.tsx`, `flow.spec.ts` (per-room counts) | 25.2, 25.3 |
| HU-R4.5 | `Room.test.tsx` (section and group accessible names, quiet rooms) | 25.2 |
| HU-R4.6 | `House.test.tsx` (frame `aria-hidden`) | 25.2 |
| HU-R4.7 | `House.test.tsx` (`items-start`), `crowded.spec.ts` (no stretched rows at 1440 and 360 px) | 32.3 |
| HU-R4.8 | `houseModel.test.ts` (`capRoom`), `houseModel.property.test.ts` (U5), `Room.test.tsx` (crowded room), `LightsOnList.test.tsx` (every finding), `crowded.spec.ts` | 32.3 |
| HU-R5.1 | `Ghost.test.tsx` | 25.2 |
| HU-R5.2 | `Ghost.test.tsx`, `houseModel.property.test.ts` (U4) | 25.1, 25.2 |
| HU-R5.3 | `Ghost.test.tsx` (numeral) | 25.2 |
| HU-R5.4 | `Ghost.test.tsx` (level class), `flow.spec.ts` (computed size, opacity, colour) | 25.2, 25.3 |
| HU-R5.5 | `Ghost.test.tsx` (44 px minimum) | 25.2 |
| HU-R5.6 | `keyboard.spec.ts` (computed outline) | 27.3 |
| HU-R6.1 | `DetailDialog.test.tsx`, `flow.spec.ts` (click opens) | 26.1, 26.2 |
| HU-R6.2 | `DetailDialog.test.tsx`, `flow.spec.ts` (quote equals the slice) | 26.1, 26.2 |
| HU-R6.3 | `DetailDialog.test.tsx` (mitigation notes) | 26.1 |
| HU-R6.4 | `DetailDialog.test.tsx` (medium-raised note) | 26.1 |
| HU-R6.5 | `DetailDialog.test.tsx` (`<b>` shown literally) | 26.1 |
| HU-R6.6 | `DetailDialog.test.tsx` (Close returns focus), `keyboard.spec.ts` (Escape returns focus) | 26.1, 27.3 |
| HU-R6.7 | `keyboard.spec.ts` (Tab stays inside, `:modal`) | 27.3 |
| HU-R7.1 | `ScoreBadge.test.tsx` | 25.2 |
| HU-R7.2 | `flow.spec.ts` (score equals `hauntScore`), `OptInPanel.test.tsx` (score after merge) | 25.3, 29.1 |
| HU-R7.3 | `ScoreBadge.test.tsx` (announcement on change) | 25.2 |
| HU-R8.1 | `Toolbar.test.tsx` (Lights on toggle, `aria-pressed`), `lights.spec.ts` | 28.1, 28.2 |
| HU-R8.2 | `LightsOnList.test.tsx` (including the reassurance line, C13) | 28.1, 28.3 |
| HU-R8.3 | `houseModel.property.test.ts` (U1), `lights.spec.ts` | 25.1, 28.2 |
| HU-R8.4 | `LightsOnList.test.tsx` (no SVG, no animation classes) | 28.1 |
| HU-R8.5 | `LightsOnList.test.tsx`, `lights.spec.ts` (focus stays on the toggle) | 28.1, 28.2 |
| HU-R9.1 | `Room.test.tsx` (one `tabindex="0"`) | 27.2 |
| HU-R9.2 | `Room.test.tsx` (quiet room has no buttons), `keyboard.spec.ts` | 25.2, 27.3 |
| HU-R9.3 | `roving.property.test.ts` (U3), `Room.test.tsx` | 27.1, 27.2 |
| HU-R9.4 | `Room.test.tsx` (focus memory) | 27.2 |
| HU-R9.5 | `keyboard.spec.ts` (Tab to the next room) | 27.3 |
| HU-R9.6 | `keyboard.spec.ts` (Enter, Escape, focus return) | 27.3 |
| HU-R9.7 | `keyboard.spec.ts` (tab order) | 27.3 |
| HU-R9.8 | `Room.test.tsx` (button in the roving set), `crowded.spec.ts` (Enter, Space, Tab leaves the room) | 32.3 |
| HU-R10.1 | `motion.spec.ts` (level 3 animated) | 30.1 |
| HU-R10.2 | `motion.spec.ts` (reduced motion) | 30.1 |
| HU-R10.3 | `motion.spec.ts` (no running repeating animation on any element), `HauntedApp.test.tsx` (`MotionConfig`) | 30.1 |
| HU-R10.4 | `motion.spec.ts` (`getAnimations()` rules) | 30.1 |
| HU-R10.5 | `motion.spec.ts` (Lights on stops repeating animations) | 30.1 |
| HU-R11.1 | `sound.test.ts`, `motion.spec.ts` (no `AudioContext` on load) | 26.3, 30.1 |
| HU-R11.2 | `Toolbar.test.tsx` (Sound toggle) | 30.1 |
| HU-R11.3 | `sound.test.ts` (pitch, ≤ 600 ms) | 26.3 |
| HU-R11.4 | `assets.test.mts` (no audio files, no `new Audio(`) | 23.2 |
| HU-R12.1 | `layout.spec.ts` (every state listed in R12.1) | 31.1 |
| HU-R12.2 | `layout.spec.ts` (1440 × 900) | 31.1 |
| HU-R12.3 | `layout.spec.ts` (dialog fits and scrolls) | 31.1 |
| HU-R13.1 | `Footer.test.tsx`, `DetailDialog.test.tsx`, `LightsOnList.test.tsx` | 23.2, 26.1, 28.1 |
| HU-R14.1 | `OptInPanel.test.tsx`, `optin.spec.ts` | 29.1, 29.2 |
| HU-R14.2 | `OptInPanel.test.tsx`, `optin-hidden.spec.ts` | 29.1, 29.2 |
| HU-R14.3 | `OptInPanel.test.tsx` (hidden for samples), `optin.spec.ts` | 29.1, 29.2 |
| HU-R14.4 | `OptInPanel.test.tsx` (listening state) | 29.1 |
| HU-R14.5 | `OptInPanel.test.tsx` (success merge), `optin.spec.ts` | 29.1, 29.2 |
| HU-R14.6 | `OptInPanel.test.tsx` (failure messages), `optin.spec.ts` | 29.1, 29.2 |
| HU-R14.7 | `optin.spec.ts` (body holds only flagged-clause text) | 29.2 |
| HU-R14.8 | `docs.test.mts` ("redeploy") | 22.2 |
| HU-R15.1 | `explanations.test.ts` (partial file), `flow.spec.ts` (badges) | 21.3, 25.3 |
| HU-R15.2 | `flow.spec.ts` (no `/api/explain`), `package-scripts.test.mts` (build never calls Google) | 21.3, 24.2 |
| HU-R15.3 | `Toolbar.test.tsx`, `flow.spec.ts` | 25.2, 25.3 |
| HU-R16.1 | `edge.spec.ts` (empty input) | 32.1 |
| HU-R16.2 | `edge.spec.ts` (exactly 50,000) | 32.1 |
| HU-R16.3 | `edge.spec.ts` (Spanish and Japanese) | 32.1 |
| HU-R16.4 | `edge.spec.ts` (no risky clauses) | 32.1 |
| HU-R16.5 | `edge.spec.ts` (only wisps) | 32.1 |
| HU-R16.6 | `HauntedApp.test.tsx` (`too-long`) | 32.1 |
| HU-R17.1 | `perf.spec.ts` (no house chunk before action) | 33.1 |
| HU-R17.2 | `loading.spec.ts` (text and `aria-busy`), `flow.spec.ts` | 24.2, 32.2 |
| HU-R17.3 | `loading.spec.ts` (blocked chunk, retry) | 32.2 |
| HU-R17.4 | `flow.spec.ts` (Read another policy) | 24.2 |
| HU-R17.5 | `HauntedApp.test.tsx` (`HouseView` throws) | 32.2 |
| HU-R18.1 | `perf.spec.ts` (typing within 5 s) | 33.1 |
| HU-R18.2 | `perf.spec.ts` (≤ 200 kB JS) | 33.1 |
| HU-R19.1 | `a11y.spec.ts` | 31.2 |
| HU-R19.2 | `a11y.spec.ts` (`color-contrast` is serious) | 31.2 |
| HU-R19.3 | `shell.spec.ts` (one `main`, one `h1`), `flow.spec.ts` (house `h2`, room `h3`), `lights.spec.ts` (Lights on `h2`), `DetailDialog.test.tsx` (dialog `h2`) | 23.2, 25.3, 26.1, 28.2 |
| HU-R19.4 | `keyboard.spec.ts` (focus ring on every control) | 27.3 |
| HU-R20.1 | `screenshots.spec.ts` (12 states, plus the motion-on image from C14.7) | 31.3, 31.6 |
| HU-R20.2 | `screenshots.spec.ts` | 31.3 |
| HU-R20.3 | `screenshots.spec.ts` (reduced motion for the 12; motion on, with running animations checked, for the extra one) | 31.3, 31.6 |
| HU-R20.4 | `BUILD_LOG.md` (date shown and the user's reply) | 31.5 |
