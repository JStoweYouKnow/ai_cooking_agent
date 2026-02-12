# Debugging App Crash on Launch

## Common Causes & Solutions

### 1. Check Xcode Console Logs
The most important step - check what error is showing in Xcode's console:

1. Open Xcode
2. Go to View → Debug Area → Show Debug Area (or press `Cmd + Shift + Y`)
3. Look for red error messages
4. Check the stack trace

### 2. Check Metro Bundler Logs
Check the terminal where Metro is running for JavaScript errors:

```bash
# Look for red error messages
# Common errors:
# - Module not found
# - Cannot read property of undefined
# - Network request failed
```

### 3. Common Crash Causes

#### A. Missing Native Modules
**Symptoms:** "No such module" or "undefined is not an object"
**Solution:**
```bash
cd mobile/ios
pod install
cd ..
pnpm start --reset-cache
```

#### B. Environment Variables Missing
**Symptoms:** API calls fail, undefined values
**Solution:** Check `app.json` has all required `EXPO_PUBLIC_*` variables

#### C. Provider Initialization Error
**Symptoms:** "Cannot read property" in context providers
**Solution:** Check all context providers are properly initialized

#### D. Theme Context Loading
**Fixed:** ThemeProvider now provides default theme during load

#### E. AsyncStorage Access
**Symptoms:** "AsyncStorage is null" or storage errors
**Solution:** Ensure AsyncStorage is properly installed

### 4. Quick Fixes Applied

✅ **ThemeProvider Fix**
- Now provides default theme during load instead of returning null
- Prevents app from crashing while theme loads

✅ **Error Handling**
- Added try-catch around Sentry initialization
- Added try-catch around Analytics initialization
- Added try-catch around Notification handler

### 5. Debug Steps

#### Step 1: Check Console Logs
Look for:
- `[App] All imports loaded successfully` - means imports work
- `[App] Component rendering...` - means component started
- Any red error messages

#### Step 2: Simplify App.tsx (Temporary)
Comment out providers one by one to isolate the issue:

```tsx
// Comment out providers to find the culprit
// <RevenueCatProvider>
// <NetworkProvider>
// etc.
```

#### Step 3: Check Native Modules
```bash
cd mobile/ios
pod install --repo-update
```

#### Step 4: Clear Caches
```bash
cd mobile
# Clear Metro cache
pnpm start --reset-cache

# In Xcode: Product → Clean Build Folder (Shift+Cmd+K)
```

### 6. Check These Files

1. **App.tsx** - Entry point, check all imports
2. **index.js** - Registration point
3. **ThemeContext.tsx** - Recently added, check exports
4. **client.ts** - API client initialization
5. **All context providers** - Check they exist and export correctly

### 7. Most Likely Issues

Based on recent changes:

1. **ThemeContext** - Fixed to not return null during load
2. **Missing exports** - Check all context providers export correctly
3. **Circular dependencies** - Check imports don't create cycles
4. **Native module issues** - Run `pod install`

### 8. Get Detailed Error

Add this to App.tsx temporarily:

```tsx
export default function App() {
  try {
    // ... existing code
  } catch (error) {
    console.error("[App] CRASH:", error);
    Alert.alert("App Error", String(error));
    return <View><Text>Error: {String(error)}</Text></View>;
  }
}
```

### 9. Check Device Logs

If running on physical device:
```bash
# View device logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Sous"'
```

### 10. Verify All Dependencies

```bash
cd mobile
pnpm install
cd ios
pod install
```

---

## Next Steps

1. **Check Xcode console** for the actual error message
2. **Check Metro logs** for JavaScript errors
3. **Try the fixes** applied above
4. **Report the specific error** you see in the console

The fixes I applied should prevent crashes from:
- Theme loading
- Sentry initialization
- Analytics initialization
- Notification handler setup

But we need the actual error message from Xcode console to fix the root cause!
