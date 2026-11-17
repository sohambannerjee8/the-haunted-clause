> **Draft.** Written by Kiro's agent from [BUILD_LOG.md](../BUILD_LOG.md) for the author to rewrite in his own words. Every claim below is recorded there, including the parts that did not work. "The agent" is Kiro's agent; "the author" is the person who directed the build.

# How Kiro was used to build The Haunted Clause

The Haunted Clause was built in Kiro from a written brief (`PLAN.md`) and a file of approved decisions (`PLAN_DECISIONS.md`). Everything Kiro produced or used lives in [`.kiro/`](../.kiro/): three specs and a traceability matrix, six steering files, four hooks, five custom agents and the MCP settings.

| Feature | Count | Where |
| --- | --- | --- |
| Specs | 3 (236 acceptance criteria) | `.kiro/specs/clause-analyzer/`, `llm-explainer/`, `haunted-house-ui/`, plus `.kiro/specs/traceability.md` |
| Steering files | 6, all always included | `.kiro/steering/` |
| Hooks | 4 | `.kiro/hooks/` |
| Custom agents | 5 | `.kiro/agents/` |
| MCP servers | 3 configured, 2 used through Kiro (Playwright and Vercel) | `.kiro/settings/mcp.json` |
| Property-based tests | 36 `fc.assert` calls in 10 files, each at 1,000 runs | `src/**/*.property.test.ts` and others |
| Gate reports | 17 | `docs/gate-reports/` |

## Which Kiro app

BUILD_LOG.md records one: the Kiro IDE. No other Kiro app was used, so there is no comparison to make.

## Specs

Each part of the app has its own spec, written requirements first: `requirements.md` in EARS form ("WHEN … THE SYSTEM SHALL …"), then `design.md`, then `tasks.md`.

- **clause-analyzer:** the clause splitter, the rules, the classifier and the Haunt Score. 11 requirements, 69 criteria.
- **llm-explainer:** the optional server route that asks Gemini for plain-English readings. 16 requirements at first, 17 after the privacy wording was added; 72 criteria.
- **haunted-house-ui:** the house, the ghosts, Lights on mode, keyboard use, motion and sound. 20 requirements, 95 criteria.

The author approved each spec at set stops: twice for clause-analyzer (after requirements, then after design), once each for the other two.

Writing the design before the code changed the product. While designing the score for clause-analyzer, a scratch script showed that the planned formula gave a realistic long policy a score of 97, so long policies would all saturate. The design offered two options. The author chose per-room ceilings, which give that policy 80, and the highest reachable score became 97. A 200,000-case random check found no out-of-range scores.

**What did not work: the Gate 1 traceability loop.** The spec-reviewer agent failed the specs three times in a row. Each time the failing item included item 4, "every criterion has a named test", but each time for different criteria. The agent's fixes patched only the criteria each review listed, and three of its attempt 1 fixes created new problems. After the third failure the build stopped, as the brief requires, and the agent asked the author. The fix he approved was structural: a full matrix of all 236 criteria in `.kiro/specs/traceability.md`, each mapped to a named test and a task, and a script, `npm run check:trace`, that fails when any criterion is missing. Attempt 4 passed. After that, every spec change also updated the matrix, and `check:trace` ran before every push.

**Specs compared with vibe coding.** Every feature in this build went through a spec. Changes the author asked for in chat during the build (the mitigation phrasing fix, rule calibration, the design pass, the ghost faces) were first written into `PLAN_DECISIONS.md` and the spec, then added as tasks with tests. BUILD_LOG.md has no vibe-coded feature to measure against, so it does not support a measured comparison. *(Author: add your own view here.)*

## Steering

Six files in `.kiro/steering/`, all `inclusion: always`: `product.md`, `tech.md`, `structure.md`, `hackathon-rules.md`, `design-language.md` and `testing.md`. Kiro loaded each one into the session as a workspace rule as soon as it was written.

What made them useful was that they held rules a later step could check, not general advice:

