#!/bin/bash

# Fresh Build Script for Hackathon TestFlight Submission
# This script builds and submits the app to TestFlight

set -e  # Exit on error

echo "🚀 Starting fresh build for TestFlight submission..."
echo ""

# Check if we're in the mobile directory
if [ ! -f "app.json" ]; then
    echo "❌ Error: Please run this script from the mobile directory"
    exit 1
fi

# Check EAS login
echo "📋 Checking EAS login status..."
if ! eas whoami > /dev/null 2>&1; then
    echo "❌ Not logged into EAS. Please run: eas login"
    exit 1
fi

echo "✅ Logged in as: $(eas whoami | head -1)"
echo ""

# Set RevenueCat API key as environment variable for production
echo "🔐 Setting RevenueCat API key..."
REVENUECAT_KEY="sk_JieatuPCUueahYjhdYeMXgsXZcput"

# Check if secret already exists (using env:create which will update if exists)
echo "Setting EXPO_PUBLIC_REVENUECAT_IOS_API_KEY for production environment..."
eas env:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value "$REVENUECAT_KEY" --environment production --force 2>&1 || {
    echo "⚠️  Note: Environment variable may already exist or need manual setup"
    echo "   You can set it manually with:"
    echo "   eas env:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value $REVENUECAT_KEY --environment production"
}

echo ""
echo "📦 Starting production build..."
echo "   This will take 15-30 minutes..."
echo ""

# Build for production
eas build --platform ios --profile production

echo ""
echo "✅ Build completed!"
echo ""
echo "📤 To submit to TestFlight, run:"
echo "   eas submit --platform ios --profile production"
echo ""
echo "   Or use the auto-submit flag next time:"
echo "   eas build --platform ios --profile production --auto-submit"
echo ""
