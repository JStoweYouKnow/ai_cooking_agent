# Network Connection Troubleshooting

## Error: "Network request failed"

This error means the mobile app can't reach the backend server.

## Quick Fixes

### 1. Verify Backend is Running
```bash
# Check if backend is running
curl http://localhost:3000/api/trpc/auth.me

# Should return JSON, not HTML
```

### 2. For iOS Simulator
The simulator should be able to use `localhost:3000`. If it doesn't work:

**Option A: Use IP Address**
1. Find your computer's IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
2. Update `mobile/src/api/client.ts`:
   ```typescript
   return "http://192.168.1.94:3000"; // Use your IP
   ```

**Option B: Check Simulator Network**
1. In iOS Simulator: Settings → General → Reset → Reset Network Settings
2. Restart simulator

### 3. For Physical Device (Expo Go)
You MUST use your computer's IP address, not localhost:

1. Find your IP:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update `mobile/src/api/client.ts`:
   ```typescript
   return "http://192.168.1.94:3000"; // Your computer's IP
   ```

3. Ensure device and computer are on the same WiFi network

### 4. Use Environment Variable
Create `.env` file in `mobile/` directory:
```
EXPO_PUBLIC_API_URL=http://192.168.1.94:3000
```

Then restart Expo.

### 5. Check Firewall
Make sure your firewall allows connections on port 3000:
```bash
# macOS: System Settings → Network → Firewall
# Allow Node.js or Terminal through firewall
```

### 6. Test Connection
In the mobile app console, you should see:
```
[API] Using base URL: http://localhost:3000
```

If you see network errors, check:
- Backend is running: `npm run dev` in project root
- Port 3000 is accessible
- No firewall blocking connections

## Common Issues

### Issue: "Network request failed" in Simulator
**Solution**: Try using IP address instead of localhost

### Issue: "Network request failed" on Physical Device
**Solution**: Must use IP address, not localhost. Ensure same WiFi network.

### Issue: Backend returns HTML instead of JSON
**Solution**: Check that `/api/trpc` endpoint is configured correctly in Next.js

### Issue: CORS errors
**Solution**: Next.js should handle CORS automatically. If issues persist, check Next.js config.

## Testing the Connection

### From Terminal
```bash
# Test backend
curl http://localhost:3000/api/trpc/auth.me

# Should return: {"result":{"data":{"json":null}}}
```

### From Mobile App
Check console logs for:
- `[API] Using base URL: ...`
- Network request errors
- Connection timeouts

## Quick Test

1. **Start Backend**:
   ```bash
   npm run dev
   ```

2. **Verify Backend**:
   ```bash
   curl http://localhost:3000/api/trpc/auth.me
   ```

3. **Update Mobile API URL** (if needed):
   Edit `mobile/src/api/client.ts` to use IP address

4. **Restart Mobile App**:
   ```bash
   cd mobile
   npm start -- --reset-cache
   ```

5. **Check Console**:
   Look for `[API] Using base URL:` message

## Your Current Setup

- **Backend URL**: `http://localhost:3000`
- **Your IP**: `192.168.1.94`
- **For Simulator**: Try `localhost:3000` first, then `192.168.1.94:3000` if needed
- **For Physical Device**: Use `192.168.1.94:3000`



