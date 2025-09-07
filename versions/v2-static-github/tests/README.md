# AWS Health Map - Test Automation

This directory contains automated tests and validation scripts for the AWS Health Map application.

## Test Structure

```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for component interactions
├── e2e/           # End-to-end tests for full user workflows
├── scripts/       # Test automation scripts
└── fixtures/      # Test data and mock responses
```

## Running Tests

### Local Development
```bash
npm run test           # Run all tests
npm run test:unit      # Run unit tests only
npm run test:e2e       # Run end-to-end tests
npm run test:ci        # Run tests for CI/CD pipeline
```

### CI/CD Pipeline
```bash
./tests/scripts/ci-test.sh    # Full CI test suite
./tests/scripts/validate.sh   # Quick validation
```

## Test Categories

1. **Unit Tests**: Core functionality (status mapping, RSS parsing)
2. **Integration Tests**: Component interactions (TestControls + RegionMap)
3. **E2E Tests**: Full user workflows (issue simulation, map interaction)
4. **Performance Tests**: Load times, memory usage
5. **Accessibility Tests**: WCAG compliance, keyboard navigation

## Pipeline Integration

These tests are designed to run in:
- GitHub Actions
- Local development
- Pre-deployment validation
- Production health checks
