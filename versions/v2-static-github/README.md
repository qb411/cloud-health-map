# V2 - Static GitHub Pages Implementation

A completely static version of the AWS Health Monitor designed for free GitHub Pages hosting.

## Features

- Static deployment (no backend required)
- localStorage for data persistence
- 5-10 minute refresh intervals
- Interactive map with region status
- CORS-handled RSS feed fetching
- Zero hosting costs

## Tech Stack

- React + TypeScript + Vite
- localStorage for data persistence
- Leaflet.js for mapping
- shadcn/ui + Tailwind CSS
- Direct RSS feed parsing

## Setup

```bash
cd versions/v2-static-github
npm install
npm run dev
```

## Deployment

```bash
npm run build
npm run deploy  # Deploys to GitHub Pages
```

## Key Changes from V1

- ❌ Removed Supabase dependencies
- ✅ Added localStorage persistence
- ✅ CORS proxy fallback for RSS feeds
- ✅ Optimized for static hosting
- ✅ GitHub Pages deployment ready

## Status

**Active Development** - This is the current focus for public deployment.
