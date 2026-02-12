# Xcode Local Build for TestFlight

Build and upload to TestFlight without EAS (for when the EAS queue is full).

---

## Step 1: Generate Native iOS Project

Expo needs to generate the `ios` folder first. Run from the **project root**:

```bash
cd mobile
npx expo prebuild --platform ios --clean
```

This creates the `ios/` folder with the Xcode project. Use `--clean` to regenerate from scratch if you've modified native files.

---

## Step 2: Install CocoaPods

```bash
cd mobile/ios
pod install
```

Always open **Sous.xcworkspace** (not .xcodeproj) after this.

---

## Step 3: Open in Xcode

```bash
cd mobile/ios
open Sous.xcworkspace
```

---

## Step 4: Configure Signing

1. Select **Sous** in the left sidebar (blue project icon)
2. Select the **Sous** target
3. Go to **Signing & Capabilities**
4. Enable **Automatically manage signing**
5. Select your **Team** (Apple Developer account)
6. Verify **Bundle Identifier**: `com.aicookingagent.app`

---

## Step 5: Set Build for Release

1. **Product** → **Scheme** → **Edit Scheme** (or `Cmd + <`)
2. Select **Run** in the left column
3. Set **Build Configuration** to **Release**
4. Close the dialog

---

## Step 6: Create Archive

1. In the device dropdown (top toolbar), select **Any iOS Device (arm64)** or **Generic iOS Device**
   - Do **not** select a simulator
2. **Product** → **Archive**
3. Wait for the build to complete (5–15 min)

---

## Step 7: Upload to TestFlight

1. When the archive completes, **Organizer** opens (or **Window** → **Organizer**)
2. Select your new archive
3. Click **Distribute App**
4. Choose **App Store Connect** → Next
5. Choose **Upload** → Next
6. Keep defaults (Upload symbols, Manage version/build number) → Next
7. Select your **Signing Certificate** and **Provisioning Profile** (usually automatic)
8. Click **Upload**

---

## Environment Variables for Production

For production/TestFlight, the app uses values from `app.json` → `extra`. To override for a demo build:

1. Edit `app.json` or create/update `.env` in `mobile/`
2. Set `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_DEMO_MODE`, etc. as needed
3. Run `expo prebuild --platform ios --clean` again to bake them in

---

## Quick Reference

```bash
# Full flow from scratch
cd mobile
npx expo prebuild --platform ios --clean
cd ios
pod install
open Sous.xcworkspace
# Then in Xcode: Product → Archive → Distribute App
```

---

## Troubleshooting

**"No such module 'ExpoModulesCore'"**
```bash
cd mobile/ios
pod install
```

**Signing errors**
- Ensure Xcode → Signing & Capabilities uses your correct Apple Developer Team
- Check that your Apple Developer account has valid certificates

**Archive option grayed out**
- Switch the device dropdown from a simulator to **Any iOS Device**

**Build fails with pod errors**
```bash
cd mobile/ios
rm -rf Pods Podfile.lock
pod install --repo-update
```
