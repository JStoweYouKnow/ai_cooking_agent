#!/bin/bash

# Test Authentication Endpoint
# This script helps diagnose authentication issues

echo "=== Testing Authentication Endpoint ==="
echo ""

# Test 1: Without Bearer token (should return null)
echo "Test 1: Request without Bearer token"
echo "Expected: null (no authentication)"
curl -s "https://sous.projcomfort.com/api/trpc/auth.me" | jq '.'
echo ""
echo "---"
echo ""

# Test 2: With Bearer token (email)
echo "Test 2: Request with Bearer token (email)"
echo "Expected: User object or null if authentication fails"
EMAIL="test@example.com"
RESPONSE=$(curl -s -H "Authorization: Bearer $EMAIL" "https://sous.projcomfort.com/api/trpc/auth.me")
echo "$RESPONSE" | jq '.'
echo ""

# Check if we got a user
USER_ID=$(echo "$RESPONSE" | jq -r '.result.data.json.id // empty')
if [ -z "$USER_ID" ] || [ "$USER_ID" == "null" ]; then
    echo "❌ Authentication failed - server returned null"
    echo ""
    echo "This means:"
    echo "1. Bearer token was received by server"
    echo "2. But authentication failed (check Vercel logs for details)"
    echo ""
    echo "Common causes:"
    echo "- Database connection issue during user creation"
    echo "- User creation failing silently"
    echo "- Authentication error being caught and returning null"
    echo ""
    echo "Next steps:"
    echo "1. Check Vercel logs for [Auth] and [Context] messages"
    echo "2. Look for error messages in the logs"
    echo "3. Check DATABASE_URL environment variable in Vercel"
else
    echo "✅ Authentication successful - User ID: $USER_ID"
fi

echo ""
echo "=== Test Complete ==="

