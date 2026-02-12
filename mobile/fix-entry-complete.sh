#!/bin/bash
# Complete fix for Expo App Entry Point Error

echo "🔧 Complete Fix for Expo App Entry Point Error..."
echo ""

cd "$(dirname "$0")"

# Step 1: Clear all caches
echo "1️⃣ Clearing all caches..."
rm -rf node_modules/.cache 2>/dev/null
rm -rf .expo 2>/dev/null
rm -rf .metro 2>/dev/null
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null

# Step 2: Verify files exist
echo "2️⃣ Verifying entry point files..."
if [ ! -f "index.js" ]; then
    echo "❌ Error: index.js not found!"
    exit 1
fi

if [ ! -f "App.tsx" ]; then
    echo "❌ Error: App.tsx not found!"
    exit 1
fi

echo "✅ index.js found"
echo "✅ App.tsx found"

# Step 3: Verify package.json
echo "3️⃣ Checking package.json..."
if grep -q '"main": "index.js"' package.json; then
    echo "✅ package.json main field is correct"
else
    echo "⚠️  Warning: package.json main field might be incorrect"
    echo "   Current main: $(grep '"main"' package.json)"
fi

echo ""
echo "✅ Cache cleared and files verified!"
echo ""
echo "📱 Now restart your Expo dev server:"
echo ""
echo "   # Stop current server (Ctrl+C if running)"
echo "   npx expo start --clear"
echo ""
echo "   # Or if using npm/pnpm:"
echo "   npm start -- --clear"
echo "   pnpm start -- --clear"
echo ""
echo "   # Then reload the app (press 'r' in terminal or shake device)"
echo ""
