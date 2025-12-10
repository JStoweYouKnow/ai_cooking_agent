# Build and Submit Guide - Phases 5-8

Complete guide for building and submitting your app to the App Store.

---

## Phase 5: Build for App Store

### Prerequisites Checklist

Before building, ensure:

- [ ] Apple Developer account is active ($99/year)
- [ ] App ID created in Apple Developer Portal (`com.aicookingagent.app`)
- [ ] App created in App Store Connect
- [ ] EAS project initialized (`eas init` completed)
- [ ] `app.json` has correct bundle identifier
- [ ] `eas.json` is configured (already done ✅)

### Step 1: Verify Configuration

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile

# Check app.json
cat app.json | grep -A 2 "bundleIdentifier"

# Should show: "bundleIdentifier": "com.aicookingagent.app"
```

### Step 2: Login to EAS (if not already)

```bash
eas login
```

Enter your Expo credentials.

### Step 3: Check EAS Project Status

```bash
eas project:info
```

This shows your project details and confirms everything is linked.

### Step 4: Run Production Build

```bash
eas build --platform ios --profile production
```

**What happens:**
1. EAS will prompt for Apple ID credentials (first time only)
2. Automatically generates certificates and provisioning profiles
3. Builds your app in the cloud (~15-20 minutes)
4. Provides download link when complete

**First Time Setup:**
- You'll be asked for your Apple ID email
- You'll be asked for your Apple ID password (or app-specific password)
- EAS will handle certificate generation automatically

**Build Process:**
- Uploads your code to EAS servers
- Installs dependencies
- Compiles native iOS code
- Creates `.ipa` file
- Signs with your certificates

### Step 5: Monitor Build Progress

```bash
# Check build status
eas build:list

# View specific build details
eas build:view [build-id]
```

You can also monitor at: https://expo.dev/accounts/[your-account]/projects/[project-slug]/builds

### Step 6: Download Build (Optional)

When build completes, you'll see:
```
✔ Build finished
Download URL: https://expo.dev/artifacts/...
```

You can download the `.ipa` file, but you don't need to if using automatic submission.

---

## Phase 6: Submit to App Store

### Option A: Automatic Submission (Recommended)

**Before submitting, update `eas.json` with your App Store Connect details:**

1. Get your **App Store Connect App ID**:
   - Go to https://appstoreconnect.apple.com/
   - **My Apps** → Select "Sous"
   - The App ID is in the URL or under **App Information**

2. Get your **Apple Team ID**:
   - Go to https://developer.apple.com/account/
   - **Membership** tab
   - Your Team ID is displayed (10 characters)

3. Update `eas.json`:
   ```json
   "submit": {
     "production": {
       "ios": {
         "appleId": "your-email@example.com",
         "ascAppId": "1234567890",
         "appleTeamId": "ABCD123456"
       }
     }
   }
   ```

4. Submit:
   ```bash
   eas submit --platform ios --profile production --latest
   ```

   The `--latest` flag uses the most recent build.

**What happens:**
- Uploads build to App Store Connect
- Automatically associates with your app
- Build appears in App Store Connect within minutes

### Option B: Manual Submission via App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. **My Apps** → Select "Sous"
3. **TestFlight** tab (or **App Store** tab → **iOS App**)
4. Click **+** next to **Build**
5. Select your uploaded build
6. Click **Done**

---

## Phase 7: Configure App Store Listing

### Step 1: Complete App Information

Go to: https://appstoreconnect.apple.com/ → **My Apps** → **Sous**

#### App Information Tab

1. **Subtitle** (30 char max):
   ```
   Your AI Cooking Assistant
   ```

2. **Category**:
   - **Primary:** Food & Drink
   - **Secondary:** Lifestyle (optional)

3. **Content Rights:**
   - Answer questions about content ownership
   - Usually: "Yes, I own or have rights to all content"

4. **Privacy Policy URL:**
   - `https://project-comfort-website.vercel.app/privacy`
   - ✅ Already configured and ready

### Step 2: Upload Screenshots

1. Go to **App Store** tab → **iOS App**
2. Scroll to **Screenshots and App Preview**
3. Upload screenshots for each device size:

   **6.7" Display (iPhone 14 Pro Max, 15 Pro Max)**
   - Required: 3-10 screenshots
   - Size: 1290 x 2796 pixels
   - Upload your screenshots from `screenshots/6.7-inch/`

   **6.5" Display (iPhone 11 Pro Max, XS Max)**
   - Required: 3-10 screenshots
   - Size: 1242 x 2688 pixels
   - Upload from `screenshots/6.5-inch/`

   **5.5" Display (iPhone 8 Plus)**
   - Required: 3-10 screenshots
   - Size: 1242 x 2208 pixels
   - Upload from `screenshots/5.5-inch/`

**Tip:** You can use the same screenshots for all sizes, just ensure they're the correct dimensions.

### Step 3: Add App Preview Video (Optional)

1. Same section as screenshots
2. Upload 15-30 second video
3. Showcase main features
4. MP4 format, same dimensions as screenshots

### Step 4: Set Version Information

1. **Version:** 1.0.0
2. **Copyright:** © 2025 [Your Name/Company]
3. **Description:** Copy from `APP_STORE_TEXT_ASSETS.md`
4. **Keywords:** Copy from `APP_STORE_TEXT_ASSETS.md` (100 char max)
5. **Promotional Text:** Copy from `APP_STORE_TEXT_ASSETS.md` (170 char max)
6. **Support URL:** `https://project-comfort-website.vercel.app/support`
7. **Marketing URL:** Your website (optional)

### Step 5: Add Build

1. **App Store** tab → Scroll to **Build** section
2. Click **+** next to **Build**
3. Select your uploaded build (from Phase 6)
4. Click **Done**

