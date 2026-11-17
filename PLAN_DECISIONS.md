# PLAN_DECISIONS.md

Decisions the user approved after writing PLAN.md. Where this file and PLAN.md conflict, this file wins. Known conflicts:

- Phase 1 approval stops: one per spec, after its design, instead of two.
- Agent wording: "no write tool; shell limited to build/test commands" instead of "read-only".
- Samples use precomputed explanations and never call the API at runtime.

Re-read PLAN.md and this file at the start of every phase and after every context compaction.

## C1. Decisions approved by the user

1. **LLM provider: Google Gemini.**
   - SDK: `@google/genai` (Apache-2.0).
   - Env vars: `GEMINI_API_KEY` (required for the LLM path) and `GEMINI_MODEL` (optional). The default model ID is checked through Context7 or the Gemini docs in Phase 3.
   - Gemini structured output accepts a JSON Schema. Generate it from the Zod schema, and still validate every response with Zod on the server.
2. **Gemini data handling.**
   - For pasted text, the live LLM call is opt-in. A clearly labelled button comes with a notice that the flagged clauses will be sent to Google, which may keep them under free-tier terms.
   - Only the clauses the classifier flagged are sent, never the full text.
   - DEPLOY.md recommends a billing-enabled (paid-tier) key.
   - The app works fully with no key. In that case the button is hidden and a line of text explains that rule-based readings are shown.
   - Source: aistudio.google.com/docs/terms, "Unpaid Services". On the free tier, Google uses content to improve products and human reviewers may read it. Paid services do not.
3. **Samples use precomputed explanations and never call the API at runtime.**
   - **Changed by C10.14:** `scripts/precompute-samples.mts` runs only as `npm run precompute:samples`, by hand. The build never calls Google and uses the committed JSON. (Original text: it ran as an npm `prebuild` step and also as `npm run precompute:samples`.)
   - When `GEMINI_API_KEY` is set, it runs each of the three samples through the same pipeline as the route: analyzer, flagged clauses, provider, Zod, then merge. It writes `src/lib/samples/sample-explanations.json` with `source: "llm"`.
   - When no key is set, it writes or keeps the rule-based content (`source: "rules"`) and exits 0. With a key, a rejected model or a failed sample call exits 1 (C10.13). The build cannot fail because of this script, since the build never runs it (C10.14).
   - The committed version of the file holds the rule-based content, because the builder has no key. The user regenerates it after adding a key and commits it (see manual steps). The Vercel build uses the committed file as it is; it does not call Gemini (C10.14).
   - The JSON is validated against the Zod schema when it is imported. A consistency test checks that its clause IDs match the current analyzer output for each sample, so drift fails the tests.
   - A UI E2E test proves that picking a sample makes no request to `/api/explain`.
4. **Rate limit.**
   - In memory, per server instance, sliding window, 10 requests per minute per IP. When the limit is hit, the response is the rule-based result with `reason: "rate-limited"`.
   - Client IP, verified from Vercel docs (vercel.com/docs/headers/request-headers): Vercel overwrites `x-forwarded-for` and does not forward external IPs, to prevent spoofing. `x-vercel-forwarded-for` is identical but is not overwritten by a proxy placed in front of Vercel.
   - Order of use: `x-vercel-forwarded-for`, then the first value of `x-forwarded-for`, then `x-real-ip`, then a shared `"unknown"` bucket.
   - The executor re-reads that Vercel page in Phase 3 and cites it in a code comment and in DEPLOY.md.
   - DEPLOY.md states plainly that the limit is best-effort: each serverless instance keeps its own count, counts reset on cold start, and instances do not share counts.
5. **Kiro app: Kiro IDE.** Hooks use native triggers:
   - `FileSave` for Test on save, Secret guard and Rules guard.
   - `PostTaskExecution` for Spec sync.
6. **Visual direction: Victorian gothic.**
   - Palette: deep aubergine, ink-black, candle-amber, and sickly green for severity 3.
   - Fonts: Creepster for headings only (not Nosifer) and Atkinson Hyperlegible for body text. Both are under the SIL Open Font License and are self-hosted through `next/font`, with no runtime request to Google.
