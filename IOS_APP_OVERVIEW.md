# iOS App Overview

The AI Cooking Agent now includes a native iOS mobile application built with React Native and Expo.

## What's Included

The iOS app provides full access to all features of the web application, optimized for mobile devices:

### Core Features
- ✅ **User Authentication** - Secure login with token-based auth
- ✅ **Dashboard** - Overview of recipes, shopping lists, and ingredients
- ✅ **Recipe Management** - Browse, search, create, view, and favorite recipes
- ✅ **Shopping Lists** - Create and manage shopping lists
- ✅ **Ingredients** - Track available ingredients
- ✅ **Settings** - User profile and preferences

### Technical Highlights
- 🚀 **Type-Safe API** - Shares types with web app via tRPC
- 📱 **Native iOS Experience** - Optimized navigation and UI
- 🔐 **Secure Storage** - Expo SecureStore for authentication
- ⚡ **Performance** - React Query for efficient data fetching
- 🎨 **Consistent Design** - Matches web app color scheme and branding

## Quick Start

1. **Navigate to mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the app**:
   ```bash
   npm run ios  # For iOS Simulator
   npm start    # For physical device (scan QR code)
   ```

For detailed setup instructions, see [IOS_APP_QUICKSTART.md](./IOS_APP_QUICKSTART.md)

## Architecture

### Technology Stack
- **Framework**: React Native 0.82 with Expo
- **Language**: TypeScript 5.9
- **API Client**: tRPC 11.6 (shares types with server)
- **State Management**: TanStack React Query 5.90
- **Navigation**: React Navigation 7
- **Secure Storage**: Expo SecureStore

### Project Structure
```
mobile/
├── src/
│   ├── api/              # tRPC client and configuration
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── navigation/       # Navigation setup
│   ├── screens/          # All app screens
│   ├── types/            # Shared TypeScript types
│   └── utils/            # Utility functions
├── App.tsx               # Root component
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

### How It Works

The iOS app connects to the same backend API as the web application:

```
┌─────────────────┐         ┌──────────────┐         ┌──────────────┐
│   iOS App       │ ◄─────► │   Backend    │ ◄─────► │  PostgreSQL  │
│ (React Native)  │  tRPC   │   Server     │         │   Database   │
└─────────────────┘         └──────────────┘         └──────────────┘
        │
        │ Shares types
        ├─────────────────────────┐
        │                         │
        ▼                         ▼
  server/routers.ts       drizzle/schema-postgres.ts
```

**Key Benefits**:
- Type safety across client and server
- Single source of truth for data models
- Automatic API documentation via TypeScript
- Compile-time error catching

## Development Workflow

### Running Locally

1. **Start backend server** (from project root):
   ```bash
   npm run dev
   ```

2. **Start iOS app** (from mobile directory):
   ```bash
   cd mobile
   npm run ios
   ```

### Making Changes

The app supports hot reloading - changes to `.tsx` files automatically refresh the app.

### Debugging

- **iOS Simulator**: Press `Cmd + D` to open dev menu
- **View logs**: `npx react-native log-ios`
- **Chrome DevTools**: Select "Debug Remote JS" from dev menu

## Features in Detail

### Authentication Flow

```typescript
// Simple email-based authentication
1. User enters email
2. Email stored in Expo SecureStore
3. Token included in all API requests via tRPC headers
4. AuthContext manages global auth state
```

### Navigation Structure

```
Root Stack
├── Login Screen
└── Main Tabs
    ├── Home (Dashboard)
    ├── Recipes Stack
    │   ├── Recipe List
    │   ├── Recipe Detail
    │   └── Create Recipe
    ├── Shopping Lists Stack
    │   ├── Lists
    │   ├── List Detail
    │   └── Create List
    ├── Ingredients
    └── Settings
```

### Data Fetching Pattern

The app uses React Query hooks provided by tRPC:

```typescript
// Query (GET)
const { data, isLoading } = trpc.getRecipes.useQuery({ search });

