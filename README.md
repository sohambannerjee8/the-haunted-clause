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

## License

MIT, see [LICENSE](./LICENSE).
