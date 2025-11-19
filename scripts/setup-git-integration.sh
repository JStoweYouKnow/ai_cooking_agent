#!/bin/bash

# Vercel Git Integration Setup Script
# Connects your GitHub repo to Vercel for auto-deployments

set -e

echo "🔗 Vercel Git Integration Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Prerequisite checks - fail fast with clear errors
echo "Checking prerequisites..."

# Check if Git CLI is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Error: Git CLI is not installed${NC}"
    echo "Please install Git first:"
    echo "  macOS: brew install git"
    echo "  Linux: sudo apt-get install git (or your package manager)"
    echo "  Windows: Download from https://git-scm.com/download/win"
    exit 1
fi

# Check if running inside a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo -e "${RED}✗ Error: Not running inside a Git repository${NC}"
    echo "Please run this script from the root of your Git repository."
    exit 1
fi

# Check if remote 'origin' exists
if ! git remote get-url origin &> /dev/null; then
    echo -e "${RED}✗ Error: Git remote 'origin' is not configured${NC}"
    echo "Please add a remote named 'origin':"
    echo "  git remote add origin <your-repository-url>"
    exit 1
fi

# Check if remote 'origin' is reachable
if ! git ls-remote --exit-code origin &> /dev/null; then
    echo -e "${RED}✗ Error: Git remote 'origin' is not reachable${NC}"
    echo "Please verify:"
    echo "  1. The remote URL is correct: git remote get-url origin"
    echo "  2. You have network connectivity"
    echo "  3. You have proper authentication (SSH keys or credentials)"
    echo "  4. The repository exists and is accessible"
    exit 1
fi

echo -e "${GREEN}✓${NC} All prerequisites met"
echo ""

# Function to detect the default branch name
detect_branch() {
    local branch=""
    local remote="origin"
    
    # Method 1: Try to get remote default branch from symref
    if remote_ref=$(git ls-remote --symref "$remote" HEAD 2>/dev/null); then
        branch=$(echo "$remote_ref" | grep -E '^ref: refs/heads/' | head -1 | sed -E 's|^ref: refs/heads/([^\t[:space:]]+).*|\1|')
        if [ -n "$branch" ]; then
            echo -e "${GREEN}✓${NC} Detected remote default branch: $branch" >&2
            echo "$branch"
            return 0
        fi
    fi
    
    # Method 2: Try to get local current branch using symbolic-ref
    if branch=$(git symbolic-ref --short HEAD 2>/dev/null); then
        if [ -n "$branch" ]; then
            echo -e "${YELLOW}⚠${NC} Using local current branch: $branch (remote default not available)" >&2
            echo "$branch"
            return 0
        fi
    fi
    
    # Method 3: Fallback to rev-parse --abbrev-ref
    if branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null); then
        if [ -n "$branch" ] && [ "$branch" != "HEAD" ]; then
            echo -e "${YELLOW}⚠${NC} Using branch from rev-parse: $branch" >&2
            echo "$branch"
            return 0
        fi
    fi
    
    # Method 4: Default to "main"
    echo -e "${YELLOW}⚠${NC} Could not detect branch, defaulting to 'main'" >&2
    echo "main"
    return 1
}

# Detect the branch name
DEFAULT_BRANCH=$(detect_branch)
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗${NC} Vercel CLI not found"
    echo "Installing Vercel CLI..."
    npm i -g vercel
fi

echo -e "${GREEN}✓${NC} Vercel CLI installed"
echo ""

# Check if logged in
echo "Checking Vercel login status..."
if vercel whoami &> /dev/null; then
    USERNAME=$(vercel whoami)
    echo -e "${GREEN}✓${NC} Logged in as: $USERNAME"
else
    echo -e "${YELLOW}⚠${NC} Not logged in to Vercel"
    echo "Please login..."
    vercel login
fi
echo ""

# Check current project
echo "Checking current project..."
if vercel ls &> /dev/null; then
    echo -e "${GREEN}✓${NC} Project linked"
