VERDICT: PASS
Gate: Gate 5 (Phase 5: hardening and polish), ui-a11y-reviewer, attempt 1
Date: 17 November 2026
URL tested: http://localhost:3100

Evidence (one line per check):
1. Yes - On the input screen the snapshot showed the h1 "The Haunted Clause" and the textarea "Paste a Terms & Conditions or privacy policy". The counter went from "0 / 50,000 characters" to "11 / 50,000 characters" after typing "Hello there". The screen also had the three cards "Open this house: Quillwhisper Notes / Mirebell Streaming / Murkwillow Social", the "Analyze" button and the footer "Not legal advice. The readings are automated and can be wrong."
2. Yes - All three samples showed the rooms in order: Cellar, Watching Portraits, Coin Vault, Locked Door, Silent Court, Mirror Room, Trapdoor, Shifting Stairs. Each ghost sat in the room named in its label. Quiet rooms showed "Quiet": Silent Court, Mirror Room and Shifting Stairs in the mild sample; Locked Door, Mirror Room and Trapdoor in the average sample; none in the terrible sample.
3. Yes - I evaluated every `button[data-severity]`. Each numeral equals `data-severity`. Labels read "Severity N ghost in <Room>: …" for levels 1–3 and "Severity 0 wisp in <Room>: looks fine" for level 0, as haunted-house-ui R5.2 specifies. Drawn width, opacity and colour per level at 1440: level 0 is 28 px, 0.55, #9a93a6; level 1 is 40 px, 0.75, #f2b544; level 2 is 52 px, 0.9, #ef8a4c; level 3 is 64 px, 1.0, #a6e86b. At 360 the widths are 32/40/48 px. Every hit area is at least 44 × 44 px.
4. Yes - Clicking the first Cellar ghost opened dialog "The Cellar" with "3 Serious concern" and the quote "We may sell your personal information to third parties." That quote matches `src/lib/samples/terrible.ts` line 11, and the heading "1. Your information" is left out, as C14.6 requires. The dialog also showed the explanation, "Why it matters", "Rule reading" and "Not legal advice."
5. Yes - The samples showed "14 · Mostly quiet" (mild), "59 · Haunted" (average) and "97 · Run" (terrible, with a ghost in all 8 rooms). The live region repeats each one, e.g. "Haunt Score 97, Run". No "/100" appears anywhere on the page.
6. Yes - In Lights on mode (aria-pressed=true), the per-room severity lists match the house exactly for all three samples. The quiet rooms are listed with "Quiet". No ghost buttons, SVGs or animations remain (`document.getAnimations()` returns 0).
7. Yes - `browser_network_requests` (all, static, filter `api|explain|google|gstatic`) returned no matches after all three samples were opened several times.
8. Yes - I analyzed pasted text of exactly 50,000 characters. No opt-in button appeared (0 buttons matching /medium|gemini|ask/i). The line "These readings come from built-in rules. No medium is configured on this site." was shown.
9. Yes - On the terrible sample, Tab from the "Inside the house" heading went to the Cellar, Watching Portraits, Coin Vault, Locked Door, Silent Court, Mirror Room, Trapdoor and Shifting Stairs, one stop each, then left the house. Each stop showed `:focus-visible` with a solid 3 px rgb(242,181,68) outline and a 2 px offset.
10. Yes - In the Coin Vault (4 ghosts), ArrowRight went 0→1→2→3 and wrapped to 0, and ArrowLeft wrapped to 3. Home went to 0 and End to 3; ArrowDown and ArrowUp also moved and wrapped. Only one ghost had tabindex 0 at a time. Tab moved to the Locked Door, and Shift+Tab returned to the last focused Coin Vault ghost.
11. Yes - Enter and Space each opened the dialog. After Escape the dialog count was 0 and focus was back on the same ghost (index 0, and index 2 in a second check).
12. Yes - `npx playwright test --grep "reduced motion"` gave 1 passed and exit 0 (e2e/motion.spec.ts:67). With MCP `emulateMedia reduce`, there were 0 running animations after 1.2 s. The level-3 glow halo (`.hc-glow`, globals.css:184-191) keeps a static scale(1.05) that did not change over 1.5 s, so nothing moves.
13. Yes - On first load the Sound button had aria-pressed="false". No AudioContext was created (counted with an init-script wrapper) and no audio element exists, even after opening and closing a ghost dialog.
14. Yes - At 360 × 740 I checked the input screen, the empty-input error, all three houses, the open dialog and Lights on mode. scrollWidth was 360 everywhere, with 0 overlapping controls and 0 visible text overflowing its box. The only clipped element is the 1 px `sr-only-live` status, which is meant to be hidden. The rooms use 2 × 4, and the dialog fits inside the viewport (top 96, bottom 644, left 19, right 341). At 1440 × 900 the rooms use 4 columns × 2 rows in the correct order.
15. Yes - `npx playwright test --grep "axe"` gave 11 passed and exit 0. The scans covered the input screen and empty error, the house for each sample, the detail panel and Lights on, the no-ghosts state and non-English notice, Lights on for each sample, the first screen, and the opt-in panel (llm-ui project).
16. Yes - Empty Analyze stays on the input screen and shows "Paste a policy or pick a sample first." with aria-invalid="true" and aria-describedby="policy-count policy-error". The textarea has maxlength 50000: typing a 50,001st character leaves the length at 50,000. A real paste (clipboard, Ctrl/Meta+V) that would reach 50,010 characters is cut to 50,000 and announces "Your text was cut at 50,000 characters." in a status region. Exactly 50,000 characters is analyzed and the house opens. French text shows "This app reads English only. Results for other languages may be missing or wrong." A text with no risky clauses shows "No ghosts here. None of the clauses matched a risky pattern, but that does not make the policy safe." with 8 rooms "Quiet", 0 ghosts and "0 · Mostly quiet".

