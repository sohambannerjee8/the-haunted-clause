# Devpost submission pack: The Haunted Clause

Every Devpost field, ready to paste. Only the video link and your student details are left blank. Nothing here has been submitted.

The "Kiro usage" section is condensed from `docs/KIRO_USAGE.md`, which is a draft you said you would rewrite in your own words; rewrite this section the same way before submitting.

## Project name

The Haunted Clause

## Tagline

Paste any privacy policy and it becomes a haunted house: every ghost is a clause, and the worse the clause, the scarier the ghost.

## About the project

### Inspiration

Terms and conditions are written to be skipped. The Haunted Clause makes the risky parts impossible to miss by giving them a haunted house to live in.

### What it does

Paste any Terms & Conditions or privacy policy (up to 50,000 characters), or open one of three fictional sample houses. The text becomes a haunted house with eight rooms, one per kind of clause: The Cellar (data sharing and selling), The Watching Portraits (tracking and profiling), The Coin Vault (auto-renewal, fees and billing), The Locked Door (cancellation and account deletion), The Silent Court (forced arbitration and class-action waivers), The Mirror Room (rights over your content), The Trapdoor (liability limits) and The Shifting Stairs (terms that change without notice).

- One ghost per risky clause. Severity runs from 0 to 3, and each level differs in size, shape, opacity, colour, motion and a visible numeral, from a calm wisp to a tattered, menacing ghost with glowing eyes. Colour is never the only signal.
- Click a ghost, or press Enter on it, to read the exact clause, a plain-English explanation, why it matters and where the reading came from.
- The Haunt Score sums up the house as a number and a band: Mostly quiet, Uneasy, Haunted or Run. The fictional samples score 14 · Mostly quiet, 59 · Haunted and 97 · Run.
- Lights on mode shows the same findings as a plain, accessible list. Keyboard use has one Tab stop per room and arrow keys between ghosts; reduced motion is respected and sound is off by default.
- Optional: on the live site you can opt in to ask "the medium" (Google Gemini) for a plainer reading of pasted text. Only the flagged clauses are sent, and the medium can raise or confirm a severity but never lower it. If it is slow or wrong, the rule reading stays.
- No login, no database, no stored text. The analysis runs in your browser. Not legal advice, and the app says so.

### How we built it

Next.js 16 with TypeScript, Tailwind CSS and Motion. The analyzer is pure TypeScript that runs in the browser: a clause splitter whose output joins back to the input exactly, 48 rules with 11 mitigations and exception markers, and the Haunt Score with per-room ceilings (the highest reachable score is 97). One server route calls Gemini with a 15-second timeout, validates every answer with Zod, and logs only an outcome code. All art is inline SVG and CSS made for this project; the fonts are open-licensed and self-hosted; the optional sound is synthesised in the browser.

The whole build ran in Kiro, from three specs to five verification agents (see "Kiro usage" below). Tests: 856 unit and property tests and 85 end-to-end tests, with line coverage at 96.87%.

### Challenges we ran into

- Under the first score formula every long policy scored near the top. Per-room ceilings fixed it.
- Reassurances: "We do not sell your data." must calm a ghost, while "We do not sell your data, but we may share it with advertising partners." must not.
- The spec reviewer failed the specs three times on traceability, until every one of 236 acceptance criteria was mapped to a named test and a script enforced it.
- The medium's readings for the samples added claims the clauses do not make, so the samples keep their rule readings and the medium stays opt-in for pasted text.

### Accomplishments that we're proud of

- Every spooky element carries information: the room is the clause type, the ghost is the severity, the score is the whole policy.
- It works fully with no API key and no login, and the key never reaches the browser bundle (checked by a build-time canary test).
- Property-based tests (fast-check, 1,000 runs each) caught a splitter bug that no unit test had.

### What we learned

Writing requirements and a design before code changed the product: the score formula and the reassurance rules were both decided on paper, with numbers, before any code existed. Verification agents with fresh context found problems the builder had stopped seeing.

### What's next

More rules for more kinds of clause, and languages other than English.

## Built with

kiro, next.js, react, typescript, tailwind-css, motion, zod, google-gemini, vercel, vitest, fast-check, playwright, axe-core

## Try it out

- Live app: https://the-haunted-clause.vercel.app
- Source code (MIT licence): https://github.com/sohambannerjee8/the-haunted-clause

## Video demo

_(blank: your YouTube video link)_

The recording is `video/demo.webm` on your machine (git-ignored), made from `docs/VIDEO_SCRIPT.md`; see BUILD_LOG.md for how it was made.

## Category

Costume Contest

## Kiro usage

> Condensed from `docs/KIRO_USAGE.md` (a draft). Rewrite in your own words before submitting.

The Haunted Clause was built in Kiro from a written brief. Everything Kiro used is in the repository's `.kiro/` folder.

- **Specs:** three (clause analyzer, LLM explainer, haunted-house UI), each requirements in EARS form, then design, then tasks; 236 acceptance criteria in all. After the spec-reviewer agent failed the specs three times on traceability, a matrix mapping every criterion to a named test and a script, `npm run check:trace`, made it impossible to miss one again.
- **Steering:** six always-included files: product, tech, structure, the hackathon rules copied word for word, the design language with computed contrast ratios, and a testing policy (no skipped tests, every property test at 1,000 runs).
- **Hooks:** four: tests on save, a secret scan on save, a repository rules check, and a spec-sync hook that logs each finished task. The spec-sync hook first relied on the spec task panel, which never fired for this build; it was moved to fire when a `tasks.md` file is saved.
- **Custom agents:** five verification agents (spec reviewer, test verifier, security reviewer, UI and accessibility reviewer, rules auditor), each with no write tool; shell limited to build/test commands. They gated every phase with fresh context; 17 reports are committed unchanged.
- **MCP:** Playwright MCP let the UI reviewer use the app in a real browser, and was used to check the live site. Vercel MCP created and deployed the Vercel project linked to the repository. Context7 was configured but never connected in Kiro.
- **Property-based tests:** 36 fast-check properties at 1,000 runs each; one found a splitter bug with the counterexample `"\r\n\nWe may sell your personal information to third parties."`.

## Student details

_(blank: student status, school and expected graduation, if the form asks)_

## Before you submit

- Add the video link above, and fill in the student details if they apply.
- Rewrite the "Kiro usage" section and `docs/KIRO_USAGE.md` in your own words.
- Check the live app once more: https://the-haunted-clause.vercel.app
