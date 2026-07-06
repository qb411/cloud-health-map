# Cloud Health Map — UI Enhancement Specification

## Overview

Improve the visual design and usability of the Cloud Health Map dashboard, taking inspiration from Cisco ThousandEyes' Internet Outages Map while keeping the design purposely simpler. The app uses only public cloud RSS/status feeds with no dependency on specialized monitoring services.

## Design Principles

- Light/dark theme support — user choice, not forced
- Public data sources only (RSS feeds, JSON status APIs)
- Simpler than enterprise tools — this is a demonstration piece
- Don't break existing functionality (map, popups, TestControls, provider switching)
- Mobile-responsive is a bonus, not a requirement

---

## Feature 1: Light/Dark Theme Toggle

### Priority: High
### Effort: Medium

### Requirements
- Default to system preference (`prefers-color-scheme`)
- User can override via a toggle button (sun/moon icon) in the header
- Persist choice in localStorage
- Dark theme: dark map tiles (CartoDB dark_all or similar), dark backgrounds, light text
- Light theme: current look (light gray map, white cards)
- Provider buttons, popups, status badges must look good in both themes
- Use Tailwind's `dark:` variant system with a class-based toggle on `<html>`

### Implementation Notes
- `next-themes` is already installed — use it for the toggle logic
- Leaflet tile layer must switch between light/dark tile URLs when theme changes
- Map popup styling needs dark-mode variants in the injected `<style>` block
- The amber warning banner and green "Supabase active" indicator should remain visible in both themes

---

## Feature 2: Marker Clustering

### Priority: High
### Effort: Medium

### Requirements
- Use `leaflet.markercluster` (well-maintained Leaflet plugin)
- When zoomed out, nearby regions cluster into a single circle showing the count
- Cluster color should reflect worst status within: all green = green cluster, any amber = amber, any red = red
- Clicking a cluster zooms in to show individual markers
- Individual markers retain current behavior (colored by status, popup on click)
- Must not break popups, hover effects, or provider switching
- When switching providers, clear and rebuild markers (don't mix providers in clusters)

### Implementation Notes
- Install: `npm install leaflet.markercluster @types/leaflet.markercluster`
- Use `L.markerClusterGroup` instead of adding markers directly to the map
- Custom `iconCreateFunction` to set cluster color based on child marker statuses
- On provider switch: remove old cluster group, create new one with new provider's markers

---

## Feature 3: Incident Count Badge on Region Markers

### Priority: Medium
### Effort: Low

### Requirements
- When a region has 1+ active incidents, show a small count badge on the marker
- Badge appears as a small number overlaid on or next to the colored dot
- If count is 0 (operational), no badge — just the green dot
- Badge color matches severity (amber for issues, red for outages)
- Count comes from Supabase events matching that region code

### Implementation Notes
- Use Leaflet `L.divIcon` instead of `L.circleMarker` to allow HTML content (number badge)
- The badge count requires knowing how many events exist per region — derive from the events already fetched from Supabase
- Keep it simple: a `<div>` with the region dot + a small superscript number

---

## Feature 4: Condensed Status Log

### Priority: High
### Effort: Medium

### Requirements
- **Group events by incident** — multiple updates about the same region/event collapse into one card with an "N updates" badge
- **Truncate long descriptions** — show first ~150 characters with a "Show more" toggle to expand
- **Date headers** — group cards under headers like "Today", "Yesterday", "Jul 3, 2026"
- **Limit initial display** — show max 10 events initially with a "Show more" button to load additional
- Keep provider badges (AWS/Azure/GCP/OCI)
- Keep severity color coding (left border: green/amber/red)

### Grouping Logic
- Events with the same `region_code` extracted from the title/guid AND within 24 hours of each other = same incident group
- Show the most recent update as the primary card, others nested inside as "Previous updates (N)"
- Expanding shows the full timeline of that incident

### Implementation Notes
- This is primarily a change to `StatusLog.tsx`
- Add a `groupEvents()` function that clusters by region + time proximity
- Use `useState` for expand/collapse per group
- Date headers: use `date-fns` `isToday()`, `isYesterday()`, `format()`

---

## Non-Goals (Deferred)

- Timeline sparkline strip (nice-to-have for later)
- Compact sidebar layout (nice-to-have for later)
- Active synthetic monitoring / probing endpoints
- Network-layer visibility (BGP, AS-level)
- Any paid service dependencies

---

## Known Issue: NOC Mode Map Does Not Fill Screen

**Status**: Unresolved  
**Symptom**: When entering NOC fullscreen mode, the Leaflet map stays at its default ~600px height and does not expand to fill the available viewport space. The surrounding dark background fills correctly, but the map tiles remain constrained.

**What was tried**:
1. CSS `h-full` chain from `fixed inset-0` → `flex-1` → Card → mapContainer (did not work — Leaflet cannot resolve percentage heights)
2. `absolute inset-0` on the Card (conflicted with internal `relative` needs)
3. Explicit `calc(100vh - 88px)` inline style on the parent div (still did not work)
4. `ResizeObserver` calling `map.invalidateSize()` (fires but map doesn't resize)
5. Delayed `invalidateSize()` on className change (200ms, no effect)

**Root Cause Theory**: Leaflet initializes its internal size based on the container's `clientHeight` at mount time. In NOC mode, React renders a NEW `<RegionMap>` instance (different JSX branch), so the map mounts fresh. The container should have pixel height from `calc()`, but something in the rendering chain prevents Leaflet from reading it correctly — possibly the fullscreen API hasn't completed its layout pass by the time Leaflet initializes, or the shadcn Card component adds intermediate elements.

**Suggested Next Steps**:
- Try rendering only ONE `<RegionMap>` instance (not two branches) and resizing it via CSS when `nocMode` toggles — this avoids remounting
- Try removing the Card wrapper entirely in NOC mode (just a plain div)
- Try `requestAnimationFrame` + `invalidateSize()` after fullscreen API resolves
- Test with a hardcoded `height: 900px` style to confirm Leaflet CAN render at that size (isolates CSS vs Leaflet issue)
- Check if the issue is specific to 4K screens / DPR > 1

---

## Acceptance Criteria

1. Toggle between light and dark theme — map tiles change, all UI elements remain readable
2. Markers cluster when zoomed out, expand on click, cluster color reflects worst-status
3. Regions with active incidents show a count badge on the map marker
4. Status log is scannable: grouped, truncated, date-separated, not a wall of text
5. All existing functionality preserved: provider switching, TestControls, popups, Supabase persistence
6. Build passes (`npm run build`) with zero TypeScript errors
7. Deployed successfully to GitHub Pages
