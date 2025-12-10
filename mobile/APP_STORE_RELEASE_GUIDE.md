# App Store Release Guide - Sous Mobile App

Complete step-by-step guide to release your app on the Apple App Store.

---

## 📋 Prerequisites Checklist

Before you start, ensure you have:

- [ ] **Apple Developer Account** ($99/year)
  - Sign up at: https://developer.apple.com/programs/
  - Takes 24-48 hours for approval

- [ ] **Mac with Xcode** (Required for iOS builds)
  - Download from Mac App Store
  - Install Command Line Tools

- [ ] **Expo Account** (Free)
  - Sign up at: https://expo.dev/signup
  - Needed for EAS Build

- [ ] **Valid Apple ID** (for App Store Connect)

- [ ] **App Assets Ready**
  - App icon (1024x1024px)
  - Screenshots (required sizes)
  - Privacy policy URL
  - App description

---

## Phase 1: Apple Developer Setup (One-Time)

### Step 1: Join Apple Developer Program

1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with your Apple ID
3. Complete enrollment ($99/year)
4. Wait for approval (24-48 hours typically)

### Step 2: Create App ID & Certificates

1. Go to https://developer.apple.com/account/
2. **Certificates, Identifiers & Profiles** → **Identifiers**
3. Click **+** to create new App ID
   - **Description:** Sous - AI Cooking Assistant
   - **Bundle ID:** `com.aicookingagent.app` (matches app.json)
   - **Capabilities:** Enable what you need (Camera, Photo Library, etc.)
4. Click **Continue** → **Register**

### Step 3: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. Click **My Apps** → **+** → **New App**
3. Fill in details:
   - **Platform:** iOS
   - **Name:** Sous (or your preferred name)
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** Select `com.aicookingagent.app`
   - **SKU:** `sous-app-001` (any unique identifier)
   - **User Access:** Full Access
4. Click **Create**

---

## Phase 2: Expo EAS Setup

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile
eas login
```

Enter your Expo credentials.

### Step 3: Configure EAS Project

```bash
eas init
```

This will:
- Create an EAS project
- Update `app.json` with your project ID
- Link to your Expo account

### Step 4: Create EAS Build Configuration

Create `eas.json` in the mobile directory:

```bash
eas build:configure
```

This creates `eas.json` with build profiles.

---

## Phase 3: Prepare App Assets

> **📋 Quick Reference:** See `SCREENSHOT_CAPTURE_GUIDE.md` for detailed screenshot instructions and `APP_STORE_TEXT_ASSETS.md` for all text content ready to copy/paste.

### Required Assets

#### 1. App Icon (1024x1024px)
- **Location:** `mobile/assets/icon.png`
- **Format:** PNG, no transparency
- **Current:** ✅ Already have (verified 1024x1024)

#### 2. Splash Screen
- **Location:** `mobile/assets/splash-icon.png`
- **Current:** ✅ Already configured

#### 3. App Screenshots (Required for App Store)

You'll need screenshots for:
- **6.7" Display (iPhone 14 Pro Max)** - 1290 x 2796 pixels (3-10 images)
- **6.5" Display (iPhone 11 Pro Max)** - 1242 x 2688 pixels (3-10 images)
- **5.5" Display (iPhone 8 Plus)** - 1242 x 2208 pixels (3-10 images)

**How to capture:**
1. Use iOS Simulator (included with Xcode)
2. Or use real device and upload via Xcode
3. Or use tools like https://www.screely.com/

**Recommended screenshots:**
1. Dashboard screen ("Ready, Chef!")
2. Recipe detail screen
3. Ingredients/Pantry screen
4. Shopping list screen
5. AI assistant screen

#### 4. App Preview Video (Optional but recommended)
- 15-30 seconds
- Showcases main features

#### 5. Text Assets

**App Description** (4000 char max):
```
Sous is your personal AI cooking assistant that makes meal planning, recipe management, and grocery shopping effortless.

✨ KEY FEATURES:
• AI-Powered Recommendations: Get personalized recipe suggestions based on your pantry
• Smart Pantry Management: Track ingredients and expiration dates
• Recipe Import: Save recipes from any URL automatically
• Shopping Lists: Generate smart lists from your recipes
• Sous AI: Your 24/7 cooking companion for questions and tips

🍳 PERFECT FOR:
• Home cooks who want to reduce food waste
• Busy professionals planning meals
• Anyone looking to discover new recipes
• Families managing groceries efficiently

📱 ELEGANT DESIGN:
Michelin star-inspired interface with sophisticated animations and intuitive navigation.

Start your culinary journey today! 👨‍🍳
```

**Keywords** (100 char max):
```
cooking,recipes,meal planning,grocery,pantry,AI,assistant,food,chef,shopping
```

**Promotional Text** (170 char max):
```
Your AI sous chef is here! Manage recipes, track ingredients, and plan meals with elegance. Cook smarter, not harder. ✨
```

**Support URL:**
```
https://project-comfort-website.vercel.app/support
```

**Privacy Policy URL** (Required):
```
https://project-comfort-website.vercel.app/privacy
```

**Marketing URL** (Optional):
```
https://project-comfort-website.vercel.app
```

---

## Phase 4: Configure App for Production

> **✅ Status:** Configuration is already complete! `app.json` and `eas.json` are production-ready.

### Step 1: Verify app.json

Your configuration is already correct:

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile
cat app.json
```