Commands and MCP actions run:
- browser_navigate http://localhost:3100 and snapshot -> input screen elements present
- browser_type "Hello there" into the textarea, then browser_find "characters" -> counter showed "11 / 50,000 characters"
- browser_click "Open this house: Murkwillow Social", then read the snapshot -> 8 rooms, 29 ghosts, "97 · Run"
- browser_evaluate on ghost attributes and styles (1440 and 360) -> severity, numeral, label, size, opacity, colour and hit area all consistent
- browser_click on the first Cellar ghost, snapshot of the dialog, then browser_press_key Escape -> dialog contents correct, focus returned to ghost index 0
- browser_run_code_unsafe: Tab sequence on the terrible sample -> 8 rooms in order, one stop each, 3 px amber outline
- browser_run_code_unsafe: Arrow, Home, End, Tab and Shift+Tab in the Coin Vault; Enter, Space and Escape -> all pass
- browser_run_code_unsafe: three samples, house plus Lights on comparison -> lists match, quiet rooms listed, scores 14 / 59 / 97
- browser_network_requests (all, with and without static, filter api|explain|google|gstatic) -> no matching requests
- browser_run_code_unsafe: empty input, maxlength, typed 50,001st character, clipboard paste over the cap, exactly 50,000 characters, non-English, no ghosts -> all states as specified
- browser_run_code_unsafe: layout checks at 360 × 740 and 1440 × 900, plus viewport screenshots in .playwright-mcp/ -> no horizontal scroll, overlap or clipping; 2 × 4 and 4 × 2 layouts
- browser_run_code_unsafe: AudioContext counter and Sound aria-pressed -> 0 contexts, "false"
- browser_run_code_unsafe with emulateMedia reducedMotion=reduce -> 0 running animations; static glow halo only
- `ls -la playwright-report test-results` -> checked whether an earlier background run had finished
- `npx playwright test --grep "reduced motion" --reporter=list` -> 1 passed, exit 0 (an earlier background start of the same command produced no output I could read; the foreground rerun is the result)
- `npx playwright test --grep "axe" --reporter=list` -> 11 passed, exit 0

Problems:
- none found
