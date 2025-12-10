# Icon Update Workflow

## Quick Answer

**For Development/Testing:**
- ✅ **No rebuild needed** - Just clear cache and restart
- Use: `npx expo start -c`

**For Production/App Store:**
- ✅ **Yes, rebuild required** - Icons are bundled in the app
- Use: `eas build --platform ios --profile production`

## Development Mode (Testing Icons)

### Option 1: Clear Cache and Restart (Fastest)

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile

# Clear cache and restart
npx expo start -c
```

**What this does:**
- Clears Expo's cache
- Reloads assets including icons
- Restarts the development server
- Icons should update in simulator/device

### Option 2: Full Cache Clear

If Option 1 doesn't work:

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile

# Clear all caches
rm -rf node_modules/.cache
npx expo start -c
```

### Option 3: Reinstall (Nuclear Option)

If icons still don't update:

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile

# Clear everything
rm -rf node_modules
rm -rf .expo
npm install
npx expo start -c
```

## Production Build (App Store)

**Yes, you MUST rebuild for production:**

Icons are bundled into the app binary during the build process. To see updated icons in:
- App Store
- TestFlight
- Production builds
- Final app on device

You need to rebuild:

```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile

# Rebuild for production
eas build --platform ios --profile production
```

**Why rebuild is needed:**
- Icons are compiled into the app binary
- Native iOS/Android apps bundle assets at build time
- Development mode uses different asset loading

## Testing Icon Updates

### In Development (Simulator/Device)

1. **Update icon file:**
   ```bash
   # Replace mobile/assets/icon.png with your new icon
   ```

2. **Clear cache and restart:**
   ```bash
   npx expo start -c
   ```

3. **Check in simulator:**
   - Press `i` for iOS simulator
   - Check home screen icon
   - May need to uninstall/reinstall app in simulator

4. **If icon doesn't update:**
   - Delete app from simulator
   - Restart simulator
   - Run `npx expo start -c` again
   - Reinstall app

### In Production (TestFlight/App Store)

1. **Update icon files:**
   - Replace all icon files in `mobile/assets/`

2. **Rebuild:**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Submit to App Store:**
   ```bash
   eas submit --platform ios --profile production --latest
   ```

4. **Wait for processing:**
   - Build takes ~15-20 minutes
   - App Store Connect processing: ~5-10 minutes
   - Then check TestFlight or App Store Connect

## Icon Update Checklist

### Development Testing
- [ ] Replace icon file(s) in `mobile/assets/`
- [ ] Clear cache: `npx expo start -c`
- [ ] Check in simulator/device
- [ ] If not updating, delete app and reinstall

### Production Release
- [ ] Replace all icon files (icon, adaptive-icon, favicon, splash-icon)
- [ ] Verify file sizes are correct
- [ ] Rebuild: `eas build --platform ios --profile production`
- [ ] Submit: `eas submit --platform ios --profile production --latest`
- [ ] Verify in App Store Connect

## Troubleshooting

### Icon Not Updating in Development?

1. **Clear cache:**
   ```bash
   npx expo start -c
   ```

2. **Delete app from simulator:**
   - Long press app icon → Delete
   - Or: Simulator → Device → Erase All Content

3. **Restart everything:**
   ```bash
   # Kill Expo
   # Restart simulator
   npx expo start -c
   ```

4. **Check file:**
   ```bash
   # Verify icon file exists and is correct size
   file mobile/assets/icon.png
   # Should show: PNG image data, 1024 x 1024
   ```

### Icon Not Updating in Production?

1. **Verify files are correct:**
   - Check file sizes
   - Ensure no transparency in app icon
   - Verify file paths in `app.json`

2. **Rebuild required:**
   - Icons are bundled at build time
   - Must rebuild for changes to appear

3. **Check build logs:**
   ```bash
   eas build:list
   eas build:view [build-id]
   ```

## Summary

| Scenario | Rebuild Needed? | Command |
|----------|----------------|---------|
| **Development testing** | ❌ No | `npx expo start -c` |
| **Simulator/Device** | ❌ No | `npx expo start -c` |
| **TestFlight** | ✅ Yes | `eas build --platform ios` |
| **App Store** | ✅ Yes | `eas build --platform ios` |
| **Production app** | ✅ Yes | `eas build --platform ios` |

**Quick Rule:**
- **Development = Clear cache** (`npx expo start -c`)
- **Production = Rebuild** (`eas build`)



