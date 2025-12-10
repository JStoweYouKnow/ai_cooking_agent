# Deployment Monitoring Guide

## Quick Status Check

### 1. Check Latest Deployment
```bash
# View recent commits
git log --oneline -3
```

Expected output:
```
bf3e771 Fix: Force clean build on deployment to clear module cache
ff11865 (previous commit)
...
```

### 2. Monitor Vercel Build

**URL:** https://vercel.com/[your-username]/[your-project]/deployments

**What to look for:**
- ✅ Build phase completes
- ✅ No "module not found" errors
- ✅ All routes compile successfully

### 3. Test Production API

Once deployed, run these tests:

```bash
# 1. Health check (if you have one)
curl https://sous.projcomfort.com/

# 2. Test tRPC endpoint
curl https://sous.projcomfort.com/api/trpc
# Expected: CORS or "Method not allowed" (means it's alive)

# 3. Test Stripe endpoint
curl -X POST https://sous.projcomfort.com/api/stripe/webhook
# Expected: 400 or "Webhook Error" (means it's responding)
```

## Common Deployment Issues

### Issue: Still Getting Module Not Found

**Solution 1:** Clear Vercel cache manually
1. Go to Vercel Dashboard
2. Project Settings → Build & Development Settings
3. Click "Clear Build Cache"
4. Trigger new deployment

**Solution 2:** Check environment variables
```bash
# Ensure these are set in Vercel:
DATABASE_URL
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
S3_BUCKET
```

### Issue: 500 Internal Server Error

**Check Vercel logs:**
1. Go to deployment
2. Click "Functions" tab
3. View runtime logs
4. Look for database connection errors

**Common causes:**
- DATABASE_URL not set or incorrect
- Database not accessible from Vercel's IP
- Missing environment variables

### Issue: Stripe Webhooks Not Working

**Verify webhook URL:**
```
https://sous.projcomfort.com/api/stripe/webhook
```

**Check:**
1. STRIPE_WEBHOOK_SECRET is set
2. Webhook is configured in Stripe dashboard
3. Test webhook from Stripe dashboard

## Success Indicators

✅ Build completes without errors
✅ All routes show as deployed (ƒ or ○)
✅ API endpoints respond (even if with errors - means they're alive)
✅ Mobile app can connect to server

## Deployment Timeline

From push to production:
1. **0-1 min:** Vercel detects push
2. **1-3 min:** Installing dependencies
3. **3-5 min:** Building application
4. **5-7 min:** Deployment complete

Total: ~7 minutes

## Mobile App Testing After Deploy

Once server is deployed:

```bash
cd mobile
# Update API URL is already set to production
grep "projcomfort.com" src/api/client.ts
# Should show: https://sous.projcomfort.com
```

### Test on Simulator:
```bash
npx expo start
# Press 'i' for iOS simulator
# Try logging in with an email
```

### Expected Behavior:
- Login screen appears
- Enter email → shows "Signing in"
- Creates user in database
- Shows dashboard

## Quick Rollback

If deployment fails and you need to rollback:

```bash
# 1. Go to Vercel dashboard
# 2. Find previous successful deployment
# 3. Click "Promote to Production"
```

Or revert the commit:
```bash
git revert bf3e771
git push
```

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Build Errors:** https://nextjs.org/docs/messages
- **Deployment Guide:** See `DEPLOYMENT_FIX_SUMMARY.md`

## Contact Info

If deployment is stuck:
1. Check Vercel status: https://www.vercel-status.com/
2. Review build logs carefully
3. Compare with successful builds
