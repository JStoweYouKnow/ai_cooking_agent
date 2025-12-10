# TestFlight Authentication Issue - Diagnosis & Fix

## 🔍 Problem Identified

Your mobile app authentication is failing in TestFlight because the production build cannot reach `https://sous.projcomfort.com`.

## 🔬 How Authentication Works

### Mobile App Flow:
1. User enters email in LoginScreen
2. Email is stored as `auth_token` in SecureStore
3. On every API request, the token is sent as: `Authorization: Bearer <email>`
4. Server receives Bearer token and authenticates

### Server Flow (sdk.ts:259-417):
```typescript
authenticateRequest(req):
  1. Extract Bearer token from Authorization header
  2. Try to verify as JWT session token
  3. If not JWT, treat as openId (email)
  4. Call getUserByOpenId(email)
  5. If user doesn't exist, create new user
  6. Return user object
```

### What the Mobile App Expects (AuthContext.tsx:111):
```typescript
const userData = await trpcClient.auth.me.query();
// Expects: { id, openId, name, email, role }
```

## 🚨 Root Causes

### 1. **Server Not Accessible**
**Status:** ⚠️ CRITICAL

Your TestFlight build is trying to reach:
```
https://sous.projcomfort.com/api/trpc/auth.me
```

**Checklist:**
- [ ] Is your server deployed and running?
- [ ] Is `sous.projcomfort.com` DNS configured correctly?
- [ ] Is SSL certificate valid?
- [ ] Can you curl the endpoint from outside your network?

**Test:**
```bash
curl -v https://sous.projcomfort.com/api/trpc
```

Expected: Should return CORS headers or tRPC error (not connection refused)

### 2. **CORS Configuration**
**Status:** ✅ SHOULD BE OK

Server has CORS enabled (server/_core/index.ts:36-41):
```typescript
cors({
  origin: true, // Allows all origins
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
})
```

This should work, but might need adjustment for production.

### 3. **HTTPS/SSL Issues**
**Status:** ⚠️ NEEDS VERIFICATION

TestFlight builds **require valid SSL certificates**. Self-signed certificates won't work.

**Checklist:**
- [ ] SSL certificate is from trusted CA (Let's Encrypt, etc.)
- [ ] Certificate matches `sous.projcomfort.com` domain
- [ ] Certificate is not expired

**Test:**
```bash
curl -v https://sous.projcomfort.com 2>&1 | grep -i "ssl\|certificate"
```

### 4. **Environment Variables Not Set**
**Status:** ⚠️ POSSIBLE

The mobile app uses `process.env.EXPO_PUBLIC_API_URL` in production.

**Check mobile/app.json (line 62):**
```json
"extra": {
  "EXPO_PUBLIC_API_URL": "https://sous.projcomfort.com"
}
```

This should be set ✅, but verify in your build logs.

## 🔧 Fixes to Implement

### Fix 1: Add Server Health Check Endpoint

Add a simple health check to verify the server is accessible:

**File: server/_core/index.ts**
```typescript
// Add after line 45 (before OAuth routes)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});
```

### Fix 2: Add Better Error Logging in Mobile App

**File: mobile/src/contexts/AuthContext.tsx (line 154)**

The error handling already exists, but you can enhance it:
```typescript
if (error?.message?.includes("Network request failed") || error?.message?.includes("fetch")) {
  const errorMsg = `Cannot connect to server at ${baseUrl}.

  Troubleshooting:
  - Check if ${baseUrl} is accessible
  - Verify DNS is configured
  - Check SSL certificate is valid
  - Review server logs for errors`;

  console.error("[Auth]", errorMsg);
  throw new Error(errorMsg);
}
```

### Fix 3: CORS Configuration for Production

**File: server/_core/index.ts (line 36-41)**

For production, restrict CORS to specific origins:
```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://sous.projcomfort.com', 'https://projcomfort.com']
    : true,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
}));
```

### Fix 4: Add Retry Logic in Mobile App

**File: mobile/src/api/client.ts**

The QueryClient already has retry: 2, but you can make it smarter:
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.data?.code === "UNAUTHORIZED") return false;
        // Retry network errors up to 3 times
        if (error?.message?.includes("Network")) return failureCount < 3;
        // Default retry
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});
```

## 🧪 How to Test

### Test 1: Verify Server is Accessible
```bash
# Test health endpoint
curl https://sous.projcomfort.com/api/health

