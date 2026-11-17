# Demo video script: The Haunted Clause

Target length **2:30** (the limit is under 3 minutes; this script stays well inside 2:50). Category: Costume Contest.

Everything on screen is the real app, running at a 1440 px wide window, except the last two segments, which show the project in Kiro. No mock-ups and no slides.

## Recording notes

- **Audio:** narration only. **No music** and no sound effects. Leave the app's own Sound toggle off, which is its default.
- **Screen:** record only the page area of the browser window, so no browser, operating system or bookmark logos appear. Close other tabs and notifications.
- **Motion:** leave the operating system's reduced-motion setting off, so the ghosts move. (With it on, they stand still, which also works but shows less.)
- **Branding:** nothing on screen or in the narration names a third-party product or company. The sample companies (Quillwhisper Notes, Mirebell Streaming, Murkwillow Social) are fictional and were checked by web search. Do not open the optional "medium" panel; it names an outside service.
- **Readings:** if the sample readings were refreshed with `npm run precompute:samples` before recording, the badge in the panel reads "Medium's reading" and the explanation wording differs. The narration below does not quote the explanation, so it fits either way.
- **Start state:** the app open on the input screen, scrolled to the top.

## Script

### 0:00–0:16 · Cold open: the terrible house

**On screen:** the moonlit input screen. Scroll to the three sample house fronts and click the door of the third, **Murkwillow Social**. "Opening the house…" shows for a moment, then the house fills with ghosts, and the large score above it reads **97 · Run**. Hold on the score for two seconds.

**Narration:** "This is a privacy policy from a company that doesn't exist. A terrible one. The Haunted Clause turned it into a haunted house, and it scores ninety-seven. Run."

### 0:16–0:36 · What the house is telling you

**On screen:** move the pointer slowly across the eight rooms, left to right and top to bottom: The Cellar, The Watching Portraits, The Coin Vault, The Locked Door, The Silent Court, The Mirror Room, The Trapdoor, The Shifting Stairs. Pause on a large, tattered level 3 ghost with glowing eyes, then on a smaller level 1 ghost, so the numerals 3 and 1 are readable.

**Narration:** "Every room is a kind of clause: data selling in the Cellar, tracking in the Watching Portraits, billing in the Coin Vault, forced arbitration in the Silent Court. Every ghost is one clause. The worse the clause, the bigger and more restless the ghost, and the number on it gives the severity, from zero to three."

### 0:36–1:00 · The keyboard path

**On screen:** take the hand off the mouse. Show a small caption in the corner with each key as it is pressed. Press **Tab** until the focus ring (a thick amber outline) lands on a ghost in The Cellar. Press the **arrow keys** to move between that room's ghosts, **Tab** once to jump to The Watching Portraits, **Shift+Tab** back to The Cellar, then stop on its level 3 ghost and press **Enter**. The ghost detail panel opens.

**Narration:** "You don't need a mouse. Each room is one Tab stop, the arrow keys move between its ghosts, and Enter opens the one you're on."

### 1:00–1:22 · One ghost, up close

**On screen:** the open detail panel for the level 3 ghost in The Cellar. Move the pointer down it slowly: the room name and severity 3; **The clause**, quoting "We may sell your personal information to third parties."; the plain-English explanation; **Why it matters**; the source badge; and "Not legal advice." Press **Escape**. The panel closes and the focus ring is back on the same ghost.

**Narration:** "The panel quotes the exact clause, word for word, then says in plain English what it lets the company do, why it matters, and where the reading came from. It's not legal advice, and the app says so. Escape puts you right back where you were."

### 1:22–1:46 · A mild policy, with the lights on

**On screen:** click **Read another policy**. Show the paste box and its counter ("0 / 50,000 characters") for a second. Open the first sample house, **Quillwhisper Notes**. The score reads **14 · Mostly quiet**, with a few small ghosts and calm wisps. Click **Lights on**. The ghosts go, and the same findings appear as a plain list grouped by room. Scroll to The Cellar entry: "We do not sell your data." with the line "A reassurance in this clause lowers its severity." Then scroll past a room listed as "Quiet".

**Narration:** "Paste any policy up to fifty thousand characters. The analysis runs in your browser, and nothing is stored. Here's a mild one: fourteen, mostly quiet. Its Cellar holds only a calm wisp, because the clause promises not to sell your data. Lights on shows the same findings as a plain, accessible list, with no ghosts and no motion."

### 1:46–2:22 · How it was built with Kiro

**On screen:** Kiro with the project open. Show, in this order, a few seconds each:
1. `.kiro/specs/` with its three spec folders and `traceability.md`, then a few EARS lines ("WHEN … THE SYSTEM SHALL …") in `clause-analyzer/requirements.md`.
2. `.kiro/steering/` with its six files.
3. `.kiro/hooks/` with its four hooks.
4. `.kiro/agents/` with its five agents, then the list of reports in `docs/gate-reports/`.
5. A property test with `numRuns: 1000`, for example `src/lib/analyzer/analyze.property.test.ts`.

**Narration:** "I built it with Kiro. Three specs, from requirements to design to tasks, with all two hundred and thirty-six criteria mapped to tests, after the spec reviewer failed them three times on exactly that. Six steering files held the rules. Hooks ran the tests and a secret scan as files were saved. Five verification agents, with no write tool, checked every phase, one through a real browser over MCP. And property-based tests, a thousand runs each, caught a bug no unit test did."

### 2:22–2:30 · End card

**On screen:** the terrible house again, with the score "97 · Run", and a caption over the bottom of the frame: "The Haunted Clause · Built with Kiro for Kiroween 2026 · Costume Contest · Not legal advice".

**Narration:** "The Haunted Clause. Built with Kiro, for Kiroween."

## Timing check

| Segment | Start | End | Length |
| --- | --- | --- | --- |
| Cold open | 0:00 | 0:16 | 16 s |
| What the house is telling you | 0:16 | 0:36 | 20 s |
| The keyboard path | 0:36 | 1:00 | 24 s |
| One ghost, up close | 1:00 | 1:22 | 22 s |
| A mild policy, with the lights on | 1:22 | 1:46 | 24 s |
| How it was built with Kiro | 1:46 | 2:22 | 36 s |
| End card | 2:22 | 2:30 | 8 s |
| **Total** | | | **2:30** |

The narration is about 300 words (the Kiro segment about 85 words in 36 s), which fits 2:30 at a calm pace with pauses for the on-screen moments.
