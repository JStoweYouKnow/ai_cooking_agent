# Shared Recipes Feature

## Overview

All recipes uploaded via HTML/URL to the web app are now automatically shared with all users across all devices. This creates a base library of recipes that everyone can access.

## Changes Made

### 1. Database Schema
- Added `isShared` boolean field to `recipes` table (default: `false`)
- Created index on `isShared` for query performance

### 2. Recipe Creation
- When recipes are uploaded via `parseFromUrl` (HTML/URL import), they are automatically marked with `isShared: true`
- User-created recipes remain private (`isShared: false`)

### 3. Recipe Queries
- `getUserRecipes()` now returns:
  - User's own recipes (where `userId` matches)
  - All shared recipes (where `isShared = true`)
- `getRecipeById()` allows access to:
  - User's own recipes
  - Shared recipes

### 4. Access Control
- **Viewing**: Users can view their own recipes + all shared recipes
- **Favoriting**: Users can favorite shared recipes (favorite status is per-user)
- **Deleting**: Users can only delete their own recipes (shared recipes are protected)

## Migration

To apply this change to your existing database, run the migration script:

```bash
# For PostgreSQL
psql -d your_database_name -f server/migrations/add-isShared-to-recipes.sql

# Or using your database connection string
psql $DATABASE_URL -f server/migrations/add-isShared-to-recipes.sql
```

The migration will:
1. Add the `isShared` column to the `recipes` table
2. Mark all existing URL-imported recipes as shared
3. Create an index for better query performance

## How It Works

### For New Recipes
- **HTML/URL Upload**: Automatically marked as `isShared: true` → Available to all users
- **Manual Creation**: Marked as `isShared: false` → Private to the user

### For Existing Recipes
- Recipes with `source = 'url_import'` or with a `sourceUrl` are automatically marked as shared
- User-created recipes remain private

## Benefits

1. **Base Recipe Library**: All users have access to a curated collection of recipes
2. **Cross-Platform**: Recipes are available on web, mobile, and any future platforms
3. **No Duplication**: Multiple users can access the same recipe without creating duplicates
4. **User Privacy**: Personal recipes remain private unless explicitly shared

## Future Enhancements

Potential improvements:
- Allow users to manually share/unshare their recipes
- Add a "Shared Recipes" section in the UI
- Show recipe source/contributor information
- Add moderation for shared recipes



