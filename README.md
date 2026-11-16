# The Haunted Clause

Paste any Terms & Conditions or privacy policy and it becomes a haunted house. Each room is a type of clause, and the worse the clause, the scarier the ghost. Built for Kiroween 2026 (category: Costume Contest).

**Not legal advice.**

> This README is a stub. Setup, tests, architecture, pre-existing work and licenses are completed in Phase 6.

## Features

<!-- features:start -->
- (none yet)
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