# Test tRPC endpoint
curl https://sous.projcomfort.com/api/trpc

# Test with authentication
curl -H "Authorization: Bearer test@example.com" \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":null}}' \
  https://sous.projcomfort.com/api/trpc/auth.me
```

### Test 2: Check DNS
```bash
nslookup sous.projcomfort.com
# Should return an IP address
```

### Test 3: Check SSL
```bash
openssl s_client -connect sous.projcomfort.com:443 -servername sous.projcomfort.com
# Look for "Verify return code: 0 (ok)"
```

### Test 4: TestFlight Logging

Add console logs to see what's happening in TestFlight:

**File: mobile/src/contexts/AuthContext.tsx (line 107-109)**
```typescript
const { getBaseUrl } = await import("../api/client");
const baseUrl = getBaseUrl();
console.log("[Auth] Production URL:", baseUrl);
console.log("[Auth] Environment:", __DEV__ ? "development" : "production");
console.log("[Auth] Attempting to fetch user from:", `${baseUrl}/api/trpc/auth.me`);
```

Then check TestFlight logs:
- Open TestFlight app
- Tap your app
- Go to "Previous Builds"
- View crash logs or console output

## 📋 Debugging Checklist

Run through this checklist:

### Server Side:
- [ ] Server is deployed to production
- [ ] Server is accessible at `https://sous.projcomfort.com`
- [ ] `/api/health` endpoint returns 200 OK
- [ ] `/api/trpc` endpoint returns CORS headers
- [ ] SSL certificate is valid and trusted
- [ ] Environment variables are set (.env.local)
- [ ] Database connection works in production
- [ ] CORS allows Authorization header

### Mobile Side:
- [ ] Built with production profile: `eas build --platform ios --profile production`
- [ ] app.json has `EXPO_PUBLIC_API_URL: "https://sous.projcomfort.com"`
- [ ] TestFlight build is not in development mode
- [ ] Network permissions are enabled in iOS
- [ ] App can reach internet (test with other apps)

### DNS & SSL:
- [ ] `nslookup sous.projcomfort.com` resolves to correct IP
- [ ] `curl https://sous.projcomfort.com` doesn't show SSL errors
- [ ] Certificate is from trusted CA (not self-signed)
- [ ] Certificate matches exact domain name

## 🎯 Quick Fix (If Server is Down)

If your server isn't deployed yet, you have two options:

### Option A: Deploy Server First
1. Deploy your Node.js server to a hosting provider:
   - Vercel (recommended for Next.js/Express)
   - Railway
   - Render
   - AWS/GCP/Azure

2. Configure domain:
   - Point `sous.projcomfort.com` to server IP
   - Enable SSL/HTTPS
   - Verify with curl

3. Rebuild mobile app after server is live

### Option B: Temporary - Use Email Login Without Server
For immediate TestFlight testing, you could add offline mode:

**File: mobile/src/contexts/AuthContext.tsx**
```typescript
const login = async (openId: string) => {
  try {
    setIsLoading(true);
    await SecureStore.setItemAsync("auth_token", openId);

    // Try to fetch user from server
    try {
      const userData = await trpcClient.auth.me.query();
      // ... existing code
    } catch (error) {
      // FALLBACK: Create local user for offline testing
      console.warn("[Auth] Server unreachable, using offline mode");
      const offlineUser: AuthUser = {
        id: 1,
        openId: openId,
        name: openId.split('@')[0],
        email: openId,
        role: "user",
      };
      setUser(offlineUser);
      return; // Skip server validation
    }
  } finally {
    setIsLoading(false);
  }
};
```

⚠️ **Warning:** This is only for testing! Remove before production release.

## 🚀 Next Steps

1. **Verify server is running:**
   ```bash
   curl https://sous.projcomfort.com/api/health
   ```

2. **If server is down:** Deploy it first (see Option A above)

3. **If server is up but not accessible:** Check DNS, SSL, firewall

4. **If server is accessible:** Add health check endpoint and rebuild app

5. **Test in TestFlight:** Install new build and check console logs

## 📝 Summary

The authentication flow is working correctly in code. The issue is **network connectivity** between your TestFlight app and the production server at `https://sous.projcomfort.com`.

**Most likely cause:** Server is not deployed or not accessible at that URL.

**Immediate action:** Verify the server is running and accessible with:
```bash
curl -v https://sous.projcomfort.com/api/trpc
```

If this fails, deploy your server first before testing the mobile app.
