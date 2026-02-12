# Demo Mode for Hackathon Judging

Demo mode enables judges to test all app features without signing up or purchasing a subscription.

## What Demo Mode Does

- **Auto-login**: Signs in as demo user (`demo@sous.app`) on launch
- **Premium unlocked**: All premium features (meal planning, URL imports, AI recipe generation, etc.) are available
- **Banner**: "Demo Mode — All features unlocked" shown at the top of the app

## Building the Demo App

Use the `demo` EAS build profile:

```bash
cd mobile
eas build --profile demo --platform ios
```

This produces an internal/distribution build (installable via TestFlight or direct install) with demo mode enabled.

## Testing Demo Mode Locally

Set the env var before starting:

```bash
EXPO_PUBLIC_DEMO_MODE=true pnpm exec expo start
```

Or add to `mobile/.env`:

```
EXPO_PUBLIC_DEMO_MODE=true
```

## Demo User

The demo user is created on the server the first time the app connects. All judges share the same demo account, so any data they add (recipes, shopping lists, etc.) will be visible to other judges. For a clean experience each time, consider resetting demo user data between judging sessions, or creating separate demo accounts per judge.

---

## Alternative: Dev + Judge Accounts (Server-Side)

If judges or you (the dev) sign in with real OAuth accounts and want all features unlocked without demo mode:

1. **Owner gets premium**: Set `OWNER_OPEN_ID` to your dev account's OpenID (usually your email). You automatically get premium.

2. **Judge accounts**: Add their OpenIDs to `HACKATHON_PREMIUM_OPEN_IDS` in `.env` or production env vars:
   ```
   HACKATHON_PREMIUM_OPEN_IDS=judge1@example.com,judge2@example.com
   ```

3. The server treats these accounts as premium: meal planning, URL import, AI recipe generation, etc., all work without a subscription.
