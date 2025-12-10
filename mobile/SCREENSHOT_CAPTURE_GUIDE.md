# Screenshot Capture Guide for App Store

Step-by-step guide to capture professional screenshots for App Store submission.

---

## Required Screenshot Sizes

You need screenshots for these device sizes:

1. **6.7" Display (iPhone 14 Pro Max, 15 Pro Max)** - 1290 x 2796 pixels (3-10 images)
2. **6.5" Display (iPhone 11 Pro Max, XS Max)** - 1242 x 2688 pixels (3-10 images)  
3. **5.5" Display (iPhone 8 Plus)** - 1242 x 2208 pixels (3-10 images)

**Minimum:** 3 screenshots per size
**Recommended:** 5-10 screenshots per size

---

## Method 1: iOS Simulator (Recommended - Easiest)

### Step 1: Open iOS Simulator

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile

# Start the app in simulator
npx expo start
# Then press 'i' to open iOS simulator
```

Or open Xcode → **Xcode** → **Open Developer Tool** → **Simulator**

### Step 2: Select Device

In Simulator:
1. **Device** → **Manage Devices and Simulators**
2. Select one of these:
   - **iPhone 15 Pro Max** (6.7" - 1290 x 2796)
   - **iPhone 11 Pro Max** (6.5" - 1242 x 2688)
   - **iPhone 8 Plus** (5.5" - 1242 x 2208)

### Step 3: Navigate to Screens

Open these screens in your app (in order of importance):

1. **Dashboard/Home Screen** - Main landing page
2. **Recipe Detail Screen** - Show a beautiful recipe
3. **AI Assistant Screen** - Show the AI chat interface
4. **Shopping Lists Screen** - Show shopping list functionality
5. **Pantry/Ingredients Screen** - Show ingredient management
6. **Recipe List Screen** - Show recipe browsing
7. **Cooking Mode Screen** - Show step-by-step cooking (if available)

### Step 4: Capture Screenshots

**Option A: Simulator Menu**
1. **Device** → **Screenshots** → **New Screenshot**
2. Or press `Cmd + S`
3. Screenshots save to Desktop by default

**Option B: Command Line**
```bash
xcrun simctl io booted screenshot ~/Desktop/screenshot-$(date +%Y%m%d-%H%M%S).png
```

### Step 5: Organize Screenshots

Create folders:
```
mobile/screenshots/
  ├── 6.7-inch/  (iPhone 15 Pro Max)
  │   ├── 01-dashboard.png
  │   ├── 02-recipe-detail.png
  │   ├── 03-ai-assistant.png
  │   ├── 04-shopping-list.png
  │   └── 05-pantry.png
  ├── 6.5-inch/  (iPhone 11 Pro Max)
  │   └── ...
  └── 5.5-inch/  (iPhone 8 Plus)
      └── ...
```

---

## Method 2: Real Device (Alternative)

### Step 1: Connect iPhone

1. Connect iPhone via USB
2. Trust computer on iPhone
3. Open Xcode → **Window** → **Devices and Simulators**

### Step 2: Take Screenshots

On iPhone:
- **iPhone X and later:** Press **Side Button + Volume Up**
- **iPhone 8 and earlier:** Press **Home + Power**

Screenshots save to Photos app.

### Step 3: Transfer to Mac

1. Open **Photos** app on Mac
2. Import from iPhone
3. Export screenshots to your project folder

---

## Method 3: Using Screenshot Tools

### Option A: Screely (Online Tool)
1. Take screenshot in simulator
2. Go to https://www.screely.com/
3. Upload screenshot
4. Add device frame (optional)
5. Download

### Option B: Fastlane Frameit
```bash
# Install fastlane
gem install fastlane

