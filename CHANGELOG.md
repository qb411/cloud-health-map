# Changelog

All notable changes to this project will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [3.0.0] — 2026-07-04

### Added
- **Multi-cloud support**: AWS, Azure, and GCP provider switching via header tab bar
- **Supabase persistence**: `cloud_health_events` table stores all events cross-browser and cross-device with 7-day retention; app falls back gracefully to localStorage when Supabase is not configured
- **Real-time event sync**: Supabase Realtime subscription pushes new events to all open tabs instantly
- **Per-provider status log badges**: each event in the status feed is labelled AWS / Azure / GCP
- **Region-to-status matching**: Azure and GCP RSS items are parsed to identify affected regions and update map markers accordingly
- `src/lib/supabase-client.ts` — null-safe Supabase client
- `src/lib/event-store.ts` — upsert, query, and realtime-subscribe helpers
- `src/lib/cloud-health.ts` — Azure and GCP fetch logic, shared types (`RSSItem`, `RegionStatus`, `CloudProvider`), and region coordinate data for both providers
- Manual refresh button with "Refreshing…" loading state
- "Supabase persistence active" indicator in the status bar
- `CLAUDE.md` — AI assistant guidance for working with this codebase

### Changed
- **Node.js requirement raised to 22** (local dev via nvm; GitHub Actions workflow updated)
- All dependencies upgraded to latest security-patched versions including `zod` → 3.25.76, `vite` → 6.4, full Radix UI suite updated
- GitHub Actions workflow updated to Node 22, checkout@v6, setup-node@v6, configure-pages@v6, upload-pages-artifact@v5, deploy-pages@v5
- `package.json` now declares `"engines": { "node": ">=20.0.0" }`
- Refresh rate label corrected from 15 minutes to 10 minutes
- GCP provider button color changed to green (was blue, conflicting with Azure)
- `vite.config.ts` cleaned up: removed unused `mode` parameter, removed `lovable-tagger` devDependency

### Fixed
- **Circular import** between `aws-health.ts` and `cloud-health.ts` — `aws-health.ts` is now self-contained with its own types; `cloud-health.ts` imports from it (one-way only)
- **Broken `fetchAllCloudHealth` return type** — was typed as `typeof fetchAWSHealth` (the function itself) rather than the resolved data type
- **Missing `fetchAWSHealth` import** in `cloud-health.ts` — function was called without being imported, causing a ReferenceError at runtime
- **`AWSRegionWithStatus` missing `provider` field** — normalized when converting to `RegionStatus` for the map
- **`node_modules` out of sync** — stale install from wrong Node version; fresh install with Node 22
- Removed stale Supabase `postgres_changes` real-time subscription left over from the v1 architecture

### Removed
- `src/integrations/supabase/client.ts` and `types.ts` (replaced by `src/lib/supabase-client.ts`)
- `lovable-tagger` devDependency
- `@vitejs/plugin-react-swc` replaced with `@vitejs/plugin-react` for broader compatibility

---

## [2.1.0] — 2025-09-07

### Added
- Comprehensive test automation framework (unit, integration, E2E, CI/CD scripts)
- Browser-based test runner at `/tests/test-runner.html`
- Security headers and Content Security Policy via `nginx.conf`

### Fixed
- Yellow "Service Issues" simulation — React state timing bug caused amber status to not apply correctly
- AWS-branded popups with flag images via `flagcdn.com`

### Changed
- All Radix UI dependencies updated to resolve security advisories
- `zod` updated to 3.25.76 (moderate vulnerability fix)
- Dependabot configured for automated security updates

---

## [2.0.0] — 2025-09-06

### Added
- V2 static GitHub Pages architecture (no backend required)
- CORS proxy fallback via `api.allorigins.win`
- localStorage persistence with 7-day event retention
- Provider-branded popup redesign (AWS orange header, flag images)
- Test controls for simulating issues and outages per region

### Changed
- Migrated primary codebase from V1 (Supabase) to V2 (static)
- Refresh interval changed from 15 minutes to 10 minutes (normal) / 5 minutes (errors)

### Removed
- Supabase real-time dependency from primary app
- All `src/integrations/supabase/` code moved to archived `versions/v1-original-supabase/`

---

## [1.0.0] — 2025-09-06

### Added
- Initial implementation with Supabase backend
- AWS RSS feed parsing from `status.aws.amazon.com/rss/all.rss`
- Interactive Leaflet.js world map with color-coded region markers
- shadcn/ui component library + Tailwind CSS
- GitHub Pages deployment via GitHub Actions
- 34 AWS regions with coordinates
