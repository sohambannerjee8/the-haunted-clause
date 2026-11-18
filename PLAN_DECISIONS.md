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
4. **Spec sync now fires on saving a tasks.md file (replaces C12.3).** The spec task panel route did not work in this workspace: Task 31.4, started from the panel, left no report, commit, checkbox change or Spec sync entry, and my own attempt to dispatch a task that way found no spec-task agent. So the user stopped the panel route. The Spec sync hook (`.kiro/hooks/spec-sync.json`) now has trigger `PostFileSave` with matcher `\.kiro/specs/[^/]+/tasks\.md$`, and keeps the same agent prompt. It fires when a task checkbox is ticked and the file is saved. Task checkboxes are ticked by hand again, each only after its task (or gate) has passed. If the hook does not fire, that is logged and the build carries on.

## C13. Mitigation texts (approved by the user after Gate 4, 17 November 2026)

The Gate 4 ui-a11y-reviewer pointed out that on a mitigated finding the rule's text says the opposite of the clause: "We do not sell your data." read "This clause lets the company sell what it knows about you." The user approved this change before the Gate 4 screenshots:

1. Each mitigation gets its own plain-English explanation and "why it matters" text (each 1 to 400 characters). When a mitigation lowers a finding (`mitigationId` set), the finding's `explanation` and `whyItMatters` are the mitigation's texts, so the detail panel and Lights on mode show them. Example: "We do not sell your data." reads like "This clause promises not to sell your data." Findings with no applied mitigation, including cancelled ones (R3.11), keep the rule's texts.
2. Lights on mode shows "A reassurance in this clause lowers its severity." for a mitigated finding, as the detail panel already does.
3. Clause-analyzer R4.5 and haunted-house-ui R8.2 are reworded, the clause-analyzer design and the traceability matrix are updated, the tests are written first, and the committed `sample-explanations.json` must still validate and stay consistent. Tasks: clause-analyzer 16.5 and haunted-house-ui 28.3.
4. The existing `classifier.test.ts` test "takes the explanation and why-it-matters texts from the rule named by ruleId (R4.5)" changes with the requirement: it now covers findings without an applied mitigation, and the new test file covers mitigated ones.

## C14. Design pass after the Gate 4 screenshot review (approved by the user, 17 November 2026)

The user approved the function and asked for one design pass before Phase 5. Every contrast ratio, hit area, keyboard path and test must keep passing.

1. **Input screen:** a moonlit night scene with the house silhouette behind the paste box; the three samples drawn as small house fronts with doors. The paste box and all text keep solid backgrounds, so contrast is unchanged. The sample buttons keep their names ("Open this house: <company>") and 44 px minimum size.
2. **Room props:** each room gets one small drawn prop that identifies it: cellar barrels, portrait frames with eyes, a coin vault door, a locked door with chains, a gavel, a cracked mirror, a trapdoor, crooked stairs. They repeat the room's identity, so they carry information under the design-language rule. They are `aria-hidden` SVG and never cover a ghost's hit area.
3. **Ghost shapes by severity:** size, opacity, colour and numeral stay as in design-language.md. The shape also changes: level 3 tattered with glowing eyes, level 2 uneasy, level 1 faint, level 0 a wisp.
4. **Haunt Score as the hero:** much larger, above the house, with the band label as the main phrase. The text stays "<score> · <band>" with no "/100" (R7.1).
5. **Background:** subtle fog and dim candlelight in the page background and the house frame only, as CSS and inline SVG within the 200 kB first-load budget. Any movement lives in the house frame, so Lights on mode still stops every repeating animation (R10.5), and the reduced-motion rule makes it fully still. No flashing (R10.4).
6. **Clause headings out of quotes:** when a clause starts with a short heading line (for example "1. Your information" on its own line), the finding's `start` moves past that line, so the displayed quote leaves the heading out and is still exactly `input.slice(start, end)`. The heading is also left out of classification, so a finding always quotes the words that triggered it. clause-analyzer R4.2 is reworded (Task 16.6); the finding ID stays the clause ID.
7. **Screenshots:** the 12 from R20 are regenerated, plus one extra with motion on (`house-terrible-motion-1440.png`, made by its own `@screenshots` test). Then the build stops for the user's review again.

## C15. Ghost expressions (approved by the user with the design-pass screenshots, 17 November 2026)