7. **Mitigations and exception markers.** A mitigating phrase (for example "we do not sell") lowers severity only when no exception marker follows it in the same clause. The markers are: `except`, `unless`, `other than`, `however`, `provided that` (extended in C10.2 with `but`, `although`, `subject to`). Matching is case-insensitive and on word boundaries. Add tests for each marker, for a marker that comes before the mitigation (the mitigation still applies), and for a marker in a different clause (the mitigation still applies).
8. **Keyboard navigation in the house: roving tabindex.**
   - Each room that has ghosts is exactly one tab stop. Arrow keys (Left/Right and Up/Down) move between the ghosts in that room. Home and End jump to the first and last ghost. Enter or Space opens the detail panel. Escape closes it and returns focus to the same ghost. Tab moves to the next room, not the next ghost.
   - Rooms with no ghosts are not tab stops. Their "Quiet" status is visible text, is announced in each room's accessible name, and appears in Lights on mode.
   - E2E keyboard tests for the terrible sample: Tab visits all eight rooms in order, arrow keys reach every ghost in a room, and the Enter, Escape and focus-return cycle works.
9. **Agent wording.** Describe the verification agents everywhere as "no write tool; shell limited to build/test commands". Never call them "read-only". This applies to the agent files, steering, BUILD_LOG.md, README, docs/KIRO_USAGE.md, docs/DEVPOST_DESCRIPTION.md, the blog and social drafts, and COMPLETION_REPORT.md. PLAN.md itself stays unchanged.
10. **Splitter abbreviations.** The splitter never ends a clause after these: `e.g.`, `i.e.`, `Inc.`, `Ltd.`, `Co.`, `Corp.`, `U.S.`, `No.`, `Sec.`, `etc.`, `vs.`. A paragraph break still splits. Add a unit test for each abbreviation used mid-sentence, plus one for `etc.` followed by a paragraph break.
11. **LICENSE:** MIT, "Copyright (c) 2026 Soham Banerjee".
12. **Phase 1 approval:** one stop per spec, after its design. At each stop, show the requirements and the design together and wait for approval before writing that spec's tasks and moving on. (Changed for clause-analyzer only; see C10.1.)
13. **Submission period:** open. Start Phase 0 immediately.

## C2. Remaining assumptions

- Framer Motion is now published as `motion` (MIT, imported from `motion/react`). Use `motion` and note the rename in BUILD_LOG.md.
- The builder saves each verification agent's full report, unchanged, to `docs/gate-reports/phase-N-<agent>-attempt-K.md`, and appends a summary (verdict, attempt number, problems) to BUILD_LOG.md.
- Sound is synthesised in code with the Web Audio API, so there are no audio asset files. Sound is off by default.

## C3. Architecture

The analyzer runs in the browser, so pasted text never leaves the device unless the user opts in.

```mermaid
flowchart LR
  A[Paste text] --> B[analyze in browser<br/>splitter, classifier, score]
  S[Pick sample] --> B
  S --> P[committed sample-explanations.json<br/>precomputed by hand]
  P --> C
  B --> C[House view: 8 rooms, ghosts, Haunt Score]
  B --> L[Lights on list]
  C -->|opt-in, pasted text only, key configured| D[POST /api/explain<br/>flagged clauses only]
  D --> E{rate limit, Zod input check}
  E -->|ok| F[Gemini, 15 s timeout]
  F --> G{Zod output check}
  G -->|valid| H[merge: severity = max of rule and LLM<br/>quote never changes]
  G -->|invalid| R[source: rules + reason]
  E -->|limited or bad| R
  F -->|timeout, error, no key| R
  H --> C
  R --> C
```

## C4. Analyzer design (spec: clause-analyzer)

- **Splitter:**
  - Returns `Clause{id, start, end, text}`, where `text === input.slice(start, end)` and the spans are contiguous. Joining all clause texts gives back the input exactly.
  - It splits at paragraph breaks, list markers, and `. ; ? !` followed by whitespace.
  - It never splits after the abbreviations listed in C1.10.
  - IDs are `c-<start>`.
- **Classifier:**
  - A data table of patterns per room. Each pattern has a severity, an explanation template and a "why it matters" template.
  - Mitigating phrases lower the severity, subject to the exception markers in C1.7.
  - Each clause is classified on its own, with no `Date` and no randomness.