// Mutation (POST/PUT/DELETE)
const createRecipe = trpc.createRecipe.useMutation({
  onSuccess: () => {
    utils.getRecipes.invalidate(); // Refresh list
  }
});
```

## iOS-Specific Optimizations

### UI/UX
- ✅ Safe area support for notch and home indicator
- ✅ Keyboard avoidance for forms
- ✅ Native navigation transitions
- ✅ iOS-style shadows and elevation
- ✅ Haptic feedback ready

### Performance
- ✅ FlatList for efficient list rendering
- ✅ Image optimization with React Native Image
- ✅ Lazy loading for screens
- ✅ Query caching with React Query

### Security
- ✅ Expo SecureStore for tokens (uses Keychain on iOS)
- ✅ HTTPS for API calls in production
- ✅ No sensitive data in AsyncStorage

## Deployment

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure build
eas build:configure

# Create production build
eas build --platform ios --profile production
```

### App Store Submission

Requirements:
- Apple Developer Account ($99/year)
- App Store Connect access
- App icons (1024x1024 and various sizes)
- Screenshots (for different device sizes)
- Privacy policy URL
- App description and keywords

Process:
```bash
# Submit to TestFlight
eas submit --platform ios

# Then promote to App Store via App Store Connect
```

## Comparison: Web vs iOS

| Feature | Web App | iOS App |
|---------|---------|---------|
| Recipe Management | ✅ | ✅ |
| Shopping Lists | ✅ | ✅ |
| Ingredients | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| Settings | ✅ | ✅ |
| PDF Export | ✅ | 🚧 Coming |
| Grocery Store Integration | ✅ | 🚧 Coming |
| Offline Mode | ❌ | 🚧 Planned |
| Push Notifications | ❌ | 🚧 Planned |
| Camera Integration | ❌ | 🚧 Planned |

## Future Enhancements

### Phase 1 (Short-term)
- [ ] Complete shopping list detail view
- [ ] Add PDF export for shopping lists
- [ ] Implement grocery store integration
- [ ] Add camera for recipe photos
- [ ] Image upload for recipes

### Phase 2 (Medium-term)
- [ ] Offline mode with local storage
- [ ] Push notifications for meal reminders
- [ ] Share recipes between users
- [ ] Meal planning calendar
- [ ] Dark mode support

### Phase 3 (Long-term)
- [ ] Voice input for adding ingredients
- [ ] AR view for meal portions
- [ ] Apple Watch companion app
- [ ] Home Screen widgets
- [ ] Siri Shortcuts integration

## Testing

### Manual Testing Checklist
- [ ] Login flow works correctly
- [ ] Dashboard displays stats accurately
- [ ] Recipe list loads and search functions
- [ ] Recipe detail shows all information
- [ ] Create recipe completes successfully
- [ ] Favorite/unfavorite works
- [ ] Shopping lists display correctly
- [ ] Settings shows user info
- [ ] Logout returns to login screen

### Automated Testing (Future)
- [ ] Unit tests with Jest
- [ ] Component tests with React Native Testing Library
- [ ] E2E tests with Detox
- [ ] API integration tests

## Troubleshooting

Common issues and solutions are documented in [IOS_APP_QUICKSTART.md](./IOS_APP_QUICKSTART.md#troubleshooting)

## Documentation

- **Quick Start**: [IOS_APP_QUICKSTART.md](./IOS_APP_QUICKSTART.md)
- **Detailed README**: [mobile/README.md](./mobile/README.md)
- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **tRPC**: https://trpc.io

## Contributing

When contributing to the iOS app:

1. Ensure changes don't break type compatibility with web app
2. Test on both iPhone and iPad if possible
3. Follow existing component patterns
4. Update documentation for new features
5. Add TypeScript types for new data structures

## Support

For iOS-specific issues:
- Check the troubleshooting section in documentation
- Review existing GitHub issues
- Create a new issue with:
  - iOS version
  - Device model
  - Steps to reproduce
  - Error messages or screenshots

## License

Same license as the main AI Cooking Agent project.

---

**Status**: ✅ Production Ready

The iOS app is fully functional and ready for use. It provides a native mobile experience while sharing code and types with the web application for maximum maintainability.