The user approved the design-pass screenshots and asked for one fix during Phase 5, without another review stop: the expressions read inverted. Level 2 must look worried and uneasy (raised inner brows, a small wavering mouth), not angry. Level 3 must be clearly the most menacing: hollow glowing eyes, a jagged mouth and a darker tattered hem. Size, opacity, colour, numeral, contrast and every test stay as they are, and the screenshots are regenerated (Task 32.0, done before Task 32.1).
## C16. Phase 6 additions (approved by the user at the start of Phase 6, 17 November 2026)
The user approved Phase 6 with three additions:
1. **Steering:** `.kiro/steering/product.md` must not present Context7 as used through Kiro, matching `docs/KIRO_USAGE.md` and BUILD_LOG.md (Playwright MCP was used through Kiro; Context7 was configured but only reached from the shell).
2. **Video script (`docs/VIDEO_SCRIPT.md`):** about 2:30 (still under the 2:50 limit), the real app on screen throughout, the terrible sample's "97 · Run" moment within the first 20 seconds, one ghost detail panel, Lights on mode and the keyboard path, ending on how Kiro was used. No music unless it is royalty-free and named in the script.
3. **Drafts:** `docs/KIRO_USAGE.md`, `docs/BLOG_DRAFT.md` and `docs/SOCIAL_POST.md` are drafts the user will rewrite in his own words, so each is marked as a draft at the top. Every claim is based on BUILD_LOG.md, including what did not work: the spec task panel route, the Context7 connection, and the Gate 1 traceability loop.
   - Builder's reading, reported to the user: in `docs/SOCIAL_POST.md` the draft note sits above the post, and the post text itself begins with `#KiroweenHackathon26` (the hackathon-rules clarification is about the post). The user deletes the note when publishing.
