#!/bin/bash

# Test script to verify tRPC API alignment
# Run this to check if all API calls match the server router

echo "🔍 Checking tRPC API Alignment..."
echo ""

# Check if server router file exists
if [ ! -f "../server/routers.ts" ]; then
    echo "❌ Error: server/routers.ts not found"
    exit 1
fi

echo "✅ Server router found"
echo ""

# Extract router structure from server/routers.ts
echo "📋 Server Router Structure:"
echo "----------------------------"
grep -E "(auth|recipes|shoppingLists|ingredients|notifications|messages|user):" ../server/routers.ts | head -10
echo ""

# Check mobile API calls
echo "📱 Mobile API Calls:"
echo "-------------------"
echo ""

# Check authentication
if grep -q "trpc.auth.me" src/contexts/AuthContext.tsx 2>/dev/null; then
    echo "✅ Auth: trpc.auth.me.useQuery()"
else
    echo "❌ Auth: Missing or incorrect"
fi

# Check recipes
if grep -q "trpc.recipes.list" src/screens/Home/HomeScreen.tsx 2>/dev/null; then
    echo "✅ Recipes List: trpc.recipes.list.useQuery()"
else
    echo "❌ Recipes List: Missing or incorrect"
fi

if grep -q "trpc.recipes.getById" src/screens/Recipes/RecipeDetailScreen.tsx 2>/dev/null; then
    echo "✅ Recipe Get: trpc.recipes.getById.useQuery()"
else
    echo "❌ Recipe Get: Missing or incorrect"
fi

if grep -q "trpc.recipes.create" src/screens/Recipes/CreateRecipeScreen.tsx 2>/dev/null; then
    echo "✅ Recipe Create: trpc.recipes.create.useMutation()"
else
    echo "❌ Recipe Create: Missing or incorrect"
fi

if grep -q "trpc.recipes.toggleFavorite" src/screens/Recipes/RecipeListScreen.tsx 2>/dev/null; then
    echo "✅ Recipe Toggle Favorite: trpc.recipes.toggleFavorite.useMutation()"
else
    echo "❌ Recipe Toggle Favorite: Missing or incorrect"
fi

if grep -q "trpc.recipes.delete" src/screens/Recipes/RecipeDetailScreen.tsx 2>/dev/null; then
    echo "✅ Recipe Delete: trpc.recipes.delete.useMutation()"
else
    echo "❌ Recipe Delete: Missing or incorrect"
fi

# Check shopping lists
if grep -q "trpc.shoppingLists.list" src/screens/ShoppingLists/ShoppingListsListScreen.tsx 2>/dev/null; then
    echo "✅ Shopping Lists: trpc.shoppingLists.list.useQuery()"
else
    echo "❌ Shopping Lists: Missing or incorrect"
fi

echo ""
echo "✅ API Alignment Check Complete!"
echo ""
echo "Next steps:"
echo "1. Start backend: npm run dev"
echo "2. Start mobile: cd mobile && npm start -- --reset-cache"
echo "3. Test the app in simulator"