- **Severity levels:** 0 means the clause matches a room but looks fine; it shows as a faint wisp, which tells the user the clause was checked. Levels 1 to 3 are ghosts of rising intensity.
- **Haunt Score:** replaced by C10.6 (per-room caps; highest reachable score 97). The original formula was:
  - Per-severity weights are 0, 0.05, 0.15 and 0.30.
  - The score is `round(100 × (1 − Π(1 − w)))`, multiplying over all findings.
  - It is always a whole number from 0 to 100, and adding a finding can never lower it.
- **Input limits:** Input over 50,000 characters returns a typed error result instead of throwing. A non-English check (few English stopwords) sets a flag, and the UI then shows a notice.
- **Properties:** The six from PLAN.md section 4, each run with `fc.assert(..., { numRuns: 1000 })`. The monotonic property inserts the risky clause at a clause boundary (for example joined with `"\n\n"`).

## C5. LLM explainer design (spec: llm-explainer)

- **Input:** At most 40 clauses, each at most 1,500 characters, validated with Zod.
- **Output:** `{findings:[{id, plainEnglish ≤400, whyItMatters ≤400, severity 0–3}]}`. The route returns `{source: "llm" | "rules", reason?: "no-key" | "timeout" | "invalid" | "rate-limited" | "error" | "bad-request", findings}`.
- **Merge rules:**
  - IDs the server did not send are dropped.
  - Severity becomes `max(rule, llm)`.
  - The quote always comes from the analyzer.
- **Prompt injection:** Clause text is treated as data in the system instruction, and explanations are rendered as plain text, never as HTML.
- **Server-only code:** `import "server-only"` keeps the provider code out of the browser bundle. The route handler is built by a factory (`createExplainHandler({ provider, rateLimiter, now, log, isKeySet })`) so tests can pass in mocks.
- **Logging:** Only reason codes are logged, never request bodies or clause text.
- **Route settings:** no `runtime` export (C10.10: Next.js 16 with Cache Components rejects it; the route runs on Node.js). `maxDuration = 30` (Vercel Hobby allows up to 300 s).
- **Precompute:** The sample precompute script (C1.3) reuses the provider, schema and merge code.
- **Properties:**
  - Merging never lowers a severity.
  - Merging never changes a quote.
  - The merged result has the same IDs as the rule-based result.
  - Any JSON at all (`fc.anything()`) falls back to the rules result without throwing.

## C6. UI design (spec: haunted-house-ui)

- **Input screen:**
  - A textarea with a live character counter and a hard 50,000 cap.
  - Three sample cards. Picking one loads its static precomputed explanations.
  - An Analyze button.
  - The house view is loaded with a dynamic import, which keeps the first screen light.
- **House layout:** An SVG and CSS house with eight rooms, 2 columns × 4 rows on mobile and 4 × 2 on desktop. A room with no findings is drawn as calm and dusty, with the text "Quiet".
- **Ghosts:**
  - Each ghost is a `<button>` with `data-severity` and an aria-label such as "Severity 3 ghost in The Cellar".
  - Intensity is shown by size, opacity, colour, motion amplitude and a visible numeral, so colour is never the only signal.
  - Keyboard behaviour follows C1.8.
- **Detail panel:** Built on the native `<dialog>` element. It shows the exact quote, the plain-English explanation, why it matters, the severity, and a source badge reading "Rule reading" or "Medium's reading".
- **Haunt Score:** Shown as a number plus a band label:
  - 0–24: Mostly quiet
  - 25–49: Uneasy
  - 50–74: Haunted
  - 75 and above: Run (the highest reachable score is 97; see C10.6)
- **Lights on mode:** A toggle switches to a plain, semantic list of the same findings.
- **Motion:** `MotionConfig reducedMotion="user"` plus a CSS `prefers-reduced-motion` media query.
- **Sound:** Off by default (see C2).
- **Page chrome:** A skip link, and a "Not legal advice" notice in the footer and the detail panel.
- **LLM availability:** The server passes only `llmAvailable: boolean` to the page, never the key.

## C7. Expected sample results

These are fixtures, checked in both unit and E2E tests.

- Mild sample: score ≤ 25.
- Average sample: score 35–65.
- Terrible sample: score ≥ 80, with at least one ghost in every room.
- All three are fictional companies with invented names. Web-search each name to confirm it is not a real company, and record the check in BUILD_LOG.md.

## C8. Tooling

