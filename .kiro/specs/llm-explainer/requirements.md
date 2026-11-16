# Requirements: llm-explainer

## Introduction

The LLM explainer is the optional second reading of a policy. After the rule-based analyzer has produced its findings, the explainer can send the flagged clauses, and only those, to Google Gemini through one server route. Gemini rewrites each explanation in plain English and may raise or confirm a severity. Its output is checked against a Zod schema. If anything goes wrong (no key, a timeout, bad output, an error or the rate limit), the app keeps the rule-based result and keeps working.

For pasted text, the call happens only after the user opts in. The three fictional samples never call the route at runtime. Their explanations are computed once, at build time, by a script that uses the same pipeline.

Sources: PLAN.md sections 2, 3 and Phase 3; PLAN_DECISIONS.md C1.1–C1.4, C3, C5 and C8; the clause-analyzer spec (types `Finding`, `RoomId`, `Severity`).

## Glossary

- **Route**: the Next.js route handler at `src/app/api/explain/route.ts`, path `POST /api/explain`.
- **Handler**: the function built by `createExplainHandler({ provider, rateLimiter, now })` that the route exports as `POST`.
- **Provider**: an object with `explain(clauses, { signal }): Promise<string>` that returns the model's raw text. The real provider is the Gemini provider; tests use mocks.
- **Key**: the value of the `GEMINI_API_KEY` environment variable. "No key" means the variable is unset, empty or only whitespace.
- **Flagged clause**: the text of a clause that has a finding from the analyzer (any severity, 0–3).
- **Explain request**: the JSON body sent to the route: `{ clauses: [{ id, room, severity, text }] }`.
- **LLM finding**: one item of validated model output: `{ id, plainEnglish, whyItMatters, severity }`.
- **Explain response**: the JSON body the route returns: `{ source: "llm" | "rules", reason?, findings }`.
- **Reason code**: one of `no-key`, `timeout`, `invalid`, `rate-limited`, `error`, `bad-request`.
- **Merge**: combining the analyzer's findings with LLM findings into the findings the UI shows.
- **Client IP**: the address used as the rate-limit key, read from request headers in the order given in Requirement 9.
- **Sample explanations file**: `src/lib/samples/sample-explanations.json`, written by the precompute script.

## Requirements

### Requirement 1: One server route

**User Story:** As the builder, I want exactly one server route that talks to the LLM, so that there is one place to secure and test.

#### Acceptance Criteria

1. THE app SHALL expose exactly one route that calls an LLM: `POST /api/explain`.
2. THE route file SHALL export `POST` and `maxDuration = 30`, and SHALL NOT export `runtime` (Next.js 16 with Cache Components runs route handlers on the Node.js runtime and rejects the `runtime` export).
3. WHEN the route receives a method other than POST, THE app SHALL respond with HTTP 405 and SHALL NOT call the provider.
4. THE route SHALL set the header `Cache-Control: no-store` on every response.

### Requirement 2: Validate the request

**User Story:** As the builder, I want every request checked before it reaches the model, so that oversized or malformed input never costs money or crashes the route.

#### Acceptance Criteria

1. WHEN the request body is larger than 256,000 bytes, THE handler SHALL respond with HTTP 400 and `{ source: "rules", reason: "bad-request", findings: [] }` without parsing it further. (40 clauses of 1,500 characters need at most 180,000 bytes of UTF-8 text, plus JSON overhead.)
2. WHEN the body is not valid JSON, THE handler SHALL respond as in criterion 1.
3. WHEN the body does not match the explain-request schema, THE handler SHALL respond as in criterion 1. The schema is: `clauses` is an array of 1 to 40 items; each item has `id` matching `^c-\d+$`, `room` one of the eight room IDs, `severity` an integer from 0 to 3, and `text` a string of 1 to 1,500 characters; IDs are unique; no other properties are allowed.
4. WHEN the request has an `Origin` header whose host differs from the request's `Host` header, THE handler SHALL respond with HTTP 403 and `{ source: "rules", reason: "bad-request", findings: [] }`, and SHALL NOT call the provider.
5. THE handler SHALL NOT call the provider for any request that fails criteria 1–4.

