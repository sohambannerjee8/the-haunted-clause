> **Draft.** Written by Kiro's agent from [BUILD_LOG.md](../BUILD_LOG.md) for the author to rewrite in his own words before publishing. Every fact below is recorded there.

# The Haunted Clause: turning privacy policies into a haunted house with Kiro

*This post was written for the Kiroween 2026 hackathon (category: Costume Contest).*

Nobody reads the terms and conditions. The Haunted Clause doesn't ask you to. Paste a policy, or open one of three fictional sample houses, and the text becomes a haunted house with eight rooms, one per kind of clause: data selling in The Cellar, tracking in The Watching Portraits, auto-renewal in The Coin Vault, forced arbitration in The Silent Court, and so on. Every risky clause becomes a ghost, and the worse the clause, the scarier the ghost.

The one design rule was that every spooky element has to carry information. A ghost's size, shape, colour, motion and the numeral on it all show its severity, from a calm wisp (0, checked and fine) to a tattered, menacing ghost with glowing eyes (3). Colour is never the only signal. Click a ghost, or press Enter on it, and a panel shows the exact clause, a plain-English explanation and why it matters. Above the house sits the Haunt Score. The terrible sample, Murkwillow Social, scores **97 · Run**. The mild one, Quillwhisper Notes, scores 14 · Mostly quiet. "Lights on" mode turns the house into a plain, accessible list of the same findings.

It is not legal advice, and the app says so.

## How it works

The analysis runs in the browser. A clause splitter breaks the text into clauses, and a property test checks that joining them back gives the input exactly. 45 rules give each risky clause a room and a severity, and 11 mitigations lower it when the clause reassures you ("We do not sell your data."). An exception marker such as "but" or "except" in the same clause cancels the reassurance, so "We do not sell your data, but we may share it with advertising partners." stays serious. Each room's worst ghost sets a ceiling on how much that room adds to the score, so a long but mild policy stays low. The highest reachable score is 97.

There is no login, no database and no stored text. The app works fully with no API key. If the site has a Gemini key and you opt in, only the flagged clauses go to a server route for a plainer reading, which can raise or confirm a severity but never lower it.

## Building it with Kiro

The build started from a written brief and a file of approved decisions, and Kiro did the building. Everything it used is in the repository's `.kiro/` folder.

**Specs.** The app has three specs: the clause analyzer, the LLM explainer and the haunted-house UI. Each went from requirements (in EARS form) to design to tasks, with the author approving at set stops. The design step changed the product. A quick simulation while designing the score showed that the planned formula gave a realistic long policy 97, which would make every long policy look terrible. The design offered two fixes, and the per-room ceilings won.

**The part that went wrong first.** The spec-reviewer agent failed the specs three times in a row on the same item: every acceptance criterion needs a named test. Each review listed different criteria, and each round of fixes patched only those, sometimes creating new gaps. After the third failure the build stopped and asked the author. The fix was a traceability matrix of all 236 criteria, each mapped to a test and a task, plus a script, `npm run check:trace`, that fails if any criterion is missing. The fourth review passed, and the script ran before every push after that.

**Steering.** Six always-included steering files held the rules: the hackathon checklist copied word for word, the palette with contrast ratios computed from the WCAG formula, and a testing policy that says every property test runs 1,000 cases and nothing is ever skipped.

**Custom agents.** Five verification agents (spec reviewer, test verifier, security reviewer, UI and accessibility reviewer, rules auditor), each with no write tool; shell limited to build/test commands. They ran at every gate with fresh context, and their reports are committed unchanged. They found real problems. The UI reviewer, using the app in a real browser through Playwright MCP, noticed that the reassuring clause "We do not sell your data." was explained as "This clause lets the company sell what it knows about you." Every mitigation now has its own explanation. The spec reviewer showed that one test server, which carries a placeholder key, could have reached Google if a browser stub was missed; it now runs behind a dead local proxy, and a test proves an unstubbed request fails.

**Hooks.** Four hooks: tests on save, a secret scan on save, a repository rules check, and a "spec sync" hook that logs each finished task. The secret guard caught a fake key the agent planted in a probe file to test it. Spec sync did not work as first designed. It was tied to Kiro's spec task panel, and when the agent tried to start a task that way, Kiro answered "Agent 'spec-task-execution' not found in registry". A task the author started from the panel left no trace in the repository. The hook was moved to fire when a `tasks.md` file is saved, and from then on it fired on every ticked task.

**MCP.** Playwright MCP worked and was used for the accessibility gates. Context7 never connected in Kiro: its first download ran past the 60-second connect timeout, and reconnecting didn't fix it. The library docs came from `node_modules` instead.

**Property-based tests.** 36 fast-check properties at 1,000 runs each. The best catch was in the splitter: a policy starting with a blank line produced a clause made only of whitespace, with the counterexample `"\r\n\nWe may sell your personal information to third parties."`. None of the 45 unit tests started with a blank line. Another property's own guard showed that its generator never reached the success path, which meant the test would have passed while proving nothing.

## Numbers

- 772 unit and property tests and 85 end-to-end tests, all passing; line coverage 96.86%.
- First-load JavaScript of 142,493 bytes gzip-encoded; the paste box responds after about 1.65 s on a throttled 1.6 Mbps connection.
- The three sample companies were checked by web search to make sure no real company uses their names.

*(Author: add what you would do differently, and a link to the app and the repository.)*
