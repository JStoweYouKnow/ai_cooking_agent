# Pre-Submission Checklist

Complete checklist to verify everything is ready before submitting to App Store.

---

## ✅ Phase 3: App Assets

### App Icon
- [ ] `assets/icon.png` exists and is 1024x1024 pixels
- [ ] Icon has no transparency
- [ ] Icon looks professional and represents the app

### Splash Screen
- [ ] `assets/splash-icon.png` exists
- [ ] Configured in `app.json`

### Screenshots
- [ ] Screenshots captured for 6.7" display (1290 x 2796) - minimum 3
- [ ] Screenshots captured for 6.5" display (1242 x 2688) - minimum 3
- [ ] Screenshots captured for 5.5" display (1242 x 2208) - minimum 3
- [ ] All screenshots show actual app content (not mockups)
- [ ] Screenshots are organized in folders
- [ ] Screenshots showcase key features

### Text Assets
- [ ] App description written (see `APP_STORE_TEXT_ASSETS.md`)
- [ ] Keywords prepared (100 char max)
- [ ] Promotional text prepared (170 char max)
- [x] Support URL ready: `https://project-comfort-website.vercel.app/support`
- [x] **Privacy Policy URL ready and LIVE**: `https://project-comfort-website.vercel.app/privacy` ⚠️ REQUIRED

---

## ✅ Phase 4: Configuration

### app.json
- [ ] Bundle identifier: `com.aicookingagent.app`
- [ ] Version: `1.0.0`
- [ ] Build number: `1`
- [ ] App name: `Sous`
- [ ] All plugins configured correctly
- [ ] Permissions descriptions present (camera, photo library)
- [ ] EAS project ID present

### eas.json
- [ ] Production profile configured
- [ ] Distribution set to "store"
- [ ] Auto-increment enabled for build numbers
- [ ] Submit configuration ready (can add App Store Connect IDs later)

### Apple Developer Account
- [ ] Apple Developer Program membership active ($99/year)
- [ ] App ID created: `com.aicookingagent.app`
- [ ] Certificates available (EAS will generate if needed)

### App Store Connect
- [ ] App created in App Store Connect
- [ ] Bundle ID matches: `com.aicookingagent.app`
- [ ] App name set: `Sous`
- [ ] Primary language: English (U.S.)

---

## ✅ Phase 5: Build

### EAS Setup
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged in: `eas login`
- [ ] Project initialized: `eas init` (already done ✅)
- [ ] Project ID in `app.json` matches EAS project

### Build Readiness
- [ ] All dependencies installed: `npm install` or `pnpm install`
- [ ] App runs locally: `npx expo start`
- [ ] No TypeScript errors: `npx tsc --noEmit` (if applicable)
- [ ] No linting errors
- [ ] App tested in iOS Simulator
- [ ] App tested on real iOS device (recommended)

### Build Execution
- [ ] Production build command ready: `eas build --platform ios --profile production`
- [ ] Apple ID credentials available
- [ ] Build completed successfully
- [ ] Build ID noted for reference

---

## ✅ Phase 6: Submission

### App Store Connect IDs
- [ ] Apple ID email noted
- [ ] App Store Connect App ID found (in App Store Connect URL)
- [ ] Apple Team ID found (in Developer Portal)
- [ ] `eas.json` updated with submission details (optional, can use manual)

### Submission Method
- [ ] Chosen: Automatic (EAS) or Manual (App Store Connect)
- [ ] If automatic: `eas.json` configured with IDs
- [ ] If manual: Know how to upload build in App Store Connect

---

## ✅ Phase 7: App Store Listing

### App Information
- [ ] Subtitle added (30 char max): "Your AI Cooking Assistant"
- [ ] Category selected: Food & Drink (Primary)
- [ ] Content rights answered
- [x] Privacy Policy URL added: `https://project-comfort-website.vercel.app/privacy` ⚠️

### Screenshots
- [ ] 6.7" screenshots uploaded (minimum 3)
- [ ] 6.5" screenshots uploaded (minimum 3)
- [ ] 5.5" screenshots uploaded (minimum 3)
- [ ] All screenshots show current app version

### Version Information
- [ ] Version number: 1.0.0
- [ ] Copyright: © 2025 [Your Name/Company]
- [ ] Description pasted from `APP_STORE_TEXT_ASSETS.md`
- [ ] Keywords pasted (100 char max)
- [ ] Promotional text pasted (170 char max)
- [x] Support URL added: `https://project-comfort-website.vercel.app/support`
- [ ] Marketing URL added (optional)

### Build
- [ ] Build attached to version in App Store Connect
- [ ] Build status is "Ready to Submit" or similar

### Age Rating
- [ ] Age rating questionnaire completed
- [ ] Expected rating: 4+
- [ ] All questions answered accurately

### Pricing
- [ ] Price set: Free (or chosen price)
- [ ] Availability: All countries (or selected)

---

## ✅ Phase 8: Pre-Submission

### Export Compliance
- [ ] Question answered: "Does your app use encryption?"
- [ ] Answer: Yes
- [ ] Details: "No, encryption is limited to standard encryption"

### Advertising Identifier
- [ ] Question answered: "Does your app use IDFA?"
- [ ] Answer: No (or Yes with details if applicable)

### App Review Information
- [ ] Contact information provided
- [ ] Demo account provided (if app requires login)
- [ ] Notes added (if needed)

### Final Testing
- [ ] App tested on real iOS device
- [ ] All features work correctly
- [ ] No crashes or freezes
- [ ] No placeholder text
- [ ] No "coming soon" features
- [ ] All links work
- [ ] Privacy policy URL accessible
- [ ] Support URL accessible

### Final Verification
- [ ] All screenshots match current app
- [ ] Description is accurate
- [ ] No typos in text
- [ ] All URLs are live
- [ ] Bundle ID matches everywhere
- [ ] Version number is correct

---

## 🚨 Critical Requirements

These will cause **immediate rejection** if missing:

1. **Privacy Policy URL** - MUST be live and accessible
2. **Support URL** - MUST be live (or use email)
3. **Screenshots** - Minimum 3 per device size, must show actual app
4. **Working App** - All features must function
5. **No Placeholders** - No "Lorem ipsum" or "Coming soon"
6. **Age Rating** - Must be completed
7. **Export Compliance** - Must be answered

---

## 📝 Quick Reference

### Key URLs
- **Apple Developer:** https://developer.apple.com/account/
- **App Store Connect:** https://appstoreconnect.apple.com/
- **Expo Dashboard:** https://expo.dev/

### Key Commands
```bash
# Build
eas build --platform ios --profile production

# Submit
eas submit --platform ios --profile production --latest

# Check status
eas build:list
```

### Key Files
- `app.json` - App configuration
- `eas.json` - Build configuration
- `APP_STORE_TEXT_ASSETS.md` - All text content
- `SCREENSHOT_CAPTURE_GUIDE.md` - Screenshot instructions
- `BUILD_AND_SUBMIT_GUIDE.md` - Complete build/submit guide

---

## ✅ Ready to Submit?

If all items above are checked, you're ready to:

1. Go to App Store Connect
2. Click **Submit for Review**
3. Wait for approval (24-48 hours typically)

**Good luck! 🚀**

---

## Need Help?

- **Expo Docs:** https://docs.expo.dev/
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **App Store Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Expo Discord:** https://chat.expo.dev/

