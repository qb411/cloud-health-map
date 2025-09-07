#!/bin/bash

# Quick Validation Script for AWS Health Map
# Runs essential tests for rapid feedback during development

set -e

echo "⚡ AWS Health Map - Quick Validation"
echo "===================================="

# Configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$(cd "$TEST_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Quick test function
quick_test() {
    local name="$1"
    local command="$2"
    
    echo -n "Testing $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED=$((FAILED + 1))
    fi
}

cd "$PROJECT_DIR"

# Essential validations
quick_test "Project Structure" "[ -f package.json ] && [ -f vite.config.ts ] && [ -d src ]"
quick_test "Dependencies" "npm list --depth=0"
quick_test "TypeScript" "npx tsc --noEmit"
quick_test "Unit Tests" "cd '$TEST_DIR' && node -e 'require(\"./unit/status-mapping.test.js\").runUnitTests()'"
quick_test "Integration Tests" "cd '$TEST_DIR' && node -e 'require(\"./integration/test-controls.test.js\").runIntegrationTests()'"

echo ""
echo "Results: $PASSED passed, $FAILED failed"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🚀 Quick validation passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Issues detected. Run full CI test for details.${NC}"
    exit 1
fi
