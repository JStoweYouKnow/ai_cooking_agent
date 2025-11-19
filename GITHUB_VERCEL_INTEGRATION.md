# GitHub → Vercel Auto-Deployment Setup

Your deployments aren't triggering automatically from GitHub pushes. Follow these steps to fix it.

## Quick Diagnosis

Check if integration is working:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Git**
4. Check if GitHub repository is connected

If **NOT connected** or shows "Deploy Hooks" only → Follow Setup Below

---

## Complete Setup Guide

### Step 1: Install Vercel GitHub App

1. **Go to GitHub**
   - Visit: https://github.com/apps/vercel
   - Click **"Configure"**
   - Or click **"Install"** if not installed

2. **Grant Repository Access**
   - Choose **"Only select repositories"**
   - Select your `ai-cooking-agent` repository
   - Click **"Install & Authorize"**

### Step 2: Connect Repository to Vercel

#### Option A: From Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click **"Add New..."** → **"Project"**

2. **Import Git Repository**
   - Find your `ai-cooking-agent` repository
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset**: Next.js ✓
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
   - Click **"Deploy"**

4. **Set Environment Variables**
   - Before deploying, add all required env vars
   - See `.env.production.example`

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to existing project (if you already created one)
vercel link

# Or create new project
vercel

# Enable Git integration
vercel git connect
```

### Step 3: Verify Integration

1. **Check Settings**
   - Go to your Vercel project
   - Click **Settings** → **Git**
   - Should show:
     - ✅ Connected to GitHub
     - ✅ Production Branch: `main`
     - ✅ Auto-deploy enabled

2. **Test Auto-Deploy**
   ```bash
   # Make a small change
   echo "# Test auto-deploy" >> README.md
   git add README.md
   git commit -m "Test auto-deploy"
   git push origin main
   ```

3. **Watch Deployment**
   - Go to Vercel Dashboard → **Deployments**
   - Should see new deployment triggered automatically
   - Build should start within 5-10 seconds

---

## Troubleshooting

### Issue: "Repository already linked to another project"

**Solution:**
1. Go to old/duplicate project in Vercel
2. Settings → General → Delete Project
3. Or disconnect Git in Settings → Git
4. Reconnect to your desired project

### Issue: Pushes don't trigger deployments

**Possible causes:**

#### 1. Webhook Not Created

**Fix:**
```bash
# Via Vercel CLI
vercel git connect

# Or manually in GitHub:
# Settings → Webhooks → Should see Vercel webhook
# URL: https://api.vercel.com/...
# Events: push, pull_request
```

#### 2. Branch Mismatch

**Fix:**
- Vercel Settings → Git → Production Branch
- Make sure it's set to `main` (or your primary branch)
- Update if needed

#### 3. GitHub App Permissions

**Fix:**
1. Go to GitHub Settings → Applications → Vercel
2. Check repository access
3. Grant access if needed
4. Revoke and reinstall if permissions look wrong

#### 4. Webhook Deliveries Failing

**Check GitHub:**
1. Repository → Settings → Webhooks
2. Click on Vercel webhook
3. Click "Recent Deliveries"
4. Check for failed deliveries (red X)
5. Redeliver if needed

**Common webhook errors:**
- 401: Vercel API key invalid (reconnect integration)
- 404: Project not found (re-link repository)
- 500: Vercel server error (try again in 5 min)

### Issue: Auto-deploy works but builds fail

**Check:**
1. Environment variables are set in Vercel
2. Build command is correct: `pnpm build`
3. Dependencies install: `pnpm install`
4. No TypeScript errors locally: `pnpm check`
5. Build succeeds locally: `pnpm build`

---

## Manual Deployment (Until Auto-Deploy Fixed)

### Method 1: Vercel CLI

```bash
# Deploy current directory to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

### Method 2: Vercel Dashboard

1. Go to Deployments tab
2. Click **"Deploy"** button (top right)
3. Or click **"Redeploy"** on existing deployment

### Method 3: Deploy Hooks (Temporary)

If you need auto-deploy NOW while fixing integration:

1. **Create Deploy Hook**
   - Vercel Project → Settings → Git → Deploy Hooks
   - Name: "GitHub Push"
   - Branch: main
   - Click **Create Hook**
   - Copy the webhook URL

2. **Add to GitHub Actions**
   ```yaml
   # .github/workflows/deploy-vercel.yml
   name: Deploy to Vercel
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Vercel Deployment
           run: curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}
   ```

3. **Add Secret to GitHub**
   - Repository → Settings → Secrets → Actions
   - New secret: `VERCEL_DEPLOY_HOOK`
   - Value: The webhook URL from step 1

---

## Recommended Setup

### Production Branch (main)
- ✅ Auto-deploy enabled
- ✅ Environment: Production
- ✅ Domain: your-app.vercel.app

### Preview Branches (all others)
- ✅ Auto-deploy enabled
- ✅ Environment: Preview
- ✅ Unique URL per deployment

### Configuration in Vercel Settings → Git

```
Production Branch: main
Deploy Previews: Enabled
Deploy Hooks: (optional, for manual triggers)

✓ Automatically deploy all branches
✓ Deploy preview for pull requests
✓ Comment on pull requests
```

---

## Verification Checklist

Once set up, verify:

- [ ] GitHub app installed and has repository access
- [ ] Vercel project connected to GitHub repo
- [ ] Production branch set to `main`
- [ ] Webhook exists in GitHub repo settings
- [ ] Webhook deliveries are successful (green checks)
- [ ] Push to main triggers deployment in Vercel
- [ ] Build completes successfully
- [ ] Deployment goes live

---

## GitHub Webhook Verification

### Check if webhook exists:

1. **GitHub Repository → Settings → Webhooks**
2. **Should see:**
   ```
   Payload URL: https://api.vercel.com/v1/integrations/deploy/...
   Content type: application/json
   Events: Just the push event, Pull requests
   Active: ✓
   ```

### Test webhook:

1. Click on the webhook
2. Click "Recent Deliveries" tab
3. Click "Redeliver" on any delivery
4. Should get 200 OK response

### If webhook is missing:

```bash
# Reconnect via Vercel CLI
vercel git connect

# Or reinstall GitHub app
# Visit: https://github.com/apps/vercel
# Click: Configure → Reinstall
```

---

## Alternative: Keep Using Manual Deploys

If you prefer manual control:

```bash
# Alias for quick production deploy
alias deploy-prod="vercel --prod"

# Use it
deploy-prod

# Or add to package.json
{
  "scripts": {
    "deploy": "vercel --prod"
  }
}

# Then run
pnpm deploy
```

---

## Support

Still having issues?

1. **Vercel Support**: https://vercel.com/support
2. **Check Vercel Status**: https://www.vercel-status.com/
3. **Community**: https://github.com/vercel/vercel/discussions

Common issues database:
- https://vercel.com/docs/deployments/git
- https://vercel.com/docs/deployments/troubleshoot-a-build

---

## Quick Fix (Most Common)

Usually, this works:

1. **Disconnect and Reconnect**
   ```bash
   vercel git disconnect
   vercel git connect
   ```

2. **Or in Dashboard**
   - Settings → Git → Disconnect
   - Import project again from GitHub

3. **Test**
   ```bash
   git commit --allow-empty -m "Test auto-deploy"
   git push origin main
   ```

Should trigger automatic deployment! ✅
