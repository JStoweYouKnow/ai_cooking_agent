# How to Verify CI is Checking the Correct Repository/Branch

## Current Configuration

Based on your workflow files:

**Repository:** `JStoweYouKnow/ai_cooking_agent`  
**Branch:** `main`  
**Workflow Files:**
- `.github/workflows/vercel-production.yml` - Runs on push to `main`
- `.github/workflows/vercel-preview.yml` - Runs on PRs to `main`

## Steps to Verify

### 1. Check GitHub Repository Settings

1. Go to: `https://github.com/JStoweYouKnow/ai_cooking_agent`
2. Click **Settings** → **Actions** → **General**
3. Verify:
   - Repository is correct: `JStoweYouKnow/ai_cooking_agent`
   - Actions are enabled
   - Workflow permissions are set correctly

### 2. Check Workflow Runs

1. Go to: `https://github.com/JStoweYouKnow/ai_cooking_agent/actions`
2. Click on a recent workflow run
3. Check:
   - **Repository:** Should show `JStoweYouKnow/ai_cooking_agent`
   - **Branch:** Should show `main` (or the branch that triggered it)
   - **Commit:** Click to verify it matches your local commits

### 3. Verify in Workflow Logs

In any workflow run, check the "Checkout code" step:

```yaml
- name: Checkout code
  uses: actions/checkout@v4
```

The logs should show:
```
Cloning github.com/JStoweYouKnow/ai_cooking_agent (Branch: main, Commit: <your-commit-hash>)
```

### 4. Check Local Repository

Run these commands locally to verify:

```bash
# Check remote repository
git remote -v
# Should show: origin https://github.com/JStoweYouKnow/ai_cooking_agent.git

# Check current branch
git branch
# Should show: * main

# Check recent commits
git log --oneline -5
# Should match commits you see in GitHub
```

### 5. Verify Files Exist

The errors mention files that don't exist in your repository:
- `app/components/leaflet-map.tsx` ❌ (doesn't exist)
- `app/api/email-deals/route.integration.test.ts` ❌ (doesn't exist)

**If these files don't exist locally, they shouldn't exist in CI either.**

## Troubleshooting

### If CI is checking wrong files:

1. **Check if files exist in a different branch:**
   ```bash
   git branch -a
   git checkout <other-branch>
   ls app/components/leaflet-map.tsx 2>/dev/null || echo "File doesn't exist"
   ```

2. **Check if files are in .gitignore but being checked:**
   ```bash
   git check-ignore -v app/components/leaflet-map.tsx
   ```

3. **Verify TypeScript is using correct config:**
   ```bash
   pnpm check
   # Should only check files in your repository
   ```

### If errors persist:

The errors you're seeing suggest:
- CI might be checking a different repository
- Files might exist in a different branch
- TypeScript might be including files from node_modules or .next

**Solution:** The `tsconfig.json` has been updated to exclude test files. If errors persist, check:
1. GitHub Actions is using the correct repository
2. The workflow is checking out the correct branch
3. No other TypeScript configs are being used

## Quick Verification Command

Run this to see what TypeScript is actually checking:

```bash
pnpm check 2>&1 | grep -E "(error|leaflet|email-deals)" || echo "✅ No errors found for those files"
```

