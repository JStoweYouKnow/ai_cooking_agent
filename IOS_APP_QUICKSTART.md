# iOS App Quick Start Guide

This guide will help you get the iOS mobile app running quickly.

## Prerequisites

Ensure you have these installed:
- Node.js 18+ and npm
- Xcode (download from Mac App Store)
- CocoaPods: `sudo gem install cocoapods`

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Start the Backend Server

In a separate terminal, from the project root:

```bash
npm run dev
```

The server should start on `http://localhost:3000`

### 3. Configure API Endpoint

If testing on an iPhone/iPad (not simulator), update `mobile/src/api/client.ts`:

```typescript
// Find your computer's IP: System Preferences → Network
const getBaseUrl = () => {
  if (__DEV__) {
    return "http://192.168.1.XXX:3000"; // Replace XXX with your IP
  }
  return "https://your-production-url.com";
};
```

### 4. Run the App

#### Option A: iOS Simulator (Easiest)

```bash
npm run ios
```

This will:
- Open Xcode Simulator
- Build and launch the app

#### Option B: Physical iPhone/iPad

```bash
npm start
```

Then:
1. Install "Expo Go" from the App Store
2. Scan the QR code with your iPhone camera
3. App will open in Expo Go

## Testing the App

### Login
1. Enter any email address
2. Tap "Sign In"
3. You'll be taken to the dashboard

### Available Features

**Dashboard**
- View recipe count, shopping lists, ingredients
- Quick actions for adding recipes and lists
- See recent recipes

**Recipes**
- Browse all recipes
- Search recipes by name
- View recipe details
- Add to favorites
- Create new recipes

**Shopping Lists**
- View all shopping lists
- Create new lists
- (Detail view coming soon)

**Settings**
- View user information
- Sign out

## Troubleshooting

### Can't connect to server

**Problem**: App shows "Unable to connect" or API errors

**Solutions**:
1. Verify backend is running: `http://localhost:3000`
2. Check API URL in `mobile/src/api/client.ts`
3. If on physical device, ensure same WiFi network
4. Use computer's IP address, not localhost

### App won't start

**Problem**: Build fails or app crashes

**Solutions**:
1. Clear Metro cache: `npx expo start -c`
2. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install
   ```
3. If iOS pod issues:
   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   ```

### TypeScript errors

**Problem**: Type errors or "Cannot find module" errors

**Solutions**:
1. Ensure you're in the mobile directory
2. Check that `../server/routers.ts` is accessible
3. Run: `npx tsc --noEmit` to see all type errors

### Simulator is slow

**Problem**: iOS Simulator running slowly

**Solutions**:
1. Close other apps to free up memory
2. Use a newer simulator device (iPhone 15, etc.)
3. Restart simulator: Device → Restart

## Development Workflow

### Making Changes

The app supports hot reloading:
1. Edit any `.tsx` file
2. Save the file
3. App automatically reloads

### Debugging

**View Logs**:
```bash
npx react-native log-ios
```

**Open Dev Menu**:
- iOS Simulator: `Cmd + D`
- Physical device: Shake device

**Debug with Chrome**:
1. Open dev menu
2. Select "Debug Remote JS"
3. Opens Chrome DevTools

### Testing API Calls

All API calls use tRPC. To see what's happening:

```typescript
// In any screen
const { data, isLoading, error } = trpc.getRecipes.useQuery();

console.log('Loading:', isLoading);
console.log('Data:', data);
console.log('Error:', error);
```

## Next Steps

### Customize the App

1. **Update Colors**: Edit color values in screen styles
2. **Add Features**: Create new screens in `src/screens/`
3. **Modify Navigation**: Update `src/navigation/` files

### Production Build

When ready to deploy:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

## Project Structure

```
mobile/
├── src/
│   ├── api/           # tRPC client setup
│   ├── components/    # Reusable UI components
│   ├── contexts/      # Auth and global state
│   ├── navigation/    # App navigation setup
│   ├── screens/       # All app screens
│   └── types/         # TypeScript types
├── App.tsx            # Root component
├── app.json           # Expo configuration
└── package.json
```

## Common Tasks

### Add a New Screen

1. Create file in `src/screens/[Category]/NewScreen.tsx`
2. Add to navigator in `src/navigation/`
3. Add navigation types in `src/navigation/types.ts`

### Add a New API Call

The app uses the same tRPC router as the web app:

```typescript
// Example
const createRecipe = trpc.createRecipe.useMutation({
  onSuccess: () => {
    // Refresh recipe list
    utils.getRecipes.invalidate();
  }
});
```

### Update Styling

All styles use React Native StyleSheet:

```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F0',
    padding: 16,
  }
});
```

## Getting Help

- Check `mobile/README.md` for detailed documentation
- View example screens in `src/screens/` for patterns
- Check tRPC docs: https://trpc.io
- React Navigation docs: https://reactnavigation.org

## Performance Tips

1. **Use FlatList** for long lists (already implemented)
2. **Lazy load images** with React Native Image
3. **Memoize components** that don't change often
4. **Profile with Flipper** for performance issues

## Recommended Tools

- **Expo Go**: Test on physical device without building
- **React DevTools**: Debug component hierarchy
- **Reactotron**: Advanced debugging and API inspection
- **Flipper**: Performance profiling

---

**You're all set!** 🎉

The iOS app is now running and connected to your backend. Start exploring the features and customize it to match your needs.