**Note:** Build may take a few minutes to appear after submission.

### Step 6: Complete Age Rating

1. Click **Edit** next to **Age Rating**
2. Answer questions about content:
   - Violence: No
   - Profanity: No
   - Sexual content: No
   - Gambling: No
   - Unrestricted web access: No
   - etc.
3. Expected rating: **4+**
4. Click **Save**

### Step 7: Set Pricing

1. **Pricing and Availability** tab
2. **Price:** Select "Free" (or set price)
3. **Availability:** All countries (or select specific)
4. **Discounts:** None (for first release)
5. Click **Save**

---

## Phase 8: Submit for Review

### Pre-Submission Checklist

Before clicking "Submit for Review", verify:

- [ ] All required screenshots uploaded (minimum 3 per device size)
- [ ] App description is complete and accurate
- [ ] Keywords are added
- [ ] Privacy policy URL is live and accessible
- [ ] Support URL is live and accessible
- [ ] Build is attached to version
- [ ] Age rating is complete
- [ ] Pricing is set
- [ ] App tested on real iOS device
- [ ] All features work correctly
- [ ] No placeholder text or "coming soon" features
- [ ] App icon is correct (1024x1024)
- [ ] Bundle ID matches Apple Developer account

### Step 1: Export Compliance

1. **App Store** tab → Scroll to **App Review Information**
2. **Export Compliance** section:
   - **Question:** "Does your app use encryption?"
   - **Answer:** Yes
   - **Details:** Select "No, encryption is limited to standard encryption" (HTTPS/TLS)

### Step 2: Advertising Identifier (IDFA)

1. Same section
2. **Question:** "Does your app use the Advertising Identifier (IDFA)?"
3. **Answer:** No (unless you're using analytics that require it)

### Step 3: App Review Information

Fill in:
- **Contact Information:** Your email/phone
- **Demo Account:** If app requires login, provide test credentials
- **Notes:** Any special instructions for reviewers

### Step 4: Submit for Review

1. **App Store** tab
2. Click **Submit for Review** (top right, blue button)
3. Review all information
4. Confirm submission

**What happens:**
- Status changes to "Waiting for Review"
- You'll receive email confirmation
- Review typically takes 24-48 hours
- You'll receive email when status changes

---

## Monitoring Review Status

### Check Status

1. Go to App Store Connect
2. **My Apps** → **Sous**
3. Status is shown at the top:
   - **Waiting for Review** - In queue
   - **In Review** - Being reviewed
   - **Pending Developer Release** - Approved, waiting for you
   - **Ready for Sale** - Live on App Store
   - **Rejected** - Needs fixes

### Email Notifications

You'll receive emails for:
- Submission confirmation
- Review started
- Approval/rejection
- Status changes

---

## If Your App is Rejected

### Common Rejection Reasons

1. **Missing Privacy Policy**
   - Ensure URL is live and accessible
   - Policy must cover all data collection

2. **Incomplete Functionality**
   - All features must work
   - No broken links or "coming soon" features

3. **Poor User Experience**
   - App must work on all device sizes
   - No crashes or freezes

4. **Missing Permissions Description**
   - Already handled in `app.json` ✅

5. **Misleading Screenshots**
   - Screenshots must match current app version
   - No mock data that looks fake

### How to Fix and Resubmit

1. **Read rejection message carefully**
   - Apple provides specific reasons
   - Note what needs to be fixed

2. **Fix the issues**
   - Update app if needed
   - Rebuild: `eas build --platform ios --profile production`
   - Update screenshots if UI changed

3. **Resubmit**
   - Go to App Store Connect
   - Update version/build if needed
   - Click **Submit for Review** again
   - Add notes explaining fixes in "Notes" field

---

## After Approval

### App Goes Live

1. **Automatic Release:**
   - App goes live immediately after approval
   - Or on date you specified

2. **Manual Release:**
   - You control when to release
   - Click **Release This Version** in App Store Connect

### Post-Launch Checklist

- [ ] Test download on real device
- [ ] Verify all features work in production
- [ ] Monitor App Store Connect analytics
- [ ] Respond to user reviews
- [ ] Share on social media
- [ ] Update website with App Store link

---

## Quick Command Reference

```bash
# Login to EAS
eas login

# Check project info
eas project:info

# Build for production
eas build --platform ios --profile production

# Check build status
eas build:list

# Submit to App Store
eas submit --platform ios --profile production --latest

# View build details
eas build:view [build-id]
```

---

## Timeline

| Step | Duration |
|------|----------|
| Build | 15-20 minutes |
| Upload to App Store Connect | 2-5 minutes |
| Configure listing | 30-60 minutes |
| Submit for review | 5 minutes |
| **Apple Review** | **24-48 hours** |
| **Total** | **1-3 days** |

---

## Troubleshooting

### Build Fails

```bash
# Check build logs
eas build:view [build-id]

# Common issues:
# - Missing dependencies
# - Incompatible versions
# - Certificate issues

# Fix: Run locally first
npx expo-doctor
npx expo install --fix
```

### Submission Fails

- Check `eas.json` has correct App Store Connect IDs
- Verify Apple ID credentials
- Ensure app exists in App Store Connect
- Check build is complete before submitting

### Build Not Appearing in App Store Connect

- Wait 5-10 minutes after submission
- Check spam folder for emails
- Verify App Store Connect app ID matches `eas.json`

---

## Next Steps After Launch

1. **Monitor Analytics** - App Store Connect provides download stats
2. **Respond to Reviews** - Engage with users
3. **Plan Updates** - Collect feedback for v1.1.0
4. **Marketing** - Share on social media, website, etc.

**Congratulations! Your app is on the App Store! 🎉**

