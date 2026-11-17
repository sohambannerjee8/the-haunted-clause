# The Haunted Clause

Paste any Terms & Conditions or privacy policy and it becomes a haunted house. Each room is a type of clause, and the worse the clause, the scarier the ghost. Built for Kiroween 2026 (category: Costume Contest).

**Not legal advice.**

Every spooky element carries information. The room says what kind of clause it is, the ghost's size, shape, colour and numeral say how bad it is (severity 0 to 3), and the Haunt Score says how haunted the whole policy is. "Lights on" mode shows the same findings as a plain list.

## Features

<!-- features:start -->
- Arrive at a moonlit haunted house: paste a policy of up to 50,000 characters, or open one of three fictional sample houses (mild, average, terrible).
- The analysis runs in your browser: a rule-based reader splits the text into clauses and sorts risky ones into eight rooms.
- The haunted house: eight rooms, each with a drawn prop that identifies it, and one ghost per flagged clause whose size, shape, opacity, colour, motion and numeral rise with severity, from a calm wisp (checked, looks fine) through a worried ghost to a tattered, menacing ghost with glowing eyes and a jagged grin.
- Click or press Enter on a ghost to read the exact clause (without its section heading), a plain-English explanation, why it matters and where the reading came from; a clause that reassures you (for example "We do not sell your data") is explained as a reassurance.
- A large Haunt Score above the house, led by its band label (Mostly quiet, Uneasy, Haunted, Run).
- Lights on mode: the same findings as a plain, accessible list, including the note when a reassurance lowers a clause's severity.
- Keyboard use with one Tab stop per room and arrow keys between ghosts; reduced motion respected; sound off by default.
- Works from 360 px wide to desktop, and works fully with no API key.
- Fast first screen: on a slow connection (1.6 Mbps, 150 ms latency) the paste box responds in under 2 seconds; the house loads only when you open one.
- Clear messages for unusual input: empty text, the 50,000-character limit (long pastes are cut, with a notice), non-English text, a policy with no risky clauses, and one with only calm wisps.
- A loading message while the house opens, and if it fails to load, a "Try again" button that keeps your text.
- Optional: with a Gemini key on the site, ask "the medium" for a plain-English reading of pasted text, sending only the flagged clauses and only after you opt in.
<!-- features:end -->

## Setup

You need Node.js 20.9 or newer (the build was made and tested on Node 26.13.1 with npm 11.20.0) and git. No account, database or API key is needed.

1. Get the code and install the exact dependency versions from the lockfile:

   ```bash
   git clone https://github.com/sohambannerjee8/the-haunted-clause.git
   cd the-haunted-clause
   npm ci
   ```

2. Environment variables (optional). The app works fully without them. To turn on the optional "medium's reading" of pasted text, copy the example file and add a Google Gemini API key:

   ```bash
   cp .env.example .env.local
   ```

   | Name | Required | What it does |
   | --- | --- | --- |
   | `GEMINI_API_KEY` | No | Shows the opt-in button that asks Gemini for a plain-English reading of the flagged clauses in pasted text. Without it, every finding shows the rule-based reading. |
   | `GEMINI_MODEL` | No | Overrides the default model ID. |

   `.env.local` is ignored by git. Never put a key in a tracked file. See [docs/DEPLOY.md](docs/DEPLOY.md) for the paid-tier recommendation and for refreshing the sample readings with `npm run precompute:samples`.

3. Run it:

   ```bash
   npm run dev                  # development server on http://localhost:3000
   # or the production build:
   npm run build && npm start   # http://localhost:3000
   ```

## Tests

```bash
npm test                         # all unit and property tests, once
npm run test:coverage            # the same, with line-coverage thresholds
npx playwright install chromium  # once, before the first end-to-end run
npm run test:e2e                 # Playwright end-to-end tests
```

- `npm run test:e2e` builds the app twice and starts two production servers: port 3100 with no key, and port 3101 with a placeholder key behind a dead local proxy, so it can never reach Google. Both ports must be free. Set `CI=1` to make Playwright build fresh servers instead of reusing ones already running.
- No test calls a real LLM. The LLM is always mocked, and no test needs a key or a network connection beyond `localhost`.
- Every property-based test (fast-check) runs 1,000 cases.
- Coverage thresholds (lines): 90% for `src/lib/analyzer` and `src/lib/llm`, 80% for the rest of `src/`.
- Other checks: `npm run typecheck`, `npm run lint`, `npm run check:secrets` (secret scan of tracked files), `npm run check:history` (secret scan of git history), `npm run check:rules` (repository rules), `npm run check:bundle` (builds with a canary key and checks it never reaches the browser bundle), `npm run check:trace` (every spec criterion has a named test).
- `npm run screenshots` regenerates the review screenshots in `docs/screenshots/`.

Results at the end of the build (17 November 2026): 772 unit and property tests in 71 files, 85 end-to-end tests across the two projects, all passing; line coverage 96.86%.

## Architecture

