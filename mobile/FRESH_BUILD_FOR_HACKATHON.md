# Fresh Xcode Build for Hackathon TestFlight Submission

## Quick Start

```bash
cd mobile

# 1. Set RevenueCat API key as EAS environment variable (if not already set)
eas env:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value sk_JieatuPCUueahYjhdYeMXgsXZcput --environment production

# 2. Build for production
eas build --platform ios --profile production

# 3. Once build completes, submit to TestFlight
eas submit --platform ios --profile production
```

## Pre-Build Checklist

- [x] Build number incremented to 5 in `app.json`
- [x] RevenueCat API key added to `mobile/.env`
- [ ] RevenueCat API key set as EAS secret (run command above)
- [x] Production environment variables configured in `eas.json`
- [x] App Store Connect App ID configured: `6755921222`
- [x] Apple Team ID configured: `4GG5889HS8`
- [x] Bundle ID: `com.aicookingagent.app`
- [x] Version: `1.0.2`

## Step-by-Step Build Process

### Step 1: Verify EAS Login
```bash
eas whoami
```
If not logged in:
```bash
eas login
```

### Step 2: Set Production Environment Variables
```bash
# Set RevenueCat API key (required for production builds)
eas env:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value sk_JieatuPCUueahYjhdYeMXgsXZcput --environment production
```

**Or use the automated script:**
```bash
./build-for-testflight.sh
```

### Step 3: Clean Build (Optional but Recommended)
```bash
# Clear any cached builds
eas build:cancel --all
```

### Step 4: Start Production Build
```bash
cd mobile
eas build --platform ios --profile production
```

**What to expect:**
- Build will take 15-30 minutes
- You'll get a build URL to track progress
- EAS will handle certificates and provisioning automatically
- Build will be automatically uploaded to App Store Connect

### Step 5: Monitor Build Progress
```bash
# Check build status
eas build:list --platform ios

# View build logs (replace BUILD_ID with actual ID)
eas build:view [BUILD_ID]
```

### Step 6: Submit to TestFlight
Once build status shows "finished":

```bash
eas submit --platform ios --profile production
```

**Alternative:** Build and submit in one command:
```bash
eas build --platform ios --profile production --auto-submit
```

## Configuration Summary

**Current Build Configuration:**
- **Version:** 1.0.2
- **Build Number:** 5 (auto-increments in future builds)
- **Bundle ID:** com.aicookingagent.app
- **EAS Project ID:** 65457bbb-9885-45f1-9ea5-93923d0a9e76

**Environment Variables (Production):**
- `EXPO_PUBLIC_API_URL`: https://sous.projcomfort.com
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`: sk_JieatuPCUueahYjhdYeMXgsXZcput
- All Stripe price IDs configured

**App Store Connect:**
- **App ID:** 6755921222
- **Apple Team ID:** 4GG5889HS8

## Troubleshooting

### Build Fails - Missing Credentials
```bash
eas credentials
# Select iOS → Production → Manage credentials
# Choose "Set up credentials automatically"
```

### Build Fails - Environment Variable Missing
```bash
# Verify environment variable is set
eas env:list --scope project --environment production

# If missing, create it:
eas env:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value sk_JieatuPCUueahYjhdYeMXgsXZcput --environment production
```

### Submit Fails - No Build Found
- Wait 2-3 minutes after build completes
- Check build status: `eas build:list --platform ios`
- Ensure build status is "finished" before submitting

### TestFlight Not Showing Build
- Wait 5-10 minutes (App Store Connect sync delay)
- Check App Store Connect → TestFlight → Builds
- Ensure build processing completed (green checkmark)

## Post-Build Steps

1. **Monitor Build Processing**
   - Go to App Store Connect: https://appstoreconnect.apple.com
   - Navigate to your app → TestFlight
   - Wait for build to finish processing (5-15 minutes)

2. **Add Test Information**
   - Click on the build
   - Add "What to Test" notes:
     ```
     Hackathon Submission Build - Key Features:
     - AI-powered recipe generation from pantry ingredients
     - Voice-controlled cooking mode
     - Smart ingredient substitutions
     - AR ingredient recognition
     - Meal planning with AI
     - Shopping list generation
     ```

3. **Add Internal Testers**
   - Go to TestFlight → Internal Testing
   - Add testers (up to 100 internal testers)
   - They'll get immediate access

4. **Submit for External Testing (if needed)**
   - Go to TestFlight → External Testing
   - Create a new group or use existing
   - Add the build
   - Submit for review (24-48 hours)

## Quick Reference Commands

```bash
# Build only
eas build --platform ios --profile production

# Build and auto-submit
eas build --platform ios --profile production --auto-submit

# Submit existing build
eas submit --platform ios --profile production

# Check build status
eas build:list --platform ios

# View build logs
eas build:view [BUILD_ID]

# Manage environment variables
eas env:list --scope project --environment production
eas env:create --scope project --name KEY_NAME --value VALUE --environment production

# Check credentials
eas credentials
```

## Notes

- **Build Time:** ~15-30 minutes
- **Processing Time:** ~5-15 minutes after upload
- **External Review:** 24-48 hours (if submitting for external testing)
- **Build Expiration:** TestFlight builds expire after 90 days
- **Auto-increment:** Build number will auto-increment in future builds (currently set to 5)

## Support

If you encounter issues:
- Check EAS build logs: `eas build:view [BUILD_ID]`
- Check App Store Connect for processing errors
- Review EAS documentation: https://docs.expo.dev/build/introduction/
- Check Expo forums: https://forums.expo.dev/