Verified:
- ✅ Bundle ID: `com.aicookingagent.app`
- ✅ Version: `1.0.0`
- ✅ Build number: `1`
- ✅ Plugins configured (expo-secure-store, expo-image-picker, etc.)
- ✅ EAS project ID: `65457bbb-9885-45f1-9ea5-93923d0a9e76`

### Step 2: Verify eas.json

Your `eas.json` is already configured for production:

Your `eas.json` includes:
- ✅ Production profile with `distribution: "store"`
- ✅ Auto-increment for build numbers
- ✅ Submit configuration (update with your App Store Connect IDs when ready)

See `BUILD_AND_SUBMIT_GUIDE.md` for detailed instructions on updating submission IDs.

---

## Phase 5: Build for App Store

> **📋 Detailed Guide:** See `BUILD_AND_SUBMIT_GUIDE.md` for complete build and submission instructions.

### Step 1: Run Production Build

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile
eas build --platform ios --profile production
```

This will:
1. Prompt for Apple ID credentials (if first time)
2. Generate certificates automatically
3. Build your app in the cloud (~15-20 minutes)
4. Provide download link when complete

**What happens:**
- EAS builds native iOS binary (.ipa file)
- Automatically handles code signing
- Creates production-ready build

### Step 2: Monitor Build

```bash
# Check build status
eas build:list

# View build details
eas build:view [build-id]
```

When complete, you'll see:
```
✔ Build finished
Download URL: https://expo.dev/artifacts/...
```

Download the `.ipa` file or proceed to automatic submission.

---

## Phase 6: Submit to App Store

> **📋 Detailed Guide:** See `BUILD_AND_SUBMIT_GUIDE.md` for complete submission instructions.

### Option A: Automatic Submission (Recommended)

**First, update `eas.json` with your App Store Connect IDs:**
- `appleId`: Your Apple ID email
- `ascAppId`: From App Store Connect (in URL or App Information)
- `appleTeamId`: From Developer Portal (Membership tab)

Then submit:
```bash
eas submit --platform ios --profile production --latest
```

This will:
1. Upload your build to App Store Connect
2. Automatically fill in build details
3. Build appears in App Store Connect within minutes

### Option B: Manual Submission via App Store Connect

1. Go to https://appstoreconnect.apple.com/
2. **My Apps** → Select your app → **TestFlight** tab (or **App Store** tab)
3. Click **+** next to **Build**
4. Select your uploaded build
5. Click **Done**

---

## Phase 7: Configure App Store Listing

> **📋 Text Assets:** All text content is ready in `APP_STORE_TEXT_ASSETS.md` - just copy and paste!

### Step 1: Complete App Information

Go to https://appstoreconnect.apple.com/ → **My Apps** → **Sous**

#### **App Information**
1. **Subtitle** (30 char): "Your AI Cooking Assistant"
2. **Category**:
   - Primary: Food & Drink
   - Secondary: Lifestyle
3. **Content Rights**: Select appropriate age rating
4. **Privacy Policy URL**: ⚠️ **REQUIRED** - Must be live before submission

#### **Pricing and Availability**
1. **Price**: Free (or set price)
2. **Availability**: All countries (or select specific)

### Step 2: Upload Screenshots

1. **App Store** tab → **iOS App** → **Screenshots and App Preview**
2. Upload screenshots for each device size:
   - 6.7" Display (1290 x 2796) - minimum 3
   - 6.5" Display (1242 x 2688) - minimum 3
   - 5.5" Display (1242 x 2208) - minimum 3

**See:** `SCREENSHOT_CAPTURE_GUIDE.md` for detailed instructions.

### Step 3: Add Build

1. **App Store** tab → **Build** section
2. Click **+** next to **Build**
3. Select your uploaded build (from Phase 6)
4. Click **Done**

### Step 4: Set Version Information

Copy all text from `APP_STORE_TEXT_ASSETS.md`:

1. **Version**: 1.0.0
2. **Copyright**: © 2025 [Your Name/Company]
3. **Description**: Copy from `APP_STORE_TEXT_ASSETS.md`
4. **Keywords**: Copy from `APP_STORE_TEXT_ASSETS.md` (100 char max)
5. **Promotional Text**: Copy from `APP_STORE_TEXT_ASSETS.md` (170 char max)
6. **Support URL**: Your support page URL
7. **Marketing URL**: Your website (optional)

### Step 5: Age Rating

Click **Edit** next to **Age Rating**:
- Answer questions about content
- Expected rating: **4+** (no mature content for cooking app)

---

## Phase 8: Submit for Review

> **📋 Complete Checklist:** See `PRE_SUBMISSION_CHECKLIST.md` for comprehensive pre-submission verification.

### Before Submitting Checklist

- [ ] All required screenshots uploaded (minimum 3 per device size)
- [ ] App description complete (from `APP_STORE_TEXT_ASSETS.md`)
- [ ] Keywords added (from `APP_STORE_TEXT_ASSETS.md`)
- [ ] **Privacy policy URL valid and LIVE** ⚠️ REQUIRED
- [ ] Support URL valid and LIVE
- [ ] Build attached to version
- [ ] Age rating complete (expected: 4+)
- [ ] Pricing set
- [ ] Test app thoroughly on real device

### Submit for Review

1. **App Store** tab → Click **Submit for Review** (top right)
2. Review **Export Compliance**:
   - "Does your app use encryption?"
   - Answer: Likely "Yes" (HTTPS)
   - Select: "No, encryption is limited to standard encryption"
3. **Advertising Identifier**:
   - Do you use IDFA? Probably "No"
4. Click **Submit**

---

## Phase 9: Review Process

### What to Expect

- **In Review**: 24-48 hours typically
- **Status Updates**: You'll receive emails
- **Possible Outcomes**:
  - ✅ **Approved**: App goes live automatically (or on date you set)
  - ⚠️ **Metadata Rejected**: Fix description/screenshots, resubmit
  - ❌ **Binary Rejected**: Need to fix code, rebuild, resubmit

### Common Rejection Reasons

1. **Missing Privacy Policy**
   - Ensure URL is live and accessible

2. **Incomplete Functionality**
   - All features must work
   - No "coming soon" features

3. **Poor User Experience**
   - Must work on all device sizes
   - No crashes

4. **Missing Permissions Description**
   - Already handled in app.json (camera, photo library)

### If Rejected

1. Read rejection message carefully
2. Fix issues mentioned
3. Rebuild if needed: `eas build --platform ios --profile production`
4. Resubmit via App Store Connect

---

## Phase 10: Post-Approval

### After Approval

1. **Check App Store**: Search for "Sous" (may take few hours)
2. **Test Download**: Download on real device
3. **Monitor Reviews**: Respond to user feedback
4. **Analytics**: Check App Store Connect analytics

### Future Updates

When you need to release v1.1.0:

1. Update `version` in `app.json`: `"1.0.0"` → `"1.1.0"`
2. Increment `buildNumber`: `"1"` → `"2"`
3. Build: `eas build --platform ios --profile production`
4. Submit: `eas submit --platform ios --profile production`
5. Update App Store Connect listing if needed
6. Submit for review

---

## Quick Reference Commands

```bash
# Login to Expo
eas login

