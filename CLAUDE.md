# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloud Health Map is a multi-cloud status monitoring dashboard. It visualizes AWS, Azure, GCP (and OCI on the backend) service health across global regions on an interactive Leaflet.js world map. Events are persisted to Supabase.

Live: https://qb411.github.io/cloud-health-map

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite 6, Tailwind CSS + shadcn/ui, Leaflet.js
- **Persistence**: Supabase (cloud_health_events table, RLS anon read/insert)
- **Data ingestion**: GitHub Actions cron (every 10 min) fetches RSS feeds server-side → Supabase
- **Deployment**: GitHub Pages via GitHub Actions
- **Node requirement**: >=20 (use 22 locally via nvm)

## Commands

```bash
npm install          # Install deps (Node 22 required)
npm run dev          # Dev server at localhost:8080
npm run build        # tsc + vite build (MUST pass before committing)
npm run preview      # Preview production build
npm run lint         # ESLint
```

## Architecture Rules

1. **No circular imports.** `aws-health.ts` is self-contained. `cloud-health.ts` imports FROM it (one-way only).
2. **Types live in `cloud-health.ts`**: `RegionStatus`, `RSSItem`, `CloudProvider`, `StatusType`.
3. **Components import types from `cloud-health.ts`**, never from `aws-health.ts`.
4. **Browser-side RSS fetching is unreliable** (CORS). The primary data source is the server-side cron script (`scripts/update-status.js`). The browser reads from Supabase.
5. **`versions/` directory is archived** — do not modify files there.

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/aws-health.ts` | AWS RSS fetch + localStorage cache (self-contained) |
| `src/lib/cloud-health.ts` | Azure/GCP fetchers, shared types, region definitions |
| `src/lib/supabase-client.ts` | Null-safe Supabase client (graceful no-op when unconfigured) |
| `src/lib/event-store.ts` | Supabase upsert/query/realtime helpers |
| `src/pages/Index.tsx` | Main dashboard: provider switching, refresh, simulation |
| `src/components/TestControls.tsx` | Simulate incidents (receives `allRegions` across all providers) |
| `scripts/update-status.js` | Server-side cron: fetch AWS/Azure/GCP/OCI → Supabase |
| `.github/workflows/update-status.yml` | Cron schedule (*/10 * * * *) |
| `.github/workflows/deploy.yml` | Build + deploy to GitHub Pages |
| `.github/workflows/migrate.yml` | Auto-apply Supabase migrations on push |

## Environment Variables

Required for local dev (put in `.env.local`, which is gitignored):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

For running the cron script locally:
- `SUPABASE_URL` — same as above but without VITE_ prefix
- `SUPABASE_SERVICE_ROLE_KEY` — service role JWT (never expose client-side)

## For detailed local-only guidance

See `.claude/steering.md` (gitignored) for secrets references, Supabase connection details, dependency directions, and debugging tips.