## C17. Default model and prompt tightening (approved by the user after the first real precompute run, 17 November 2026)
1. **Default model `gemini-3.5-flash-lite`** (was `gemini-4-hydrogen`, C10 llm-explainer decision 2). `GEMINI_MODEL` still overrides it, and thinking level low stays (Google's thinking page lists minimal, low, medium and high for this model). Google's models page shows it as stable and the fastest, lowest-cost model in the 3.5 family, with structured output and thinking (aistudio.google.com/docs/models/gemini-3.5-flash-lite and /docs/whats-new-gemini-3.6, fetched 17 November 2026).
   - Reason (corrected by the user on 17 November 2026): speed, after the timeouts. `gemini-4-hydrogen` is on Google's published model list, and the precompute's real `models.get` call accepted it. In the first run one sample (average) timed out at 15 seconds and one (terrible) failed with an unrecorded error. An earlier version of this entry gave "not on Google's model list" as a reason; that was wrong and is withdrawn.
2. **Prompt tightening.** The system instruction gains one paragraph: "Explain only what the clause text itself states. Do not add facts, consequences, exceptions, examples or comparisons that the clause does not state. Do not guess what other parts of the policy say. If the clause is a promise that protects the reader, say so plainly." The whyItMatters description becomes "saying how what this clause states could affect the reader". Reason: in the first run, three of the five mild readings added claims the clause does not make. llm-explainer R4.4 is extended to match.
3. Then `npm run precompute:samples` runs once (done; see C18 for the outcome). Every generated explanation is shown to the user, and `sample-explanations.json` is committed only after the user approves. The unapproved `gemini-4-hydrogen` output from the first run is not kept in the file, so a failed sample cannot mix the two models.
## C18. Sample readings stay rule-based (decided by the user after reviewing the gemini-3.5-flash-lite run, 17 November 2026)
1. The user reviewed all 37 readings from the one `gemini-3.5-flash-lite` run (average 8, terrible 29; mild failed) and rejected them, because the medium's readings added claims beyond the clause text (for example, class actions in an arbitration-only clause, and an arbitrator in a jury-trial clause). The first run's `gemini-4-hydrogen` mild readings were not kept either (C17.3).
2. `src/lib/samples/sample-explanations.json` stays the committed rule-based file (`source: "rules"` for all three samples). Nothing from either run is committed. The three samples show rule readings and the "Rule reading" badge.
3. The medium remains an opt-in feature for pasted text only: the opt-in notice, flagged clauses only, Zod validation and the never-lower merge are unchanged. Samples never call the API (unchanged from C1.3 and C10.14).
4. The `gemini-3.5-flash-lite` default and the tightened prompt (C17.1, C17.2) stay, and apply to pasted text.
## C19. Broader Cellar sharing rule (requested by the user after the production test, 17 November 2026)
The production test text "We may share your email address with our sponsors." got no finding, because the Cellar sharing rules named only third parties, partners, affiliates and advertising partners.
1. Sharing, disclosing, providing or transferring your data, information, email or details with or to **sponsors** is caught by `cellar.third-parties` (severity 2, like partners and affiliates); with or to **advertisers**, by `cellar.ad-partners` (severity 3, like advertising partners). Third parties, partners, affiliates and advertising partners keep their existing patterns and severities, so nothing they matched before is lost.
2. For the two new targets the thing shared must be named (data, information, email or e-mail, details), so "We provide reports to advertisers about how their ads performed." gives no finding. The rule count stays 45.
3. Tests first: four positive and three negative room examples, two `cellar.no-share` phrasings ("We do not share your email address with our sponsors.", "We will never share your data with advertisers.") and one exception case that cancels the reassurance. The sample scores stay 14, 59 and 97 with identical findings, so `sample-explanations.json` stays consistent. Task: clause-analyzer 16.7.
## C20. Remaining preparation, automated (requested by the user, 17 November 2026)
Nothing is published, uploaded or submitted. Only code and docs are pushed.
1. **Real-policy audit:** `scripts/audit-real-policies.mts` fetches the policies listed in `audit/sources.json`, analyses each in chunks within the 50,000-character cap, and writes `audit/report.md` (score and band, ghosts per room, up to 10 possible misses). `/audit/` is git-ignored, so neither the policy text, the report's quotes nor the real company names reach the repository (product rule: no real company's policy or name). The audit changes no rule; the user reviews the report first.
2. **Demo video:** `scripts/record-demo.mts` plays `docs/VIDEO_SCRIPT.md` on the live site with Playwright (the library, run from the shell) at 1440 × 900 with motion on, burning the narration in as captions through an in-page overlay. Output in git-ignored `/video/`. It never presses "Ask the medium". The Kiro segment shows a local page built from the repository's real `.kiro/` files, because a browser cannot film the Kiro window. An MP4 needs a full ffmpeg; without one only `demo.webm` is written and the conversion command is printed.
3. **Submission pack:** `docs/SUBMISSION_PACK.md` holds every Devpost field with the live and repository URLs, leaving blanks only for the video link and student details.
## C21. Rules for gaps found by the real-policy audit (requested by the user, 17 November 2026)
Written from generic example sentences only; no real policy text is in the repository.
1. **Shifting Stairs:** new `stairs.may-modify` (severity 1): the company can or may change, modify, update, amend or revise this or these or our policy, statement, notice, terms or agreement. It is listed last in the Stairs rules, so older rules of the same severity keep winning ties. `stairs.continued-use` (severity 2) also matches "continued use … means … the updated (or revised, new, changed) policy, terms or agreement".
2. **Watching Portraits:** new `portraits.derived-location` (severity 1): location based on or derived from an IP address, IP addresses mapped to location, or location provided by or received from third parties, partners, providers, advertisers or ad networks. Collecting precise location stays `portraits.location` (severity 2), which wins when both match.
3. **Cellar:** new `cellar.supplement` (severity 2): supplementing, enriching or augmenting your information with data from third parties, data or information providers, data brokers, partners or other sources.
4. The rule count goes from 45 to 48 (the `rules.test.ts` count changes with this approved table). Tests first: 9 positive and 6 negative room examples. The sample scores stay 14, 59 and 97 with identical findings, so `sample-explanations.json` stays consistent. Task: clause-analyzer 16.8.
## C22. Crowded rooms (requested by the user after the real-policy audit, 17 November 2026)
1. Rooms in a row are aligned to the top, so a crowded room no longer stretches its neighbours.
2. A room with more than 12 findings draws its 12 most severe (ties to the earlier finding, shown in input order) and a "+N more" button that expands the room in place and becomes "Show fewer". The room's accessible name and visible count still count every finding. Lights on mode lists every finding.
3. The button is the last stop in the room's roving set (arrows, Home, End), Enter and Space toggle it, focus stays on it, and Tab still leaves the room.
4. New criteria: haunted-house-ui R4.7, R4.8 and R9.8, with R4.4 noting the cap (239 criteria). Task: haunted-house-ui 32.3. E2E: `e2e/crowded.spec.ts` with a made-up 40-ghost text. The sample scores are unchanged, because no sample room has more than four findings.
