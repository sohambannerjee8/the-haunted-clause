You are the lead builder for my Kiroween 2026 hackathon entry, "The Haunted Clause" (category: Costume Contest). This message is the complete plan. Follow it exactly.  
  
FIRST ACTION: save this entire message, unchanged, as PLAN.md at the project root. Re-read PLAN.md at the start of every phase and whenever your context is compacted.  
  
# 1. How to work  
  
1. Work through the build phases in section 6 in order. Do not skip or merge phases.  
2. Use spec-driven development for every feature: requirements in EARS format, then design with correctness properties, then tasks. Stop and ask me to approve each spec's requirements and design before you implement it.  
3. After each phase, run that phase's verification gate. Launch the named custom agents from .kiro/agents/ as sub-agents. They verify; they do not fix. A phase is done only when every agent for that gate returns PASS with evidence (commands run, output, file paths).  
4. If a gate fails, fix the cause and re-run the gate. After 3 failed attempts on the same problem, stop and tell me what is wrong and what you need from me.  
5. Never weaken, skip or delete a test to make a gate pass. Never mark a task complete that you did not run and see pass.  
6. Obey every rule in section 3. If a rule and a feature conflict, the rule wins; tell me.  
7. Never write a secret into a file that git tracks. Never commit .env files. Never add .kiro or anything inside it to .gitignore.  
8. Keep BUILD_LOG.md up to date after every phase: what you built, which Kiro feature you used (spec, steering, hook, MCP, sub-agent, property-based test), what failed, and what the verification agents found. Record only what really happened. I will write my hackathon write-up from this log.  
9. If a Kiro file format named here differs from your current version, use your current format and note the difference in BUILD_LOG.md.  
10. Do not do the steps in section 8 ("My manual steps"). Prepare everything for them and list them in the completion report.  
  
When all phases and the final gate pass, write COMPLETION_REPORT.md as specified in section 7, then send me one message that starts with "BUILD COMPLETE" and summarises: what works, test counts, anything not done, and my manual steps. If you cannot finish, send "BUILD BLOCKED" with the reason instead. Do not say BUILD COMPLETE while any gate is failing.  
  
# 2. Project brief  
  
The Haunted Clause turns any Terms & Conditions or privacy policy into a haunted house: each room is a type of clause, and the worse the clause, the scarier the ghost. Every spooky element must carry information.  
  
## What the user can do  
  
1. Paste policy text, or pick one of three built-in sample policies.  
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
  
## How the analysis works  
  
- A clause splitter breaks the text into clauses.  
- A rule-based classifier assigns each clause a room and a severity from 0 to 3. It is deterministic and runs with no network.  
- An LLM call, made from the server, rewrites the explanations in plain English and can raise or confirm a severity. Its JSON output is validated against a schema.  
- If the LLM is missing, slow or returns bad output, the app shows the rule-based result. The app must work fully with no API key.  
  
## Tech stack  
  
| Part | Choice |  
| --- | --- |  
| Framework | Next.js (App Router) with TypeScript, current stable version |  
| Styling and motion | Tailwind CSS, Framer Motion, hand-made SVG and CSS art |  
| Validation | Zod |  
| Unit and property tests | Vitest with fast-check |  
| End-to-end tests | Playwright |  
| LLM | One provider behind a single server route; key in an environment variable |  
| Hosting | Vercel, free plan |  
| License | MIT |  
  
## Scope limits  
  
- No login, no database, no stored user text. Pasted text is processed and discarded.  
- No real company's policy, name or logo anywhere in the app, repo or video. The three samples are fictional companies written for this project.  
- No copyrighted images, fonts or music. Use open-licensed fonts and art made in this project.  
- English only. Input capped at 50,000 characters.  
- Sound is off by default. Motion respects the reduced-motion setting.  
- The app states it is not legal advice.  
  
# 3. Hackathon rules (checklist)  
  
Source: https://kiroween.devpost.com/rules. The rules-auditor agent checks every item at the final gate. One failure blocks BUILD COMPLETE.  
  
## Repository  
  
- [ ] All code is new, written during the submission period (30 October to 4 December 2026).  
- [ ] Only standard resources are reused: frameworks, libraries, starter templates. Each one is listed in the README under "Pre-existing work".  
- [ ] /.kiro sits at the repository root and holds specs, hooks and steering.  
- [ ] .gitignore contains no line that matches .kiro or any folder inside it.  
- [ ] An MIT LICENSE file is at the root, so GitHub shows the license in the About section.  
- [ ] The README has setup steps that work on a clean machine: install, environment variables, run, test.  
- [ ] All source code and assets needed to run the app are in the repository.  
- [ ] No secrets appear in any tracked file or in git history.  
  
## App  
  
- [ ] The app installs and runs consistently, and behaves as the description and video say.  
- [ ] The app works with no login. Judges need free, unrestricted access until judging ends on 29 January 2027.  
- [ ] Every third-party library and API is used within its license and terms. Licenses are listed in the README.  
- [ ] The work is original and breaks no one's copyright, trademark or privacy rights.  
  
