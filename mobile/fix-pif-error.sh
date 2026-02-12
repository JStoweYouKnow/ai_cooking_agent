#!/bin/bash

# Fix PIF Transfer Session Error
# This script cleans Xcode build artifacts and processes that can cause PIF errors

set -e

echo "🔧 Fixing PIF Transfer Session Error..."
echo ""

# 1. Kill any running Xcode processes
echo "1. Stopping Xcode processes..."
pkill -9 Xcode 2>/dev/null || true
pkill -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true
pkill -9 com.apple.dt.SKAgent 2>/dev/null || true
sleep 2
echo "   ✓ Processes stopped"
echo ""

# 2. Clean Xcode DerivedData
echo "2. Cleaning Xcode DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/* 2>/dev/null || true
echo "   ✓ DerivedData cleaned"
echo ""

# 3. Clean Expo prebuild artifacts
echo "3. Cleaning Expo prebuild artifacts..."
cd "$(dirname "$0")"
rm -rf ios android 2>/dev/null || true
echo "   ✓ Prebuild artifacts cleaned"
echo ""

# 4. Clean node_modules/.cache if it exists
echo "4. Cleaning build caches..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
echo "   ✓ Caches cleaned"
echo ""

# 5. Wait a moment for processes to fully terminate
echo "5. Waiting for processes to fully terminate..."
sleep 3
echo "   ✓ Ready"
echo ""

echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "  1. Close Xcode if it's still open"
echo "  2. Run: npx expo prebuild --clean"
echo "  3. Or run: npx expo run:ios"
echo ""









