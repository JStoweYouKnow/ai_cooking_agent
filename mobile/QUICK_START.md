# Quick Start - App Store Release

Quick reference for completing Phases 3-8 of the App Store release process.

---

## 📋 What You Need First

1. **Apple Developer Account** ($99/year) - https://developer.apple.com/programs/
2. **App created in App Store Connect** - https://appstoreconnect.apple.com/
3. ✅ **Privacy Policy URL** - `https://project-comfort-website.vercel.app/privacy`
4. ✅ **Support URL** - `https://project-comfort-website.vercel.app/support`

---

## 🚀 Quick Steps

### Step 1: Prepare Assets (Phase 3)

```bash
# 1. Capture screenshots (see SCREENSHOT_CAPTURE_GUIDE.md)
# Use iOS Simulator to capture screenshots for:
# - 6.7" (1290 x 2796) - minimum 3
# - 6.5" (1242 x 2688) - minimum 3  
# - 5.5" (1242 x 2208) - minimum 3

# 2. Prepare text assets (see APP_STORE_TEXT_ASSETS.md)
# All text is ready to copy/paste
```

**Files to review:**
- `SCREENSHOT_CAPTURE_GUIDE.md` - How to capture screenshots
- `APP_STORE_TEXT_ASSETS.md` - All text content ready to use

### Step 2: Verify Configuration (Phase 4)

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile

# Verify app.json
cat app.json | grep bundleIdentifier
# Should show: "bundleIdentifier": "com.aicookingagent.app"

# Verify eas.json exists
cat eas.json
# Should show production profile configured
```

✅ **Already done!** Configuration is ready.

### Step 3: Build for App Store (Phase 5)

```bash
# Login to EAS (if not already)
eas login

# Build for production
eas build --platform ios --profile production

# This takes ~15-20 minutes
# EAS will handle certificates automatically
```

**Monitor build:**
```bash
eas build:list
```

### Step 4: Submit to App Store (Phase 6)

**Option A: Automatic (Recommended)**
```bash
# First, update eas.json with your App Store Connect IDs:
# - appleId: your-email@example.com
# - ascAppId: from App Store Connect URL
# - appleTeamId: from Developer Portal

# Then submit:
eas submit --platform ios --profile production --latest
```

**Option B: Manual**
1. Go to App Store Connect
2. **My Apps** → **Sous** → **TestFlight** tab
3. Click **+** → Select build → **Done**

### Step 5: Configure Listing (Phase 7)

1. Go to https://appstoreconnect.apple.com/
2. **My Apps** → **Sous** → **App Store** tab

**Complete these sections:**
- **App Information:** Subtitle, Category, Privacy Policy URL
- **Screenshots:** Upload from `screenshots/` folders
- **Version Information:** Copy from `APP_STORE_TEXT_ASSETS.md`
- **Age Rating:** Complete questionnaire (expected: 4+)
- **Pricing:** Set to Free (or your price)
- **Build:** Attach your uploaded build

### Step 6: Submit for Review (Phase 8)

1. **App Store** tab → **Submit for Review**
2. Answer Export Compliance: "Yes" → "Standard encryption"
3. Answer IDFA: "No" (unless you use it)
4. Click **Submit**

**Wait 24-48 hours for review.**

---

## 📁 File Reference

All guides are in the `mobile/` directory:

1. **APP_STORE_RELEASE_GUIDE.md** - Complete guide (Phases 1-10)
2. **APP_STORE_TEXT_ASSETS.md** - All text content (copy/paste ready)
3. **SCREENSHOT_CAPTURE_GUIDE.md** - How to capture screenshots
4. **BUILD_AND_SUBMIT_GUIDE.md** - Detailed build/submit instructions
5. **PRE_SUBMISSION_CHECKLIST.md** - Final checklist before submitting
6. **QUICK_START.md** - This file (quick reference)

---

## ⚠️ Critical Requirements

**These will cause rejection if missing:**

1. ✅ **Privacy Policy URL** - `https://project-comfort-website.vercel.app/privacy` (Ready!)
2. ✅ **Support URL** - `https://project-comfort-website.vercel.app/support` (Ready!)
3. ⏳ **Screenshots** - Minimum 3 per device size (Need to capture)
4. ⏳ **Working App** - All features must work (Need to test)
5. ⏳ **No Placeholders** - No "Lorem ipsum" (Need to verify)

---

## 🎯 Current Status

✅ **Phase 1-2:** Complete (Apple Developer + EAS Setup)
✅ **Phase 3:** Assets ready (screenshots needed)
✅ **Phase 4:** Configuration ready
⏳ **Phase 5:** Ready to build
⏳ **Phase 6:** Ready to submit
⏳ **Phase 7:** Ready to configure listing
⏳ **Phase 8:** Ready to submit for review

---

## 🚨 Before You Start

**Must have ready:**
- [ ] Privacy Policy URL (live and accessible)
- [ ] Support URL (live and accessible)
- [ ] Screenshots captured (see guide)
- [ ] App tested on real device

**Then proceed with:**
1. Build: `eas build --platform ios --profile production`
2. Submit: `eas submit --platform ios --profile production --latest`
3. Configure listing in App Store Connect
4. Submit for review

---

## 📞 Need Help?

- **Expo Docs:** https://docs.expo.dev/
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **App Store Guidelines:** https://developer.apple.com/app-store/review/guidelines/

---

## ⏱️ Timeline

- **Screenshot capture:** 1-2 hours
- **Build:** 15-20 minutes
- **Listing setup:** 30-60 minutes
- **Apple Review:** 24-48 hours
- **Total:** 2-3 days

**You're ready to go! 🚀**