# Add frames to screenshots
fastlane frameit
```

---

## Recommended Screenshot Sequence

Capture these screens in this order (most important first):

### 1. Dashboard/Home Screen
- Shows main navigation
- Displays key features
- "Ready, Chef!" greeting

### 2. Recipe Detail Screen
- Beautiful recipe card
- Ingredients list
- Cooking instructions
- High-quality recipe image

### 3. AI Assistant Screen
- Chat interface
- Example conversation
- Shows AI capabilities

### 4. Shopping Lists Screen
- List of shopping lists
- Items with checkboxes
- Shows organization

### 5. Pantry/Ingredients Screen
- Ingredient list
- Categories
- Shows management features

### 6. Recipe List/Browse Screen
- Grid or list of recipes
- Search functionality
- Filter options

### 7. Cooking Mode Screen (if available)
- Step-by-step instructions
- Timer display
- Progress indicator

---

## Screenshot Best Practices

### ✅ DO:
- Show actual app content (not mockups)
- Use real data that looks good
- Ensure text is readable
- Show key features prominently
- Use consistent styling across screenshots
- Remove any personal/sensitive data
- Ensure UI is polished and complete

### ❌ DON'T:
- Use placeholder text like "Lorem ipsum"
- Show "Coming Soon" features
- Include personal information
- Use outdated UI designs
- Show errors or empty states (unless intentional)
- Use screenshots from different app versions

---

## Quick Capture Script

Save this as `capture-screenshots.sh`:

```bash
#!/bin/bash

# Navigate to mobile directory
cd /Users/v/Downloads/ai_cooking_agent/mobile

# Start Expo
npx expo start &
EXPO_PID=$!

# Wait for server to start
sleep 5

# Open iOS Simulator
open -a Simulator

# Wait for simulator
sleep 10

# List of devices to capture
DEVICES=(
  "iPhone 15 Pro Max"  # 6.7"
  "iPhone 11 Pro Max" # 6.5"
  "iPhone 8 Plus"     # 5.5"
)

# Create screenshot directories
mkdir -p screenshots/{6.7-inch,6.5-inch,5.5-inch}

for device in "${DEVICES[@]}"; do
  echo "Capturing screenshots for $device..."
  
  # Boot device
  xcrun simctl boot "$device" 2>/dev/null || true
  
  # Wait for boot
  sleep 5
  
  # Take screenshot (you'll need to navigate manually)
  echo "Navigate to the screen you want, then press Enter..."
  read
  
  xcrun simctl io booted screenshot "screenshots/$(echo $device | tr ' ' '-').png"
done

# Cleanup
kill $EXPO_PID 2>/dev/null || true
```

---

## Resizing Screenshots

If you only capture one size, you can resize:

```bash
# Using ImageMagick (install: brew install imagemagick)
convert screenshot.png -resize 1242x2688! resized.png

# Or use online tools:
# - https://www.iloveimg.com/resize-image
# - https://imageresizer.com/
```

**Note:** Resizing may reduce quality. Best to capture at native resolution.

---

## Next Steps

After capturing screenshots:

1. **Review all screenshots** - Ensure they look professional
2. **Organize by device size** - Create folders for each size
3. **Name them clearly** - e.g., `01-dashboard-6.7.png`
4. **Upload to App Store Connect** - Follow Phase 7 in the release guide

---

## Troubleshooting

### Simulator won't open
```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

### Screenshots are wrong size
- Make sure you selected the correct device in Simulator
- Check device resolution in Simulator → Window → Physical Size

### App won't load in simulator
- Check Expo server is running: `npx expo start`
- Try clearing cache: `npx expo start -c`
- Restart simulator

---

## Quick Reference

**Device Sizes:**
- iPhone 15 Pro Max: 1290 x 2796 (6.7")
- iPhone 11 Pro Max: 1242 x 2688 (6.5")
- iPhone 8 Plus: 1242 x 2208 (5.5")

**Keyboard Shortcuts:**
- Simulator Screenshot: `Cmd + S`
- Simulator Home: `Cmd + Shift + H`
- Simulator Rotate: `Cmd + Left/Right Arrow`



