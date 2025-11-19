# Fix Vercel Git Integration - Step by Step Guide

## 🔧 Method 1: Reconnect Repository in Vercel Dashboard (Recommended)

### Step 1: Disconnect Current Connection
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project: **ai-cooking-agent**
3. Go to **Settings** → **Git**
4. If you see a connected repository, click **Disconnect** or **Change Git Provider**
5. Confirm the disconnection

### Step 2: Reconnect Repository
1. Still in **Settings** → **Git**
2. Click **Connect Git Repository** or **Add Git Repository**
3. Select **GitHub** as your Git provider
4. Authorize Vercel if prompted (grant necessary permissions)
5. Search for: `JStoweYouKnow/ai_cooking_agent`
6. Click **Import** or **Connect**

### Step 3: Configure Deployment Settings
After connecting, verify these settings:
- **Production Branch**: `main` ✅
- **Root Directory**: `./` (leave default)
- **Framework Preset**: `Next.js` (should auto-detect)
- **Build Command**: `pnpm build` ✅
- **Install Command**: `pnpm install` ✅
- **Output Directory**: `.next` (auto-detected)

### Step 4: Enable Automatic Deployments
1. In **Settings** → **Git**
2. Ensure **Automatic deployments from Git** is **Enabled** ✅
3. For Production branch (`main`): **Auto-deploy** should be ON
4. For Preview branches: **Auto-deploy** should be ON (optional)

### Step 5: Test the Integration
1. Make a test commit:
   ```bash
   git commit --allow-empty -m "Test Vercel Git integration"
   git push origin main
   ```
2. Go to Vercel Dashboard → **Deployments** tab
3. Within 1-2 minutes, you should see a new deployment starting
4. If deployment appears → **Integration is working!** ✅

---

## 🔧 Method 2: Use Vercel CLI to Link Project

If the dashboard method doesn't work, use CLI:

### Step 1: Install Vercel CLI (if not installed)
```bash
# Use npx (no global install needed)
npx vercel --version

# Or install globally (requires sudo)
sudo npm i -g vercel
```

### Step 2: Login to Vercel
```bash
npx vercel login
# Follow the prompts to authenticate
```

### Step 3: Link Your Project
```bash
# Navigate to your project directory
cd <project-directory>
# Or if already in the project root:
# cd ./

npx vercel link
```

When prompted:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your team/account
- **Link to existing project?** → Yes
- **What's the name of your existing project?** → `ai-cooking-agent`
- **In which directory is your code located?** → `./` (current directory)

### Step 4: Connect Git Repository
```bash
npx vercel git connect
```

This will:
1. Open a browser to connect your GitHub repository
2. Authorize Vercel to access your repository
3. Set up the webhook automatically

### Step 5: Verify Connection
```bash
npx vercel git status
```

Should show:
- Repository: `JStoweYouKnow/ai_cooking_agent`
- Production branch: `main`
- Connected: Yes

---

## 🔧 Method 3: Manual Webhook Setup (If Methods 1 & 2 Fail)

### Step 1: Get Vercel Integration ID
1. Go to Vercel Dashboard → **Settings** → **Git**
2. Look for "Integration" or "Git Provider" section
3. Note the integration ID or webhook URL

### Step 2: Add Webhook in GitHub
1. Go to: `https://github.com/JStoweYouKnow/ai_cooking_agent/settings/hooks`
2. Click **Add webhook**
3. **Payload URL**: 
   ```
   https://api.vercel.com/v1/integrations/deploy/[INTEGRATION_ID]/github
   ```
   (Replace `[INTEGRATION_ID]` with your actual integration ID)
4. **Content type**: `application/json`
5. **Secret**: Leave empty (or get from Vercel if provided)
6. **Events**: Select:
   - ✅ `push` (for commits)
   - ✅ `pull_request` (for PR previews)
7. **Active**: ✅ Checked
8. Click **Add webhook**

### Step 3: Test Webhook
1. Make a test commit:
   ```bash
   git commit --allow-empty -m "Test webhook"
   git push origin main
   ```
2. Go back to GitHub → Settings → Webhooks
3. Click on the Vercel webhook
4. Check "Recent Deliveries" tab
5. Should see a delivery with status 200 ✅

---

## 🔍 Troubleshooting Common Issues

### Issue: "Repository not found" or "Access denied"
**Solution**:
1. Check GitHub repository is public OR
2. Grant Vercel access to private repositories:
   - GitHub → Settings → Applications → Authorized OAuth Apps
   - Find "Vercel" → Grant repository access

### Issue: Webhook shows "Failed" or "Error"
**Solution**:
1. Check webhook URL is correct
2. Verify integration ID is correct
3. Try removing and re-adding webhook
4. Check Vercel logs for error messages

### Issue: Deployments not triggering
**Solution**:
1. Verify branch name matches: `main` (not `master`)
2. Check Vercel Settings → Git → Production branch is `main`
3. Ensure "Automatic deployments" is enabled
4. Try disconnecting and reconnecting repository

### Issue: Build fails after integration
**Solution**:
1. Check environment variables are set in Vercel
2. Verify `pnpm` is available (Vercel auto-detects from `package-lock.json` or `pnpm-lock.yaml`)
3. Check build logs in Vercel dashboard for specific errors

---

## ✅ Verification Checklist

After fixing, verify:

- [ ] Repository shows in Vercel Dashboard → Settings → Git
- [ ] Production branch is set to `main`
- [ ] Automatic deployments are enabled
- [ ] Webhook exists in GitHub (Settings → Webhooks)
- [ ] Webhook status is "Active" and shows recent deliveries
- [ ] Test commit triggers a new deployment in Vercel
- [ ] Deployment builds successfully

---

## 🚀 Quick Test Script

Run this to test the integration:

```bash
#!/bin/bash
echo "Testing Vercel Git Integration..."
echo ""

# Make test commit
git commit --allow-empty -m "Test Vercel integration - $(date +%Y-%m-%d-%H:%M:%S)"
git push origin main

echo ""
echo "✅ Commit pushed!"
echo "📊 Check Vercel Dashboard → Deployments tab in 1-2 minutes"
echo "   URL: https://vercel.com/dashboard"
echo ""
echo "If you see a new deployment starting, integration is working! ✅"
```

Save as `test-vercel-integration.sh`, make executable (`chmod +x test-vercel-integration.sh`), and run it.

---

## 📞 Still Not Working?

If none of the above methods work:

1. **Check Vercel Status**: https://www.vercel-status.com/
2. **Vercel Support**: https://vercel.com/support
3. **GitHub Integration Docs**: https://vercel.com/docs/concepts/git

Common final fixes:
- Clear browser cache and cookies
- Try incognito/private browsing mode
- Use a different browser
- Wait 5-10 minutes for webhook propagation

