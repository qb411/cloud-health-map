# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cloud Health Map is a multi-cloud status monitoring dashboard that visualizes AWS, Azure, and GCP service health across global regions. The main application (root) is being refactored to support multi-cloud monitoring, while legacy versions remain in the `versions/` directory.

## Architecture

### Current Structure (Root - Multi-Cloud Refactor)
- **React 18 + TypeScript** frontend with Vite 5
- **Tailwind CSS + shadcn/ui** components
- **Leaflet.js** for interactive world map
- **localStorage** for data persistence (7-day retention)
- **Multi-provider support**: AWS, Azure, GCP

### Key Directories
- `/src/lib/` - Core utilities including `aws-health.ts`, `cloud-health.ts` (multi-provider)
- `/src/components/` - RegionMap, RegionSummary, StatusLog, TestControls
- `/src/pages/` - Index.tsx (main multi-cloud dashboard)
- `/versions/` - Legacy implementations (v1-supabase, v2-static-github, v3-aws-personal)

## Common Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Deploy to GitHub Pages
npm run predeploy && npm run deploy
```

## Multi-Cloud Implementation

The root application supports three cloud providers:
- **AWS**: RSS feed from `status.aws.amazon.com/rss/all.rss`
- **Azure**: RSS feed from `status.azure.com/rss/`
- **GCP**: Status feed from `status.cloud.google.com`

All providers use localStorage for persistence and CORS proxy fallback for RSS fetching.

## Development Notes

- Base path configured as `/cloud-health-map/` for GitHub Pages deployment
- Auto-refresh: 10 minutes normal, 5 minutes when issues detected
- Test controls available for simulating issues/outages per region
