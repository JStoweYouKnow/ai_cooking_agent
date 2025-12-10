# Complete Icon Generation Guide

Generate all required icons (app icon, adaptive icon, favicon, splash) from a single source image.

## Quick Method: Using Icon Kitchen (Recommended)

**Icon Kitchen** is the easiest way to generate all icons at once:

1. **Go to:** https://icon.kitchen/
2. **Upload your source image:**
   - Any size (square recommended, at least 1024x1024)
   - Can be PNG, JPG, or SVG
   - Should be your app icon design

3. **Configure settings:**
   - **Platform:** Select "Expo" or "React Native"
   - **Adaptive Icon:** Enable for Android
   - **Splash Screen:** Enable if you want it generated
   - **Favicon:** Enable for web

4. **Download:**
   - Click "Download" to get a zip file
   - Extract the zip

5. **Copy files to your project:**
   ```bash
   # Extract the downloaded zip
   # Copy these files to mobile/assets/:
   - icon.png (1024x1024) → mobile/assets/icon.png
   - adaptive-icon.png (1024x1024) → mobile/assets/adaptive-icon.png
   - favicon.png (32x32 or 64x64) → mobile/assets/favicon.png
   - splash-icon.png (if generated) → mobile/assets/splash-icon.png
   ```

## Manual Method: Create Each Icon

### 1. App Icon (iOS/Android)

**Requirements:**
- **Size:** 1024 x 1024 pixels
- **Format:** PNG
- **No transparency**
- **No rounded corners** (iOS adds them automatically)

**Steps:**
1. Create a 1024x1024px canvas in your design tool
2. Design your icon (centered, with safe margins)
3. Export as PNG (no transparency)
4. Save as `mobile/assets/icon.png`

### 2. Adaptive Icon (Android)

**Requirements:**
- **Size:** 1024 x 1024 pixels
- **Format:** PNG
- **Design:** Should work with Android's adaptive icon system
- **Safe Zone:** Keep important content within 768x768px center area

**Why it's different:**
- Android can crop/mask adaptive icons
- Keep important elements in the center
- Background can extend to edges

**Steps:**
1. Use the same 1024x1024px design as app icon
2. OR create a version with extended background
3. Ensure main icon is centered in 768x768px safe zone
4. Save as `mobile/assets/adaptive-icon.png`

**Quick Option:** If your app icon is well-centered, you can use the same file:
```bash
cp mobile/assets/icon.png mobile/assets/adaptive-icon.png
```

### 3. Favicon (Web)

**Requirements:**
- **Size:** 32 x 32 or 64 x 64 pixels (64x64 recommended)
- **Format:** PNG or ICO
- **Simple design:** Should be readable at tiny size

**Steps:**
1. Create a 64x64px canvas
2. Use a simplified version of your icon
3. Or use just a letter/symbol (like "S" for Sous)
4. Export as PNG
5. Save as `mobile/assets/favicon.png`

**Tools:**
- **Favicon.io:** https://favicon.io/ - Upload image, generates favicon
- **RealFaviconGenerator:** https://realfavicongenerator.net/

### 4. Splash Icon (Splash Screen)

**Requirements:**
- **Size:** 1024 x 1024 pixels (or match your splash screen)
- **Format:** PNG
- **Design:** Can be same as app icon or simplified version

**Current Configuration:**
Looking at your `app.json`, the splash uses:
- Image: `./assets/splash-icon.png`
- Background color: `#6B8E23` (olive green)
- Resize mode: `contain`

**Steps:**
1. Create a 1024x1024px icon
2. Can be the same as app icon
3. OR create a simplified version (just logo, no text)
4. Save as `mobile/assets/splash-icon.png`

**Quick Option:** Use your app icon:
```bash
cp mobile/assets/icon.png mobile/assets/splash-icon.png
```

## Using Design Tools

### Option 1: Figma (Free, Web-based)

1. **Create frames:**
   - 1024x1024px for app icon
   - 1024x1024px for adaptive icon
   - 64x64px for favicon

