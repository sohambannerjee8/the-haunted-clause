---
inclusion: always
---

<!-- The checklist below is copied word for word from PLAN.md section 3. Keep it identical to PLAN.md. -->

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
  

## Clarifications approved by the user (from PLAN_DECISIONS.md)

- Describe the verification agents as "no write tool; shell limited to build/test commands". Never call them "read-only".
- Sample policies use precomputed explanations and never call the LLM API at runtime.
- Pasted text goes to the LLM only after the user opts in, and only the flagged clauses are sent.
- The social post must begin with #KiroweenHackathon26. The blog post must say it was written for the Kiroween 2026 hackathon.
