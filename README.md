# JobCollar

JobCollar.com is a RemoteOK-inspired public job aggregator for skilled trades, blue-collar work, healthcare, logistics, and other AI-resilient careers.

## What it does

- Aggregates real public jobs through `/api/jobs`
- Normalizes listings from Remotive, Arbeitnow, RemoteOK, and The Muse
- Filters and scores roles for skilled-trade keywords
- Deduplicates listings and links applicants back to the original public job page
- Provides a dense job-board UI with trade categories, source status, search, location, and remote-capable filters

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run build
```