- **Tests:** Vitest with `@vitest/coverage-v8`, Testing Library with jsdom, fast-check, Playwright, and `@axe-core/playwright` (MPL-2.0, listed in the README licenses).
- **Coverage thresholds**, enforced in the Vitest config:
  - `src/lib/analyzer/**`: 90% of lines.
  - `src/lib/llm/**`: 90% of lines.
  - Everything else: 80% of lines.
- **E2E setup:** Tests run against `next build && next start` with no key. The pasted-text LLM path is stubbed in the browser with `page.route`. Exception (C10.18): the `llm-ui` project builds with a placeholder key value so that `llmAvailable` is true, and its server's outbound traffic goes to a dead local proxy.
- **Scripts in `scripts/`:**
  - `secret-scan.mjs` scans files, the staged diff, or STDIN (for `git log -p --all`). It detects Google keys (`AIza…`), private key blocks, `sk-` style keys, and env assignments that look like keys.
  - `check-repo-rules.mjs` runs `git check-ignore` on paths inside `.kiro`, checks the MIT LICENSE text, and checks that `.env.example` is tracked with no value set.
  - `test-related.mjs` reads the hook's STDIN JSON and runs `vitest related <file> --run`.
  - `check-bundle.mjs` builds with a canary key, then searches `.next/static` for both the canary and the variable name.
  - `precompute-samples.mts` is described in C1.3.
- **Fake keys in test fixtures** are assembled at runtime by joining strings. Otherwise the secret guard and GitHub push protection would flag the test files.
- **`.gitignore`:** `.env*` then `!.env.example`, plus `.next`, `node_modules`, `coverage`, `playwright-report`, `test-results` and `.vercel`. It must contain nothing that matches `.kiro`, including broad patterns such as `.*`.
- **MCP:** `.kiro/settings/mcp.json` has Context7 (`@upstash/context7-mcp`) and Playwright MCP (`@playwright/mcp`), both pinned to versions checked with `npm view`. No API keys go in this file.
- **Agents:** Markdown files in `.kiro/agents/`.
  - No agent has the `write` tool.
  - Shell permissions are limited to build and test commands: `npm run test*`, `npm run build`, `npm run lint`, `npm run typecheck`, `npm run check:*` (including `check:trace`), `npx playwright test`, `npx vitest`, `npm audit`, `npx license-checker`, `git log`, `git ls-files`, `git check-ignore`, `git show` and `git diff`.
  - ui-a11y-reviewer also gets the Playwright MCP tools.
- **Linting:** Recent Next.js removed `next lint`, so the `lint` script runs `eslint .`.
- **Scaffolding:** `create-next-app` refuses to run in a folder holding PLAN.md. Scaffold into a temporary folder and move the files in.

## C9. User's manual steps (do not do these; prepare for them)

1. Get a Gemini API key (paid tier recommended) and put it in `.env.local`.
2. Run `npm run precompute:samples` (the build never does this; the deployed samples use whatever file is committed). It first makes one real `models.get` call and prints `precompute: model=<id>`; if Google rejects the model name or the key, it stops with an ERROR and exit code 1 and leaves the file alone (set `GEMINI_MODEL` and rerun). Then check `src/lib/samples/sample-explanations.json` (each entry should say `"source": "llm"` and name the model), record the model name in BUILD_LOG.md, and commit the file.
3. Create the public GitHub repository and push.
4. Deploy to Vercel and set `GEMINI_API_KEY` (and `GEMINI_MODEL` if wanted), following docs/DEPLOY.md.
5. Record the demo video from docs/VIDEO_SCRIPT.md and upload it to YouTube.
6. Rewrite docs/KIRO_USAGE.md in his own words.
7. Fill in and submit the Devpost form, using docs/DEVPOST_DESCRIPTION.md.
8. Publish docs/BLOG_DRAFT.md and docs/SOCIAL_POST.md.

## C10. Changes approved during Phase 1 (16 November 2026)

