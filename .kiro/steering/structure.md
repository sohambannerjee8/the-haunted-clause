---
inclusion: always
---

# Project structure

Planned layout. Folders appear as their phase builds them.

```
/
├── .kiro/
│   ├── steering/          product, tech, structure, hackathon-rules, design-language, testing
│   ├── specs/             clause-analyzer/, llm-explainer/, haunted-house-ui/ (requirements, design, tasks), traceability.md
│   ├── hooks/             test-on-save, secret-guard, spec-sync, rules-guard (.json)
│   ├── agents/            spec-reviewer, test-verifier, security-reviewer, ui-a11y-reviewer, rules-auditor (.md)
│   └── settings/mcp.json  Context7 and Playwright MCP
├── src/
│   ├── app/
│   │   ├── layout.tsx, page.tsx, globals.css
│   │   └── api/explain/route.ts       the only server route
│   ├── components/                    house, rooms, ghosts, detail panel, Lights on list, input screen
│   └── lib/
│       ├── analyzer/                  types, splitter, rules, classifier, score, analyze (pure TS, no network)
│       ├── llm/                       schema, merge, gemini (server-only), rateLimit, handler factory
│       └── samples/                   three fictional policies + sample-explanations.json
├── e2e/                               Playwright specs
├── scripts/                           secret-scan, check-repo-rules, test-related, check-bundle, precompute-samples
├── docs/                              DEPLOY, KIRO_USAGE, DEVPOST_DESCRIPTION, VIDEO_SCRIPT, BLOG_DRAFT, SOCIAL_POST
│   └── gate-reports/                  verification agent reports, saved unchanged
├── PLAN.md, PLAN_DECISIONS.md, BUILD_LOG.md, COMPLETION_REPORT.md
├── README.md, LICENSE (MIT), .env.example
└── vitest.config.mts, vitest.setup.ts, playwright.config.ts, eslint.config.mjs, next.config.ts
```

## Conventions

- `src/lib/analyzer` must stay pure: no imports from React, Next.js, `node:` modules or the network. It runs in the browser.
- Anything that reads `GEMINI_API_KEY` imports `server-only`.
- Tests sit next to the code they test (`*.test.ts`, `*.property.test.ts`).
- Import alias `@/*` maps to `src/*`.
- Verification agent reports are saved unchanged to `docs/gate-reports/phase-N-<agent>-attempt-K.md`.
