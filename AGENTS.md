# AGENTS.md

## Cursor Cloud specific instructions

### Repository structure

The `main` branch contains only a `README.md`. All application code lives on feature branches:

- **`cursor/jobcollar-aggregator-4d73`** — Next.js 16 / React 19 / TypeScript job aggregator (base branch)
- **`cursor/maximize-job-results-7f95`** — Latest version with expanded sources, pagination, Stripe, and UI improvements

### Development commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `STRIPE_SECRET_KEY` | For `/post` page | Stripe secret key for job posting checkout ($299/post) |

No other secrets are needed — all external job APIs are public/unauthenticated.

### Architecture notes

- **No database** — jobs are fetched live from 6 public APIs on each request (cached 10 min via Next.js revalidate)
- **Pages**: `/` (job board with pagination), `/post` (Stripe-powered job posting form)
- **API routes**: `/api/jobs` (job aggregation), `/api/checkout` (Stripe Checkout session creation)
- **Sources**: Remotive, Arbeitnow, RemoteOK, The Muse, Greenhouse ATS (16 boards), SmartRecruiters (7 companies)
- The `/api/jobs` route makes many parallel outbound HTTP calls; first request takes 5-10s, subsequent ones are cached
- Client-side pagination: API returns up to 1000 jobs, rendered in pages of 30 with "Show more" button
- No automated test suite exists

### Gotchas

- The Greenhouse and SmartRecruiters fetchers are resilient to individual board/company 404s — one failing board won't kill the source
- `next-env.d.ts` gets auto-modified when running `next dev` — don't commit these changes
- The `stripe` package is a runtime dependency (used in the API route), not dev-only
