#!/bin/bash

# Deployment Pre-flight Check Script
# Run this before deploying to catch common issues

set -e

echo "🚀 AI Cooking Agent - Deployment Pre-flight Check"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counter
CHECKS_PASSED=0
CHECKS_FAILED=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Checking Node.js and pnpm..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js installed: $NODE_VERSION"
else
    check_fail "Node.js not installed"
fi

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    check_pass "pnpm installed: $PNPM_VERSION"
else
    check_fail "pnpm not installed (run: npm install -g pnpm)"
fi

echo ""
echo "2. Checking dependencies..."
if [ -d "node_modules" ]; then
    check_pass "node_modules directory exists"
else
    check_fail "node_modules not found (run: pnpm install)"
fi

echo ""
echo "3. Running type check..."
if pnpm check &> /dev/null; then
    check_pass "TypeScript types are valid"
else
    check_fail "TypeScript errors found (run: pnpm check)"
fi

echo ""
echo "4. Testing production build..."
if pnpm build &> /dev/null; then
    check_pass "Production build successful"
    rm -rf .next # Clean up
else
    check_fail "Build failed (run: pnpm build to see errors)"
fi

echo ""
echo "5. Checking required files..."
required_files=(
    "package.json"
    "next.config.mjs"
    "tsconfig.json"
    "vercel.json"
    ".env.example"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file exists"
    else
        check_fail "$file missing"
    fi
done

echo ""
echo "6. Checking environment variables..."
if [ -f ".env.example" ]; then
    check_pass ".env.example exists"
    echo ""
    echo "   Required variables:"
    grep -E '^[A-Z_]+=' .env.example | cut -d'=' -f1 | while read var; do
        echo "   - $var"
    done
else
    check_fail ".env.example not found"
fi

echo ""
echo "7. Git status check..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    check_pass "Git repository initialized"

    # Check for uncommitted changes
    if git diff-index --quiet HEAD --; then
        check_pass "No uncommitted changes"
    else
        check_warn "You have uncommitted changes"
        echo "   Run: git status"
    fi

    # Check if remote exists
    if git remote -v | grep -q origin; then
        check_pass "Git remote 'origin' configured"
    else
        check_warn "No git remote configured"
        echo "   Add with: git remote add origin <your-repo-url>"
    fi
else
    check_fail "Not a git repository (run: git init)"
fi

echo ""
echo "=================================================="
echo "Pre-flight Check Results:"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
if [ $CHECKS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
    echo ""
    echo "❌ Please fix the failed checks before deploying"
    exit 1
else
    echo -e "${RED}Failed: 0${NC}"
    echo ""
    echo "✅ All checks passed! Ready to deploy to Vercel"
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub: git push origin main"
    echo "2. Deploy to Vercel: vercel --prod"
    echo "3. Or connect repo in Vercel dashboard"
    exit 0
fi