## Submission materials (you draft, I finish)  
  
- [ ] Text description of features and functionality, in English.  
- [ ] Demo video script that fits under 3 minutes and shows the app running.  
- [ ] No third-party trademarks or copyrighted music in anything shown in the video.  
- [ ] Kiro usage write-up covering the features that were really used.  
- [ ] Category stated as Costume Contest.  
  
## Kiro usage  
  
- [ ] Kiro is the main build tool. The rules allow disqualification for insufficient use of Kiro.  
- [ ] BUILD_LOG.md records real use of specs, steering, hooks, MCP, custom agents and property-based tests.  
  
# 4. Kiro setup (create in Phase 0, commit all of it)  
  
| Kiro feature | What to create | Where |  
| --- | --- | --- |  
| Steering | product.md, tech.md, structure.md, hackathon-rules.md, design-language.md, testing.md | .kiro/steering/ |  
| Specs | Three feature specs, each with requirements, design and tasks | .kiro/specs/ |  
| Hooks | Four hooks, listed below | .kiro/hooks/ |  
| Custom agents | Five verification agents, section 5 | .kiro/agents/ |  
| MCP | A documentation server and a browser server | Workspace MCP settings file |  
| Property-based tests | Properties derived from the EARS requirements, run with fast-check | Next to the code they test |  
  
## Steering files  
  
- hackathon-rules.md copies the checklist in section 3, so every session sees it.  
- design-language.md fixes the look: colour palette, fonts, ghost intensity levels 0 to 3, motion limits, and the rule that every spooky element must carry information.  
- testing.md states the test policy: no task is done without a passing test, and tests are never weakened to pass.  
  
## The three specs  
  
1. clause-analyzer: splitter, rule-based classifier, severity and Haunt Score.  
2. llm-explainer: server route, schema validation, timeout, fallback to rules.  
3. haunted-house-ui: input screen, house, rooms, ghost detail, Lights on mode.  
  
## Properties the analyzer spec must include  
  
- The Haunt Score is always a whole number from 0 to 100.  
- Adding a risky clause to any text never lowers the score.  
- Every finding quotes text that appears in the input, character for character.  
- The analyzer never throws, for any string up to the size cap, including empty text and emoji.  
- The same input always gives the same rule-based result.  
- Splitting text into clauses and joining them back loses no characters.  
  
## The four hooks  
  
| Hook | Trigger | Action |  
| --- | --- | --- |  
| Test on save | A source file is saved | Run the tests for that file |  
| Secret guard | Any file is saved | Scan for key-like strings and warn |  
| Spec sync | A spec's tasks are completed | Update BUILD_LOG.md and the README feature list |  
| Rules guard | .gitignore or LICENSE changes | Re-check the repository rules |  
  
## MCP servers  
  
- A documentation server such as Context7, so you read current Next.js, fast-check and Playwright docs instead of guessing.  
- A browser server such as Playwright MCP, so the UI agent can open the running app and look at it.  
  
Kiro powers and Kiro Crew are optional. Use them only if they help, and record them only if they were used.  
  
# 5. Verification agents  
  
Create five custom agents in .kiro/agents/, one Markdown file each. Launch them as sub-agents at the gates. Each is read-only: it may read files and run tests, but it may not edit source code.  
  
| Agent | Checks | Fails the gate when |  
| --- | --- | --- |  
| spec-reviewer | Requirements, designs and task lists against the project brief | A requirement cannot be tested, a brief feature has no requirement, or a spec adds something outside the scope limits |  
| test-verifier | Runs unit, property and end-to-end tests itself, plus build, lint and type-check | Any test fails, a test is skipped or weakened, a property is missing, or coverage is under target |  
| security-reviewer | Secrets, the server route, the browser bundle, logging, dependencies | A key is in a tracked file, git history or the client bundle; user text is stored or logged; a dependency has a known serious vulnerability |  
| ui-a11y-reviewer | Opens the running app in a browser through MCP and uses it | The flow breaks, a ghost does not match its severity, keyboard or reduced-motion paths fail, or the layout breaks at 360 px |  
| rules-auditor | The checklist in section 3, item by item | Any checklist item is unmet |  
  
Each agent file must contain:  
  
- A description that says when to use it.  
- Its checklist, written as yes or no questions.  
- Its tool limits: read and run only, no writes outside its own report.  
- Its output format: PASS or FAIL, then one line of evidence per check, then a list of problems with file paths.  
  
# 6. Build phases  
  
## Phase 0: Foundation  
  
- Initialise git, the Next.js project, the MIT LICENSE, a README stub and BUILD_LOG.md.  
- Create the steering files, the five agents, the four hooks and the MCP settings.  
- Add .env.example with the LLM key name and no value. Add .env* to .gitignore, keeping .env.example tracked.  
- Gate: rules-auditor. Pass when /.kiro is complete and tracked, the license is detected, and no secrets exist.  
  
## Phase 1: Specs  
  
