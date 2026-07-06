# UI Enhancement — Task Breakdown

## Feature 1: Light/Dark Theme Toggle

- [ ] 1.1 Configure `next-themes` ThemeProvider in App.tsx with `class` strategy
- [ ] 1.2 Add `darkMode: 'class'` to tailwind.config.ts
- [ ] 1.3 Create theme toggle button component (sun/moon icon) in header
- [ ] 1.4 Add dark tile layer URL (CartoDB dark_all) and switch on theme change in RegionMap.tsx
- [ ] 1.5 Add `dark:` variants to all cards, backgrounds, text, badges across components
- [ ] 1.6 Update map popup injected styles for dark mode
- [ ] 1.7 Test both themes with all 4 providers, verify popups and TestControls

## Feature 2: Marker Clustering

- [ ] 2.1 Install `leaflet.markercluster` and `@types/leaflet.markercluster`
- [ ] 2.2 Import CSS for marker clusters in RegionMap.tsx
- [ ] 2.3 Replace direct marker addition with `L.markerClusterGroup`
- [ ] 2.4 Implement custom `iconCreateFunction` — cluster color = worst child status
- [ ] 2.5 On provider switch: remove old cluster group, create new with new markers
- [ ] 2.6 Verify popups still work within clusters
- [ ] 2.7 Verify zoom-in expands clusters correctly

## Feature 3: Incident Count Badge on Markers

- [ ] 3.1 Switch from `L.circleMarker` to `L.marker` with `L.divIcon` for HTML control
- [ ] 3.2 Pass event counts per region into RegionMap (derive from recentItems)
- [ ] 3.3 Render badge as a superscript number on the marker when count > 0
- [ ] 3.4 Badge color matches severity (amber for issue, red for outage)
- [ ] 3.5 No badge when region is operational (clean green dot only)

## Feature 4: Condensed Status Log

- [ ] 4.1 Create `groupEvents()` utility — clusters by region + 24h proximity
- [ ] 4.2 Add date section headers (Today, Yesterday, formatted date)
- [ ] 4.3 Truncate descriptions to ~150 chars with "Show more" toggle
- [ ] 4.4 Collapsed incident groups: show latest update + "N previous updates" expander
- [ ] 4.5 Limit initial display to 10 events with "Load more" button
- [ ] 4.6 Keep provider badges and severity color coding

## Final

- [ ] 5.1 Run `npm run build` — zero errors
- [ ] 5.2 Push to main — verify GitHub Pages deployment succeeds
- [ ] 5.3 Manual visual QA: both themes, all providers, clustering, log condensation
