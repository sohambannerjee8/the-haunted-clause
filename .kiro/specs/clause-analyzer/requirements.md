# Requirements: clause-analyzer

## Introduction

The clause analyzer is the deterministic core of The Haunted Clause. It takes the text of a Terms & Conditions or privacy policy and returns findings: each clause that matches one of the eight rooms gets a room and a severity from 0 to 3, and the whole text gets a Haunt Score from 0 to 100. It is a set of pure TypeScript functions in `src/lib/analyzer/` that run in the browser with no network, no clock and no randomness. The LLM explainer (separate spec) can later rewrite explanations and raise severities, but the analyzer's result always exists on its own, so the app works with no API key.

This spec also covers the three fictional sample policies in `src/lib/samples/`, because their expected scores are fixtures for the analyzer.

Sources: PLAN.md sections 2 and 4, and PLAN_DECISIONS.md C1.7, C1.10, C4 and C7.

## Glossary

- **Analyzer**: the function `analyze(text)` and the modules it uses (splitter, classifier, score).
- **Input**: the string passed to `analyze`. Its length is measured in UTF-16 code units (JavaScript `string.length`), the same unit a browser textarea's `maxLength` uses.
- **Cap**: 50,000 code units.
- **Clause**: a contiguous span of the input produced by the splitter, with fields `id`, `start`, `end` and `text`, where `text === input.slice(start, end)`.
- **Whitespace**: characters matched by the JavaScript regular expression `\s`.
- **Room**: one of the eight clause types, in this fixed order:

  | Order | Room ID | Room name | Clause type |
  | --- | --- | --- | --- |
  | 1 | `cellar` | The Cellar | Data sharing and selling |
  | 2 | `portraits` | The Watching Portraits | Tracking and profiling |
  | 3 | `vault` | The Coin Vault | Auto-renewal, fees and billing |
  | 4 | `locked-door` | The Locked Door | Cancellation and account deletion |
  | 5 | `court` | The Silent Court | Forced arbitration and class-action waivers |
  | 6 | `mirror` | The Mirror Room | Rights the company takes over your content |
  | 7 | `trapdoor` | The Trapdoor | Liability limits and disclaimers |
  | 8 | `stairs` | The Shifting Stairs | Terms the company can change without notice |

- **Rule**: an entry in the rule table that belongs to one room and has an ID, a case-insensitive pattern, a severity from 1 to 3, a plain-English explanation and a "why it matters" text.
- **Mitigation**: an entry in the rule table that belongs to one room and has an ID, a case-insensitive pattern and a level (0 or 1). Example: "we do not sell" in The Cellar, level 0.
- **Exception marker**: one of the words or phrases `except`, `unless`, `other than`, `however`, `provided that`, matched case-insensitively on word boundaries.
- **Finding**: the analyzer's output for one clause that matched a room. Fields: `id` (the clause ID), `room`, `severity` (0–3), `quote`, `start`, `end`, `ruleId`, `mitigationId` (or `null`), `explanation` and `whyItMatters`.
- **Risky finding**: a finding with severity 1, 2 or 3. In the UI each risky finding is a ghost; a severity 0 finding is a faint wisp meaning "checked, looks fine".
- **Haunt Score**: a whole number from 0 to 100 computed from the severities of all findings.
- **Sample**: one of the three fictional policies (mild, average, terrible) written for this project.

## Requirements

### Requirement 1: Split text into clauses with nothing lost

**User Story:** As a user, I want my policy broken into clauses exactly as I wrote it, so that every quote the app shows me is really in my text.

#### Acceptance Criteria

1. THE splitter SHALL return clauses whose `text` values, joined in order, equal the input exactly, character for character, for every input string up to the cap.
2. THE splitter SHALL return clauses that are contiguous: the first clause starts at 0, each clause starts where the previous one ends, the last clause ends at `input.length`, and every clause has `end > start`.
3. WHEN the input is the empty string, THE splitter SHALL return an empty list.
4. WHEN the input consists only of whitespace, THE splitter SHALL return exactly one clause covering the whole input.
5. WHEN the input contains at least one non-whitespace character, THE splitter SHALL return no clause that consists only of whitespace.
6. THE splitter SHALL give each clause the ID `c-<start>`, where `<start>` is the clause's start offset in decimal.
7. WHEN a sentence terminator (`.`, `;`, `?` or `!`), optionally followed by one or more closing characters (`)`, `]`, `"`, `'`, `”`, `’`), is followed by whitespace, THE splitter SHALL end the clause after that run of whitespace.
8. WHEN the input contains a paragraph break (a line break, optional spaces or tabs, then another line break, where a line break is `\n` or `\r\n`), THE splitter SHALL end the clause after the full run of whitespace that contains the break.
9. WHEN a line begins, after optional spaces or tabs, with a list marker (`-`, `*` or `•`; one to three digits followed by `.` or `)`; a single letter followed by `)`; or `(` followed by one to four letters or digits and `)`), each followed by a space or tab, THE splitter SHALL start a new clause at the beginning of that line.
10. WHEN a `.` is the last character of one of the abbreviations `e.g.`, `i.e.`, `Inc.`, `Ltd.`, `Co.`, `Corp.`, `U.S.`, `No.`, `Sec.`, `etc.` or `vs.`, and the abbreviation is not preceded by a letter, THE splitter SHALL NOT end a clause after that `.` under criterion 7. The abbreviations SHALL match exactly as written, and `e.g.`, `i.e.`, `etc.` and `vs.` SHALL also match with a capital first letter (`E.g.`, `I.e.`, `Etc.`, `Vs.`).
11. WHEN an abbreviation from criterion 10 is followed by a paragraph break, THE splitter SHALL still end the clause at the paragraph break, as in criterion 8.
12. WHEN the input is longer than the cap, THE splitter SHALL still satisfy criteria 1 to 6. (The analyzer refuses such input; see Requirement 8.)

