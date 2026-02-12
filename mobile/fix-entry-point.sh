#!/bin/bash
# Fix Expo App Entry Point Error

echo "🔧 Fixing Expo App Entry Point Error..."
echo ""

cd "$(dirname "$0")"

# Step 1: Clear Metro cache
echo "1️⃣ Clearing Metro bundler cache..."
rm -rf node_modules/.cache 2>/dev/null
rm -rf .expo 2>/dev/null
rm -rf .metro 2>/dev/null

# Step 2: Verify entry point files exist
echo "2️⃣ Verifying entry point files..."
if [ ! -f "index.ts" ]; then
    echo "❌ Error: index.ts not found!"
    exit 1
fi

if [ ! -f "App.tsx" ]; then
    echo "❌ Error: App.tsx not found!"
    exit 1
fi

echo "✅ index.ts found"
echo "✅ App.tsx found"

# Step 3: Verify package.json main field
echo "3️⃣ Checking package.json configuration..."
if grep -q '"main": "index.ts"' package.json; then
    echo "✅ package.json main field is correct"
else
    echo "⚠️  Warning: package.json main field might be incorrect"
fi

echo ""
echo "✅ Cache cleared! Now restart your Expo dev server:"
echo ""
echo "   npx expo start --clear"
echo ""
echo "Or if using npm/pnpm:"
echo "   npm start -- --clear"
echo "   pnpm start -- --clear"
echo ""