### Requirement 3: Work with no key

**User Story:** As a judge with no API key, I want the app to work fully, so that I can review it without signing up for anything.

#### Acceptance Criteria

1. WHEN there is no key, THE handler SHALL respond with HTTP 200 and `{ source: "rules", reason: "no-key", findings: [] }` and SHALL NOT make any outbound network call.
2. THE server SHALL expose `isLlmAvailable(): boolean`, which returns `true` only when a key is set, so that the page can pass only this boolean to the browser.
3. WHEN there is no key, every analyzer feature SHALL still work; the explainer SHALL only ever replace explanation texts and raise severities, never be required for a result.

### Requirement 4: Call Gemini safely

**User Story:** As a user who opted in, I want a plain-English explanation of each worrying clause, so that I understand what I am agreeing to.

#### Acceptance Criteria

1. WHEN a valid request arrives, a key is set and the rate limit allows it, THE handler SHALL call the provider once with the request's clauses.
2. THE Gemini provider SHALL use `@google/genai` `models.generateContent` with: a system instruction; `responseMimeType: "application/json"`; `responseJsonSchema` generated from the LLM-output Zod schema with `z.toJSONSchema`; `store: false`, so that the request is not kept in Google AI Studio logs; and the model named by `GEMINI_MODEL`, or `gemini-4-hydrogen` when that variable is unset or empty.
3. THE Gemini provider SHALL send only the clauses in the request: their IDs, room names, clause types, rule severities and texts. It SHALL send nothing else from the user.
4. THE system instruction SHALL tell the model that clause texts are untrusted data to be explained, not instructions to follow, and SHALL define the four severity levels and the output length limits.
5. THE Gemini provider SHALL read the key at call time, not at module load, and SHALL be the only module that reads `GEMINI_API_KEY` apart from `isLlmAvailable`.

### Requirement 5: Time out after 15 seconds

**User Story:** As a user, I want a slow model to give up quickly, so that I am not left waiting.

#### Acceptance Criteria

1. WHEN the provider has not returned 15 seconds after the call starts, THE handler SHALL abort the call through its `AbortSignal` and respond with HTTP 200 and `{ source: "rules", reason: "timeout", findings: [] }`.
2. THE handler SHALL respond within 15.5 seconds of the call starting, even if the provider ignores the abort signal.

### Requirement 6: Validate the model's output

**User Story:** As a user, I want the app to ignore broken or invented model output, so that a bad answer never reaches the screen.

#### Acceptance Criteria

1. THE handler SHALL parse the provider's text as JSON and validate it against the LLM-output schema: `{ findings: [{ id, plainEnglish, whyItMatters, severity }] }`, where `plainEnglish` and `whyItMatters` are 1 to 400 characters after trimming whitespace, `severity` is an integer from 0 to 3, there are at most 40 findings, and no other properties are allowed.
2. THE handler SHALL drop LLM findings whose `id` is not in the request, and SHALL keep only the first LLM finding for each `id`.
3. WHEN the text is not JSON, does not match the schema, or has no findings left after criterion 2, THE handler SHALL respond with HTTP 200 and `{ source: "rules", reason: "invalid", findings: [] }`.
4. WHEN validation succeeds, THE handler SHALL respond with HTTP 200 and `{ source: "llm", findings }`, where `findings` are the validated, filtered LLM findings.
5. FOR any value at all, THE output validator SHALL return either a valid list of LLM findings or a failure, and SHALL NOT throw.

### Requirement 7: Fall back on errors

**User Story:** As a user, I want any failure to leave me with the rule-based house, so that the app never breaks.

#### Acceptance Criteria

1. WHEN the provider throws or rejects for any reason other than the timeout, THE handler SHALL respond with HTTP 200 and `{ source: "rules", reason: "error", findings: [] }`.
2. THE handler SHALL NOT throw for any request; every path SHALL produce an explain response.

