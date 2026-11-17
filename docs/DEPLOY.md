# Deploying The Haunted Clause

The app runs on the Vercel free (Hobby) plan. It has no database and no login. It works fully with no API key: the analysis runs in the browser and every finding has a rule-based reading.

## Environment variables

| Name | Required | What it does |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Turns on the optional "medium's reading" for pasted text. Without it the opt-in button is hidden and the app shows rule-based readings. |
| `GEMINI_MODEL` | No | Overrides the default model, `gemini-3.5-flash-lite` (stable, and the fastest model in Google's 3.5 family). |

Set them in Vercel under the project's Settings, Environment Variables. Locally, put them in `.env.local`, which git ignores. Never put a key in a tracked file.

A billing-enabled (paid-tier) key is recommended. On the free tier, Google's terms let Google use the content it receives to improve its products, and human reviewers may read it.

## Before you deploy: the sample readings

The three sample policies never call the API, and the build never calls Google. Their readings come from the committed file `src/lib/samples/sample-explanations.json`.

1. Put your key in `.env.local`.
2. Run `npm run precompute:samples`. It first makes one `models.get` call and prints `precompute: model=<id>`. If Google rejects the model name or the key, it prints an ERROR, leaves the file alone and exits with code 1; set `GEMINI_MODEL` to a current model ID and run it again.
3. Check that each entry in `src/lib/samples/sample-explanations.json` says `"source": "llm"` and names the model, then commit the file and push it.

Vercel builds use the committed file as it is. If you skip these steps, the samples show rule-based readings.

## Deploy on Vercel

These steps follow Vercel's [Deploying Git Repositories](https://vercel.com/docs/git) and [Managing Deployments](https://vercel.com/docs/deployments/managing-deployments) pages (checked 17 November 2026).

1. Make sure `main` is pushed to GitHub (`sohambannerjee8/the-haunted-clause`, a public repository on a personal account, which a Hobby account can import).
2. Sign in to Vercel with the same GitHub account and select **New Project** on the dashboard (or open https://vercel.com/new).
3. Pick `the-haunted-clause` from the repository list and select **Import**.
4. On the configuration page:
   - **Framework Preset:** Next.js (Vercel detects it).
   - **Root Directory:** leave it as the repository root.
   - **Build and Output Settings:** leave the defaults. The build command is `npm run build` (`next build`); no custom output folder or install command is needed.
   - **Environment Variables:** add `GEMINI_API_KEY` with your key if you want the opt-in reading of pasted text. Add `GEMINI_MODEL` only to override the default model. Leave both out for a rule-based-only site.
5. Select **Deploy**. When the build finishes, open the production domain (`<project>.vercel.app`) and check:
   - the input screen loads and each of the three sample houses opens (the terrible one shows "97 · Run");
   - with a key set, pasting text and opening the house shows the opt-in button; without a key it does not appear.
6. Judges need free access with no login. Under Settings, **Deployment Protection**, Vercel's Standard Protection leaves production domains public but protects preview and generated deployment URLs. Share only the production domain, and do not choose "All Deployments".

Vercel deploys again by itself on every push to `main`.

## A key change needs a redeploy

The page reads `llmAvailable` (whether a key is set) at build time, when the page is built. Adding, changing or removing `GEMINI_API_KEY` on Vercel has no effect on the opt-in button until you redeploy.

To redeploy: open the project, select **Deployments** in the sidebar, find the latest production deployment, open its **…** menu, select **Redeploy**, and confirm **Redeploy** in the dialog.

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