- `hackathon-rules.md` is the rules checklist copied word for word from `PLAN.md` (checked with `diff`). The rules-auditor agent audits against the same list.
- `testing.md` says every property test runs at least 1,000 cases and no test is skipped or loosened. The test-verifier agent counted the `fc.assert` calls and their run counts at every gate.
- `design-language.md` holds the palette with contrast ratios computed by a script from the WCAG formula, not estimated, and the rule that every spooky element must carry information.
- `tech.md` holds the measured performance figures: first-load JavaScript of 142,493 bytes gzip-encoded, and the paste box usable after about 1.65 s on a throttled connection.

*(Author: say which of these helped you most.)*

**What did not work:** steering drifted from the code twice. `tech.md` still said the route used the `nodejs` runtime after the design dropped that export (the security-reviewer agent caught it at Gate 3), and `product.md` listed Context7 among the MCP servers in use until Phase 6.

## Hooks

Four hooks, each created with Kiro's `createHook` tool:

| Hook | Trigger | What it does |
| --- | --- | --- |
| Test on save | `PostFileSave`, `src/**/*.ts(x)` | Runs the tests related to the saved file |
| Secret guard | `PostFileSave`, any file | Scans the saved file for key-shaped strings |
| Rules guard | `PostFileSave`, `.gitignore` or `LICENSE` | Runs the repository rules check |
| Spec sync | `PostFileSave`, any spec `tasks.md` | Asks the agent to log the finished task in BUILD_LOG.md and update the README feature list |

The three command hooks write one line per run to a git-ignored log, so there is evidence that Kiro fired them. Secret guard caught a fake Google-format key the agent saved in a probe file to test it (exit 1, value masked), and Test on save ran the related tests when files such as `rooms.ts` and `page.tsx` were saved.

**What did not work: Spec sync and the spec task panel.** Spec sync was first a `PostTaskExec` hook, which fires when a task is started from Kiro's spec task interface. It never fired, because the agent ticked tasks by editing `tasks.md`.

- The agent tried to start a task through the spec mechanism by dispatching it to a `spec-task-execution` sub-agent. Kiro answered "Agent 'spec-task-execution' not found in registry". The agent's tools cannot press the panel's "Start task" button.
- The author then started Task 31.4 (Gate 4) from the panel himself. Nothing from that run reached the repository: no gate report, no commit, no ticked box, no log entry.
- At the author's instruction the panel route was dropped, and Spec sync became a `PostFileSave` hook on `tasks.md`. It fired for the first time on 17 November 2026, when Task 31.4 was ticked, and then on every later tick.
- It has its own limits. It fires on every save of a `tasks.md`, including a save that only adds a task, and it does not fire when a script (rather than the editor tools) edits the file.

## Custom agents

Five verification agents in `.kiro/agents/`: `spec-reviewer`, `test-verifier`, `security-reviewer`, `ui-a11y-reviewer` and `rules-auditor`. Each has no write tool; shell limited to build/test commands. Each answers a fixed checklist of yes/no questions and returns PASS or FAIL. They ran as sub-agents with fresh context at seven gates, and their reports are saved unchanged in `docs/gate-reports/`.

| Gate | Agents and results |
| --- | --- |
| 0 | rules-auditor PASS |
| 1 | spec-reviewer FAIL, FAIL, FAIL, then PASS on attempt 4 |
| 2 | test-verifier PASS |
| 3 | security-reviewer PASS, test-verifier PASS |
| 4 | ui-a11y-reviewer PASS, test-verifier PASS |
| 5 | spec-reviewer FAIL then PASS; security-reviewer, rules-auditor, ui-a11y-reviewer and test-verifier PASS |
| 6 | rules-auditor (final audit of the whole rules checklist) PASS |

What they changed, all recorded in BUILD_LOG.md:

- **spec-reviewer, Gate 1:** found criteria nobody could test. It also showed that the second end-to-end build, which carries a placeholder key so the opt-in UI can be tested, could reach Google if one browser stub was missed. That server now runs behind a dead local proxy, and a guard test proves an unstubbed request fails.
- **ui-a11y-reviewer, Gate 4:** using the app through Playwright MCP, it found that a reassuring clause such as "We do not sell your data." was explained as "This clause lets the company sell what it knows about you." Each mitigation now has its own explanation.
- **test-verifier, Gate 4:** found stale example counts in the traceability matrix.
- **spec-reviewer, Gate 5:** found that a requirement still said 12 screenshots after the author had approved a 13th.
- **What did not work:** at Gate 5 the rules-auditor used `cat`, `sed`, `head` and `npx --no-install` to read files, which are outside its shell allow-list. They only read, but it shows the allow-list was not enforced as written.

## MCP

Three servers are configured in `.kiro/settings/mcp.json`. Kiro protects `.kiro/settings/` from agent writes, so the author created that file by hand, and added the Vercel server himself after the build.

- **Playwright MCP** was used through Kiro. An early snapshot of the running app showed a 404 for the favicon, which led to the project's own ghost icon. At Gates 4 and 5 the ui-a11y-reviewer agent used it to open the production build and use the app as a person would: the full flow, keyboard use and the edge states. At Gate 5 it confirmed in the browser that clause headings no longer appear in quotes. After deployment the agent used it on the live site: it opened the three samples (14, 59 and 97), pasted a short test text, pressed "Ask the medium" once, and read the request body (only the one flagged clause), the response (`source: "llm"`) and the "Medium's reading" badge in the detail panel. The console showed no errors.
- **Vercel MCP** (`mcp-remote` to `https://mcp.vercel.com`) deployed the app. Its first start hit the same 60-second connect timeout as Context7; a reconnect worked. Two more things needed the author: approving a team-access consent link (the first `list_projects` returned 403 for the personal team scope), and reconnecting GitHub inside Vercel (the first `create_git_project` returned `repo_not_found`, and listing repositories returned `401 github_response_error`). After that the agent created the project linked to the GitHub repository, checked that no environment variables were set, read the build logs, redeployed production once the author had added the key in the dashboard, and read the runtime logs, where the one medium call logged `explain outcome=llm clauses=1 ms=1921`. Some calls failed once with "mcp-remote: fetch failed" on a slow network and worked on retry. The agent never set or read the key.
- **Context7 was never connected in Kiro.** At session start Kiro installed both servers with `npx` at the same time. Context7's first download ran past Kiro's 60-second connect timeout, and Kiro's MCP log shows "Failed to connect: MCP server 'context7' connection timed out after 60000ms". The download also left a half-written npx cache folder. The agent removed that folder from the shell, and the server then started and answered over stdio, so the config itself works. Reconnecting from the MCP Server view did not bring its tools into the session. Library facts (Next.js 16, fast-check 4, `@google/genai`) were read from the installed packages in `node_modules` and the vendors' own docs instead.

## Property-based tests

36 fast-check properties, each at 1,000 runs, cover the analyzer (splitting with nothing lost, exact quotes, score range and order independence), the LLM merge and parser, the rate limiter, the request builder and the house model.

What they caught that the unit tests missed:

- **A splitter bug.** Property P6 ("no whitespace-only clause when the input has text") failed after 70 runs with the counterexample `"\r\n\nWe may sell your personal information to third parties."`. A paragraph break at the very start of the input produced a first clause made only of whitespace. None of the 45 splitter unit tests started with a blank line. A regression test was added first, then the fix.
- **A test that would have proved nothing.** Property E7 checks the route handler on random inputs and also asserts that the success path was reached at least once. That guard failed: in 1,000 runs the generator never produced a provider answer that matched its request. A "matched" generator was added. Without the guard, E7 would have passed while never testing the success branch.
- **Generators that miss the hard cases.** For E6 (the request builder), 1,000 samples of the everyday generator never gave more than 40 findings or a quote over 1,500 characters, the two limits being tested. E6 now also runs on a large-input generator, where 205 of 1,000 inputs pass 40 findings.
- **A planted bug.** As a check, the rate limiter's `>= limit` was changed to `> limit` for one run. The burst generator caught it at once; the spread-out generator did not, which is why both exist.

## Kiro powers

None. No Kiro powers were used in this build.