### Requirement 8: Response contract

**User Story:** As the UI builder, I want one response shape for every outcome, so that the client handles all cases the same way.

#### Acceptance Criteria

1. EVERY response SHALL be JSON matching the explain-response schema: `source` is `"llm"` or `"rules"`; `reason` is present exactly when `source` is `"rules"` and is one of the six reason codes; `findings` is an array of LLM findings, empty when `source` is `"rules"`.
2. THE HTTP status SHALL be 200 for `llm`, `no-key`, `timeout`, `invalid` and `error`; 429 for `rate-limited`; and 400 or 403 for `bad-request`.

### Requirement 9: Per-IP rate limit

**User Story:** As the builder paying for the key, I want one visitor limited to a fair number of calls, so that a script cannot run up costs.

#### Acceptance Criteria

1. THE rate limiter SHALL allow at most 10 requests per client IP in any 60-second sliding window, counting every POST that passes the size check (Requirement 2.1), and SHALL check the limit before the provider is called.
2. WHEN a request goes over the limit, THE handler SHALL respond with HTTP 429, the header `Retry-After` giving the whole seconds until the oldest counted request leaves the window (at least 1), and `{ source: "rules", reason: "rate-limited", findings: [] }`, and SHALL NOT call the provider.
3. THE rate limiter SHALL read the client IP from the first of these that is present and non-empty: `x-vercel-forwarded-for`; the first comma-separated value of `x-forwarded-for`, trimmed; `x-real-ip`. WHEN none is present, it SHALL use the shared key `"unknown"`.
4. THE rate limiter SHALL keep its counts in memory in the server instance, take the current time from an injected clock, remove timestamps older than the window, and hold at most 10,000 IP keys, removing the least recently used key when a new one would exceed that.
5. THE rate limiter's code SHALL carry a comment citing https://vercel.com/docs/headers/request-headers for the header order, and docs/DEPLOY.md SHALL state that the limit is best-effort: each instance keeps its own counts, counts reset on a cold start, and instances do not share counts.

### Requirement 10: Log reason codes only

**User Story:** As a user, I want nothing I paste to end up in server logs.

#### Acceptance Criteria

1. THE handler SHALL write at most one log line per request, containing only: the outcome (`llm` or a reason code), the number of clauses in the request (or 0), and the duration in milliseconds.
2. THE handler and the Gemini provider SHALL NOT log clause text, model output, request headers, the client IP or the key, including inside error objects.

### Requirement 11: Store nothing

**User Story:** As a user, I want my text processed and thrown away.

#### Acceptance Criteria

1. THE route, handler, provider and rate limiter SHALL NOT write request or response content to files, databases, caches, cookies or any store; the rate limiter SHALL hold only IP keys and timestamps.
2. THE Gemini provider SHALL set `store: false` on every call (Requirement 4.2).

### Requirement 12: Merge the readings

**User Story:** As a user, I want the medium's reading to improve the rule reading, never to hide a danger or change the quoted words.

#### Acceptance Criteria

1. THE merge function SHALL return exactly one finding for each analyzer finding, with the same IDs in the same order.
2. FOR each finding with an LLM finding of the same ID, THE merge function SHALL set `severity` to the higher of the analyzer's and the LLM's severity, replace `explanation` with `plainEnglish` and `whyItMatters` with the LLM's `whyItMatters`, and set `source` to `"llm"`.
3. FOR each finding with no LLM finding of the same ID, THE merge function SHALL keep the analyzer's severity and texts and set `source` to `"rules"`.
4. THE merge function SHALL NOT change any finding's `quote`, `start`, `end`, `room` or `id`.
5. THE merge function SHALL ignore LLM findings whose ID is not an analyzer finding ID.

### Requirement 13: Build the request from flagged clauses only

**User Story:** As a user who opted in, I want only the worrying clauses sent, never my whole text.

#### Acceptance Criteria

