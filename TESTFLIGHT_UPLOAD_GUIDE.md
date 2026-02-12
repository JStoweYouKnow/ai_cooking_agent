# TestFlight Upload Guide

## Prerequisites

✅ **EAS CLI Installed**
```bash
npm install -g eas-cli
```

✅ **Logged into EAS**
```bash
eas login
```

✅ **Apple Developer Account**
- App Store Connect access
- Apple Team ID: `4GG5889HS8`
- App Store Connect App ID: `6755921222`

✅ **Configuration Verified**
- Bundle ID: `com.aicookingagent.app`
- Current Version: `1.0.2`
- Current Build: `4` (will auto-increment)

---

## Step 1: Update Build Number (Optional)

The build number will auto-increment, but you can manually set it in `app.json`:

```json
"ios": {
  "buildNumber": "5"  // Increment this
}
```

---

## Step 2: Build for Production

Navigate to the mobile directory and build:

```bash
cd mobile
eas build --platform ios --profile production
```

**What happens:**
- EAS builds your app in the cloud
- Build takes ~15-30 minutes
- You'll get a build URL to track progress
- Build will be automatically uploaded to App Store Connect

**Options during build:**
- You can answer prompts about:
  - Apple credentials (if not already configured)
  - Distribution certificate (auto-managed by EAS)
  - Provisioning profile (auto-managed by EAS)

---

## Step 3: Submit to TestFlight

Once the build completes, submit it:

```bash
eas submit --platform ios --profile production
```

**What happens:**
- EAS submits the build to App Store Connect
- Build appears in TestFlight within a few minutes
- You can add testers and groups in App Store Connect

**Alternative:** Use the npm script:
```bash
npm run submit:ios
```

---

## Step 4: Configure TestFlight in App Store Connect

1. **Go to App Store Connect**
   - https://appstoreconnect.apple.com
   - Navigate to your app (Sous)

2. **Add TestFlight Information**
   - Build will appear under "TestFlight" tab
   - Add "What to Test" notes (optional but recommended)
   - Example:
     ```
     New Features in This Build:
     - AI "Cook with What You Have" Generator
     - Voice-Controlled Cooking Mode
     - Smart Ingredient Substitutions
     - AI Meal Planning
     - AR Ingredient Recognition
     ```

3. **Add Testers**
   - **Internal Testers:** Up to 100 (immediate access)
   - **External Testers:** Up to 10,000 (requires App Review)
   - Create groups for organized testing

4. **Submit for External Testing (Optional)**
   - If you want external testers, submit for review
   - Review takes 24-48 hours typically
   - Once approved, external testers can access

---

## Quick Commands Reference

```bash
# Build and submit in one go (after first build)
cd mobile
eas build --platform ios --profile production --auto-submit

# Or build first, then submit separately
eas build --platform ios --profile production
eas submit --platform ios --profile production

# Check build status
eas build:list --platform ios

# View build logs
eas build:view [BUILD_ID]
```

---

## Troubleshooting

### Build Fails

**Issue:** Build fails with certificate errors
**Solution:**
```bash
eas credentials
# Select iOS → Production → Manage credentials
# Let EAS auto-manage certificates
```

**Issue:** Build fails with missing dependencies
**Solution:**
```bash
cd mobile
pnpm install
# Ensure all dependencies are installed
```

### Submit Fails

**Issue:** "No builds found"
**Solution:**
- Wait a few minutes after build completes
- Check build status: `eas build:list`
- Ensure build status is "finished"

**Issue:** "Invalid credentials"
**Solution:**
```bash
eas credentials
# Re-authenticate with Apple
```

### TestFlight Not Showing Build

**Issue:** Build submitted but not visible
**Solution:**
- Wait 5-10 minutes (App Store Connect sync delay)
- Check App Store Connect → TestFlight → Builds
- Ensure build processing completed (green checkmark)

---

## Current Configuration

**EAS Project ID:** `65457bbb-9885-45f1-9ea5-93923d0a9e76`  
**Bundle Identifier:** `com.aicookingagent.app`  
**App Store Connect App ID:** `6755921222`  
**Apple Team ID:** `4GG5889HS8`  

**Production Environment Variables:**
- `EXPO_PUBLIC_API_URL`: `https://sous.projcomfort.com`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`: `test_fYZZtsLRwNUpgiMAEYgDgicLZTO`
- Stripe price IDs configured

---

## Pre-Upload Checklist

- [ ] All new features tested locally
- [ ] App version updated in `app.json` (if needed)
- [ ] Camera permissions added for expo-camera
- [ ] Production environment variables verified
- [ ] RevenueCat API key is production (not test)
- [ ] App Store Connect app created
- [ ] EAS CLI installed and logged in
- [ ] Apple Developer account active

---

## Post-Upload Steps

1. **Monitor Build Processing**
   - Check App Store Connect for processing status
   - Usually completes in 5-15 minutes

2. **Add Test Information**
   - Fill in "What to Test" section
   - Add screenshots/videos if helpful

3. **Invite Testers**
   - Add internal testers immediately
   - Submit for external testing if needed

4. **Monitor Feedback**
   - Check TestFlight feedback
   - Monitor crash reports
   - Review analytics

---

## Notes

- **Build Time:** ~15-30 minutes
- **Processing Time:** ~5-15 minutes after upload
- **External Review:** 24-48 hours (if submitting for external testing)
- **Build Expiration:** TestFlight builds expire after 90 days

---

## Next Steps After TestFlight

1. Collect feedback from testers
2. Fix any critical issues
3. Prepare for App Store submission
4. Update version number for next release
5. Submit for App Review when ready

---

## Support

If you encounter issues:
- Check EAS build logs: `eas build:view [BUILD_ID]`
- Check App Store Connect for processing errors
- Review EAS documentation: https://docs.expo.dev/build/introduction/
- Check Expo forums: https://forums.expo.dev/
