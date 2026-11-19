# Requirements: haunted-house-ui

## Introduction

This spec covers everything the user sees and touches in The Haunted Clause. It includes:
- the input screen, where the user pastes text or picks one of three fictional samples;
- the haunted house, with eight rooms and one ghost per finding;
- the ghost detail panel and the Haunt Score;
- the plain "Lights on" list;
- the opt-in control that asks the medium (Gemini) to explain pasted text;
- keyboard use, reduced motion, sound and the layout from 360 px to desktop;
- the edge-case, loading and error states (Phase 5).

The analysis itself runs in the browser with the clause-analyzer. The medium's reading comes from the llm-explainer, through precomputed data for samples and an opt-in call for pasted text. The look follows `.kiro/steering/design-language.md`.

Sources: PLAN.md sections 2, 3, Phase 4 and Phase 5; PLAN_DECISIONS.md C1.2, C1.3, C1.6, C1.8, C6, C10; the clause-analyzer and llm-explainer specs.

## Glossary

- **App**: the page at `/`.
- **Input screen**: the first screen, with the textarea, the sample cards and the Analyze button.
- **House view**: the screen shown after analysis, holding the Haunt Score, a toolbar and either the house or the Lights on list.
- **Finding**: an analyzer finding, after any merge with the medium's reading (llm-explainer `ExplainedFinding`).
- **Ghost**: the button that shows one finding with severity 1–3.
- **Wisp**: the button that shows one finding with severity 0 ("checked, looks fine").
- **Room**: one of the eight rooms, in the order in the clause-analyzer `ROOMS` list.
- **Quiet room**: a room with no findings.
- **Detail panel**: the modal dialog that shows one finding.
- **Lights on mode**: the plain list view of the same findings.
- **Medium's reading**: findings that came from the LLM (precomputed for samples, or from the opt-in call).
- **Rule reading**: findings that came only from the analyzer.
- **llmAvailable**: the boolean the server passes to the app; `true` only when a key is configured (llm-explainer R3.2).
- **Reduced motion**: the user's `prefers-reduced-motion: reduce` setting.
- **Severity label**: 0 "Looks fine", 1 "Mild concern", 2 "Real concern", 3 "Serious concern".
- **Band**: the Haunt Score label: 0–24 "Mostly quiet", 25–49 "Uneasy", 50–74 "Haunted", 75 and above "Run".

## Requirements

### Requirement 1: Page shell

**User Story:** As any visitor, I want a clear page with the app's name, a way to skip to the content and a visible "not legal advice" notice, so that I know what this is and what it is not.

#### Acceptance Criteria

1. THE app SHALL render one `h1` reading "The Haunted Clause", set `<html lang="en">` and the document title "The Haunted Clause".
2. THE app SHALL show a footer on every screen with the text "Not legal advice" and one sentence saying the readings are automated and can be wrong.
3. THE app SHALL provide a "Skip to content" link as the first focusable element, which moves focus to the main content.
4. THE app SHALL use only fonts committed to the repository under the SIL Open Font License, with their licence files, loaded through `next/font/local`: Creepster for headings, room names and the band label; Atkinson Hyperlegible for all other text. The browser SHALL request no font from any other origin.
5. THE app SHALL use only images and art made in this project (inline SVG and CSS) and SHALL load no image, audio or font from another origin.
6. THE app SHALL NOT use `localStorage`, `sessionStorage`, cookies, IndexedDB or any analytics script. Verified by: `no-storage.test.ts`, which scans `src/` for `localStorage`, `sessionStorage`, `document.cookie` and `indexedDB`; and by `flow.spec.ts`, which after a full sample and pasted-text flow checks that both storages are empty, `document.cookie` is empty, `indexedDB.databases()` is empty, and no request went to a host other than the app's own.
7. THE footer SHALL contain a link "How it works and source code", underlined, to https://github.com/sohambannerjee8/the-haunted-clause (PLAN_DECISIONS.md C25.7).

### Requirement 2: Input screen

**User Story:** As a user, I want to paste a policy or pick a sample in one step, so that I can see the house quickly.

#### Acceptance Criteria

