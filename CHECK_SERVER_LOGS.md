# How to Check Server Logs on Vercel

This guide will help you access and check your server logs to debug the authentication issue.

## Method 1: Vercel Dashboard (Easiest)

### Step 1: Access Vercel Dashboard
1. Go to [https://vercel.com](https://vercel.com)
2. Sign in to your account
3. Find your project (likely named "ai-cooking-agent" or similar)

### Step 2: View Logs
1. Click on your project
2. Go to the **"Deployments"** tab
3. Click on the most recent deployment (the one that's currently live)
4. Click on the **"Functions"** tab or **"Logs"** tab
5. You'll see real-time logs from your serverless functions

### Step 3: Filter Authentication Logs
Look for these log prefixes to find authentication-related logs:
- `[Context]` - Shows request context and Bearer token detection
- `[Auth]` - Shows authentication flow details
- `[Database]` - Shows database connection and query issues
- `[OAuth]` - Shows OAuth-related messages (can be ignored)

### Step 4: Test Login and Watch Logs
1. Keep the Vercel logs page open
2. Try to log in from your mobile app
3. Watch the logs in real-time to see what happens

## Method 2: Vercel CLI (More Detailed)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Link Your Project
```bash
cd /Users/v/Downloads/ai_cooking_agent
vercel link
```

### Step 4: View Logs
```bash
# View real-time logs
vercel logs

# View logs for a specific deployment
vercel logs [deployment-url]

# Filter logs (look for authentication)
vercel logs | grep -i "auth\|context\|database"
```

## Method 3: Using Vercel API

You can also use the Vercel API to fetch logs programmatically, but the dashboard is easier.

## What to Look For

When testing login, you should see logs in this order:

1. **Request Received:**
   ```
   [Context] Request headers - authorization: present
   ```

2. **Bearer Token Detection:**
   ```
   [Auth] Bearer token extracted successfully, length: XX
   [Auth] Using Bearer token authentication, token length: XX
   ```

3. **Authentication Flow:**
   ```
   [Auth] Treating token as openId: user@example.com
   [Auth] getUserByOpenId result: null (or user object)
   [Auth] Creating new user with openId: user@example.com
   [Database] Cannot upsert user: database not available (if DB issue)
   ```

4. **Success or Failure:**
   ```
   [Auth] Bearer token authentication successful, user id: X
   OR
   [Auth] Bearer token authentication failed: [error message]
   ```

## Common Issues to Check

### Issue 1: Bearer Token Not Received
**Look for:**
```
[Context] Request headers - authorization: missing
[Auth] No Bearer token found. Auth header: missing
```
**Solution:** Check that the mobile app is sending the Authorization header correctly.

### Issue 2: Database Connection Issue
**Look for:**
```
[Database] Cannot upsert user: database not available
[Auth] Error creating user: Database connection not available
```
**Solution:** Check your `DATABASE_URL` environment variable in Vercel.

### Issue 3: User Creation Failing
**Look for:**
```
[Auth] Error creating user: [specific error message]
[Auth] User was not created or could not be retrieved after upsertUser
```
**Solution:** Check the specific error message for details.

### Issue 4: Authentication Returning Null
**Look for:**
```
[Context] Auth error (non-blocking): [error message]
[Auth.me] No user in context - authentication may have failed
```
**Solution:** Check the error details in the logs to see why authentication failed.

## Quick Test Command

You can also test the authentication endpoint directly:

```bash
# Test with a Bearer token (replace with actual email)
curl -H "Authorization: Bearer test@example.com" \
  "https://sous.projcomfort.com/api/trpc/auth.me"
```

This should return either:
- `{"result":{"data":{"json":null}}}` - Authentication failed
- `{"result":{"data":{"json":{"id":1,...}}}}` - Authentication succeeded

## Next Steps

1. **Access Vercel Dashboard** and go to your project's logs
2. **Try logging in** from your mobile app
3. **Watch the logs** in real-time
4. **Look for the log patterns** mentioned above
5. **Share the relevant logs** so we can identify the exact issue

## Filtering Logs in Vercel Dashboard

In the Vercel dashboard logs view:
- Use the search/filter box to search for: `[Auth]`, `[Context]`, `[Database]`
- Click on individual log entries to see full details
- Use the time range selector to see logs from when you tested

## Need Help?

If you're having trouble accessing logs or finding the issue:
1. Take a screenshot of the relevant logs
2. Copy the log entries that show `[Auth]` or `[Context]` prefixes
3. Share them so we can help diagnose the issue