```
src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css   page shell, self-hosted fonts, palette
│   └── api/explain/route.ts                the only server route (POST /api/explain)
├── components/                              input screen, night scene, sample cards, app state machine
│   └── house/                               house, rooms, props, ghosts, detail dialog, score, Lights on list, toolbar
└── lib/
    ├── analyzer/                            splitter, rules, classifier, score, analyze() — pure TypeScript
    ├── llm/                                 Zod schemas, merge, request builder, rate limit, handler, Gemini (server only)
    ├── samples/                             three fictional policies and their precomputed readings
    └── ui/                                  house model, roving tabindex, sound, retryable import
```

How a policy becomes a house:

1. **In the browser.** `analyze()` in `src/lib/analyzer` splits the text into clauses (joining them back gives the input exactly), gives each risky clause one of eight rooms and a severity from 0 to 3 using 45 rules and 11 mitigations, and computes the Haunt Score. It uses no network, clock or randomness, so the same text always gives the same house. The highest reachable score is 97.
2. **The house view** is loaded with a dynamic import, so the first screen stays light. Each finding becomes a ghost button; the detail dialog shows the exact clause, its explanation, why it matters and the reading's source.
3. **Optional, on the server.** If the site has a key and the user opts in, the browser sends only the flagged clauses to `POST /api/explain`. The route checks the Origin, the body size and shape (Zod) and a best-effort rate limit, calls Gemini with a 15-second timeout and `store: false`, validates the answer with Zod, and merges it. The medium can rewrite an explanation and raise or confirm a severity, never lower it. On any failure the rule-based reading stays. The key is read only in files that import `server-only`.
4. **Samples** never call the route. Their readings come from the committed `src/lib/samples/sample-explanations.json`.

Specs, steering, hooks and verification agents used to build it are in [`.kiro/`](.kiro/). How they were used is in [docs/KIRO_USAGE.md](docs/KIRO_USAGE.md) and [BUILD_LOG.md](BUILD_LOG.md).

## Privacy

The analysis runs in your browser. Pasted text is processed and discarded; there is no login and no database. The three sample policies never call any API.

If the site has a Gemini key and you choose to ask for the medium's reading of pasted text, the app shows this notice first:

> This app does not store your text. If you continue, only the flagged clauses are sent to Google Gemini for a plain-English reading. Google processes them under its own terms.

Google's terms: [Gemini API terms](https://ai.google.dev/gemini-api/terms).

## Pre-existing work

Everything in this repository was written for Kiroween 2026, except these standard resources:

- The `create-next-app` starter template (Next.js 16), used to scaffold the project. Its default logos and page were removed.
- Frameworks and libraries installed from npm, listed under Licenses below.
- Two fonts from the official `google/fonts` repository, committed unmodified in `src/app/fonts/` with their licence files: Creepster (Font Diner, Inc) and Atkinson Hyperlegible (Braille Institute of America, Inc).

All art (the house, rooms, props, ghosts and night scene) is inline SVG and CSS drawn for this project. The three sample policies and their companies are fictional and were written for this project. There is no audio file; the optional sound is synthesised with the Web Audio API.

## Licenses

This project: MIT, see [LICENSE](./LICENSE).

Runtime dependencies:

| Package | Version | License |
| --- | --- | --- |
| next | 16.4.6 | MIT |
| react, react-dom | 19.3.0 | MIT |
| zod | 4.6.7 | MIT |
| motion | 14.14.0 | MIT |
| @google/genai | 3.3.0 | Apache-2.0 |
| server-only | 0.0.1 | MIT |

`npx license-checker --production --summary` reports the whole production tree as MIT (44), Apache-2.0 (15), BSD-3-Clause (12), ISC (2), 0BSD (1), CC-BY-4.0 (1: `caniuse-lite`, browser data used at build time), LGPL-3.0-or-later (1: `@img/sharp-libvips`, an optional image library Next.js loads as a separate binary), and UNLICENSED (1: this package itself, which the tool reports that way because it is marked private; its licence is MIT).

Development tools: TypeScript (Apache-2.0), Tailwind CSS and @tailwindcss/turbopack (MIT), babel-plugin-react-compiler (MIT), ESLint and eslint-config-next (MIT), Vitest, @vitest/coverage-v8 and @vitejs/plugin-react (MIT), fast-check (MIT), Testing Library (MIT), jsdom (MIT), Playwright (Apache-2.0), @axe-core/playwright (MPL-2.0), tsx (MIT), license-checker (BSD-3-Clause), and the type packages @types/node, @types/react and @types/react-dom (MIT).

Build-time MCP servers, configured in `.kiro/settings/mcp.json` and run by Kiro through `npx` (not installed in the project or used by the app): Playwright MCP `@playwright/mcp` (Apache-2.0) and Context7 `@upstash/context7-mcp` (MIT).

Fonts: Creepster and Atkinson Hyperlegible, both under the SIL Open Font License 1.1 (`src/app/fonts/OFL-*.txt`).

APIs: Google Gemini (optional, server side, opt-in for pasted text only), used under the [Gemini API terms](https://ai.google.dev/gemini-api/terms).
