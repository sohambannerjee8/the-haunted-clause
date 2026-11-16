# Deploying The Haunted Clause

> Draft written in Phase 3 (Task 22.2) so the security reviewer can check the privacy and cost statements. The exact Vercel click-path is finished in Phase 6.

The app runs on the Vercel free (Hobby) plan. It has no database and no login. It works fully with no API key: the analysis runs in the browser and every finding has a rule-based reading.

## Environment variables

| Name | Required | What it does |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Turns on the optional "medium's reading" for pasted text. Without it the opt-in button is hidden and the app shows rule-based readings. |
| `GEMINI_MODEL` | No | Overrides the default model, `gemini-4-hydrogen`. |

Set them in Vercel under the project's Settings, Environment Variables. Locally, put them in `.env.local`, which git ignores. Never put a key in a tracked file.

A billing-enabled (paid-tier) key is recommended. On the free tier, Google's terms let Google use the content it receives to improve its products, and human reviewers may read it.

## Before you deploy: the sample readings

The three sample policies never call the API, and the build never calls Google. Their readings come from the committed file `src/lib/samples/sample-explanations.json`.

1. Put your key in `.env.local`.
2. Run `npm run precompute:samples`. It first makes one `models.get` call and prints `precompute: model=<id>`. If Google rejects the model name or the key, it prints an ERROR, leaves the file alone and exits with code 1; set `GEMINI_MODEL` to a current model ID and run it again.
3. Check that each entry in `src/lib/samples/sample-explanations.json` says `"source": "llm"` and names the model, then commit the file.

Vercel builds use the committed file as it is. If you skip these steps, the samples show rule-based readings.

## A key change needs a redeploy

The page reads `llmAvailable` (whether a key is set) at build time, when the page is built. Adding, changing or removing `GEMINI_API_KEY` on Vercel has no effect on the opt-in button until you redeploy.

## Privacy

The app does not store pasted text. There is no database, and the server logs one line per request with only an outcome code, a clause count and a duration. For pasted text, the medium's reading is opt-in: only after the user agrees are the flagged clauses, and only those, sent to Google Gemini, which processes them under its own terms.

Every Gemini call sets `store: false`. Google's [Logs and datasets](https://ai.google.dev/gemini-api/docs/logs-datasets) page says the `generateContent` API stores requests by default for projects created on or after 26 October 2026, and that the request-level `store` property takes precedence over the project setting. This controls Google's request logging only. Google's [Gemini API terms](https://ai.google.dev/gemini-api/terms) still apply, including the free-tier terms on how Google may use content. A billing-enabled key is recommended.

## Cost: timeouts

The server stops waiting for Gemini after 15 seconds and shows the rule-based reading. Aborting only stops this app's side of the call: Google may still finish processing a timed-out call, and it may still be billed.

## Rate limit

`POST /api/explain` allows 10 requests per minute per client IP. The limit is best-effort:

- Each server instance keeps its own counts in memory.
- Counts reset on a cold start.
- Counts are not shared between instances, so a visitor whose requests reach several instances can make more than 10 calls a minute.

The client IP comes from `x-vercel-forwarded-for`, then the first value of `x-forwarded-for`, then `x-real-ip` (see Vercel's [request headers](https://vercel.com/docs/headers/request-headers) page).
