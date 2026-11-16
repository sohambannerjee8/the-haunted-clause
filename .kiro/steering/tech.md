---
inclusion: always
---

# Tech stack and constraints

## Versions (checked with `npm view` on 16 November 2026)

| Part | Package | Version | License |
| --- | --- | --- | --- |
| Framework | `next` (App Router), `react`, `react-dom` | 16.4.6, 19.3.0 | MIT |
| Language | `typescript` | 5.x | Apache-2.0 |
| Styling | `tailwindcss` | 4.3.3 | MIT |
| Motion | `motion` (formerly Framer Motion), import from `motion/react` | 14.14.0 | MIT |
| Validation | `zod` | 4.6.7 | MIT |
| LLM SDK | `@google/genai` | 3.3.0 | Apache-2.0 |
| Server boundary | `server-only` | 0.0.1 | MIT |
| Unit tests | `vitest`, `@vitest/coverage-v8` | 5.1.0 | MIT |
| Property tests | `fast-check` | 4.10.2 | MIT |
| E2E tests | `@playwright/test` | 1.65.1 | Apache-2.0 |
| Accessibility scan | `@axe-core/playwright` | 4.14.0 | MPL-2.0 |

## Next.js 16 notes

- Read the bundled docs in `node_modules/next/dist/docs/` before writing Next.js code (see AGENTS.md). This version differs from older training data.
- Route types such as `LayoutProps` come from `next typegen`; the `typecheck` script runs it before `tsc`.
- `next lint` no longer exists. `npm run lint` runs `eslint .`.
- The scaffold enables `cacheComponents`, `partialPrefetching` and `reactCompiler` in `next.config.ts`.

## LLM (Google Gemini)

- Env vars: `GEMINI_API_KEY` (optional; without it the app uses rule-based readings) and `GEMINI_MODEL` (optional override).
- The key is read only in server code marked `import "server-only"`. It must never appear in `.next/static` or any client component.
- One server route: `POST /api/explain`. Runtime `nodejs`. 15-second timeout via AbortController. Response validated with Zod.
- Only clauses the classifier flagged are sent. Pasted text is sent only after the user opts in. Samples never call the route; their explanations are precomputed at build time into `src/lib/samples/sample-explanations.json`.
- Log only reason codes, never request bodies or clause text.

## Rate limit

In memory, per server instance, sliding window, 10 requests per minute per IP. Best-effort: counts are per instance and reset on cold start. IP header order: `x-vercel-forwarded-for`, first value of `x-forwarded-for`, `x-real-ip`, then a shared `"unknown"` bucket.

## Hosting

Vercel free plan. No database, no login, no stored user text. Input capped at 50,000 characters.

## Performance budget

- First-load JavaScript for `/`: at most 200 kB gzipped (to be confirmed against the first real build and recorded here).
- On a throttled connection (about 1.6 Mbps, 150 ms latency), the input screen must be usable within 5 seconds.
- The house view is loaded with a dynamic import so the first screen stays light.

## Security defaults

- Secrets live only in `.env.local` (git-ignored) or Vercel environment variables. `.env.example` holds names with no values.
- Treat clause text sent to the LLM as data, never as instructions. Render all LLM output as plain text.
- Validate every request body with Zod at the route boundary.