### Requirement 2: Classify each clause into at most one room

**User Story:** As a user, I want each worrying clause filed in the right room of the house, so that I can see what kind of risk it is.

#### Acceptance Criteria

1. THE classifier SHALL produce at most one finding per clause.
2. WHEN no rule matches any part of a clause's text, THE classifier SHALL produce no finding for that clause.
3. WHEN a clause consists only of whitespace, THE classifier SHALL produce no finding for it.
4. WHEN one or more rules match a clause, THE classifier SHALL compute a severity for each room that has a matching rule (see Requirement 3) and SHALL assign the clause to the room with the highest severity; WHEN two rooms tie, THE classifier SHALL choose the room that comes first in the room order in the Glossary.
5. THE classifier SHALL set the finding's `ruleId` to the ID of the highest-severity matching rule in the chosen room; WHEN several rules in that room tie, it SHALL use the one listed first in the rule table.
6. THE rule table SHALL contain at least three rules for each of the eight rooms, and every rule SHALL have a unique ID, a severity of 1, 2 or 3, a non-empty explanation and a non-empty "why it matters" text.
7. FOR each of the eight rooms, THE classifier SHALL assign to that room at least one example clause of that room's clause type written for the tests (a positive case), and SHALL NOT assign to that room at least one example clause that mentions the room's topic words without the risky behaviour (a negative case). The test examples SHALL be listed in the design.
8. THE classifier SHALL match rules and mitigations case-insensitively.

### Requirement 3: Severity, mitigations and exception markers

**User Story:** As a user, I want a reassuring clause to look calm and a clause with a hidden "except…" to stay scary, so that the house does not lie to me in either direction.

#### Acceptance Criteria

1. THE classifier SHALL set a room's severity to the highest severity among the rules of that room that match the clause, before mitigations are applied.
2. WHEN a mitigation of a room matches the clause, AND no exception marker appears in the same clause after the end of that mitigation match, THE classifier SHALL lower that room's severity to the mitigation's level, unless the severity is already lower.
3. WHEN a mitigation of a room matches the clause, AND an exception marker appears in the same clause after the end of that mitigation match, THE classifier SHALL NOT apply that mitigation.
4. WHEN an exception marker appears in the clause only before the start of the mitigation match, THE classifier SHALL apply the mitigation as in criterion 2.
5. WHEN an exception marker appears only in a different clause, THE classifier SHALL apply the mitigation as in criterion 2.
6. WHEN a room's severity has been lowered by a mitigation, THE classifier SHALL set the finding's `mitigationId` to that mitigation's ID; otherwise `mitigationId` SHALL be `null`.
7. WHEN a mitigation lowers the severity to 0, THE classifier SHALL still produce the finding, with severity 0.
8. THE exception markers SHALL be matched on word boundaries, so that, for example, `exceptional` and `unlessened` do not count as markers.
9. THE classifier SHALL treat each of the five exception markers the same way; each marker SHALL have its own test showing that it cancels a mitigation that comes before it in the same clause.

### Requirement 4: Findings quote the input exactly

**User Story:** As a user, I want to read the exact words of the clause that scared the ghost into existence, so that I can check the app against my own text.

#### Acceptance Criteria

1. FOR every finding, THE analyzer SHALL set `quote` equal to `input.slice(finding.start, finding.end)`.
2. FOR every finding, THE analyzer SHALL set `start` and `end` to the clause's span with leading and trailing whitespace removed, so that `quote` neither starts nor ends with whitespace and is non-empty.
3. FOR every finding, THE analyzer SHALL set `id` to the ID of the clause it came from, and the IDs of all findings SHALL be unique.
4. THE analyzer SHALL return findings in the order their clauses appear in the input.
5. FOR every finding, THE analyzer SHALL set `explanation` and `whyItMatters` to the texts of the rule named by `ruleId`, each non-empty and at most 400 characters.

### Requirement 5: Haunt Score

**User Story:** As a user, I want one number from 0 to 100 that tells me how haunted the policy is, so that I can compare policies at a glance.

#### Acceptance Criteria