1. THE input screen SHALL show a textarea with the visible label "Paste a Terms & Conditions or privacy policy", a live character counter in the form "1,234 / 50,000 characters", and an "Analyze" button.
2. THE textarea SHALL refuse input beyond 50,000 characters (UTF-16 code units), so that typing the 50,001st character leaves the length at 50,000.
3. WHEN a paste would make the text longer than 50,000 characters, THE app SHALL keep the first 50,000 characters of the result and show the message "Your text was cut at 50,000 characters." in a polite live region.
4. WHEN the user presses Analyze with an empty or whitespace-only textarea, THE app SHALL stay on the input screen, show "Paste a policy or pick a sample first." next to the textarea, and set `aria-invalid="true"` on the textarea with `aria-describedby` pointing to the message.
5. THE input screen SHALL show three sample cards, mild, average and terrible, each with the fictional company name, a one-line description of how haunted it is, and a button "Open this house".
6. THE character counter SHALL be announced to assistive technology only through its visible text, and SHALL NOT announce on every keystroke.
7. THE input screen SHALL show, under the paste box, in the body font and mist colour: "Your text is read in your browser and never stored. The app finds risky clauses and files each one in a room of the house." (C25.1).

### Requirement 3: Analysis in the browser

**User Story:** As a user, I want my text read on my own device, so that nothing leaves it unless I choose.

#### Acceptance Criteria

1. WHEN the user presses Analyze with non-empty text, THE app SHALL run the clause-analyzer `analyze()` in the browser and show the house view.
2. THE app SHALL make no network request containing the pasted text, or any part of it, unless the user presses the opt-in control (Requirement 14).
3. WHEN the user opens a sample, THE app SHALL analyze the sample text in the browser, use the sample's precomputed reading (llm-explainer R16), and make no request to `/api/explain`.
4. THE app SHALL keep pasted text only in memory, in component state, and SHALL discard it when the page is closed or reloaded.

### Requirement 4: The house and its rooms

**User Story:** As a user, I want to see at a glance which kinds of clause are haunted, so that I know where to look.

#### Acceptance Criteria

1. THE house SHALL show all eight rooms in room order, each with its name as a heading and its clause type as text.
2. WHILE the viewport is narrower than 768 px, THE house SHALL lay the rooms out in 2 columns and 4 rows; WHILE it is 768 px or wider, in 4 columns and 2 rows. The visual order SHALL match the DOM order.
3. WHEN a room has no findings, THE room SHALL be drawn calm, with no ghost art, and SHALL show the visible text "Quiet".
4. WHEN a room has findings, THE room SHALL show one ghost or wisp per finding, in input order (up to the cap in criterion 8), and a visible count of every finding such as "3 ghosts" (wisps counted separately as "1 checked, looks fine").
5. EACH room SHALL have an accessible name made of its room name and its status: for example "The Cellar, 3 ghosts, worst: serious concern", "The Mirror Room, 1 checked, looks fine" or "The Trapdoor, quiet".
6. THE decorative house frame SHALL be hidden from assistive technology (`aria-hidden="true"`) and SHALL carry no information that is not also in text.
7. THE rooms in one row of the house SHALL be aligned to the top of the row, so a room with many ghosts grows alone and does not stretch the other rooms in its row (PLAN_DECISIONS.md C22.1).
8. WHEN a room has more than 12 findings, THE room SHALL draw its 12 most severe (ties going to the earlier finding), in input order, and a button "+N more" (N being the number not drawn) that expands the room in place to every finding and changes to "Show fewer", which collapses it again; the button SHALL carry `aria-expanded`, and the room's accessible name and visible count SHALL still count every finding. Lights on mode SHALL list every finding (C22.2).
9. THE house view SHALL show, between the "Inside the house" heading and the house, in the body font and mist colour, the legend "Each ghost is one clause. 0 looks fine · 1 mild concern · 2 real concern · 3 serious concern." and the note "Quiet means no risky clause of this kind was found. It doesn't prove the policy is safe." (C25.3, C25.4).

### Requirement 5: Ghosts and wisps

**User Story:** As a user, I want scarier ghosts for worse clauses, so that the severity is obvious, even without colour.

#### Acceptance Criteria

