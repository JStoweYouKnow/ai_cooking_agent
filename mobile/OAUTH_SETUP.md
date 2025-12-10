# OAuth Setup for Mobile App

## Overview

The mobile app now supports OAuth authentication, matching the web app's authentication flow. This ensures both apps use the same user accounts and share the same recipe data.

## Configuration

Set these environment variables in your `.env` file or Expo config:

```bash
EXPO_PUBLIC_OAUTH_PORTAL_URL=https://your-oauth-portal-url.com
EXPO_PUBLIC_APP_ID=your-app-id
EXPO_PUBLIC_API_URL=https://sous.projcomfort.com  # Your production backend URL
```

## How It Works

1. **OAuth Flow**: When users tap "Sign In with OAuth", the app opens a browser to the OAuth portal
2. **Server Callback**: After OAuth completes, the server's `/api/oauth/mobile-callback` endpoint receives the OAuth code
3. **Session Token**: The server exchanges the code for user info and returns a JWT session token
4. **Authentication**: The mobile app stores the session token and uses it for all API requests

## Current Implementation Status

✅ **Completed:**
- OAuth login button in LoginScreen
- Server mobile callback endpoint (`/api/oauth/mobile-callback`)
- Session token verification in Bearer token authentication
- OAuth utility functions

⚠️ **Limitation:**
The current implementation opens OAuth in a browser but cannot automatically capture the session token from the callback. This is because:
- The browser redirects to the server callback URL
- The server returns JSON, but the browser doesn't communicate back to the app

## Workarounds

### Option 1: Use Email Login (Recommended for now)
If you've logged in via OAuth on the web app, you can use the same email address in the mobile app. The mobile app will match your account if:
- The email matches your OAuth account's email
- Both apps point to the same backend server

### Option 2: Deep Linking (Future Enhancement)
To fully automate OAuth callback handling, implement deep linking:
1. Configure a custom URL scheme (e.g., `sous://oauth/callback`)
2. Update the OAuth redirect URI to use the deep link
3. Handle the deep link in the app to capture the session token

### Option 3: Use expo-auth-session (Future Enhancement)
Replace `expo-web-browser` with `expo-auth-session` which handles the full OAuth flow including callbacks automatically.

## Testing

1. Make sure your backend server is running
2. Set the environment variables
3. Open the mobile app and tap "Sign In with OAuth"
4. Complete the OAuth flow in the browser
5. After OAuth completes, use email login with your OAuth email to access your account

## Server Changes

The server now:
- Accepts Bearer tokens that are JWT session tokens (from OAuth)
- Falls back to treating Bearer tokens as openId (for email-based login)
- Has a mobile-specific callback endpoint that returns JSON instead of setting cookies

## Next Steps

To complete the OAuth flow:
1. Implement deep linking for OAuth callback
2. Or migrate to `expo-auth-session` for automatic callback handling
3. Test the full flow end-to-end