- Write requirements in EARS format for all three specs, then designs with correctness properties, then task lists.  
- Stop for my approval after requirements and again after design, for each spec.  
- Gate: spec-reviewer. Pass when every requirement is testable, every feature in the brief is covered, and nothing breaks a scope limit.  
  
## Phase 2: Analyzer core  
  
- Build the clause splitter, the rule-based classifier, severity and the Haunt Score as pure TypeScript functions.  
- Write the three fictional sample policies: one mild, one average, one terrible.  
- Write unit tests and all six property-based tests.  
- Gate: test-verifier. Pass when all tests pass, each property runs at least 1,000 cases, and line coverage of the analyzer is 90% or higher.  
  
## Phase 3: LLM explainer  
  
- Build one server route that calls the LLM, validates the JSON with Zod, and times out after 15 seconds.  
- Fall back to the rule-based result on any failure. Add a simple per-IP rate limit.  
- Test with a mocked LLM: good output, malformed output, timeout, and no key.  
- Gate: security-reviewer and test-verifier. Pass when the key never reaches the browser bundle, pasted text is not logged or stored, and the app works with no key.  
  
## Phase 4: Haunted house UI  
  
- Build the input screen, the house with eight rooms, ghosts at four intensity levels, the ghost detail panel and the Haunt Score.  
- Build Lights on mode, keyboard navigation, the reduced-motion path and the "not legal advice" notice.  
- Make it work from 360 px wide to desktop.  
- Gate: ui-a11y-reviewer and test-verifier. Pass when Playwright tests cover the full flow for all three samples and the accessibility scan shows no serious issues.  
  
## Phase 5: Hardening and polish  
  
- Run the full suite, a production build, lint and type-check with zero errors.  
- Test edge cases in the browser: empty input, 50,000 characters, non-English text, a policy with no risky clauses.  
- Polish loading, error and empty states. Check the first screen loads fast on a slow connection.  
- Gate: all five agents. Pass when each returns PASS.  
  
## Phase 6: Submission pack  
  
- Finish the README: what it is, setup, tests, architecture, pre-existing work, licenses.  
- Draft docs/KIRO_USAGE.md from BUILD_LOG.md. Answer each of these, only where true: which Kiro apps were used and how they differed; custom agents and their impact; which workflows hooks automated; how specs were structured and how that compared to vibe coding; which steering strategy helped most; what MCP made possible; what property-based tests caught that unit tests missed; any Kiro powers used.  
- Draft docs/DEVPOST_DESCRIPTION.md, docs/VIDEO_SCRIPT.md (timed, under 2 minutes 50 seconds), docs/BLOG_DRAFT.md and docs/SOCIAL_POST.md (must begin with #KiroweenHackathon26).  
- Write docs/DEPLOY.md with exact Vercel steps and the environment variable to set.  
- Gate: rules-auditor, final run against the whole checklist in section 3.  
  
## Phase 7: Completion report  
  
- Write COMPLETION_REPORT.md and send the BUILD COMPLETE or BUILD BLOCKED message.  
  
## Rules for every gate  
  
- The builder does not verify its own work. Verification agents run as sub-agents with fresh context.  
- A verdict needs evidence: the command run, its output, and the file paths checked.  
- A failed gate goes back to the builder. Three failures on the same problem stops the build and asks me.  
- Each gate result is appended to BUILD_LOG.md, pass or fail.  
  
# 7. Completion report  
  
## Definition of done  
  
- All eight phases are finished and every gate's last result is PASS.  
- npm install, the production build, lint and type-check finish with zero errors on a fresh clone.  
- All unit, property and end-to-end tests pass, with none skipped.  
- The app runs locally with no API key and analyses all three samples correctly.  
- Every item in section 3 is ticked by rules-auditor.  
- The six draft documents in docs/ exist.  
  
## COMPLETION_REPORT.md must contain  
  
1. Status: BUILD COMPLETE or BUILD BLOCKED, with the date.  
2. What works: each feature in the brief, with the test that proves it.  
3. Test results: counts of unit, property and end-to-end tests, cases run per property, and coverage.  
4. Gate history: each gate, each agent, the verdict, and how many attempts it took.  
5. Rules checklist: every item with PASS and where the evidence is.  
6. Kiro usage summary: number of specs, steering files, hooks, agents, MCP servers and properties, with file paths.  
7. Known issues and anything not done, stated plainly. An empty list must say "none found".  
8. My manual steps, in order, with the files you prepared for each.  
  
## Do not claim  
  
- That the app is deployed, the video is recorded or the entry is submitted. Those are mine.  
- That a Kiro feature was used when BUILD_LOG.md has no record of it.  
  
# 8. My manual steps (do not do these; prepare for them)  
  
- Getting the LLM API key and putting it in .env.local.  
- Creating the public GitHub repository and pushing.  
- Deploying to Vercel and setting the environment variable.  
- Recording the demo video and uploading it to YouTube.  
- Rewriting the Kiro write-up in my own words.  
- Filling in and submitting the Devpost form.  
- Publishing the blog post and the social post.  
  
Start with the first action (save this message as PLAN.md), then begin Phase 0.