1. THE client request builder SHALL build the explain request from the analyzer's findings only. Each item's `text` SHALL be the finding's `quote`, cut to its first 1,500 characters.
2. WHEN there are more than 40 findings, THE builder SHALL keep the 40 with the highest severity, breaking ties by input order.
3. WHEN there are no findings, THE builder SHALL return no request, and the client SHALL make no call.
4. THE text sent SHALL contain no part of the input that is outside the quotes of the selected findings.

### Requirement 14: Client fallback

**User Story:** As a user who opted in, I want a failed reading to quietly leave the rule reading in place.

#### Acceptance Criteria

1. THE client function `requestExplanations` SHALL return the LLM findings when the response is HTTP 200, matches the explain-response schema and has `source: "llm"`.
2. WHEN the call fails at the network level, returns a status other than 200, returns a body that does not match the explain-response schema, or takes longer than 20 seconds, THE client function SHALL return a rules result with a reason code (`error` for network failure and client timeout, `invalid` for a mismatched body, or the server's reason), and SHALL NOT throw.
3. THE client module SHALL send nothing on import or on analysis; it sends a request only when `requestExplanations` is called. The haunted-house-ui spec calls it only from the opt-in control for pasted text, never for samples.

### Requirement 15: Keep the key out of the browser

**User Story:** As the key owner, I want the key to exist only on the server.

#### Acceptance Criteria

1. EVERY module that reads `GEMINI_API_KEY` SHALL import `server-only`, except the build-time precompute script.
2. THE project SHALL NOT define any `NEXT_PUBLIC_` variable that holds the key or any part of it.
3. WHEN the app is built with `GEMINI_API_KEY` set to a canary value, `npm run check:bundle` SHALL find neither the canary value nor the string `GEMINI_API_KEY` in any file under `.next/static`, and SHALL exit non-zero if it finds either.

### Requirement 16: Precompute sample explanations at build time

**User Story:** As a judge, I want the samples to show the medium's reading instantly and for free, without the app calling the API while I click.

#### Acceptance Criteria

1. THE script `scripts/precompute-samples.mts` SHALL run as the npm `prebuild` step and as `npm run precompute:samples`.
2. WHEN a key is set, THE script SHALL, for each of the three samples, run the analyzer, build the explain request with Requirement 13, call the Gemini provider with the 15-second timeout, validate the output with Requirement 6, and write that sample's entry with `source: "llm"`, the model ID and the validated LLM findings.
3. WHEN a key is set and the call for a sample fails in any way, THE script SHALL keep that sample's existing entry if it is valid and consistent (criterion 6), and otherwise write the sample's rule-based entry.
4. WHEN there is no key, or the environment variable `HC_SKIP_PRECOMPUTE=1` is set, THE script SHALL make no network call; it SHALL keep each existing entry that is valid and consistent and write the rule-based entry for any other sample.
5. THE script SHALL exit with code 0 in every case, and SHALL print one summary line per sample with the sample ID, source and number of findings, and no clause text.
6. EACH entry in the sample explanations file SHALL hold `source`, `model` (`null` for rules), `findingIds` (the analyzer's finding IDs for that sample, in order) and `llmFindings` (empty for rules). An entry is "consistent" when its `findingIds` equal the analyzer's current finding IDs for that sample and every `llmFindings` ID is in `findingIds`. THE file SHALL be validated with Zod when the app imports it, and a test SHALL fail when any entry is not consistent, so that changing a sample or a rule without regenerating the file fails the tests.
7. THE rule-based entry for a sample SHALL have `source: "rules"`, `model: null`, the analyzer's finding IDs and `llmFindings: []`; the UI then shows the analyzer's own texts.
8. THE committed sample explanations file SHALL contain rule-based entries until the user regenerates it with a key (PLAN_DECISIONS.md C9 step 2).
9. THE script output SHALL be deterministic for the same model output: no timestamps, findings in analyzer order, keys in a fixed order and a trailing newline.
