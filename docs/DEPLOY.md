# Deploying The Haunted Clause

The app runs on the Vercel free (Hobby) plan. It has no database and no login. It works fully with no API key: the analysis runs in the browser and every finding has a rule-based reading.

## Environment variables

| Name | Required | What it does |
| --- | --- | --- |
| `GEMINI_API_KEY` | No | Turns on the optional "medium's reading" for pasted text. Without it the opt-in button is hidden and the app shows rule-based readings. |
| `GEMINI_MODEL` | No | Overrides the default model, `gemini-3.5-flash-lite` (stable, and the fastest model in Google's 3.5 family). |

Set them in Vercel under the project's Settings, Environment Variables. Locally, put them in `.env.local`, which git ignores. Never put a key in a tracked file.

A billing-enabled (paid-tier) key is recommended. On the free tier, Google's terms let Google use the content it receives to improve its products, and human reviewers may read it.

## The sample readings stay rule-based

The three sample policies never call the API, and the build never calls Google. Their readings come from the committed file `src/lib/samples/sample-explanations.json`, which holds rule-based readings for all three samples.

That is a deliberate choice (PLAN_DECISIONS.md C18). On 17 November 2026 the medium's readings for the samples were generated and reviewed, and rejected because they added claims the clause text does not make. The medium remains an opt-in feature for pasted text only.

If you want to try the medium on the samples again later:

1. Put your key in `.env.local`, and make sure `GEMINI_API_KEY` is not already set (even to an empty value) in your shell, because a variable that is already set wins over `.env.local`.
2. Run `npm run precompute:samples`. It first makes one `models.get` call and prints `precompute: model=<id>`. If Google rejects the model name or the key, it prints an ERROR, leaves the file alone and exits with code 1; set `GEMINI_MODEL` to a current model ID and run it again.
3. Read every generated reading against its clause. Commit the file only if you accept them; otherwise restore it with `git checkout -- src/lib/samples/sample-explanations.json`.

Vercel builds use the committed file as it is.

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

### The live deployment (17 November 2026)

The production site is **https://the-haunted-clause.vercel.app**. It was set up this way, through the Vercel MCP server in Kiro instead of the dashboard import:

- The project `the-haunted-clause` was created linked to the GitHub repository (production branch `main`). Vercel clones the repository itself, so no local file, and never `.env.local`, is uploaded.
- The first build had no environment variables. The author then added `GEMINI_API_KEY` for **Production** only, as a sensitive variable, in the project's Environment Variables page; `GEMINI_MODEL` is unset, so the default model is used. A production redeploy followed.
- Checked after the redeploy: the build compiled with no errors; the page reports the medium as available; the three samples score 14 · Mostly quiet, 59 · Haunted and 97 · Run and make no request to `/api/explain`; pasted text shows the opt-in notice and the "Ask the medium" button; the browser console logged no errors or warnings; Vercel reported no runtime errors.
- One real call of the medium, on a four-sentence text written for the test, returned the medium's reading with the "Medium's reading" badge in about 2 seconds. The server's only log line for it was `explain outcome=llm clauses=1 ms=1921`.
- Generated deployment URLs (`the-haunted-clause-<hash>-….vercel.app`) redirect to a Vercel sign-in, because the team's default Vercel Authentication covers everything except the production domain. Share only the production domain.

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
