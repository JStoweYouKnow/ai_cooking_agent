# Simulator Connection Timeout Fix

## Error
```
Error: xcrun simctl openurl ... exp://192.168.1.94:8081 exited with non-zero code: 60
Operation timed out
```

## Quick Fixes

### Option 1: Restart Simulator (Easiest)
1. Close iOS Simulator completely
2. Restart Expo dev server:
   ```bash
   cd mobile
   npm start -- --reset-cache
   ```
3. Press `i` again to launch simulator

### Option 2: Use Expo Go Instead
1. Install Expo Go app on your iPhone/iPad
2. Scan the QR code from the terminal
3. App will open in Expo Go (more reliable than simulator)

### Option 3: Reset Simulator
1. In iOS Simulator: Device → Erase All Content and Settings
2. Restart Expo: `npm start -- --reset-cache`
3. Press `i` to launch

### Option 4: Kill and Restart Expo
```bash
# Kill existing Expo process
kill -9 $(lsof -ti:8081)

# Restart Expo
cd mobile
npm start -- --reset-cache
```

### Option 5: Use Tunnel Mode
```bash
cd mobile
npx expo start --tunnel
```
This uses Expo's tunnel service (slower but more reliable)

## Why This Happens

- Simulator network stack issues
- Expo dev server connection problems
- Port conflicts
- Simulator state corruption

## Prevention

Always use `--reset-cache` when restarting:
```bash
npm start -- --reset-cache
```



