# Mobile App Verification Checklist

## ✅ Completed Fixes

### 1. Type System Alignment ✅
- **Fixed**: All tRPC API calls aligned with server router structure
- **Verified**: All procedure names match `server/routers.ts`
- **Status**: Complete

### 2. Boolean Type Issues ✅
- **Fixed**: Disabled New Architecture (`newArchEnabled: false`)
- **Fixed**: All boolean values use `Boolean()` constructor
- **Fixed**: Context values explicitly typed as booleans
- **Status**: Should be resolved

### 3. Dependencies ✅
- **Fixed**: Installed missing peer dependencies (`expo-font`, `react-dom`)
- **Fixed**: Updated `expo-secure-store` to compatible version (~15.0.7)
- **Fixed**: Added `@trpc/server` dependency
- **Status**: Complete

### 4. Configuration ✅
- **Fixed**: `app.json` configuration updated
- **Fixed**: Added `expo-font` plugin
- **Status**: Complete

## 🔍 Verification Steps

### Step 1: Verify tRPC API Alignment

All API calls should match the router structure:

```typescript
// ✅ CORRECT - Matches router
trpc.auth.me.useQuery()
trpc.recipes.list.useQuery()
trpc.recipes.getById.useQuery({ id })
trpc.recipes.create.useMutation()
trpc.recipes.toggleFavorite.useMutation({ id, isFavorite })
trpc.recipes.delete.useMutation({ id })
trpc.shoppingLists.list.useQuery()
```

### Step 2: Test Boolean Types

Run this check in your app:

```typescript
// In RootNavigator.tsx or any component
const auth = useAuth();
console.log('isLoading type:', typeof auth.isLoading); // Should be 'boolean'
console.log('isAuthenticated type:', typeof auth.isAuthenticated); // Should be 'boolean'
console.log('isLoading value:', auth.isLoading); // Should be true/false, not "true"/"false"
```

### Step 3: Test API Calls

1. **Start Backend**:
   ```bash
   npm run dev
   ```

2. **Start Mobile App**:
   ```bash
   cd mobile
   npm start -- --reset-cache
   ```

3. **Test Each Screen**:
   - Login screen should load
   - After login, dashboard should show
   - Recipe list should fetch data
   - Recipe detail should load
   - Shopping lists should load

### Step 4: Check for Runtime Errors

Monitor the console for:
- ✅ No "expected dynamic type 'boolean'" errors
- ✅ No "Property does not exist" errors
- ✅ No module resolution errors

## 📋 API Call Verification

### Authentication
- [x] `trpc.auth.me.useQuery()` - Get current user
- [x] `trpc.auth.logout.useMutation()` - Logout (if needed)

### Recipes
- [x] `trpc.recipes.list.useQuery()` - List all recipes
- [x] `trpc.recipes.getById.useQuery({ id })` - Get recipe by ID
- [x] `trpc.recipes.create.useMutation()` - Create recipe
- [x] `trpc.recipes.toggleFavorite.useMutation({ id, isFavorite })` - Toggle favorite
- [x] `trpc.recipes.delete.useMutation({ id })` - Delete recipe

### Shopping Lists
- [x] `trpc.shoppingLists.list.useQuery()` - List shopping lists

## 🐛 Known Issues & Solutions

### Issue: Boolean Type Error
**Status**: Should be fixed by disabling New Architecture
**If persists**: Check that all boolean props use `Boolean()` constructor

### Issue: Simulator Timeout
**Solution**: 
```bash
# Restart simulator
# Restart Expo server with cleared cache
cd mobile
npm start -- --reset-cache
```

### Issue: API Connection Failed
**Solution**:
1. Verify backend is running on `http://localhost:3000`
2. Check `mobile/src/api/client.ts` has correct URL
3. For physical device, use computer's IP address

## ✅ End-to-End Test Checklist

### Authentication Flow
- [ ] App launches without errors
- [ ] Login screen displays
- [ ] Can enter email and login
- [ ] Token stored in SecureStore
- [ ] Navigates to dashboard after login
- [ ] User data loads correctly

### Recipe Flow
- [ ] Recipe list loads from API
- [ ] Can view recipe details
- [ ] Can toggle favorite status
- [ ] Can create new recipe
- [ ] Can delete recipe
- [ ] Search functionality works (if implemented)

### Shopping List Flow
- [ ] Shopping list screen loads
- [ ] Can view shopping lists
- [ ] Can create new shopping list
- [ ] Can view shopping list details

### Navigation Flow
- [ ] Bottom tabs work correctly
- [ ] Can navigate between screens
- [ ] Back navigation works
- [ ] Deep linking works (if implemented)

## 🎯 Success Criteria

The app is considered working when:
1. ✅ No runtime type errors
2. ✅ All screens load without crashing
3. ✅ API calls succeed and return data
4. ✅ Navigation works smoothly
5. ✅ Boolean values are properly typed
6. ✅ No console errors or warnings

## 📝 Next Steps After Verification

Once verified:
1. Add error handling for API failures
2. Add loading states for better UX
3. Add offline support
4. Improve error messages
5. Add analytics/tracking
6. Prepare for production build