1. **Approval stops.** clause-analyzer has two stops: after requirements and after design (the user's instruction at the start of Phase 1). llm-explainer and haunted-house-ui keep one stop each, showing requirements and design together (C1.12).
2. **Exception markers extended.** The markers are now eight: `except`, `unless`, `other than`, `however`, `provided that`, `but`, `although`, `subject to`. Each marker has its own test. A test must show that "We do not sell your data, but we may share it with advertising partners." is not lowered to severity 0.
3. **Room examples.** At least three positive and two negative example clauses per room, all listed in the clause-analyzer design, each with its own test (Requirement 2.7).
4. **Haunt Score check.** The design must compute the score for a realistic long policy (about 150 clauses, mostly severity 0 and 1 findings) and, if long policies land at 95 or above, propose adjusted weights that keep the six properties and the sample bands. Outcome: see the clause-analyzer design, section "Haunt Score". The weights stay as in C4 until the user approves a change.
5. **Splitter boundary rule.** The design must state which rule wins when an indented list item follows a paragraph break (Requirement 1, criteria 8 and 9). Outcome: criterion 8 wins, with one boundary at the end of the whitespace run, which is the list marker.
6. **Haunt Score: Option B approved.** This replaces the formula in C4.
   - Per room: `raw = 1 − Π(1 − w)` with `w = 0, 0.05, 0.15, 0.30`, then `room = min(raw, cap)` with `cap = 0, 0.06, 0.15, 0.35` by the room's highest severity.
   - Score: `round(100 × (1 − Π(1 − room)))` over the rooms.
   - R5.1 and R5.6 are reworded to match.
   - The highest reachable score is 97 (all eight rooms at 0.35). The "Run" band text becomes "75 and above", and the UI shows no "/100" suffix.
7. **Requirement 1 clarifications approved.**
   - R1.7: the `.` in a list marker does not end a clause.
   - R1.13: boundaries in one whitespace run snap to its end.
8. **Cancelled mitigations do not fall back to the full rule severity.** New R3.11: when a mitigation is cancelled by an exception marker and no mitigation of that room applies, the cancelled mitigation's text is masked with spaces and the room's rules are re-run on the rest.
   - Severity = `min(raw, max(masked result, 1))`.
   - The finding records `cancelledMitigationId`.
   - R3.10 now holds three required tests:
     - "We do not sell your data, but you can ask us to delete it." ≤ 1 (gives 1).
     - "We do not sell your data, but we may share it with advertising partners." ≥ 2 (gives 3).
     - "We do not sell your data except to our partners." ≥ 1 (gives 1).
9. **clause-analyzer requirements and design approved** on 16 November 2026, with changes 2–8 above.
10. **llm-explainer requirements and design approved** on 16 November 2026, including these decisions:
    1. `store: false` on every Gemini call, using `models.generateContent` (not the Interactions API, which stores by default).
    2. Default model `gemini-4-hydrogen` with thinking level low, overridable with `GEMINI_MODEL`.
    3. No `runtime` export on the route (replaces "runtime = nodejs" in C5), and `maxDuration = 30`.
    4. An Origin check (see 11).
    5. Limits: a 256,000-byte body cap, 10,000 rate-limit keys with least-recently-used eviction, a 20-second browser timeout, and no-key requests counted by the rate limiter.
    6. DEPLOY.md notes that a timed-out call may still be billed.
11. **Origin check against the request's own host (addition a).** The Origin's host is compared with the `Host` header, or the request URL's host when `Host` is missing. No domain is hard-coded, so it works on localhost, Vercel preview URLs and the production URL. Each case has a test, plus `Origin: null` and no Origin.
12. **Privacy wording (addition b).**
    - The opt-in notice and README say the app does not store text and that Google processes the flagged clauses under its own terms. They never claim Google keeps nothing.
    - One source string lives in `src/lib/llm/privacy.ts`, and a test checks the README matches it.
    - DEPLOY.md cites https://ai.google.dev/gemini-api/docs/logs-datasets for `store: false`. That page says `generateContent` stores requests by default for projects created on or after 26 October 2026, and that the request-level `store` takes precedence.
13. **Strict model check.**
    - `npm run precompute:samples` (strict mode) makes one real `models.get` call before the sample calls and prints the model name.
    - If Google rejects the model name or the key, it fails loudly with exit code 1 and leaves the file unchanged. A failed sample call in strict mode also exits 1.
    - (Superseded by C10.14: there is no `prebuild` step and no lenient mode; the build never runs the script.)
    - The model name is stored in each LLM entry and recorded in BUILD_LOG.md by the user (C9 step 2).
    - The builder has no key, so the real call cannot be made during the build. It is covered by mocked tests and run by the user.
14. **The build never calls Google (haunted-house-ui addition a).**
    - The precompute script runs only as `npm run precompute:samples`, by hand. There is no `prebuild` step, and a test fails if any npm script other than `precompute:samples` runs it or uses `@google/genai`.
    - `npm run build` reads the committed `src/lib/samples/sample-explanations.json` as it is.
    - For each sample finding, the UI shows the medium's text when the JSON has an explanation for that finding's ID, and the rule text otherwise.
    - DEPLOY.md: run `npm run precompute:samples` and commit the file before deploying.
    - The strict and lenient modes of C10.13 are replaced by a single manual mode (strict).
15. **Visual review at Gate 4 (addition b).**
    - Save 12 screenshots to `docs/screenshots/`: input screen, the house for each sample, an open ghost detail panel and Lights on mode, each at 1440 px and 360 px wide, with reduced motion on.
    - They are made by `npm run screenshots` (`e2e/screenshots.spec.ts`, kept out of the normal E2E run).
    - After Gate 4 passes, show them to the user and stop before Phase 5. The agents check function and accessibility; the user judges the look.
16. **Redeploy note.** `llmAvailable` is read when the page is built, so docs/DEPLOY.md must say that adding, changing or removing `GEMINI_API_KEY` on Vercel needs a redeploy.
17. **haunted-house-ui requirements and design approved** on 16 November 2026, with additions 14–16.
18. **Placeholder key in one E2E project (builder fix after Gate 1 attempt 1).**
    - The approved haunted-house-ui design builds the `llm-ui` Playwright project with `GEMINI_API_KEY=placeholder-e2e-not-a-real-key`, only so that `llmAvailable` is true and the opt-in UI can be tested.
    - The spec-reviewer pointed out that this contradicts C8 ("with no key") and that a missed browser stub would let the server call Google.
    - Fix: that project's `next start` runs behind a dead local proxy (`NODE_USE_ENV_PROXY=1`, `HTTPS_PROXY`/`HTTP_PROXY=http://127.0.0.1:9`, `NO_PROXY=localhost,127.0.0.1`). A server guard test proves an unstubbed explain request returns `rules/error` within 5 s, and a browser guard proves no request leaves localhost.
    - Every other E2E project runs with no key.
19. **Spec traceability fixes from Gate 1 attempt 1** (no change to approved behaviour):
    - Measurable wording for llm-explainer R3.3 and haunted-house-ui R10.4 and R12.1.
    - Named checks for haunted-house-ui R1.6 and R15.3.
    - New llm-explainer R5.3 for the "may still be billed" DEPLOY.md note (C10.10).
    - `scripts/docs.test.mts` for the DEPLOY.md and README statements.
    - The README privacy section moves to Task 17.5.
    - Relative imports for analyzer and sample modules (clause-analyzer R7.4).
    - One shared generator module, `src/lib/analyzer/arbitraries.test-util.ts`.
    - Requirement-number fixes, and EARS lead words corrected.
20. **Spec fixes from Gate 1 attempt 2** (no change to approved behaviour):
    - R7.4 narrowed: only the sample text modules and `index.ts` are limited to analyzer-type imports; `explanations.ts` may import Zod and the JSON.
    - Named tests for llm-explainer R16.6 and R9.5, and haunted-house-ui R1.1, R1.2, R2.5, R4.6 and R5.6.
    - R10.4 split into repeating animations (≥ 1 s per cycle) and one-off fades (one direction, ≤ 300 ms; the design's fades are 200 ms).
    - R12.1 lists every state that `layout.spec.ts` checks.
    - An `overCapString` generator for R1.12.
    - The route exports `GET`, `PUT`, `PATCH` and `DELETE` as explicit 405 handlers, so `Cache-Control: no-store` is on every response (R1.3, R1.4, R8.2).
21. **Traceability matrix and spec-reviewer item 4 (approved by the user on 16 November 2026, after Gate 1 attempt 3).**
    - `.kiro/specs/traceability.md` maps every acceptance criterion in the three specs to its named test, property or check and its task(s).
    - `npm run check:trace` (`scripts/check-traceability.mjs`, with its own tests) fails when:
      - a criterion has no row;
      - a row names no test or check;
      - a task does not exist;
      - a named test file is not mentioned in one of the row's tasks;
      - or a named agent does not exist.
    - spec-reviewer item 4 passes when `npm run check:trace` exits 0 and a spot check of 30 entries across all three specs (at least 8 from each) finds each named test listed in a task.
    - The user also approved:
      - If Gate 1 attempt 4 fails only on minor or traceability-naming items, there is no fifth round. The open items are logged in BUILD_LOG.md and added to the relevant tasks, test-verifier enforces them as each task is built, and the build moves on to Phase 2.
      - If attempt 4 fails on a conflict with PLAN_DECISIONS.md or a scope limit, the builder stops and asks.
      - The builder pushes to origin after every gate that passes, and logs each push.
22. **Fixes from Gate 1 attempt 3** (no change to approved behaviour):
    - Named checks for haunted-house-ui R2.6, R6.7, R11.4, R17.2 and R19.3.
    - The heading structure is defined: `h1` app name, `h2` "Inside the house" or "Lights on", `h3` rooms, `h2` dialog title.
    - The 405 handlers `await connection()`, so Cache Components cannot prerender the `GET`, and a production-build E2E test checks the 405 and headers for `GET`, `PUT`, `PATCH` and `DELETE`.
    - New haunted-house-ui R10.5 (Lights on stops all repeating motion, matching the design-language 5-second rule) and R19.4 (focus ring on every focusable element, matching design-language).
    - `e2e/shell.spec.ts` is named.
    - `meta.ts` is created in clause-analyzer Task 15.2 and imports nothing.
    - The stale `route.ts` Files row is fixed.
    - A one-route test is added for llm-explainer R1.1.
    - security-reviewer item 6 no longer mentions a build-time script.
    - New named tests that the matrix needed: `server-only.test.ts`, `assets.test.mts`, `HauntedApp.test.tsx`, and `no-storage.test.ts` extended to llm and api code.

## D. Task map (spec tasks.md files must match these ranges)

- Phase 0: Tasks 1–6 (scaffold, steering, guard scripts, hooks and MCP, agents, Gate 0).
- Phase 1: Tasks 7–10 (three specs, one approval stop each after design; Gate 1).
- Phase 2 (clause-analyzer tasks.md): Tasks 11–16.
- Phase 3 (llm-explainer tasks.md): Tasks 17–22.
- Phase 4–5 (haunted-house-ui tasks.md): Tasks 23–33.
- Phase 6: Tasks 34–35 (README, DEPLOY.md, drafts, Gate 6).
- Phase 7: Task 36 (COMPLETION_REPORT.md and final message).

The full task text is in the execution handoff the user approved; the summary of each task is reproduced in the spec tasks.md files when they are written.

## C11. Changes approved during Phase 4 (16 November 2026)

1. **Push after every finished task as well as after every gate.** The user asked for the uncommitted Task 27.1–27.2 work to be committed and pushed at once, and from then on for a push after each finished task and after each gate, each logged in BUILD_LOG.md. This extends C10.21 ("push after every gate"). Before each push the builder runs `check:secrets`, `check:history`, `check:rules` and `check:trace`.

## C12. Changes approved before Gate 4 (16 November 2026)

The user asked for three fixes before Gate 4, each test first. They are clause-analyzer Tasks 16.3 and 16.4 (added after Phase 2), plus a change to how spec tasks are run.

1. **Mitigation phrasing gap (bug).** "We will never sell your personal data." scored Cellar severity 3, because the no-sell reassurance accepted "never" only straight after "we". The cellar no-sell and no-share mitigations must accept "will never". Every other mitigation is checked for the same gap (a missing modal or adverb form), and each mitigation gets a test for the form it now accepts.
2. **Rule calibration.**
   - Mirror Room: an ordinary licence (for example a royalty-free licence to host and display your content) is severity 1 or 2. Severity 3 is kept for licences that are perpetual, irrevocable, sublicensable or that let the company sell your content.
   - Trapdoor: an ordinary exclusion of indirect or consequential damages is severity 1 or 2. Severity 3 is kept for total liability exclusions.
   - New rules: cancellation only by phone or in person (Locked Door); disclosure in a merger or acquisition (Cellar); open-ended data retention (Cellar).
   - Each change gets positive and negative examples. The sample bands (C7) must still hold.
3. **Run spec tasks from Kiro's spec task panel.** From now on each remaining spec task is started from Kiro's spec task interface ("Start task") rather than by editing its checkbox, so the Spec sync hook (`PostTaskExec`) fires. The first time it fires is logged in BUILD_LOG.md.