else
    echo -e "${YELLOW}⚠${NC} No project linked"
    echo "Linking project..."
    vercel link
fi
echo ""

# The key command: Connect Git integration
echo "Setting up Git integration..."
echo "This will connect your GitHub repo to Vercel for auto-deployments"
echo ""

vercel git connect || {
    echo ""
    echo -e "${RED}✗${NC} Git connection failed"
    echo ""
    # Attempt to extract repo info from git remote
    REPO_URL=$(git config --get remote.origin.url)
    REPO_NAME=$(echo "$REPO_URL" | sed -E 's|.*[:/]([^/]+)/(.+?)(\.git)?$|\1/\2|')
    
    echo "Manual steps required:"
    echo "1. Go to: https://vercel.com/dashboard"
    echo "2. Find your project"
    echo "3. Settings → Git → Connect Git Repository"
    echo "4. Select: $REPO_NAME"
    echo ""
    exit 1
}

echo ""
echo -e "${GREEN}✓${NC} Git integration connected!"
echo ""
echo "Testing auto-deploy..."
echo "Making empty commit..."

git commit --allow-empty -m "Test Vercel auto-deploy integration" 2>&1 || {
    echo -e "${YELLOW}⚠${NC} Could not make commit (might be already up to date)"
}

echo ""
echo "Pushing to GitHub..."

# Capture git push output and exit code
PUSH_OUTPUT=$(git push origin "$DEFAULT_BRANCH" 2>&1)
PUSH_EXIT_CODE=$?

if [ $PUSH_EXIT_CODE -ne 0 ]; then
    echo ""
    echo -e "${RED}✗${NC} Git push failed (exit code: $PUSH_EXIT_CODE)"
    echo ""
    echo -e "${RED}Error output:${NC}"
    echo "$PUSH_OUTPUT"
    echo ""
    echo -e "${YELLOW}Possible issues and solutions:${NC}"
    
    # Check for common error patterns and provide specific hints
    if echo "$PUSH_OUTPUT" | grep -qi "could not read.*remote"; then
        echo "  • Remote 'origin' might not be configured correctly"
        echo "    → Check: git remote -v"
        echo "    → Fix: git remote set-url origin <your-repo-url>"
    elif echo "$PUSH_OUTPUT" | grep -qi "permission denied\|authentication failed\|could not read Username"; then
        echo "  • Authentication failed - GitHub credentials missing or invalid"
        echo "    → Check: SSH keys are set up (for SSH remotes)"
        echo "    → Or: Configure Git credential helper for HTTPS"
        echo "    → Or: Use GitHub CLI: gh auth login"
    elif echo "$PUSH_OUTPUT" | grep -qi "remote rejected\|\[rejected\]"; then
        echo "  • Remote rejected the push"
        echo "    → Branch might be protected or out of sync"
        echo "    → Try: git pull --rebase origin $DEFAULT_BRANCH"
        echo "    → Then push again"
    elif echo "$PUSH_OUTPUT" | grep -qi "branch.*does not exist\|no such branch"; then
        echo "  • Branch '$DEFAULT_BRANCH' does not exist on remote"
        echo "    → Try: git push -u origin $DEFAULT_BRANCH (to create and track branch)"
    elif echo "$PUSH_OUTPUT" | grep -qi "fatal: not a git repository"; then
        echo "  • Not in a git repository"
        echo "    → Navigate to the project root directory"
    else
        echo "  • Check the error output above for specific details"
        echo "    → Verify remote URL: git remote get-url origin"
        echo "    → Check branch exists: git branch -a"
        echo "    → Verify network connection"
    fi
    echo ""
    exit 1
fi

echo ""
echo "================================"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Click on your project"
echo "3. Go to 'Deployments' tab"
echo "4. You should see a new deployment starting!"
echo ""
echo "Future pushes to '$DEFAULT_BRANCH' will auto-deploy to Vercel"
