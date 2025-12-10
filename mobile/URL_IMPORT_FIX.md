# URL Import Fix - Ingredients Not Being Picked Up

## Issue
When importing recipes from URLs in the mobile app, ingredients (and other recipe data) were not being populated in the create recipe form.

## Root Cause
The tRPC `parseFromUrl` endpoint returns different response structures based on the `autoSave` parameter:
- `autoSave: false` → Returns `{ parsed: { name, ingredients, ... } }`
- `autoSave: true` → Returns `{ id: ... }` (recipe saved, only ID returned)

The CreateRecipeScreen was using `autoSave: false` but trying to access recipe properties directly on the response object instead of accessing them through the `parsed` property.

## Fix Applied
**File:** `mobile/src/screens/Recipes/CreateRecipeScreen.tsx`

**Change (Line 74):**
```typescript
// Before:
const data = response;

// After:
const data = response.parsed || response;
```

This ensures the mobile app correctly extracts the recipe data from the server response structure.

## Files Modified
- `mobile/src/screens/Recipes/CreateRecipeScreen.tsx` (Line 71-98)

## Testing
After this fix, when importing a recipe from a URL:
1. Name, description, instructions, cuisine, cooking time, and servings should all populate
2. **Ingredients should now populate correctly** in the ingredients list
3. User can review and edit all fields before saving

## Build Version
This fix is included in the build being prepared on December 9, 2024.