2. **Design your icon:**
   - Use your brand colors (#6B8E23 olive green)
   - Keep it simple and recognizable

3. **Export:**
   - Select frame → Export → PNG
   - Export at 1x (actual size)

### Option 2: Canva

1. **Create custom size:**
   - 1024x1024px for icons
   - 64x64px for favicon

2. **Design:**
   - Use templates or create from scratch
   - Download as PNG

### Option 3: Adobe Illustrator/Photoshop

1. **Create artboards:**
   - 1024x1024px for main icons
   - 64x64px for favicon

2. **Design and export:**
   - Export as PNG
   - Ensure no transparency for app icon

## Automated Script (Using ImageMagick)

If you have ImageMagick installed, you can generate all sizes from one source:

```bash
# Install ImageMagick (if not installed)
# macOS: brew install imagemagick

cd /Users/v/Downloads/ai_cooking_agent/mobile/assets

# Create app icon (1024x1024)
convert source-icon.png -resize 1024x1024! icon.png

# Create adaptive icon (same as app icon, or customize)
convert source-icon.png -resize 1024x1024! adaptive-icon.png

# Create favicon (64x64)
convert source-icon.png -resize 64x64! favicon.png

# Create splash icon (1024x1024)
convert source-icon.png -resize 1024x1024! splash-icon.png
```

## Recommended Workflow

### Step 1: Create Source Design
1. Design your icon at 1024x1024px
2. Use your brand colors (#6B8E23)
3. Keep it simple and centered

### Step 2: Generate All Sizes
**Option A: Use Icon Kitchen (Easiest)**
- Upload your 1024x1024 design
- Download all generated sizes
- Copy to `mobile/assets/`

**Option B: Manual Creation**
- App icon: Use your 1024x1024 design
- Adaptive icon: Same as app icon (or extended background)
- Favicon: Create simplified 64x64 version
- Splash icon: Same as app icon (or simplified)

### Step 3: Verify Files

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile/assets

# Check sizes
file icon.png          # Should be 1024x1024
file adaptive-icon.png # Should be 1024x1024
file favicon.png       # Should be 32x32 or 64x64
file splash-icon.png   # Should be 1024x1024
```

### Step 4: Update and Test

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile

# Clear cache
npx expo start -c

# Test in simulator
# Press 'i' for iOS, 'a' for Android
```

## File Locations Summary

All icons should be in: `mobile/assets/`

```
mobile/assets/
├── icon.png           (1024x1024) - Main app icon
├── adaptive-icon.png  (1024x1024) - Android adaptive icon
├── favicon.png        (64x64)     - Web favicon
└── splash-icon.png    (1024x1024) - Splash screen icon
```

## Design Tips for Sous

**Icon Design Ideas:**
- Chef's hat with "S" or stylized letter
- Cooking pot/pan icon
- Recipe book
- Olive branch (matches #6B8E23 color)
- Knife and fork (simplified)

**Color Scheme:**
- Primary: #6B8E23 (Olive green)
- Background: White or cream
- Accent: Navy or dark green

**Best Practices:**
- Keep it simple (readable at small sizes)
- High contrast
- No text (unless it's part of the logo)
- Test at different sizes

## Quick Reference

| Icon | Size | Format | Location |
|------|------|--------|----------|
| App Icon | 1024x1024 | PNG (no transparency) | `mobile/assets/icon.png` |
| Adaptive Icon | 1024x1024 | PNG | `mobile/assets/adaptive-icon.png` |
| Favicon | 64x64 | PNG | `mobile/assets/favicon.png` |
| Splash Icon | 1024x1024 | PNG | `mobile/assets/splash-icon.png` |

## Tools & Resources

- **Icon Kitchen:** https://icon.kitchen/ (Best for Expo)
- **AppIcon.co:** https://www.appicon.co/
- **Favicon.io:** https://favicon.io/
- **RealFaviconGenerator:** https://realfavicongenerator.net/
- **Figma:** https://www.figma.com/ (Free design tool)
- **Canva:** https://www.canva.com/ (Easy design tool)

---

**Recommended:** Use **Icon Kitchen** (https://icon.kitchen/) - upload one image, get all sizes automatically!



