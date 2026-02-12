# Building in Xcode - Step by Step Guide

## Prerequisites

✅ **Xcode Installed**
- Xcode 15.0 or later recommended
- Command Line Tools installed

✅ **CocoaPods Installed**
```bash
sudo gem install cocoapods
```

✅ **Dependencies Installed**
```bash
cd mobile
pnpm install
```

---

## Step 1: Install CocoaPods Dependencies

Navigate to the iOS directory and install pods:

```bash
cd mobile/ios
pod install
```

This will:
- Install all native iOS dependencies
- Generate the `.xcworkspace` file
- Set up the project for Xcode

**Note:** If you get permission errors, you may need to run:
```bash
sudo gem install cocoapods
```

---

## Step 2: Open in Xcode

### Option A: From Terminal
```bash
cd mobile/ios
open Sous.xcworkspace
```

**Important:** Always open the `.xcworkspace` file, NOT the `.xcodeproj` file!

### Option B: From Finder
1. Navigate to `mobile/ios/` folder
2. Double-click `Sous.xcworkspace`
3. Xcode will open

---

## Step 3: Configure Signing & Capabilities

1. **Select the Project**
   - Click "Sous" in the left sidebar (blue icon)
   - Select the "Sous" target (not the project)

2. **Signing & Capabilities Tab**
   - Go to "Signing & Capabilities" tab
   - Check "Automatically manage signing"
   - Select your Team (Apple Developer account)
   - Bundle Identifier should be: `com.aicookingagent.app`

3. **Verify Capabilities**
   - Camera (for expo-camera)
   - Photo Library (for image picker)
   - Face ID (for biometric auth)
   - Push Notifications (if needed)

---

## Step 4: Select Build Target

1. **Choose Device/Simulator**
   - At the top toolbar, click the device selector
   - Choose:
     - **Simulator:** iPhone 15 Pro (or any iOS 17+ simulator)
     - **Physical Device:** Your connected iPhone/iPad

2. **For Physical Device:**
   - Connect your device via USB
   - Trust the computer on your device
   - Select your device from the list
   - You may need to register the device in Apple Developer Portal

---

## Step 5: Build the Project

### Build Only (No Run)
- Press `Cmd + B` (or Product → Build)
- This compiles the app without installing

### Build and Run
- Press `Cmd + R` (or Product → Run)
- This builds and installs on the selected device/simulator

---

## Step 6: Start Metro Bundler

Before running, you need to start the Metro bundler (React Native's JavaScript bundler):

**Option A: From Terminal (Recommended)**
```bash
cd mobile
pnpm start
```

**Option B: From Xcode**
- Xcode will automatically start Metro when you run
- Or you can start it manually: `pnpm start` in the mobile directory

---

## Common Issues & Solutions

### Issue: "No such module 'ExpoModulesCore'"
**Solution:**
```bash
cd mobile/ios
pod install
```

### Issue: "Signing for 'Sous' requires a development team"
**Solution:**
1. Go to Signing & Capabilities
2. Select your Apple Developer Team
3. If you don't have a team, create one at https://developer.apple.com

### Issue: "Build Failed" with CocoaPods errors
**Solution:**
```bash
cd mobile/ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

### Issue: Metro bundler not starting
**Solution:**
```bash
cd mobile
pnpm start --reset-cache
```

### Issue: "Unable to boot simulator"
**Solution:**
- Open Xcode → Settings → Platforms
- Download the iOS Simulator runtime
- Or use: `xcrun simctl list devices available`

---

## Build Configurations

### Debug Build (Default)
- Fast builds
- Includes debugging symbols
- Hot reload enabled
- Use for development

### Release Build
1. Select "Product" → "Scheme" → "Edit Scheme"
2. Select "Run" → "Info" tab
3. Change "Build Configuration" to "Release"
4. Build with `Cmd + B`

---

## Archive for TestFlight/App Store

1. **Select "Any iOS Device" or "Generic iOS Device"**
   - Not a simulator!

2. **Create Archive**
   - Product → Archive
   - Wait for build to complete

3. **Distribute**
   - Window → Organizer (or Product → Archive)
   - Select your archive
   - Click "Distribute App"
   - Follow the wizard:
     - Choose "App Store Connect"
     - Select distribution options
     - Upload to App Store Connect

---

## Project Structure

```
mobile/
├── ios/
│   ├── Sous.xcworkspace  ← Open this in Xcode!
│   ├── Sous.xcodeproj    ← Don't open this directly
│   ├── Podfile           ← CocoaPods dependencies
│   └── Pods/             ← Installed pods
├── app.json              ← Expo configuration
└── package.json          ← Node dependencies
```

---

## Quick Commands Reference

```bash
# Install dependencies
cd mobile
pnpm install

# Install CocoaPods
cd ios
pod install

# Start Metro bundler
cd mobile
pnpm start

# Open in Xcode
cd mobile/ios
open Sous.xcworkspace

# Clean build (if issues)
cd mobile/ios
rm -rf build DerivedData
pod install
```

---

## Tips

1. **Always use `.xcworkspace`** - Never open `.xcodeproj` directly when using CocoaPods
2. **Keep Metro running** - The bundler needs to be running for the app to work
3. **Clean build folder** - If you have weird errors: Product → Clean Build Folder (Shift+Cmd+K)
4. **Check console** - Xcode console shows Metro bundler output and errors
5. **Use Release config** - For performance testing, use Release configuration

---

## Next Steps After Building

1. **Test on Device**
   - Install on your iPhone/iPad
   - Test all features
   - Check performance

2. **Archive for Distribution**
   - Create archive in Xcode
   - Upload to TestFlight
   - Or distribute via App Store

3. **Debug Issues**
   - Check Xcode console
   - Check Metro bundler logs
   - Use React Native Debugger if needed

---

## Need Help?

- **Xcode Issues:** Check Xcode console for errors
- **Metro Issues:** Check Metro bundler terminal output
- **Build Errors:** Try cleaning build folder and rebuilding
- **Signing Issues:** Verify your Apple Developer account and certificates
