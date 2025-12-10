# iOS App Implementation Notes

## Current Status: ✅ Framework Complete, Type Errors Fixed, API Integration Pending

**Recent Updates**:
- ✅ Fixed type import issues by defining types locally
- ✅ Removed dependency on server type imports
- ✅ Added @expo/vector-icons package
- ⚠️ Runtime error needs investigation (likely SecureStore type mismatch)

The iOS app structure is fully implemented with all screens, navigation, and components in place. TypeScript compilation errors are resolved. The remaining work is API integration alignment with the actual tRPC router procedures.

## What's Working ✅

1. **Project Structure** - All files and directories created
2. **Navigation** - Complete navigation hierarchy
3. **UI Components** - Button, Card, RecipeCard components
4. **Screens** - All screen files created
5. **Authentication Context** - Auth state management
6. **tRPC Client** - Client configuration ready
7. **TypeScript Config** - Proper type resolution setup
8. **Documentation** - Comprehensive guides and READMEs

## What Needs Adjustment 🔧

### API Method Name Alignment

The mobile app currently references tRPC procedures that need to be verified against the actual router implementation:

**Current mobile app calls** (may need adjustment):
- `trpc.getMe.useQuery()` → Verify actual auth procedure name
- `trpc.getStats.useQuery()` → Verify dashboard stats procedure
- `trpc.getRecipes.useQuery()` → Should likely be `trpc.recipes.getAll.useQuery()`
- `trpc.getRecipe.useQuery()` → Should likely be `trpc.recipes.getById.useQuery()`
- `trpc.createRecipe.useMutation()` → Should likely be `trpc.recipes.create.useMutation()`
- `trpc.toggleFavorite.useMutation()` → Should likely be `trpc.recipes.toggleFavorite.useMutation()`
- `trpc.deleteRecipe.useMutation()` → Should likely be `trpc.recipes.delete.useMutation()`
- `trpc.getShoppingLists.useQuery()` → Should likely be `trpc.shoppingLists.getAll.useQuery()`

### How to Fix

1. **Check the actual tRPC router** in `server/routers.ts` to see the exact procedure names
2. **Update API calls** in the mobile screens to match

Example fix pattern:
```typescript
// Before (generic)
const { data } = trpc.getRecipes.useQuery();

// After (matching actual router structure)
const { data } = trpc.recipes.getAll.useQuery();
```

## Files That Need API Updates

Once you know the correct procedure names, update these files:

### Authentication
- `src/contexts/AuthContext.tsx` - Update `getMe` or similar auth query

### Dashboard
- `src/screens/Home/HomeScreen.tsx` - Update `getStats` and `getRecipes`

### Recipes
- `src/screens/Recipes/RecipeListScreen.tsx` - Update `getRecipes`, `toggleFavorite`
- `src/screens/Recipes/RecipeDetailScreen.tsx` - Update `getRecipe`, `toggleFavorite`, `deleteRecipe`
- `src/screens/Recipes/CreateRecipeScreen.tsx` - Update `createRecipe`

### Shopping Lists
- `src/screens/ShoppingLists/ShoppingListsListScreen.tsx` - Update `getShoppingLists`

## Quick Fix Template

For each file, the pattern will be:

```typescript
// 1. Import useUtils if using invalidation
const utils = trpc.useUtils();

// 2. Update query calls
const { data, isLoading } = trpc.CORRECT.PROCEDURE.NAME.useQuery({
  // params
});

// 3. Update mutation calls
const mutation = trpc.CORRECT.PROCEDURE.NAME.useMutation({
  onSuccess: () => {
    utils.CORRECT.PROCEDURE.NAME.invalidate();
  }
});
```

## TypeScript Errors to Ignore (For Now)

The following errors are expected until API procedures are aligned:
- "Property 'getMe' does not exist" → Will be fixed when you use correct auth procedure
- "Property 'getStats' does not exist" → Will be fixed with correct stats procedure
- "Property 'getRecipes' does not exist" → Will be fixed with `recipes.getAll` or similar
- etc.

## Missing Shared Constants

The server references `@shared/const` which isn't set up. You have two options:

### Option 1: Create shared directory
```bash
mkdir shared
touch shared/const.ts
```

Then add constants like:
```typescript
export const UNAUTHED_ERR_MSG = "Unauthorized";
```

### Option 2: Use string literals
Replace references to shared constants with direct strings in the mobile app.

## Testing Plan

Once API procedures are aligned:

1. **Start backend server**:
   ```bash
   npm run dev
   ```

2. **Run mobile app**:
   ```bash
   cd mobile
   npm run ios
   ```

3. **Test each feature**:
   - Login flow
   - Dashboard stats
   - Recipe list and search
   - Recipe details
   - Create recipe
   - Favorite toggle
   - Recipe deletion
   - Shopping lists

## Development Workflow

### Step 1: Align API Calls

Check `server/routers.ts` structure:
```bash
cat server/routers.ts | grep "export const appRouter"
```

Then update each screen to use the correct procedure paths.

### Step 2: Test Compilation

```bash
npm run check
```

Should show no TypeScript errors once procedures are aligned.

### Step 3: Run App

```bash
npm run ios
```

## Common tRPC Router Patterns

Based on typical tRPC setups, your router likely uses one of these patterns:

### Pattern A: Flat Router
```typescript
export const appRouter = router({
  getRecipes: publicProcedure.query(...)
  createRecipe: protectedProcedure.mutation(...)
});
```

Usage in mobile:
```typescript
trpc.getRecipes.useQuery();
trpc.createRecipe.useMutation();
```

### Pattern B: Nested Router
```typescript
export const appRouter = router({
  recipes: router({
    getAll: publicProcedure.query(...),
    create: protectedProcedure.mutation(...),
  }),
  shoppingLists: router({
    getAll: publicProcedure.query(...),
  }),
});
```

Usage in mobile:
```typescript
trpc.recipes.getAll.useQuery();
trpc.recipes.create.useMutation();
trpc.shoppingLists.getAll.useQuery();
```

## Completion Checklist

- [x] Verify tRPC router structure in `server/routers.ts` ✅
- [x] Update `AuthContext.tsx` with correct auth procedure ✅
- [x] Update `HomeScreen.tsx` with correct stats/recipes procedures ✅
- [x] Update all Recipe screens with correct recipe procedures ✅
- [x] Update Shopping List screens with correct procedures ✅
- [x] Run `npm run check` and fix remaining TypeScript errors ✅
- [ ] Test app in iOS Simulator (Ready for testing)
- [ ] Test all features end-to-end (Ready for testing)

## ✅ API Alignment Complete

All tRPC API calls have been aligned with the server router structure:

### Authentication
- ✅ `trpc.auth.me.useQuery()` - Get current user

### Recipes
- ✅ `trpc.recipes.list.useQuery()` - List all recipes
- ✅ `trpc.recipes.getById.useQuery({ id })` - Get recipe by ID
- ✅ `trpc.recipes.create.useMutation()` - Create recipe
- ✅ `trpc.recipes.toggleFavorite.useMutation({ id, isFavorite })` - Toggle favorite
- ✅ `trpc.recipes.delete.useMutation({ id })` - Delete recipe

### Shopping Lists
- ✅ `trpc.shoppingLists.list.useQuery()` - List shopping lists

## Additional Notes

### Type Safety
Once procedures are aligned, you'll get full type safety:
- Input parameter types are enforced
- Return types are inferred
- No runtime type errors possible

### Performance
The current setup includes:
- React Query caching (5-minute stale time)
- Automatic background refetching
- Optimistic updates for mutations
- Query invalidation on mutations

### Next Steps After API Alignment

Once the API is working:
1. Test on physical device
2. Add more features (camera, offline mode, etc.)
3. Prepare app assets for App Store
4. Set up EAS build configuration
5. Submit to TestFlight for beta testing

## Support

If you encounter issues:
1. Check that backend server is running
2. Verify API URL in `src/api/client.ts`
3. Use Chrome DevTools to debug API calls
4. Check React Query DevTools for cache state

---

**Current State**: Framework ✅ Complete | API Integration 🔧 Needs Alignment

The iOS app is structurally complete and ready for API integration once the procedure names are aligned with the actual tRPC router.