# Initialize EAS project (first time)
eas init

# Configure build (first time)
eas build:configure

# Build for production
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Check build status
eas build:list

# View project details
eas whoami
eas project:info
```

---

## Troubleshooting

### "Invalid Bundle Identifier"
- Ensure `bundleIdentifier` in app.json matches Apple Developer account

### "Missing Provisioning Profile"
- Run: `eas credentials`
- Regenerate certificates

### "Build Failed"
- Check EAS build logs
- Common: Missing dependencies, incompatible versions
- Solution: Run `npx expo-doctor` locally first

### "App Crashes on Launch"
- Test in iOS Simulator: `npx expo run:ios`
- Check console logs in Xcode
- Verify all native modules are compatible

### "Screenshots Rejected"
- Ensure screenshots show actual app content
- No mock data that looks misleading
- Must match current app version

---

## Additional Resources

- **Expo Docs**: https://docs.expo.dev/
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/ios

---

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Apple Developer Enrollment | 1-2 days | Approval time |
| Asset Preparation | 2-4 hours | Screenshots, descriptions |
| EAS Setup | 30 mins | First time only |
| First Build | 15-20 mins | Cloud build time |
| App Store Connect Setup | 1-2 hours | Listing, metadata |
| Submission | 5 mins | Upload and submit |
| **Review** | **1-3 days** | **Apple review time** |
| **TOTAL** | **2-5 days** | **End to end** |

---

## Cost Breakdown

- **Apple Developer Program**: $99/year (required)
- **Expo EAS**: Free tier available, or $29/month for team features
- **Domain/Hosting** (for privacy policy): ~$10/year
- **Total First Year**: ~$110-$470 depending on hosting/Expo tier

---

## Next Steps

1. ✅ **EAS Project** - Already initialized
2. ⏳ **Prepare screenshots** - See `SCREENSHOT_CAPTURE_GUIDE.md`
3. ⏳ **Create privacy policy** - Required before submission
4. ⏳ **Build for production** - `eas build --platform ios --profile production`
5. ⏳ **Submit and configure listing** - See `BUILD_AND_SUBMIT_GUIDE.md`

## 📁 Additional Resources Created

All guides are in the `mobile/` directory:

- **QUICK_START.md** - Quick reference for Phases 3-8
- **APP_STORE_TEXT_ASSETS.md** - All text content ready to copy/paste
- **SCREENSHOT_CAPTURE_GUIDE.md** - Detailed screenshot instructions
- **BUILD_AND_SUBMIT_GUIDE.md** - Complete build and submission guide
- **PRE_SUBMISSION_CHECKLIST.md** - Final checklist before submitting

**You're ready to go! 🚀**

Questions? Check Expo Discord or App Store Connect help.