1. EVERY ghost and wisp SHALL be a `<button>` with `data-severity` equal to its finding's severity and `data-finding-id` equal to its finding's ID.
2. EVERY ghost SHALL have the accessible name "Severity N ghost in <Room name>: <severity label>", and every wisp "Severity 0 wisp in <Room name>: looks fine".
3. EVERY ghost and wisp SHALL show its severity numeral as visible text.
4. THE ghost's drawn size, opacity and colour SHALL follow the table in design-language.md for its severity, so that each level differs from the others in at least size, opacity, colour and numeral.
5. EVERY ghost and wisp SHALL have a hit area of at least 44 × 44 CSS pixels.
6. EVERY ghost and wisp SHALL show a visible focus ring (3 px candle-amber outline, 2 px offset) when focused.

### Requirement 6: Ghost detail panel

**User Story:** As a user, I want to read the exact clause behind a ghost and what it means, so that I can decide whether to worry.

#### Acceptance Criteria

1. WHEN the user activates a ghost or wisp (click, Enter or Space), THE app SHALL open a modal `<dialog>` with `showModal()`, labelled by its heading.
2. THE detail panel SHALL show: the room name; the severity numeral and severity label; the exact clause quote as plain text, character for character equal to `input.slice(start, end)` with its whitespace preserved; the explanation; "Why it matters" followed by its text; a source badge "Rule reading" or "Medium's reading"; and the "Not legal advice" notice.
3. WHEN the finding has `mitigationId`, THE panel SHALL also say "A reassurance in this clause lowers its severity."; WHEN it has `cancelledMitigationId`, it SHALL say "This clause starts with a reassurance, then adds an exception."
4. WHEN the medium raised the severity above the rule severity, THE panel SHALL say "The medium raised this from <rule severity> to <severity>."
5. THE panel SHALL render every text as plain text, never as HTML.
6. WHEN the user presses Escape or the panel's "Close" button, THE app SHALL close the panel and return focus to the ghost or wisp that opened it.
7. WHILE the panel is open, focus SHALL stay inside it, and the rest of the page SHALL be inert.
8. THE panel SHALL explain its source badge in visible text next to it: "From the app's built-in rules" for a rule reading, "Rewritten by the AI medium" for the medium's reading (C25.6).

### Requirement 7: Haunt Score

**User Story:** As a user, I want one number that sums up the policy, so that I can compare policies.

#### Acceptance Criteria

