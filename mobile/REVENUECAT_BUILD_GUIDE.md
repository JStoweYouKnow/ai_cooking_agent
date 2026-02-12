# RevenueCat Integration - Build Requirements

## Quick Answer

**For Production: YES, you need a new build**  
**For Development/Testing: You can use OTA updates (but new build recommended)**

---

## Analysis

### What Changed?

The RevenueCat integration includes:

1. ✅ **JavaScript/TypeScript Code Changes** (can use OTA updates):
   - `src/services/revenueCat.ts` - Service layer
   - `src/contexts/RevenueCatContext.tsx` - Context provider
   - `src/screens/Settings/SubscriptionScreen.tsx` - UI integration
   - `App.tsx` - Provider integration

2. ✅ **Native Module** (already installed):
   - `react-native-purchases` is already in `package.json`
   - No new native dependencies added

3. ✅ **Configuration** (already set):
   - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` in `app.json`
   - No app.json changes needed

### Can You Use OTA Updates?

**Technically: YES** ✅
- All changes are JavaScript/TypeScript code
- Native module (`react-native-purchases`) is already installed
- Your app has `expo-updates` configured

**However: NOT RECOMMENDED for Production** ⚠️

---

## Recommendations

### Option 1: New Build (Recommended for Production) ✅

**Why:**
- ✅ Full testing of native module integration
- ✅ App Store compliance (IAP changes should be reviewed)
- ✅ More reliable than OTA updates
- ✅ Better user experience (no update delays)
- ✅ Ensures native modules are properly linked

**Steps:**
```bash
cd mobile

# 1. Update version/build number in app.json
# Version: 1.0.1 → 1.0.2 (or 1.1.0)
# Build: 3 → 4

# 2. Build for production
eas build --platform ios --profile production

# 3. Submit to App Store
eas submit --platform ios --profile production
```

### Option 2: OTA Update (Development Only) ⚠️

**Use only if:**
- Testing in development/preview builds
- You've already tested the integration thoroughly
- You're comfortable with potential update failures

**Steps:**
```bash
cd mobile

# 1. Publish update
eas update --branch production --message "Add RevenueCat integration"

# 2. Users will get the update automatically (if configured)
```

**Risks:**
- ⚠️ OTA updates can fail silently
- ⚠️ Users may not get the update immediately
- ⚠️ Harder to debug if issues occur
- ⚠️ App Store may flag IAP changes without review

---

## Build Checklist

Before building, ensure:

- [ ] **Database migration** is run on production database
- [ ] **Webhook secret** is set in production environment
- [ ] **Production API key** replaces test key in `app.json`
- [ ] **Version bumped** in `app.json`:
  ```json
  {
    "version": "1.0.2",  // or 1.1.0
    "ios": {
      "buildNumber": "4"  // increment
    }
  }
  ```
- [ ] **RevenueCat dashboard** is configured:
  - Entitlements created
  - Products linked
  - Webhook URL set
- [ ] **Tested locally** with development build

---

## Step-by-Step: New Production Build

### 1. Update Version

Edit `mobile/app.json`:
```json
{
  "expo": {
    "version": "1.0.2",  // Increment version
    "ios": {
      "buildNumber": "4"  // Increment build number
    }
  }
}
```

### 2. Update Production API Key

Replace the test key in `app.json`:
```json
{
  "extra": {
    "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY": "appl_YOUR_PRODUCTION_KEY_HERE"
  }
}
```

### 3. Build

```bash
cd mobile
eas build --platform ios --profile production
```

This will:
- Build on EAS servers (takes ~15-20 minutes)
- Generate an `.ipa` file
- Make it available for download/submission

### 4. Test the Build

Before submitting:
- Download the build from EAS dashboard
- Install on a test device
- Test RevenueCat purchase flow
- Verify webhook receives events

### 5. Submit to App Store

```bash
eas submit --platform ios --profile production
```

Or manually:
1. Download `.ipa` from EAS dashboard
2. Upload via App Store Connect
3. Fill out submission details
4. Submit for review

---

## Testing Before Build

### Local Development Build

Test locally first:

```bash
cd mobile

# Development build (simulator)
eas build --platform ios --profile development

# Or run locally
npm run ios
```

### Test Checklist

- [ ] RevenueCat initializes on login
- [ ] Subscription screen shows iOS products
- [ ] Purchase flow works (sandbox)
- [ ] Restore purchases works
- [ ] Webhook receives events
- [ ] Subscription status updates correctly

---

## OTA Update Alternative (If You Must)

If you absolutely need to deploy via OTA:

```bash
cd mobile

# 1. Ensure you're on the right branch
git checkout main  # or your production branch

# 2. Publish update
eas update --branch production --message "RevenueCat integration"

# 3. Monitor update status
eas update:list --branch production
```

**Important Notes:**
- ⚠️ Only works if users have a build that supports updates
- ⚠️ Users need to restart app to get update
- ⚠️ Not recommended for IAP changes
- ⚠️ May cause issues with App Store review

---

## Summary

| Scenario | Build Required? | Why |
|----------|----------------|-----|
| **Production Release** | ✅ **YES** | IAP changes, reliability, App Store compliance |
| **Development Testing** | ⚠️ **Recommended** | Better testing, native module verification |
| **Quick Fix/Update** | ❌ **OTA OK** | Only for non-critical JS changes |
| **IAP Integration** | ✅ **YES** | Always use new build for IAP changes |

---

## Next Steps

1. ✅ **Run database migration** (if not done)
2. ✅ **Update production API key** in `app.json`
3. ✅ **Bump version** in `app.json`
4. ✅ **Test locally** with development build
5. ✅ **Build production** with EAS
6. ✅ **Test production build** before submitting
7. ✅ **Submit to App Store**

---

## Questions?

- **Q: Can I test RevenueCat without a new build?**  
  A: Yes, in development builds. Use `expo run:ios` or development EAS build.

- **Q: Will OTA updates work?**  
  A: Technically yes, but not recommended for IAP changes. Use a new build.

- **Q: How long does a build take?**  
  A: ~15-20 minutes on EAS servers.

- **Q: Do I need to update the Android build?**  
  A: No, RevenueCat is iOS-only. Android uses Stripe.
