#!/bin/bash

# CI/CD Test Suite for AWS Health Map
# Runs comprehensive tests suitable for deployment pipelines

set -e  # Exit on any error

echo "🚀 AWS Health Map - CI/CD Test Suite"
echo "======================================"

# Configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$(cd "$TEST_DIR/.." && pwd)"
LOG_FILE="$TEST_DIR/ci-test.log"
RESULTS_FILE="$TEST_DIR/ci-results.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
START_TIME=$(date +%s)

echo "📁 Project Directory: $PROJECT_DIR"
echo "📋 Test Directory: $TEST_DIR"
echo "📄 Log File: $LOG_FILE"
echo ""

# Function to log results
log_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✅ $test_name: PASS${NC} - $message"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}❌ $test_name: FAIL${NC} - $message"
    fi
    
    echo "$(date): $test_name - $status - $message" >> "$LOG_FILE"
}

# Test 1: Project Structure Validation
echo -e "${BLUE}🔍 Test 1: Project Structure Validation${NC}"
if [ -f "$PROJECT_DIR/package.json" ] && [ -f "$PROJECT_DIR/vite.config.ts" ] && [ -d "$PROJECT_DIR/src" ]; then
    log_result "Project Structure" "PASS" "All required files and directories exist"
else
    log_result "Project Structure" "FAIL" "Missing required files or directories"
fi

# Test 2: Dependencies Check
echo -e "${BLUE}🔍 Test 2: Dependencies Check${NC}"
cd "$PROJECT_DIR"
if npm list --depth=0 > /dev/null 2>&1; then
    log_result "Dependencies" "PASS" "All dependencies are installed correctly"
else
    log_result "Dependencies" "FAIL" "Missing or broken dependencies"
fi

# Test 3: Build Test
echo -e "${BLUE}🔍 Test 3: Build Test${NC}"
if npm run build > /dev/null 2>&1; then
    log_result "Build" "PASS" "Application builds successfully"
    
    # Check if dist directory was created
    if [ -d "$PROJECT_DIR/dist" ]; then
        log_result "Build Output" "PASS" "Build output directory created"
    else
        log_result "Build Output" "FAIL" "Build output directory not found"
    fi
else
    log_result "Build" "FAIL" "Build process failed"
fi

# Test 4: Unit Tests
echo -e "${BLUE}🔍 Test 4: Unit Tests${NC}"
cd "$TEST_DIR"
if node -e "
const { runUnitTests } = require('./unit/status-mapping.test.js');
const results = runUnitTests();
process.exit(results.failed > 0 ? 1 : 0);
" > /dev/null 2>&1; then
    log_result "Unit Tests" "PASS" "All unit tests passed"
else
    log_result "Unit Tests" "FAIL" "One or more unit tests failed"
fi

# Test 5: Integration Tests
echo -e "${BLUE}🔍 Test 5: Integration Tests${NC}"
if node -e "
const { runIntegrationTests } = require('./integration/test-controls.test.js');
const results = runIntegrationTests();
process.exit(results.failed > 0 ? 1 : 0);
" > /dev/null 2>&1; then
    log_result "Integration Tests" "PASS" "All integration tests passed"
else
    log_result "Integration Tests" "FAIL" "One or more integration tests failed"
fi

# Test 6: Code Quality Checks
echo -e "${BLUE}🔍 Test 6: Code Quality Checks${NC}"
cd "$PROJECT_DIR"

# Check for TypeScript errors
if npx tsc --noEmit > /dev/null 2>&1; then
    log_result "TypeScript Check" "PASS" "No TypeScript errors found"
else
    log_result "TypeScript Check" "FAIL" "TypeScript errors detected"
fi

# Check for ESLint errors (if configured)
if [ -f ".eslintrc.js" ] || [ -f "eslint.config.js" ]; then
    if npx eslint src --ext .ts,.tsx --max-warnings 0 > /dev/null 2>&1; then
        log_result "ESLint Check" "PASS" "No linting errors found"
    else
        log_result "ESLint Check" "FAIL" "Linting errors detected"
    fi
else
    log_result "ESLint Check" "SKIP" "ESLint not configured"
fi

# Test 7: Security Audit
echo -e "${BLUE}🔍 Test 7: Security Audit${NC}"
if npm audit --audit-level=high > /dev/null 2>&1; then
    log_result "Security Audit" "PASS" "No high-severity vulnerabilities found"
else
    log_result "Security Audit" "FAIL" "High-severity vulnerabilities detected"
fi

# Test 8: Performance Check
echo -e "${BLUE}🔍 Test 8: Performance Check${NC}"
if [ -d "$PROJECT_DIR/dist" ]; then
    # Check bundle size (should be reasonable for a React app)
    BUNDLE_SIZE=$(du -sh "$PROJECT_DIR/dist" | cut -f1)
    BUNDLE_SIZE_KB=$(du -sk "$PROJECT_DIR/dist" | cut -f1)
    
    if [ "$BUNDLE_SIZE_KB" -lt 10240 ]; then  # Less than 10MB
        log_result "Bundle Size" "PASS" "Bundle size is reasonable ($BUNDLE_SIZE)"
    else
        log_result "Bundle Size" "FAIL" "Bundle size is too large ($BUNDLE_SIZE)"
    fi
else
    log_result "Bundle Size" "FAIL" "No build output to check"
fi

# Calculate execution time
END_TIME=$(date +%s)
EXECUTION_TIME=$((END_TIME - START_TIME))

# Generate results summary
echo ""
echo "======================================"
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo "======================================"
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo "Execution Time: ${EXECUTION_TIME}s"
echo ""

# Generate JSON results for CI/CD integration
cat > "$RESULTS_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "total_tests": $TOTAL_TESTS,
  "passed_tests": $PASSED_TESTS,
  "failed_tests": $FAILED_TESTS,
  "execution_time_seconds": $EXECUTION_TIME,
  "success": $([ $FAILED_TESTS -eq 0 ] && echo "true" || echo "false")
}
EOF

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}💥 $FAILED_TESTS test(s) failed. Deployment blocked.${NC}"
    echo "Check $LOG_FILE for detailed error information."
    exit 1
fi
