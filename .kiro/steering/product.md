---
inclusion: always
---

# Product: The Haunted Clause

Kiroween 2026 hackathon entry, category **Costume Contest**. PLAN.md is the full brief; PLAN_DECISIONS.md holds later approved decisions and wins where they differ.

## What it does

The Haunted Clause turns any Terms & Conditions or privacy policy into a haunted house. Each room is a type of clause, and the worse the clause, the scarier the ghost. Every spooky element must carry information.

## What the user can do

1. Paste policy text (up to 50,000 characters), or pick one of three built-in fictional sample policies (mild, average, terrible).
2. See the house fill with ghosts, one per risky clause, in eight rooms.
3. Click a ghost to read the exact clause, a plain-English explanation and why it matters.
4. See an overall Haunt Score from 0 to 100.
5. Switch to "Lights on" mode: the same findings as a plain, accessible list.

## The eight rooms

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

## How analysis works

1. A clause splitter breaks the text into clauses. Joining them back gives the input exactly.
2. A deterministic rule-based classifier gives each clause a room and a severity from 0 to 3. Mitigating phrases lower severity unless an exception marker (except, unless, other than, however, provided that, but, although, subject to) follows in the same clause.
3. The Haunt Score combines all findings into a whole number from 0 to 100. Each room's worst ghost sets a ceiling on how much that room adds, so long but mild policies stay low; the highest reachable score is 97.
4. Optionally, a server-side Gemini call rewrites explanations in plain English and can raise or confirm a severity, never lower it. Pasted text needs the user's opt-in; samples use explanations precomputed at build time.
5. If the LLM is missing, slow or wrong, the rule-based result is shown. The app works fully with no API key.

## Scope limits

- No login, no database, no stored user text. Pasted text is processed and discarded.
- No real company's policy, name or logo anywhere. The samples are fictional companies written for this project.
- No copyrighted images, fonts or music. Open-licensed fonts and art made in this project only.
- English only (a notice appears for non-English text). Input capped at 50,000 characters.
- Sound is off by default. Motion respects the reduced-motion setting.
- The app states it is not legal advice.

## Kiro features in this build

Specs (three), steering (six files), hooks (four), custom verification agents (five, each with no write tool; shell limited to build/test commands), MCP (Context7 and Playwright), and property-based tests with fast-check.
