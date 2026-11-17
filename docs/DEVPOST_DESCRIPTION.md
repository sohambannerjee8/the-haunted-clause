# The Haunted Clause

**Category: Costume Contest** · Kiroween 2026

## Inspiration

Terms and conditions are written to be skipped. The Haunted Clause makes the risky parts impossible to miss by giving them a haunted house to live in.

## What it does

Paste any Terms & Conditions or privacy policy (up to 50,000 characters), or open one of three fictional sample houses (mild, average and terrible). The text becomes a haunted house with eight rooms, one per kind of clause:

| Room | Clause type |
| --- | --- |
| The Cellar | Data sharing and selling |
| The Watching Portraits | Tracking and profiling |
| The Coin Vault | Auto-renewal, fees and billing |
| The Locked Door | Cancellation and account deletion |
| The Silent Court | Forced arbitration and class-action waivers |
| The Mirror Room | Rights the company takes over your content |
| The Trapdoor | Liability limits and disclaimers |
| The Shifting Stairs | Terms the company can change without notice |

- **One ghost per risky clause.** Severity runs from 0 to 3, and each level differs in size, shape, opacity, colour, motion and a visible numeral: a calm wisp (0, checked and fine), a faint sheet (1), a worried ghost (2), and a tattered, menacing ghost with glowing eyes (3). Colour is never the only signal.
- **Every spooky element carries information.** Each room has a drawn prop that identifies it, and a room with no findings is calm, dusty and labelled "Quiet".
- **Ghost detail panel.** Click a ghost, or press Enter on it, to read the exact clause, a plain-English explanation, why it matters and where the reading came from ("Rule reading" or "Medium's reading"). A reassuring clause such as "We do not sell your data." is explained as a reassurance.
- **Haunt Score.** One number from 0 to 97 with a band label: Mostly quiet, Uneasy, Haunted or Run. The samples score 14 · Mostly quiet, 59 · Haunted and 97 · Run. Each room's worst ghost caps what that room adds, so a long but mild policy stays low.
- **Lights on mode.** The same findings as a plain, semantic list grouped by room, with no ghosts and no motion.
- **Keyboard and accessibility.** One Tab stop per room, arrow keys between ghosts, Enter or Space to open, Escape to close with focus returned. A 3 px focus ring on every control, 44 px minimum hit areas, reduced motion respected, sound off by default, and automated accessibility scans in every state. Works from 360 px wide to desktop.
- **Clear edge cases.** Empty text, the 50,000-character limit, non-English text, a policy with no risky clauses and one with only calm wisps each get a plain message.
- **Optional "medium".** If the site has a Gemini key and you opt in, only the flagged clauses of pasted text are sent for a plainer reading. The medium can raise or confirm a severity, never lower it. If it is missing, slow or wrong, the rule-based reading stays. The samples never call it.
- **Private by design.** No login, no database and no stored text. The analysis runs in the browser, and the app works fully with no API key.
- **Not legal advice**, and the app says so in the footer and in every detail panel.

## How we built it

Next.js 16 with TypeScript, Tailwind CSS and Motion, tested with Vitest, fast-check and Playwright with axe scans. The analyzer is pure TypeScript: a clause splitter whose output joins back to the input exactly, 45 rules with 11 mitigations and exception markers, and the Haunt Score. All art is inline SVG and CSS drawn for this project, the fonts are open-licensed and self-hosted, and the sound is synthesised in the browser.

The whole build ran in Kiro: three specs with 236 acceptance criteria and a traceability matrix, six steering files, four hooks, five verification agents that gate each phase, Playwright MCP for in-browser accessibility review, and 36 property-based tests at 1,000 runs each. [docs/KIRO_USAGE.md](KIRO_USAGE.md) describes how, including what did not work.

## Challenges

- Long policies all scored near the top under the first score formula. Per-room ceilings fixed it.
- Reassurances: "We do not sell your data." must calm a ghost, but "We do not sell your data, but we may share it with advertising partners." must not.
- The spec reviewer failed the specs three times on traceability, until every criterion was mapped to a named test and a script enforced it.

## What's next

More rooms and rules, and support for languages other than English. *(Author: confirm or replace; this is a suggestion, not a plan recorded in the build.)*

## Try it

- App: *(production link, added after deploying; see [DEPLOY.md](DEPLOY.md))*
- Code: https://github.com/sohambannerjee8/the-haunted-clause (MIT licence)
- Works with no login and no API key.
