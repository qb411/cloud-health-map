# AWS Health Map - V2 Static GitHub Pages

A completely static implementation of the AWS Health Map with comprehensive test automation, deployed to GitHub Pages for free hosting.

## ✨ Features

- **🆓 Zero hosting costs** - Deploys to GitHub Pages
- **🔄 No backend dependencies** - Completely client-side
- **💾 localStorage persistence** - Data persists across browser sessions (7-day retention)
- **🌐 CORS proxy fallback** - Handles RSS feed fetching restrictions
- **🔄 Manual refresh controls** - User can force data updates
- **⏱️ Smart refresh intervals** - 10 minutes normal, 5 minutes during issues
- **🧪 Test Controls** - Simulate AWS issues for testing (Yellow/Red markers)
- **🗺️ Interactive map** - Leaflet.js with AWS-branded popups and flag images
- **🧪 Comprehensive test suite** - Unit, integration, and E2E tests

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Access at: http://localhost:8080/cloud-health-map/

## 🧪 Testing

### Test Automation Framework
- **Unit Tests**: Status color mapping, CSS classes, core functions
- **Integration Tests**: Component interactions, state management
- **E2E Tests**: Complete user workflows, all status types (Green/Yellow/Red)
- **CI/CD Ready**: Scripts for deployment pipelines

### Run Tests
```bash
npm run test              # Full CI/CD test suite
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run validate          # Quick validation
```

### Browser Test Runner
Open: http://localhost:8080/cloud-health-map/tests/test-runner.html
- Interactive test execution
- Real-time results
- Downloadable test reports

## 🎯 Test Controls

The application includes built-in test controls for simulating AWS issues:

1. **Green (Operational)**: Default state, 10-minute refresh rate
2. **Yellow (Issue)**: Service degradation, 5-minute refresh rate  
3. **Red (Outage)**: Service unavailable, 5-minute refresh rate

**Usage**: Test Controls dropdown → Select Region → Choose Status → Apply Simulation

## 🚀 Deployment

```bash
npm run deploy
```

Builds and deploys to GitHub Pages using the `gh-pages` branch.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Mapping**: Leaflet.js with custom AWS region markers
- **Data**: AWS Status RSS feed with localStorage caching
- **Testing**: Comprehensive automation framework

## 🐛 Bug Fixes

- **✅ Fixed**: Yellow "Service Issues" simulation (React state timing issue)
- **✅ Enhanced**: Test automation for all status types (Green/Yellow/Red)
- **✅ Improved**: AWS-branded popups with flag images and status badges

## 📁 Key Files

- `src/pages/Index.tsx` - Main application component with fixed state management
- `src/components/RegionMap.tsx` - Interactive map with AWS-branded popups
- `src/components/TestControls.tsx` - Issue simulation controls
- `src/lib/aws-health.ts` - RSS feed parsing and localStorage management
- `tests/` - Comprehensive test automation framework

## 🔄 Status

**Active Development** - Production-ready with comprehensive testing framework.
