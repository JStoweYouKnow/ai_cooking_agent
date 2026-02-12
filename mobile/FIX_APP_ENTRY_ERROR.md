# Fix: Unable to resolve module ../../App

## Problem
Expo's `AppEntry.js` is trying to find `../../App` from within `node_modules`, but it should be using the custom `index.ts` entry point.

## Solution

### Step 1: Clear Metro Bundler Cache

```bash
cd mobile

# Clear Metro cache
npx expo start --clear

# Or if that doesn't work, try:
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

### Step 2: Verify Entry Point

The `package.json` should have:
```json
{
  "main": "index.ts"
}
```

And `index.ts` should import App:
```typescript
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```

### Step 3: If Still Not Working

If the issue persists, try:

1. **Restart the dev server completely:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then:
   npx expo start --clear
   ```

2. **Check if using pnpm causes issues:**
   ```bash
   # Try using npm instead temporarily
   rm -rf node_modules
   npm install
   npx expo start --clear
   ```

3. **Verify file structure:**
   - `mobile/index.ts` exists
   - `mobile/App.tsx` exists
   - Both are in the root of the `mobile/` directory

4. **Check Metro config:**
   The `metro.config.js` should use the default Expo config (which it does).

### Step 4: Alternative Fix (if above doesn't work)

If the issue persists, you might need to create an `index.js` file instead:

```bash
cd mobile
# Create index.js that points to index.ts
echo "module.exports = require('./index.ts');" > index.js
```

Then update `package.json`:
```json
{
  "main": "index.js"
}
```

But this should not be necessary - the TypeScript file should work directly.

## Most Likely Fix

The most common cause is a stale cache. Run:

```bash
cd mobile
npx expo start --clear
```

This should resolve the issue.
