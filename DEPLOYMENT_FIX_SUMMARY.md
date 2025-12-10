# Deployment Build Error - Fixed

## Problem

The deployment was failing with this error:
```
The export subscriptions was not found in module [project]/drizzle/schema-postgres.ts
```

Despite the `subscriptions` table being properly exported in the schema, the deployment build couldn't resolve it.

## Root Cause

**TypeScript path aliases don't work consistently across all deployment environments.**

The code was using:
```typescript
import { subscriptions, payments } from "@drizzle/schema-postgres";
```

While this works locally with TypeScript's `paths` configuration in `tsconfig.json`, deployment platforms (like Vercel) use their own build process that may not respect these aliases the same way, especially after caching.

## Solution Applied

### 1. Changed Imports to Relative Paths

**File:** `server/db.ts`

**Before:**
```typescript
import { subscriptions, payments } from "@drizzle/schema-postgres";
```

**After:**
```typescript
import { subscriptions, payments } from "../drizzle/schema-postgres";
```

This ensures the import works consistently across all environments.

### 2. Force Clean Builds on Deployment

**File:** `vercel.json`

Updated the build command to clear Next.js cache:
```json
{
  "buildCommand": "rm -rf .next && pnpm build"
}
```

This ensures every deployment starts with a clean slate, preventing stale module resolution cache from causing issues.

## Verification

### Local Build
```bash
rm -rf .next && pnpm build
```
✅ **Status:** Passes successfully

### Expected Deployment Results

After pushing these changes, your deployment should:

1. **Clear the `.next` cache** at the start of every build
2. **Successfully resolve** the `subscriptions` and `payments` imports
3. **Build all Stripe routes** without errors:
   - `/api/stripe/create-checkout-session`
   - `/api/stripe/customer-portal`
   - `/api/stripe/webhook`

## How to Monitor the Deployment

### On Vercel:

1. Go to your Vercel dashboard
2. Find the latest deployment (triggered by commit: `bf3e771`)
3. Check the build logs for:
   ```
   ✓ Compiled successfully
   ```
4. Verify no errors about missing exports

### Manual Verification After Deploy:

```bash
# Test if the API is accessible
curl https://sous.projcomfort.com/api/health

# Check if Stripe endpoints are deployed
curl https://sous.projcomfort.com/api/stripe/webhook
# Should return: 405 Method Not Allowed (expected - needs POST)
```

## What Changed

### Files Modified:
1. **server/db.ts** - Changed from path alias to relative import
2. **vercel.json** - Added cache clearing to build command

### Commits:
- `ff11865` - Fixed imports to use relative paths
- `bf3e771` - Force clean build on deployment

## Why This Works

### Relative Imports Are Universal
- ✅ Work in all JavaScript/TypeScript runtimes
- ✅ No dependency on tsconfig.json path resolution
- ✅ Clear and explicit for bundlers
- ✅ Cache-safe across deployments

### Path Aliases Are Fragile
- ❌ Require build-time transformation
- ❌ Different tools may resolve them differently
- ❌ Can cause cache issues
- ❌ Not guaranteed to work in all environments

## Future Prevention

### Best Practices Going Forward:

1. **Use relative imports for critical dependencies** like database schemas
2. **Reserve path aliases** for convenience imports in application code
3. **Always test builds** with `rm -rf .next && pnpm build` before deploying
4. **Monitor deployment logs** for module resolution warnings

### When to Use Each:

**Relative Imports:** (Recommended)
- Database schemas (`../drizzle/schema-postgres`)
- Core utilities
- Critical server-side code

**Path Aliases:** (Optional)
- UI components (`@/components/Button`)
- Utilities (`@shared/utils`)
- Client-side code

## Troubleshooting

### If Deployment Still Fails:

1. **Check Vercel Environment:**
   - Ensure `NODE_ENV=production` is set
   - Verify all required environment variables are configured

2. **Clear Vercel's Cache Manually:**
   - In Vercel dashboard: Settings → Clear Build Cache
   - Trigger a new deployment

3. **Verify the Fix Was Deployed:**
   ```bash
   git log --oneline -5
   # Should show: bf3e771 Fix: Force clean build...
   ```

4. **Check for Other Path Alias Issues:**
   ```bash
   grep -r "from \"@drizzle/" server/
   # Should return: no results
   ```

## Summary

✅ **Fixed:** Import resolution by using relative paths
✅ **Prevention:** Clean builds on every deployment
✅ **Verified:** Local build passes successfully
🚀 **Ready:** For deployment to production

Your deployment should now build successfully!
