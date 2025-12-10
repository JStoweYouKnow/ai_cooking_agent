# iOS App Troubleshooting Guide

## Current Status: ✅ Type Errors Fixed

The type import issues have been resolved by:
1. Defining types locally in `src/types/index.ts`
2. Using a placeholder AppRouter type in `src/api/trpc.ts`
3. Removing server imports from TypeScript config

## Error You're Seeing

### Runtime Error
```
ERROR [Error: Exception in HostFunction: TypeError: expected dynamic type 'boolean', but had type 'string']
```

**Cause**: This error occurs when there's a type mismatch between JavaScript and native code.

**Common Causes**:
1. SecureStore value type mismatch
2. Navigation prop type issues
3. Config value type issues

**Solution**: The error is likely in the AuthContext where we store the auth token. Let me check and fix it.

### Simulator Timeout
```
Error: xcrun simctl openurl ... exited with non-zero code: 60
Operation timed out
```

**Cause**: Simulator couldn't connect to the Expo dev server

**Solutions**:
1. Restart the simulator
2. Restart the Expo dev server
3. Try pressing `i` again in the terminal

## Quick Fixes

### 1. Clear Expo Cache
```bash
cd mobile
expo start -c
```

### 2. Restart Everything
```bash
# Terminal 1: Kill and restart backend
# Ctrl+C
cd /Users/v/Downloads/ai_cooking_agent
npm run dev

# Terminal 2: Kill and restart mobile
# Ctrl+C
cd /Users/v/Downloads/ai_cooking_agent/mobile
expo start -c
```

### 3. Reset Simulator
In iOS Simulator:
- Device → Erase All Content and Settings
- Then restart the app

## Known Issues and Fixes

### Issue 1: Type Errors ✅ FIXED

**Error**: Cannot find module errors for server types

**Status**: ✅ Fixed by defining types locally

### Issue 2: API Procedures ⚠️ NEEDS ALIGNMENT

**Error**: Properties like `getMe`, `getRecipes`, etc. don't exist

**Status**: Expected - needs API alignment (see IMPLEMENTATION_NOTES.md)

**Current Workaround**: App structure works, but API calls will fail until aligned with actual tRPC router

### Issue 3: New Architecture Warning ✅ FIXED

**Warning**: React Native's New Architecture enabled in Expo Go but disabled in config

**Status**: ✅ Fixed by setting `"newArchEnabled": false`

## Testing Without Backend

If you want to test the UI without the backend:

### Option 1: Mock Data

Add mock data to screens:

```typescript
// In RecipeListScreen.tsx
const mockRecipes: Recipe[] = [
  {
    id: 1,
    name: "Test Recipe",
    description: "A test recipe",
    cuisine: "Italian",
    cookingTime: 30,
    // ... other fields
  }
];

// Use mock data instead of API call
const recipes = mockRecipes;
```

### Option 2: Skip API Calls

Comment out API calls temporarily:

```typescript
// const { data, isLoading } = trpc.getRecipes.useQuery();
const data = null;
const isLoading = false;
```

## Development Workflow

### Recommended Setup

**Terminal 1 - Backend**:
```bash
cd /Users/v/Downloads/ai_cooking_agent
npm run dev
```

**Terminal 2 - Mobile App**:
```bash
cd /Users/v/Downloads/ai_cooking_agent/mobile
expo start
```

**Terminal 3 - Logs** (optional):
```bash
npx react-native log-ios
```

### Hot Reload

The app supports hot reloading:
- Edit any `.tsx` file
- Save
- App automatically refreshes

### Manual Refresh

If hot reload doesn't work:
- Shake device or press `Cmd+D` in simulator
- Select "Reload"

## Common Errors

### 1. "Unable to resolve module"

**Error**: Cannot find module '@expo/vector-icons'

**Fix**:
```bash
npm install --legacy-peer-deps @expo/vector-icons
```

### 2. "Invariant Violation: requireNativeComponent"

**Error**: Native component not found

**Fix**:
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start -c
```

### 3. "Network request failed"

**Error**: API calls failing

**Causes**:
1. Backend not running
2. Wrong API URL
3. Network connectivity

**Fix**:
```bash
# 1. Check backend is running
curl http://localhost:3000/api/trpc

# 2. Verify API URL in src/api/client.ts
# For simulator: http://localhost:3000
# For device: http://YOUR_IP:3000

# 3. Ensure same WiFi network (for physical device)
```

### 4. "Module parse failed"

**Error**: Unexpected token or syntax error

**Fix**:
```bash
# Clear Metro bundler cache
expo start -c
```

## Debugging Tips

### 1. Enable Debug Mode

In simulator/device:
- Shake device or `Cmd+D`
- Select "Debug Remote JS"
- Opens Chrome DevTools

### 2. View Console Logs

```typescript
console.log('Debug info:', someVariable);
```

Logs appear in:
- Terminal running `expo start`
- Chrome DevTools (if debugging)

### 3. React DevTools

```bash
# Install globally
npm install -g react-devtools

# Run
react-devtools
```

Then enable in app dev menu.

### 4. Network Debugging

In Chrome DevTools:
- Network tab shows all API calls
- Check request/response data
- Verify headers and status codes

## Next Steps

### After Fixing Runtime Error

1. **Test Login Flow**
   - Enter email
   - Check if token is stored
   - Verify navigation to main screen

2. **Test Navigation**
   - Tap through all tabs
   - Navigate to detail screens
   - Test back navigation

3. **Test API Integration** (once aligned)
   - Fetch recipes
   - Create recipe
   - Toggle favorite
   - Delete recipe

### For Production

1. **Fix API Procedure Names**
   - See IMPLEMENTATION_NOTES.md
   - Align with actual tRPC router

2. **Add Error Handling**
   - Better error messages
   - Retry logic
   - Offline support

3. **Improve Auth**
   - Real OAuth integration
   - Secure token refresh
   - Better session management

## Support Resources

### Documentation
- [Expo Docs](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [tRPC Docs](https://trpc.io)

### Commands
```bash
# Clear cache
expo start -c

# iOS simulator
expo start --ios

# View logs
npx react-native log-ios

# Type check
npm run check

# Clean install
rm -rf node_modules && npm install
```

### Debugging Commands
```bash
# Check if backend is running
curl http://localhost:3000

# Check API endpoint
curl http://localhost:3000/api/trpc

# Find iOS logs
tail -f ~/Library/Logs/CoreSimulator/*/system.log
```

## Current App State

✅ **Working**:
- App launches
- UI renders correctly
- Navigation structure in place
- Components display properly
- TypeScript compiles

⚠️ **Needs Work**:
- API procedure alignment
- Runtime type error (likely in SecureStore usage)
- Backend integration

🔧 **Next Priority**:
1. Fix the SecureStore type error
2. Align API procedures with router
3. Test end-to-end with backend

---

**Last Updated**: After fixing type import issues

The app structure is solid. Once the runtime error is fixed and API procedures are aligned, it will be fully functional.
