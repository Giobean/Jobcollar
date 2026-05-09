# AGENTS.md

## Cursor Cloud specific instructions

### Repository structure

The `main` branch contains only a `README.md`. All application code lives on feature branches:

- **`cursor/jobcollar-aggregator-4d73`** — Next.js 16 / React 19 / TypeScript single-page job aggregator (primary/active branch)
- **`cursor/jobcollar-mvp-95d2`** — PHP 8.3 + Python 3 + SQLite alternative MVP

You must check out a feature branch to work on code.

### Next.js branch (primary)

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |

- No `.env` or secrets required — all external job APIs are public/unauthenticated.
- No database — the app fetches and aggregates jobs from 6 public APIs at request time.
- No automated test suite exists yet.
- The dev server hot-reloads on file changes via Turbopack.
- The `/api/jobs` route fetches live data from external APIs; requests may be slow (~3-8s) on first load due to network calls to Remotive, Arbeitnow, RemoteOK, The Muse, Greenhouse, and SmartRecruiters.
