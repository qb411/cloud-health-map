# AWS Global Health Status Monitor

A real-time dashboard that visualizes the operational status of AWS regions worldwide through multiple implementation approaches.

## Project Versions

This repository contains three different implementations of the AWS health monitoring system:

### 🗂️ [V1 - Original Supabase](./versions/v1-original-supabase/)
**Status**: Archived
- Real-time updates via Supabase
- Database storage of events
- Requires backend infrastructure
- **Use Case**: Reference implementation

### 🚀 [V2 - Static GitHub Pages](./versions/v2-static-github/) 
**Status**: Active Development
- Completely static deployment
- localStorage for data persistence
- Zero hosting costs
- **Use Case**: Public AWS health monitoring

### 🔮 [V3 - AWS Personal Health Dashboard](./versions/v3-aws-personal/)
**Status**: Future Development
- AWS Personal Health Dashboard API
- Account-specific health data
- Lambda + EventBridge architecture
- **Use Case**: Personal AWS account monitoring

## Quick Start

Choose your preferred version:

```bash
# For static GitHub Pages version (recommended for public use)
cd versions/v2-static-github
npm install
npm run dev

# For original Supabase version (archived)
cd versions/v1-original-supabase
npm install
npm run dev
```

## Features Comparison

| Feature | V1 (Supabase) | V2 (Static) | V3 (AWS Personal) |
|---------|---------------|-------------|-------------------|
| Hosting Cost | Supabase limits | Free forever | AWS usage costs |
| Real-time Updates | ✅ | Manual/Interval | ✅ |
| Data Persistence | Database | localStorage | Database |
| Account-specific | ❌ | ❌ | ✅ |
| Setup Complexity | Medium | Low | High |
| Deployment | Complex | GitHub Pages | AWS Infrastructure |

## Documentation

- [Project Specification](./PROJECT_SPECIFICATION.md) - Complete project overview
- [Session Notes](./session-notes.md) - Development progress tracking
- [Deployment Guides](./docs/deployment-guides/) - Version-specific deployment instructions

## Current Focus

**V2 (Static GitHub Pages)** is the current development focus, providing:
- 🆓 Free hosting on GitHub Pages
- 🔄 5-10 minute refresh intervals
- 💾 localStorage data persistence
- 🌐 CORS-handled RSS feed fetching
- 🗺️ Interactive global map
- 📊 Real-time status visualization

## Contributing

Each version is independently maintained. See the README in each version directory for specific setup and contribution guidelines.

## License

MIT License - see LICENSE file for details.
