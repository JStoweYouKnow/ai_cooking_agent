# Sous - iOS Mobile App

This is the iOS mobile application for Sous, built with React Native and Expo. It provides native iOS access to all features of the web application.

## Features

- 🍳 **Recipe Management**: Browse, search, create, and favorite recipes
- 🛒 **Shopping Lists**: Create and manage shopping lists
- 🥬 **Ingredient Tracking**: Keep track of available ingredients
- 📊 **Dashboard**: Overview of your cooking activity
- 🔐 **Secure Authentication**: Cookie-based sessions with secure storage
- 📱 **Native iOS Experience**: Optimized for iPhone and iPad

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **API**: tRPC for type-safe API calls
- **State Management**: React Query (TanStack Query)
- **Navigation**: React Navigation
- **UI Components**: Custom components matching web app design
- **Secure Storage**: Expo SecureStore for authentication tokens

## Prerequisites

Before running the app, ensure you have:

- Node.js (v18 or higher)
- npm or pnpm
- Xcode (for iOS development)
- CocoaPods (for iOS dependencies)
- Expo CLI

## Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. For iOS, install CocoaPods dependencies:
```bash
cd ios
pod install
cd ..
```

## Configuration

### API Endpoint

Update the API base URL in `src/api/client.ts`:

```typescript
const getBaseUrl = () => {
  if (__DEV__) {
    // For iOS Simulator, use localhost
    // For physical device, use your computer's IP address
    return "http://YOUR_COMPUTER_IP:3000";
  }
  return "https://sous.projcomfort.com";
};
```

### Running on Physical Device

If testing on a physical iPhone/iPad:

1. Find your computer's IP address:
   - macOS: System Preferences → Network
   - Or run: `ipconfig getifaddr en0`

2. Update `getBaseUrl()` with your IP:
   ```typescript
   return "http://192.168.1.XXX:3000";
   ```

3. Ensure your device and computer are on the same network

## Running the App

### Development Mode

Start the Expo development server:

```bash
npm start
```

Then press `i` to open iOS Simulator, or scan the QR code with your iPhone.

### iOS Simulator

```bash
npm run ios
```

This will build and run the app in the iOS Simulator.

### Physical Device

1. Install Expo Go app from the App Store
2. Run `npm start`
3. Scan the QR code with your iPhone camera
4. The app will open in Expo Go

## Project Structure

```
mobile/
├── src/
│   ├── api/              # tRPC client and API configuration
│   │   ├── trpc.ts       # tRPC client instance
│   │   └── client.ts     # Query client and configuration
│   ├── components/       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── RecipeCard.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── navigation/       # Navigation configuration
│   │   ├── types.ts
│   │   ├── RootNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   ├── RecipesNavigator.tsx
│   │   └── ShoppingListsNavigator.tsx
│   ├── screens/          # App screens
│   │   ├── Auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── Home/
│   │   │   └── HomeScreen.tsx
│   │   ├── Recipes/
│   │   │   ├── RecipeListScreen.tsx
│   │   │   ├── RecipeDetailScreen.tsx
│   │   │   └── CreateRecipeScreen.tsx
│   │   ├── ShoppingLists/
│   │   │   ├── ShoppingListsListScreen.tsx
│   │   │   ├── ShoppingListDetailScreen.tsx
│   │   │   └── CreateShoppingListScreen.tsx
│   │   ├── Ingredients/
│   │   │   └── IngredientsScreen.tsx
│   │   └── Settings/
│   │       └── SettingsScreen.tsx
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   └── utils/            # Utility functions
├── App.tsx               # Root component
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## Key Features Implementation

### Authentication

The app uses a simplified authentication flow:
- User enters email on login screen
- Email is stored in Expo SecureStore
- Auth token is included in all API requests
- AuthContext manages authentication state globally

### Navigation

The app uses React Navigation with the following structure:
- **Root Stack**: Login → Main
- **Main Tabs**: Home, Recipes, Shopping Lists, Ingredients, Settings
- **Nested Stacks**: Each tab has its own stack navigator for detail views

### API Integration

All API calls use tRPC for type-safe communication with the backend:

```typescript
// Example: Fetching recipes
const { data: recipes } = trpc.getRecipes.useQuery({
  search: searchQuery || undefined,
});

// Example: Creating a recipe
const createRecipe = trpc.createRecipe.useMutation({
  onSuccess: () => {
    utils.getRecipes.invalidate();
  },
});
```

### Styling

The app uses a consistent color scheme:
- Primary: `#6B8E23` (Olive Green)
- Secondary: `#8FBC8F` (Dark Sea Green)
- Background: `#F5F5F0` (Beige)

All components follow iOS design guidelines with:
- Native-feeling shadows and elevation
- Smooth animations
- Consistent spacing and typography

## Building for Production

### Create Production Build

```bash
eas build --platform ios
```

### Submit to App Store

```bash
eas submit --platform ios
```

You'll need:
- Apple Developer Account ($99/year)
- App Store Connect access
- App icons and screenshots
- App Store listing information

## iOS-Specific Optimizations

The app includes several iOS-specific optimizations:

1. **Safe Area Support**: Respects notch and home indicator
2. **Keyboard Avoidance**: Automatically adjusts for keyboard
3. **Native Navigation**: Uses native navigation transitions
4. **Haptic Feedback**: Can be added for button presses
5. **Dark Mode Support**: Ready for dark mode implementation
6. **Performance**: Optimized FlatLists for smooth scrolling

## Environment Variables

The app uses environment variables for configuration. Create a `.env` file:

```env
EXPO_PUBLIC_API_URL=https://sous.projcomfort.com
ENVIRONMENT=production
```

## Troubleshooting

### Common Issues

**1. "Unable to connect to server"**
- Ensure backend server is running
- Check API URL in `src/api/client.ts`
- Verify network connectivity

**2. "Module not found" errors**
- Run `npm install` again
- Clear Metro bundler cache: `expo start -c`

**3. iOS build fails**
- Update CocoaPods: `cd ios && pod install && cd ..`
- Clean build folder in Xcode

**4. TypeScript errors**
- Ensure server types are accessible
- Run `npm run check` to see type errors

### Debugging

Enable debugging in Expo:
1. Shake device or press `Cmd+D` in simulator
2. Select "Debug Remote JS"
3. Open Chrome DevTools

View logs:
```bash
npx react-native log-ios
```

## Testing

### Run Type Check

```bash
npm run check
```

### Manual Testing Checklist

- [ ] Login flow works
- [ ] Dashboard loads with correct stats
- [ ] Recipe list displays and search works
- [ ] Recipe detail shows all information
- [ ] Create recipe flow completes successfully
- [ ] Favorite/unfavorite recipes works
- [ ] Shopping lists load and display correctly
- [ ] Settings shows user information
- [ ] Logout works and returns to login screen

## Future Enhancements

Planned features for future releases:

- [ ] Push notifications for meal reminders
- [ ] Offline mode with local storage
- [ ] Camera integration for recipe photos
- [ ] Voice input for adding ingredients
- [ ] Share recipes with other users
- [ ] Meal planning calendar integration
- [ ] Dark mode support
- [ ] Accessibility improvements
- [ ] iPad-optimized layouts
- [ ] Widget support for quick access

## Contributing

When contributing to the mobile app:

1. Ensure TypeScript types are correct
2. Follow existing code style and component patterns
3. Test on both iPhone and iPad if possible
4. Verify changes don't break web app types
5. Update this README for new features

## Support

For issues or questions:
- Check existing issues in the repository
- Create a new issue with detailed description
- Include device model and iOS version

## License

Same license as the main AI Cooking Agent project.
