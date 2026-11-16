---
inclusion: always
---

# Design language: Victorian gothic

## The one rule

Every spooky element must carry information. A ghost, a flicker, a cobweb or a colour is allowed only if it tells the user something about the policy: which room (clause type), how bad (severity), how much (score), or where the reading came from (rules or the medium). Pure decoration is limited to the house frame and background, and it must never compete with a ghost.

## Palette

Contrast ratios are WCAG 2.x, computed from the hex values. Body text needs 4.5:1, large text and UI parts need 3:1.

| Token | Hex | Use | On ink `#0d0a10` | On aubergine-900 | On aubergine-700 |
| --- | --- | --- | --- | --- | --- |
| ink | `#0d0a10` | Page background | n/a | n/a | n/a |
| aubergine-900 | `#1e1024` | Panels, house walls | n/a | n/a | n/a |
| aubergine-700 | `#3a1f45` | Room interiors | n/a | n/a | n/a |
| aubergine-500 | `#6b4a7d` | Decorative borders only (2.72:1, never text or the only edge of a control) | 2.72 | 2.51 | 1.98 |
| bone | `#efe6d8` | Body text, headings | 15.90 | 14.70 | 11.62 |
| mist | `#b9a9c2` | Secondary text | 8.91 | 8.24 | 6.51 |
| wisp | `#9a93a6` | Severity 0 | 6.65 | 6.15 | 4.86 |
| candle-amber | `#f2b544` | Severity 1, focus ring, primary button | 10.74 | 9.93 | 7.85 |
| ember | `#ef8a4c` | Severity 2 | 7.87 | 7.28 | 5.75 |
| venom (sickly green) | `#a6e86b` | Severity 3 | 13.46 | 12.45 | 9.83 |

Text on an amber button is ink (10.74:1). The focus ring is a 3 px candle-amber outline with a 2 px offset, on every focusable element.

## Fonts

Both are under the SIL Open Font License 1.1 and are self-hosted through `next/font`. The browser makes no runtime request to Google.

- **Creepster**: headings only (the app name, room names, the score band). Never for body text, quotes, buttons or anything longer than a few words.
- **Atkinson Hyperlegible**: everything else, including clause quotes and explanations. Minimum body size 16 px, line height 1.5.

Nosifer is not used.

## Ghost intensity levels

Colour is never the only signal. Each level differs in size, opacity, colour, motion and a visible numeral.

| Level | Meaning | Size (desktop / 360 px) | Opacity | Colour | Motion (full) | Numeral |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Clause checked, looks fine | 28 / 24 px wisp | 0.55 | wisp | Slow drift, 2 px, 6 s cycle | "0" |
| 1 | Mild concern | 40 / 32 px | 0.75 | candle-amber | Bob 4 px, 4 s cycle | "1" |
| 2 | Real concern | 52 / 40 px | 0.9 | ember | Bob 6 px plus sway, 3 s cycle | "2" |
| 3 | Serious concern | 64 / 48 px | 1.0 | venom | Bob 8 px, sway and a slow glow pulse, 2.5 s cycle | "3" |

Every ghost is a `<button>` with an aria-label such as "Severity 3 ghost in The Cellar". Its minimum hit area is 44 × 44 px at every level, even when the drawn wisp is smaller.

## Rooms

The eight rooms keep their names from the brief and appear in this order (left to right, top to bottom): The Cellar, The Watching Portraits, The Coin Vault, The Locked Door, The Silent Court, The Mirror Room, The Trapdoor, The Shifting Stairs. Layout is 2 columns × 4 rows below 768 px and 4 × 2 above. A room with no findings is drawn calm and dusty and shows the visible text "Quiet".

## Haunt Score bands

| Score | Band label |
| --- | --- |
| 0–24 | Mostly quiet |
| 25–49 | Uneasy |
| 50–74 | Haunted |
| 75 and above | Run |

The score is always shown as a number plus its band label, for example "97 · Run". The highest reachable score is 97 (see the clause-analyzer design), so never show "/100" or describe 100 as a possible result.

## Motion limits

- Nothing flashes more than 3 times per second (WCAG 2.3.1).
- No motion lasts longer than 5 seconds without a way to stop it: the toolbar's Lights on toggle, which is always visible on the house view, removes every ghost and so stops every repeating animation; the OS reduced-motion setting stops them too (haunted-house-ui R10.5).
- Reduced motion: `MotionConfig reducedMotion="user"` plus a CSS `prefers-reduced-motion: reduce` query. With reduced motion, ghosts are still, with no transforms and no glow pulse. Size, opacity, colour and numeral still show the level.
- Sound is off by default and only plays after the user turns it on. Sound is synthesised with the Web Audio API; there are no audio files.

## Lights on mode

A plain, semantic list of the same findings, grouped by room, using bone on ink and Atkinson Hyperlegible. No ghosts, no motion, no decorative art. Quiet rooms are listed with "Quiet".

## Copy

- Plain English. The quote is always the exact clause text, shown as plain text, never as HTML.
- The source badge reads "Rule reading" or "Medium's reading".
- "Not legal advice" appears in the footer and in the ghost detail panel.
