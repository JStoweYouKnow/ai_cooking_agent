# Fixing EAS Submit 403 Error

## Error: "Apple 403 detected - Access forbidden"

This error occurs when EAS doesn't have proper authentication to access App Store Connect.

## Solution 1: Use App-Specific Password (Recommended)

1. **Generate App-Specific Password:**
   - Go to https://appleid.apple.com/
   - Sign in with your Apple ID
   - Navigate to **Security** section
   - Under **App-Specific Passwords**, click **Generate Password**
   - Name it "EAS Submit" or "Expo"
   - Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`)

2. **Configure EAS Credentials:**
   ```bash
   cd /Users/v/Downloads/ai_cooking_agent/mobile
   eas credentials
   ```
   
   - Select **iOS** → **Production**
   - When prompted for Apple ID password, use the **app-specific password** (not your regular password)

3. **Try Submit Again:**
   ```bash
   eas submit --platform ios --profile production --latest
   ```

## Solution 2: Use App Store Connect API Key

If you have an App Store Connect API key:

1. **Create API Key (if you don't have one):**
   - Go to https://appstoreconnect.apple.com/access/api
   - Click **Keys** tab
   - Click **+** to generate new key
   - Name it "EAS Submit"
   - Download the `.p8` key file (you can only download once!)
   - Note the Key ID

2. **Configure in EAS:**
   ```bash
   eas credentials
   ```
   - Select **iOS** → **Production**
   - Choose **App Store Connect API** authentication
   - Provide:
     - Key ID
     - Issuer ID (found in App Store Connect → Users and Access → Keys)
     - Path to `.p8` file

## Solution 3: Manual Submission (Easiest)

If authentication continues to fail, submit manually:

1. **Go to App Store Connect:**
   - https://appstoreconnect.apple.com/
   - **My Apps** → Select "Sous"

2. **Navigate to Builds:**
   - Go to **TestFlight** tab (or **App Store** tab → **iOS App**)

3. **Add Build:**
   - Click **+** next to **Build**
   - Your build from EAS should appear in the list
   - Select it and click **Done**

The build is already uploaded by EAS - you just need to attach it manually.

## Troubleshooting

### Check Account Permissions
- Ensure your Apple ID has **App Manager** or **Admin** role in App Store Connect
- Go to **Users and Access** in App Store Connect to verify

### Verify Team ID
- Your Team ID is: `4GG5889HS8`
- Verify it matches in https://developer.apple.com/account/ → **Membership**

### Clear EAS Credentials
If credentials are cached incorrectly:
```bash
eas credentials
# Select iOS → Production → Remove credentials
# Then reconfigure
```

## Quick Reference

**Your Configuration:**
- App Store Connect App ID: `6755921222`
- Apple Team ID: `4GG5889HS8`

**Recommended Approach:**
1. Generate app-specific password
2. Run `eas credentials` to configure
3. Use app-specific password when prompted
4. Run `eas submit --platform ios --profile production --latest`