1. THE analyzer SHALL compute the Haunt Score as `round(100 × (1 − P))`, where `P` is the product of `(1 − w)` over all findings, `w` is 0, 0.05, 0.15 or 0.30 for severity 0, 1, 2 or 3 respectively, and `round` rounds half up to a whole number.
2. THE Haunt Score SHALL always be a whole number from 0 to 100 inclusive.
3. WHEN there are no findings, THE Haunt Score SHALL be 0.
4. WHEN all findings have severity 0, THE Haunt Score SHALL be 0.
5. WHEN a clause that produces a risky finding is added to any input at a clause boundary (joined with `"\n\n"`), AND the combined input is within the cap, THE Haunt Score of the combined input SHALL be greater than or equal to the Haunt Score of the original input.
6. THE score function SHALL give the same score for the same multiset of severities, whatever their order.

### Requirement 6: Never throw

**User Story:** As a user, I want the app to keep working whatever I paste, so that odd characters never break the house.

#### Acceptance Criteria

1. FOR any string up to the cap, including the empty string, whitespace only, emoji, characters from any Unicode script, unpaired surrogate code units and control characters, THE analyzer SHALL return a result and SHALL NOT throw.
2. FOR any string longer than the cap, THE analyzer SHALL return the "too long" result described in Requirement 8 and SHALL NOT throw.
3. WHEN given a 50,000-character input, THE analyzer SHALL return its result within 1 second in the Vitest test environment on the build machine, so that no pattern has run-away backtracking.

### Requirement 7: Determinism and purity

**User Story:** As a user, I want the same policy to always get the same reading, so that I can trust the result and share it.

#### Acceptance Criteria

1. FOR any input, THE analyzer SHALL return results that are deeply equal when called twice on the same input, including when other inputs are analysed between the two calls.
2. THE analyzer modules SHALL NOT read the clock (`Date`, `performance`), use randomness (`Math.random`, `crypto`), make network calls (`fetch`, `XMLHttpRequest`, `WebSocket`) or import anything from outside `src/lib/analyzer/` other than type-only imports.
3. THE analyzer SHALL NOT keep state between calls.

### Requirement 8: Size cap

**User Story:** As a user, I want a clear message when my text is too long, instead of a frozen page.

#### Acceptance Criteria

1. WHEN the input length is at most 50,000, THE analyzer SHALL return `{ ok: true, ... }` with the clauses, findings, Haunt Score and flags.
2. WHEN the input length is greater than 50,000, THE analyzer SHALL return `{ ok: false, error: { code: "too-long", length, limit: 50000 } }`, where `length` is the input length, and SHALL NOT split or classify the text.
3. WHEN the input length is exactly 50,000, THE analyzer SHALL treat it as within the cap.

### Requirement 9: Non-English flag

**User Story:** As a user who pastes text in another language, I want to be told the app only reads English, so that I do not mistake an empty house for a safe policy.

#### Acceptance Criteria

1. THE analyzer SHALL return a boolean flag `likelyNonEnglish` in every successful result.
2. WHEN the input contains fewer than 40 letters (characters matched by `\p{L}`), THE analyzer SHALL set `likelyNonEnglish` to `false`.
3. WHEN the input contains at least 40 letters AND fewer than half of those letters are ASCII letters `A`–`Z` or `a`–`z`, THE analyzer SHALL set `likelyNonEnglish` to `true`.
4. WHEN the input contains at least 40 letters, at least half are ASCII letters, AND fewer than 10% of its words (runs of ASCII letters and apostrophes, lowercased) are in the analyzer's list of common English words, THE analyzer SHALL set `likelyNonEnglish` to `true`.
5. OTHERWISE THE analyzer SHALL set `likelyNonEnglish` to `false`.
6. THE analyzer SHALL still split and classify the text when `likelyNonEnglish` is `true`.

### Requirement 10: Room metadata

**User Story:** As a developer of the house UI, I want one source for room IDs, names, clause types and order, so that the UI and the analyzer never disagree.

#### Acceptance Criteria

1. THE analyzer SHALL export the list of the eight rooms, in the order in the Glossary, each with its ID, name and clause type exactly as written there.
2. THE finding's `room` field SHALL always be one of the eight room IDs.

### Requirement 11: Three fictional sample policies

**User Story:** As a judge or first-time user, I want three ready-made policies, mild, average and terrible, so that I can see the house work without pasting anything.

#### Acceptance Criteria

1. THE project SHALL provide three sample policies, `mild`, `average` and `terrible`, each with an invented company name, a title and the policy text, written for this project.
2. THE sample company names SHALL be checked by web search before they are committed, and the check SHALL be recorded in BUILD_LOG.md; WHEN a search shows a real company using the name, the name SHALL be replaced.
3. EACH sample text SHALL be at most 50,000 characters and SHALL give `likelyNonEnglish === false`.
4. WHEN analysed, the mild sample SHALL get a Haunt Score of at most 25.
5. WHEN analysed, the average sample SHALL get a Haunt Score from 35 to 65 inclusive.
6. WHEN analysed, the terrible sample SHALL get a Haunt Score of at least 80 AND SHALL have at least one risky finding in each of the eight rooms.
7. THE mild sample SHALL contain at least one clause that gets a severity 0 finding through a mitigation, so that the "checked, looks fine" wisp appears in the demo.
8. THE sample texts SHALL NOT contain the name, policy text or logo of any real company.