1. THE house view SHALL show the Haunt Score as a whole number and its band label, in the form "<score> · <band>", with no "/100" suffix.
2. THE Haunt Score SHALL equal the clause-analyzer `hauntScore` of the findings currently shown, including severities raised by the medium.
3. WHEN the score changes (after a new analysis or after the medium's reading arrives), THE app SHALL announce "Haunt Score <score>, <band>" once in a polite live region.
4. THE house view SHALL always show, directly under the Haunt Score panel, in the body font and mist colour at 16 px or larger, the line "Scores run from 0 to 97, the most haunted a policy can be: 0–24 Mostly quiet · 25–49 Uneasy · 50–74 Haunted · 75+ Run.", with the current score's band in bold, marked `aria-current="true"` and followed by the visible text "(this policy)", so the highlight is not colour alone (PLAN_DECISIONS.md C24, C25.2).

### Requirement 8: Lights on mode

**User Story:** As a user who prefers plain text, or who uses a screen reader, I want the same findings as a simple list, so that I get all the information without the haunted house.

#### Acceptance Criteria

1. THE house view SHALL have a toggle button "Lights on" with `aria-pressed`, which switches between the house and the Lights on list.
2. THE Lights on list SHALL list all eight rooms in room order as headings, and under each room every finding in input order with its severity numeral and label, its exact quote, explanation, "why it matters" and source badge, and for a finding with `mitigationId` the line "A reassurance in this clause lowers its severity." (as in the detail panel, R6.3; PLAN_DECISIONS.md C13); a quiet room SHALL show "Quiet".
3. THE Lights on list SHALL contain exactly the same findings, with the same severities and texts, as the house.
4. THE Lights on list SHALL contain no ghost art, no animation and no decorative images.
5. WHEN the user switches modes, focus SHALL stay on the toggle button.
6. THE Lights on list SHALL show at the top, after the "Not legal advice" notice and before the first room, the same score scale line as R7.4 with the same band highlighted, then the legend and Quiet note of R4.9 (C24, C25.8).

### Requirement 9: Keyboard navigation (PLAN_DECISIONS.md C1.8)

**User Story:** As a keyboard user, I want to move through the house room by room, so that I do not have to press Tab past every ghost.

#### Acceptance Criteria

1. EACH room that has at least one ghost or wisp SHALL be exactly one Tab stop: exactly one of its ghosts or wisps SHALL have `tabindex="0"` and the others `tabindex="-1"`.
2. ROOMS with no findings SHALL NOT be Tab stops.
3. WHEN focus is on a ghost or wisp, ArrowRight and ArrowDown SHALL move focus to the next one in the same room, and ArrowLeft and ArrowUp to the previous one, wrapping from last to first and first to last; Home and End SHALL move to the first and last.
4. THE ghost or wisp that last had focus in a room SHALL keep `tabindex="0"`, so that tabbing back into the room returns to it.
5. Tab and Shift+Tab SHALL move to the next or previous room (or other control), not the next ghost.
6. Enter and Space SHALL open the detail panel (Requirement 6); Escape SHALL close it and return focus to the same ghost.
7. ALL controls on both screens SHALL be reachable and usable with the keyboard alone, in a logical order: skip link, toolbar, score, rooms in room order, footer.
8. WHEN a room has a "+N more" or "Show fewer" button, THE button SHALL be the last stop in that room's roving set (after its ghosts, reached with the arrows, Home and End, still one Tab stop for the room), Enter and Space SHALL toggle it, and focus SHALL stay on it after toggling (C22.3).

### Requirement 10: Motion

**User Story:** As a user who is sensitive to motion, I want the house to be still when I ask for that, without losing any information.

#### Acceptance Criteria

1. WHILE reduced motion is not requested, ghosts SHALL animate as in design-language.md (bob, sway and glow by level); wisps SHALL drift slowly.
2. WHILE reduced motion is requested, ghosts and wisps SHALL NOT animate: their computed `animation-name` SHALL be `none` and their transform SHALL not change over time; size, opacity, colour and numeral SHALL still show the level.
3. THE app SHALL wrap its animated parts in `MotionConfig reducedMotion="user"`, and every CSS animation SHALL be disabled by a `prefers-reduced-motion: reduce` media query.
4. NOTHING in the app SHALL flash more than 3 times in any one-second period. To make this measurable: every repeating animation (more than one iteration) SHALL last at least 1 second per cycle and change opacity through at most one peak per cycle; every one-off animation (one iteration, such as a fade-in) SHALL change opacity in one direction only and last at most 300 ms. Verified by: `motion.spec.ts`, which reads `document.getAnimations()` on each sample's house and in an open detail panel, and checks each animation's iterations, duration and opacity keyframes.
5. WHILE ghosts are animating, THE toolbar's "Lights on" toggle SHALL be visible and reachable, and switching it on SHALL stop every repeating animation on the page, so that motion lasting longer than 5 seconds can be stopped (design-language.md motion limits).

### Requirement 11: Sound

**User Story:** As a user, I want silence unless I ask for sound.

#### Acceptance Criteria

1. THE app SHALL start with sound off, and SHALL NOT create an `AudioContext` until the user turns sound on.
2. THE house view SHALL have a toggle button "Sound" with `aria-pressed`, off by default.
3. WHILE sound is on, opening a detail panel SHALL play one short synthesised tone (at most 600 ms) whose pitch depends on the finding's severity, so that the sound carries information; no other sound SHALL play.
4. THE app SHALL use only sound synthesised with the Web Audio API and SHALL ship no audio files.

### Requirement 12: Layout from 360 px

**User Story:** As a phone user, I want the whole app to fit my screen.

#### Acceptance Criteria

1. WHILE the viewport is 360 × 740 CSS pixels, in each of these states: the input screen; the input screen with the empty-input message; the input screen with the paste-cut notice; the loading state; the load-error state; the house for each sample; an open detail panel; Lights on mode; the opt-in panel, its listening state and a failure message; the non-English notice; the no-ghosts state; and the only-wisps state, THE page SHALL have: no horizontal scroll (`document.documentElement.scrollWidth <= clientWidth`); no clipped text, meaning every visible `h1`–`h3`, `p`, `li`, `label`, `button`, `blockquote` and `a` has `scrollWidth <= clientWidth + 1` and a bounding box inside the viewport's width; and no overlapping controls, meaning no two visible buttons, links or form fields have bounding boxes that intersect.
2. WHILE the viewport is 1440 × 900, THE house SHALL use the 4 × 2 room layout.
3. THE detail panel SHALL fit within the viewport at 360 × 740, scrolling inside itself when its content is taller.

### Requirement 13: Not legal advice

**User Story:** As the builder, I want the disclaimer wherever a reading is shown.

#### Acceptance Criteria

1. THE "Not legal advice" notice SHALL appear in the footer of every screen (Requirement 1.2) and inside the detail panel (Requirement 6.2), and at the top of the Lights on list.

### Requirement 14: Asking the medium about pasted text

**User Story:** As a user who pasted text, I want to choose whether the flagged clauses are sent for a plain-English reading, and to be told honestly what that means.

#### Acceptance Criteria

1. WHEN `llmAvailable` is `true`, the analysis came from pasted text, and there is at least one finding, THE house view SHALL show a button "Ask the medium" together with the llm-explainer `OPT_IN_NOTICE` text and a link "Google's Gemini API terms" to `GEMINI_TERMS_URL`.
2. WHEN `llmAvailable` is `false`, THE app SHALL NOT show the button, and SHALL show the line "These readings come from built-in rules. No medium is configured on this site."
3. WHEN the house shows a sample, THE app SHALL NOT show the button.
4. WHEN the user presses "Ask the medium", THE app SHALL call the llm-explainer `requestExplanations` once with the current findings, disable the button, and show "The medium is listening…" in a polite live region.
5. WHEN the result has `source: "llm"`, THE app SHALL merge it (llm-explainer R12), update the ghosts, detail texts, badges, Lights on list and Haunt Score, announce "The medium has spoken.", and hide the button.
6. WHEN the result has `source: "rules"`, THE app SHALL keep the rule reading and show a short message for the reason: `rate-limited` "The medium needs a rest. Try again in a minute."; `timeout` "The medium took too long. Showing the rule reading."; any other reason "The medium is silent right now. Showing the rule reading."; and SHALL re-enable the button except after `no-key`.
7. THE request body SHALL contain only the text of flagged clauses (llm-explainer R13); THE app SHALL never send the request automatically.
8. THE docs/DEPLOY.md file SHALL state that `llmAvailable` is read when the page is built, so adding, changing or removing `GEMINI_API_KEY` on Vercel needs a redeploy before the opt-in button appears or disappears. Verified by: llm-explainer `scripts/docs.test.mts`.
9. THE opt-in panel's first sentence SHALL be "The medium is an AI that rewrites these readings in plainer words.", followed by the existing privacy notice (OPT_IN_NOTICE) and terms link (C25.5).

### Requirement 15: Samples

**User Story:** As a judge, I want the samples to open instantly with the best reading available, without any API call.

#### Acceptance Criteria

1. WHEN the user opens a sample, THE house view SHALL take its medium's reading from the committed `src/lib/samples/sample-explanations.json` (llm-explainer `sampleReading`). FOR each finding, it SHALL show the medium's text when the file has an explanation for that finding's ID, and the rule text otherwise, and each finding's badge SHALL say which ("Medium's reading" or "Rule reading").
2. WHEN a sample is open, THE app SHALL make no request to `/api/explain` at any point, and neither the app nor the build SHALL call Google for samples (PLAN_DECISIONS.md C10.14).
3. THE house view SHALL say which sample is open, in the form "Sample: <company> (a fictional company)".

### Requirement 16: Edge states

**User Story:** As a user, I want clear messages for unusual input.

#### Acceptance Criteria

1. WHEN the text is empty, THE app SHALL behave as in Requirement 2.4.
2. WHEN the text is exactly 50,000 characters, THE app SHALL analyze it and show the house.
3. WHEN the analyzer sets `likelyNonEnglish`, THE house view SHALL show "This app reads English only. Results for other languages may be missing or wrong." above the house.
4. WHEN the analysis has no findings at all, THE house view SHALL show "No ghosts here. None of the clauses matched a risky pattern, but that does not make the policy safe." with every room Quiet and a Haunt Score of "0 · Mostly quiet".
5. WHEN the analysis has findings but none above severity 0, THE house view SHALL show "Only calm wisps here." above the house.
6. WHEN the analyzer returns its `too-long` error (which the input cap should prevent), THE app SHALL stay on the input screen and show "That text is longer than 50,000 characters."

### Requirement 17: Loading and error states

**User Story:** As a user on a slow connection, I want to know something is happening, and to be able to recover if it fails.

#### Acceptance Criteria

1. THE house view and the analyzer SHALL be loaded with a dynamic import when first needed, not as part of the input screen's first load.
2. WHILE that code is loading, THE app SHALL show "Opening the house…" with `aria-busy="true"` on the main region.
3. WHEN the dynamic import fails, THE app SHALL show "The house would not open. Check your connection and try again." with a "Try again" button that retries the import, and SHALL keep the pasted text.
4. THE house view SHALL have a "Read another policy" button that returns to the input screen with the pasted text still in the textarea (or empty after a sample).
5. WHEN an unexpected error occurs while rendering the house view, an error boundary SHALL show the message from criterion 3 instead of a blank page.

### Requirement 18: Performance

**User Story:** As a user on a slow phone connection, I want the first screen usable within a few seconds.

#### Acceptance Criteria

1. WHILE the network is throttled to 1.6 Mbps down, 750 kbps up and 150 ms latency, and the browser cache is empty, THE textarea SHALL be visible and accept typing within 5 seconds of navigation start.
2. THE JavaScript transferred for the first load of `/` (gzip-encoded bytes, before any user action) SHALL be at most 200 kB, and the measured value SHALL be recorded in tech.md and BUILD_LOG.md.

### Requirement 19: Accessibility checks

**User Story:** As a user of assistive technology, I want every screen to work for me.

#### Acceptance Criteria

1. AN axe scan (`@axe-core/playwright`, WCAG 2.2 A and AA tags) SHALL report zero serious and zero critical violations on each of these states:
   - the input screen;
   - the input screen with the empty-input error;
   - the house for each sample;
   - an open detail panel;
   - Lights on mode;
   - the opt-in panel (with `llmAvailable` true);
   - the no-ghosts state;
   - the non-English notice.
2. ALL text SHALL meet WCAG 2.2 AA contrast, using the palette in design-language.md.
3. THE page SHALL have one `main` landmark and one `h1` (the app name). THE house view SHALL have an `h2` heading ("Inside the house" for the house, "Lights on" for the list), every room heading SHALL be an `h3`, and the detail panel's title SHALL be an `h2` inside the dialog.
4. EVERY focusable element on both screens SHALL show the visible focus ring from design-language.md (3 px candle-amber outline, 2 px offset) when focused with the keyboard.

### Requirement 20: Screenshots for the user's visual review

**User Story:** As the owner, I want to judge the look myself before polishing starts, because the verification agents check function and accessibility, not taste.

#### Acceptance Criteria

1. WHEN Gate 4 runs, THE builder SHALL save PNG screenshots to `docs/screenshots/` of these six states, each at 1440 × 900 and at 360 × 740 (12 files): the input screen; the house for the mild, average and terrible samples; an open ghost detail panel (the first severity 3 ghost of the terrible sample); and Lights on mode (terrible sample). From the design pass on (PLAN_DECISIONS.md C14.7), THE builder SHALL also save one extra screenshot with motion on, `house-terrible-motion-1440.png` (13 files in all).
2. THE files SHALL be named `<state>-<width>.png`, for example `house-terrible-1440.png` and `detail-360.png`, and SHALL be made by a Playwright spec, `e2e/screenshots.spec.ts`, that runs only through `npm run screenshots` and not as part of `npm run test:e2e`.
3. EACH of the 12 screenshots in criterion 1 SHALL be taken with reduced motion on, so that ghosts are still and the images are repeatable; the extra motion screenshot SHALL be taken with motion on and SHALL check that animations are running (C14.7); every screenshot SHALL be taken with fonts loaded (`document.fonts.ready`).
4. WHEN Gate 4 has passed, THE builder SHALL show the screenshots to the user and SHALL NOT start Phase 5 until the user has reviewed them. Verified by: BUILD_LOG.md, which records the date the screenshots were shown and the user's reply before any Phase 5 entry.
