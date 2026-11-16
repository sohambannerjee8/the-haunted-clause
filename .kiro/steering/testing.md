---
inclusion: always
---

# Testing policy

## Rules

1. No task is done without a passing test that was run and seen to pass.
2. Tests are never weakened, skipped, deleted or loosened to make something pass. No `.skip`, `.only`, `.todo`, `test.fixme`, or lowered thresholds. If a test is wrong, say so, explain why, and get approval before changing it.
3. Write the failing test first, then the code, then see it pass.
4. Every property-based test runs at least 1,000 cases: `fc.assert(property, { numRuns: 1000 })`. A property with fewer runs does not count.
5. The builder does not verify its own work at a gate. Verification agents run as sub-agents with fresh context.

## Coverage targets (line coverage, enforced in `vitest.config.mts`)

| Path | Target |
| --- | --- |
| `src/lib/analyzer/**` | 90% |
| `src/lib/llm/**` | 90% |
| Everything else in `src/` | 80% |

## Test layout

- Unit and property tests sit next to the code they test: `foo.ts` and `foo.test.ts`. Property tests may use `foo.property.test.ts`.
- End-to-end tests are in `e2e/` and run with Playwright against `next build && next start` with no LLM key.
- Accessibility scans use `@axe-core/playwright`. A serious or critical issue fails the test.
- Script tests are in `scripts/*.test.mts`.

## Commands

| Command | What it runs |
| --- | --- |
| `npm test` | All Vitest unit and property tests, once |
| `npm run test:coverage` | The same, with coverage and thresholds |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run typecheck` | `next typegen && tsc --noEmit` |
| `npm run lint` | `eslint .` |
| `npm run check:secrets` | Secret scan of tracked files |
| `npm run check:rules` | Repository rules check |
| `npm run check:bundle` | Build with a canary key and search the browser bundle |

## Fake secrets in tests

Fake keys in test fixtures are assembled at runtime by joining strings, for example `"AI" + "za" + "x".repeat(35)`. A literal key-shaped string in a test file would trigger the secret guard and GitHub push protection.

## LLM tests

The LLM is always mocked in tests. No test makes a real network call. The four required cases are good output, malformed output, timeout and no key.
