#!/bin/bash

# AI Text2PPT Pro - Deployment Verification Script
# This script verifies that all fixes are properly deployed

echo "🔍 AI Text2PPT Pro - Deployment Verification"
echo "============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# Function to check
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} - $1"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} - $1"
        ((FAILED++))
    fi
}

echo "📋 Step 1: Checking Required Files"
echo "-----------------------------------"

# Check if critical files exist
test -f "public/index.html"
check "index.html exists"

test -f "public/js/api.js"
check "api.js exists"

test -f "public/js/ui.js"
check "ui.js exists"

test -f "public/js/fileHandler.js"
check "fileHandler.js exists"

test -f "public/diagnostic.html"
check "diagnostic.html exists (NEW)"

test -f "public/test-integration.html"
check "test-integration.html exists (NEW)"

echo ""
echo "🔧 Step 2: Verifying Fixes in Files"
echo "-----------------------------------"

# Check if api.js has window.showStatus calls
grep -q "window.showStatus" public/js/api.js
check "api.js uses window.showStatus"

# Check if api.js has window.displayPreview calls
grep -q "window.displayPreview" public/js/api.js
check "api.js uses window.displayPreview"

# Check if layout has been updated (no "Step 0" label)
! grep -q "Step 0:" public/index.html
check "Step labels removed from layout"

# Check if AI Generator section exists
grep -q "AI Idea Generator" public/index.html
check "AI Idea Generator section exists"

# Check if Theme Selector is in HTML
grep -q "themeSelector" public/index.html
check "Theme Selector exists"

echo ""
echo "🐳 Step 3: Docker Configuration"
echo "-----------------------------------"

test -f "Dockerfile"
check "Dockerfile exists"

test -f "docker-compose.yml"
check "docker-compose.yml exists"

echo ""
echo "📊 Summary"
echo "-----------------------------------"
echo -e "Total Checks: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo "Ready for Docker deployment!"
    echo ""
    echo "Next steps:"
    echo "1. docker-compose build"
    echo "2. docker-compose up -d"
    echo "3. Visit http://localhost:3000/diagnostic.html"
    exit 0
else
    echo -e "${RED}❌ SOME CHECKS FAILED!${NC}"
    echo "Please review the failures above."
    exit 1
fi

