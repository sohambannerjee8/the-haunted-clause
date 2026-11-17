# The Haunted Clause

Paste any Terms & Conditions or privacy policy and it becomes a haunted house. Each room is a type of clause, and the worse the clause, the scarier the ghost. Built for Kiroween 2026 (category: Costume Contest).

**Not legal advice.**

> This README is a stub. Setup, tests, architecture, pre-existing work and licenses are completed in Phase 6.

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

## Quick start

```bash
npm install
cp .env.example .env.local   # optional; the app works with no key
npm run dev
```

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

Development tools: TypeScript (Apache-2.0), Tailwind CSS (MIT), ESLint and eslint-config-next (MIT), Vitest and @vitest/coverage-v8 (MIT), fast-check (MIT), Testing Library (MIT), jsdom (MIT), Playwright (Apache-2.0), @axe-core/playwright (MPL-2.0), tsx (MIT), license-checker (BSD-3-Clause).

Fonts: Creepster and Atkinson Hyperlegible, both under the SIL Open Font License 1.1 (`src/app/fonts/OFL-*.txt`).

APIs: Google Gemini (optional, server side, opt-in for pasted text only), used under the [Gemini API terms](https://ai.google.dev/gemini-api/terms).
