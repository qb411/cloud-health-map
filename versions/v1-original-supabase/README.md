# V1 - Original Supabase Implementation

This is the original implementation of the AWS Health Monitor using Supabase for real-time data storage and updates.

## Features

- Real-time updates via Supabase subscriptions
- Database storage of AWS health events
- 15-minute refresh intervals (5 minutes during issues)
- Interactive map with region status
- Historical data persistence

## Tech Stack

- React + TypeScript + Vite
- Supabase for backend/database
- Leaflet.js for mapping
- shadcn/ui + Tailwind CSS
- React Query for data fetching

## Setup

```bash
cd versions/v1-original-supabase
npm install
npm run dev
```

## Deployment

This version requires Supabase backend and cannot be deployed to static hosting like GitHub Pages.

## Status

**Archived** - This version is preserved for reference. Active development continues in v2-static-github and v3-aws-personal.
