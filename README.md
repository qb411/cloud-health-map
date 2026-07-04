# Cloud Health Map

A real-time dashboard that visualizes the operational health of **AWS, Azure, and Google Cloud Platform** regions on an interactive world map. Events are persisted to Supabase so history survives browser resets and is shared across all users.

🌐 **Live**: [qb411.github.io/cloud-health-map](https://qb411.github.io/cloud-health-map)

---

## Features

- **Multi-cloud support** — switch between AWS, Azure, and GCP with a single click
- **Interactive world map** — Leaflet.js markers color-coded by status (green / amber / red)
- **Supabase persistence** — health events stored in a shared database, visible across sessions and devices; falls back to localStorage if Supabase is not configured
- **Real-time updates** — Supabase Realtime pushes new events to all open browsers instantly
- **Auto-refresh** — 10-minute polling under normal conditions, 5-minute polling when issues are detected
- **Issue simulation** — test controls let you simulate outages on any region for any provider
- **Status log** — color-coded event feed with per-provider badges (AWS / Azure / GCP)
- **7-day event history** — events older than 7 days are automatically pruned

---

## Quick Start

```bash
# Requires Node.js 20+
npm install
npm run dev        # http://localhost:8080/cloud-health-map
npm run build      # production build → dist/
npm run preview    # preview production build locally
```

---

## Supabase Setup (optional but recommended)

Without Supabase the app works fine using localStorage, but history is browser-local only.

**1. Get your credentials**
Go to [supabase.com](https://supabase.com) → your project → **Settings → API**:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public key** → `VITE_SUPABASE_ANON_KEY`

**2. Create the events table**
Run this once in your project's **SQL Editor**:

```sql
create table if not exists cloud_health_events (
  id          uuid primary key default gen_random_uuid(),
  guid        text not null unique,
  title       text not null,
  description text not null,
  pub_date    timestamptz not null,
  provider    text not null check (provider in ('aws', 'azure', 'gcp')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_health_events_provider_date
  on cloud_health_events (provider, pub_date desc);

alter table cloud_health_events enable row level security;
create policy "anon read"   on cloud_health_events for select using (true);
create policy "anon insert" on cloud_health_events for insert with check (true);
```

**3. Configure local dev**

Create `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**4. Configure GitHub Actions**

Add the same two values as repository secrets under **Settings → Secrets → Actions**.

---

## Deployment (GitHub Pages)

Pushes to `main` automatically deploy via GitHub Actions (`.github/workflows/deploy.yml`).

The workflow uses Node 22, injects the Supabase secrets at build time, and deploys the `dist/` folder to GitHub Pages.

---

## Project Structure

```
src/
├── lib/
│   ├── aws-health.ts       # AWS RSS feed fetch + localStorage cache
│   ├── cloud-health.ts     # Azure & GCP fetchers, shared types, region definitions
│   ├── supabase-client.ts  # Null-safe Supabase client (no-op when unconfigured)
│   └── event-store.ts      # upsert / query / realtime-subscribe
├── components/
│   ├── RegionMap.tsx        # Leaflet world map with provider-branded popups
│   ├── RegionSummary.tsx    # Summary counts (operational / issue / outage)
│   ├── StatusLog.tsx        # Event feed with provider badges
│   └── TestControls.tsx     # Simulate issues/outages per region
└── pages/
    └── Index.tsx            # Main dashboard, provider switching, refresh logic

versions/                    # Archived earlier implementations (reference only)
├── v1-original-supabase/
├── v1-free-supabase/
├── v2-static-github/
└── v3-aws-personal/
```

---

## Architecture Notes

- **No backend required** — all data comes from public RSS/status feeds via a CORS proxy fallback
- **CORS proxy** — direct fetch is attempted first; `api.allorigins.win` is used as fallback
- **Type safety** — `RSSItem` and `RegionStatus` are unified types across all providers; `aws-health.ts` and `cloud-health.ts` have a deliberate one-way import to avoid circular dependencies

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full release history.

---

## License

MIT — see [LICENSE](./LICENSE) for details.
