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
**Status**: Production Ready ✅
- Completely static deployment
- localStorage for data persistence
- Zero hosting costs
- **Comprehensive test automation framework**
- **Fixed yellow "Service Issues" simulation**
- **AWS-branded UI with flag images**
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
| **Test Automation** | ❌ | **✅ Comprehensive** | Planned |
| **Issue Simulation** | Basic | **✅ All Status Types** | Planned |

## 🧪 V2 Testing Framework

The V2 static version includes a comprehensive test automation framework:

### Test Categories
- **Unit Tests**: Status color mapping, CSS classes, core functions
- **Integration Tests**: Component interactions, state management  
- **E2E Tests**: Complete user workflows, all status types (Green/Yellow/Red)
- **CI/CD Tests**: Build validation, security audit, performance checks

### Run Tests
```bash
cd versions/v2-static-github
npm run test              # Full CI/CD test suite
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run validate          # Quick validation
```

### Browser Test Runner
Access: http://localhost:8080/cloud-health-map/tests/test-runner.html

## 🎯 Test Controls (V2)

Built-in simulation controls for testing AWS status scenarios:

1. **🟢 Green (Operational)**: Default state, 10-minute refresh rate
2. **🟡 Yellow (Issue)**: Service degradation, 5-minute refresh rate  
3. **🔴 Red (Outage)**: Service unavailable, 5-minute refresh rate

## Recent Updates

### Session 4 - September 7, 2025
- **✅ Fixed**: Yellow "Service Issues" simulation (React state timing bug)
- **✅ Added**: Comprehensive test automation framework
- **✅ Enhanced**: All status type validation (Green/Yellow/Red)
- **✅ Improved**: AWS-branded popups with flag images
- **✅ Created**: CI/CD ready test scripts for deployment pipelines

## Documentation

- [Project Specification](./PROJECT_SPECIFICATION.md) - Complete project overview
- [Session Notes](./session-notes.md) - Development progress tracking
- [Deployment Guides](./docs/deployment-guides/) - Version-specific deployment instructions
- [V2 Test Documentation](./versions/v2-static-github/tests/README.md) - Test automation details

## Current Focus

**V2 (Static GitHub Pages)** is production-ready with:
- 🆓 Free hosting on GitHub Pages
- 🔄 5-10 minute refresh intervals
- 💾 localStorage data persistence with 7-day retention
- 🌐 CORS-handled RSS feed fetching
- 🗺️ Interactive global map with AWS branding
- 📊 Real-time status visualization
- 🧪 **Comprehensive test automation framework**
- 🐛 **All known bugs fixed**

## Contributing

Each version is independently maintained. See the README in each version directory for specific setup and contribution guidelines.

## License

MIT License - see LICENSE file for details.
