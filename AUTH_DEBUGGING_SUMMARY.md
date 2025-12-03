# Authentication Debugging Summary

## Current Status

✅ **Server is running** - Health check passes  
✅ **Database is connected** - Health check shows database is OK  
✅ **Bearer token is being sent** - Verified with curl test  
❌ **Authentication returns null** - Server is not authenticating users

## What We Know

1. **Bearer token is received**: The server receives the `Authorization: Bearer test@example.com` header
2. **Server returns null**: The `auth.me` endpoint returns `null` instead of a user object
3. **Database is working**: Health check confirms database connectivity
4. **Error is being caught silently**: Authentication errors are caught in context creation and return null

## Most Likely Causes

Based on the code analysis, the authentication is failing in one of these places:

### 1. Database Connection Issue During User Creation
- **Symptom**: `upsertUser` fails silently
- **Check logs for**: `[Database] Cannot upsert user: database not available`
- **Solution**: Verify `DATABASE_URL` environment variable in Vercel

### 2. User Creation Failing
- **Symptom**: `upsertUser` completes but `getUserByOpenId` returns null
- **Check logs for**: `[Auth] User was not created or could not be retrieved after upsertUser`
- **Solution**: Check database schema and permissions

### 3. Authentication Error Being Caught
- **Symptom**: `ForbiddenError` is thrown but caught in context
- **Check logs for**: `[Context] Auth error (non-blocking): [error message]`
- **Solution**: Check the specific error message in logs

## How to Diagnose

### Step 1: Check Vercel Logs

1. Go to [vercel.com](https://vercel.com) → Your Project → Deployments → Latest → Logs
2. Try logging in from your mobile app
3. Filter logs for: `[Auth]`, `[Context]`, `[Database]`
4. Look for error messages

### Step 2: Check Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, verify:
- `DATABASE_URL` is set correctly
- Database connection string is valid
- Database is accessible from Vercel

### Step 3: Test Database Connection

The health check shows the database is connected, but test if user creation works:

```bash
# This should work if database is properly configured
curl "https://sous.projcomfort.com/api/trpc/system.health"
```

## What to Look For in Logs

When you test login, you should see this sequence:

### Expected Success Flow:
```
[Context] Request headers - authorization: present
[Auth] Bearer token extracted successfully, length: XX
[Auth] Using Bearer token authentication, token length: XX
[Auth] Treating token as openId: test@example.com
[Auth] getUserByOpenId result: null
[Auth] Creating new user with openId: test@example.com
[Auth] upsertUser completed, fetching user...
[Auth] User after creation: { id: X, openId: 'test@example.com' }
[Auth] Returning user: { id: X, openId: 'test@example.com', name: 'test' }
[Auth] Bearer token authentication successful, user id: X
[Context] Authentication result: { id: X, openId: 'test@example.com', name: 'test' }
[Auth.me] Returning user: { id: X, openId: 'test@example.com', name: 'test' }
```

### Failure Scenarios:

**Scenario 1: Database Not Available**
```
[Auth] Creating new user with openId: test@example.com
[Database] Cannot upsert user: database not available
[Auth] Error creating user: Database connection not available
[Context] Auth error (non-blocking): Database connection not available
```

**Scenario 2: User Creation Fails**
```
[Auth] Creating new user with openId: test@example.com
[Auth] upsertUser completed, fetching user...
[Auth] User after creation: null
[Auth] Error creating user: User was not created or could not be retrieved
[Context] Auth error (non-blocking): Failed to create user: ...
```

**Scenario 3: Bearer Token Not Extracted**
```
[Context] Request headers - authorization: present
[Auth] Bearer token is empty after trim
[Auth] No Bearer token found. Auth header: present
[Context] Auth error (non-blocking): Invalid bearer token
```

## Next Steps

1. **Check Vercel Logs** - This is the most important step
   - Go to Vercel dashboard
   - Open your project's logs
   - Try logging in
   - Copy the `[Auth]` and `[Context]` log entries

2. **Verify Database URL** - Make sure `DATABASE_URL` is set correctly in Vercel

3. **Check Database Permissions** - Ensure the database user has permission to INSERT/UPDATE users

4. **Share Logs** - Once you have the logs, share the relevant entries so we can identify the exact issue

## Quick Test Commands

```bash
# Test authentication endpoint
curl -H "Authorization: Bearer test@example.com" \
  "https://sous.projcomfort.com/api/trpc/auth.me"

# Test health endpoint
curl "https://sous.projcomfort.com/api/trpc/system.health"

# Run diagnostic script
./test-auth.sh
```

## Files Modified for Debugging

We've added extensive logging to help diagnose the issue:
- `server/_core/sdk.ts` - Enhanced authentication logging
- `server/_core/context.ts` - Enhanced context logging
- `server/routers.ts` - Enhanced auth.me logging
- `server/db.ts` - Better error handling for database issues

All these changes will show up in your Vercel logs when you test login.

