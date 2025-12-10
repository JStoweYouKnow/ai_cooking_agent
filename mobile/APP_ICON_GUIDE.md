# App Icon Replacement Guide

## Current Setup

Your app icon is located at: `mobile/assets/icon.png`
- Current size: 1024 x 1024 pixels ✅ (correct size)
- Format: PNG ✅

## Requirements for App Icon

### iOS App Icon
- **Size:** 1024 x 1024 pixels (exactly)
- **Format:** PNG (no transparency)
- **Content:** 
  - No rounded corners (iOS adds them automatically)
  - No drop shadows
  - No text that says "App" or version numbers
  - Should be recognizable at small sizes

### Design Guidelines
- **Simple and recognizable:** Should work at small sizes (like on home screen)
- **No transparency:** Solid background required
- **High contrast:** Should stand out on various backgrounds
- **Brand consistent:** Should match your app's design language

## How to Replace the Icon

### Option 1: Replace the File Directly

1. **Create or obtain your icon:**
   - Design a 1024x1024 PNG icon
   - Ensure it meets the requirements above
   - Save it as `icon.png`

2. **Replace the existing file:**
   ```bash
   # Backup the old icon (optional)
   cp mobile/assets/icon.png mobile/assets/icon-backup.png
   
   # Replace with your new icon
   # Copy your new icon.png to: mobile/assets/icon.png
   ```

3. **Verify the file:**
   ```bash
   cd mobile
   file assets/icon.png
   # Should show: PNG image data, 1024 x 1024
   ```

4. **Rebuild the app:**
   ```bash
   # Clear cache and rebuild
   npx expo start -c
   
   # Or rebuild for production
   eas build --platform ios --profile production
   ```

### Option 2: Using Design Tools

**Recommended Tools:**
- **Figma** - Free, web-based design tool
- **Sketch** - Mac design tool
- **Adobe Illustrator/Photoshop** - Professional tools
- **Canva** - Simple online tool (has app icon templates)

**Template:**
- Create a 1024x1024px canvas
- Design your icon in the center
- Export as PNG (no transparency)

### Option 3: Using Icon Generators

**Online Tools:**
- https://www.appicon.co/ - Generates all sizes from one image
- https://www.makeappicon.com/ - Free icon generator
- https://icon.kitchen/ - Expo-compatible icon generator

**Using Icon Kitchen (Recommended for Expo):**
1. Go to https://icon.kitchen/
2. Upload your source image (any size, square recommended)
3. It will generate all required sizes
4. Download and extract
5. Copy `icon.png` (1024x1024) to `mobile/assets/icon.png`

## Icon Design Ideas for Sous

Since your app is a cooking assistant, consider:
- **Chef's hat icon**
- **Cooking pot/pan**
- **Knife and fork**
- **Recipe book**
- **Olive branch** (matches your color scheme #6B8E23)
- **Letter "S"** stylized for Sous

**Color Scheme:**
- Primary: Olive green (#6B8E23) - matches your app theme
- Accent: Navy or cream colors
- Background: White or cream

## Testing Your Icon

1. **Preview in Simulator:**
   ```bash
   npx expo start
   # Press 'i' for iOS simulator
   # Check home screen to see icon
   ```

2. **Check Different Sizes:**
   - The icon will be displayed at various sizes
   - Make sure it's readable at small sizes
   - Test on actual device if possible

## Additional Icons Needed

You may also want to update:

1. **Adaptive Icon (Android):** `mobile/assets/adaptive-icon.png`
   - Same 1024x1024 size
   - Should work with Android's adaptive icon system

2. **Splash Icon:** `mobile/assets/splash-icon.png`
   - Currently used for splash screen
   - Can be same as app icon or simplified version

3. **Favicon (Web):** `mobile/assets/favicon.png`
   - 32x32 or 64x64 pixels
   - Used for web version

## Quick Steps Summary

1. **Create your icon:**
   - 1024x1024 PNG
   - No transparency
   - Simple, recognizable design

2. **Replace the file:**
   ```bash
   # Copy your new icon to:
   mobile/assets/icon.png
   ```

3. **Rebuild:**
   ```bash
   cd mobile
   npx expo start -c  # Clear cache
   # Or
   eas build --platform ios --profile production
   ```

4. **Verify:**
   - Check in iOS Simulator
   - Verify on actual device
   - Check App Store Connect preview

## Troubleshooting

### Icon not updating?
- Clear Expo cache: `npx expo start -c`
- Delete `node_modules/.cache` if it exists
- Rebuild the app completely

### Icon looks blurry?
- Ensure it's exactly 1024x1024 pixels
- Use high-quality source image
- Avoid scaling up small images

### Icon rejected by App Store?
- Ensure no transparency
- No placeholder text
- Must be original design (not copyrighted material)
- Should represent your app accurately

## Resources

- **Apple HIG - App Icons:** https://developer.apple.com/design/human-interface-guidelines/app-icons
- **Expo Icon Docs:** https://docs.expo.dev/guides/app-icons/
- **App Store Icon Requirements:** https://developer.apple.com/app-store/review/guidelines/

---

**Current Icon Location:** `mobile/assets/icon.png`
**Required Size:** 1024 x 1024 pixels
**Format:** PNG (no transparency)



