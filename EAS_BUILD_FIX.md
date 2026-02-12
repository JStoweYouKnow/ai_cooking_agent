# EAS Build Fix - Package Manager Configuration

## Issue
EAS Build was trying to use `npm ci` but the project uses `pnpm`, causing lock file sync errors.

## Solution Applied

### 1. Added `packageManager` field to `package.json`
```json
"packageManager": "pnpm@9.15.9"
```
This tells EAS Build to use pnpm instead of npm.

### 2. Updated `.npmrc`
```
package-lock=false
auto-install-peers=true
```
This ensures npm doesn't try to create package-lock.json.

### 3. Verified `pnpm-lock.yaml` is up to date
All dependencies including:
- `expo-camera@17.0.10`
- `fraction.js@5.3.4`
- `@react-native-community/netinfo@11.5.2`
- `@react-native-community/slider@4.5.7`
- Updated eslint, jest, and related dependencies

## Files Modified

1. **`mobile/package.json`**
   - Added `"packageManager": "pnpm@9.15.9"`

2. **`mobile/.npmrc`**
   - Set `package-lock=false` to prevent npm from creating lock file
   - Added `auto-install-peers=true` for better peer dependency handling

3. **`mobile/pnpm-lock.yaml`**
   - Updated with all new dependencies
   - All version conflicts resolved

## Next Steps

1. **Commit the changes:**
   ```bash
   git add mobile/package.json mobile/.npmrc mobile/pnpm-lock.yaml
   git commit -m "Configure EAS Build to use pnpm"
   ```

2. **Retry EAS Build:**
   ```bash
   cd mobile
   eas build --platform ios --profile production
   ```

## Verification

EAS Build should now:
- Detect `packageManager` field in package.json
- Use pnpm instead of npm
- Use `pnpm-lock.yaml` instead of `package-lock.json`
- Successfully install all dependencies

## Troubleshooting

If EAS still tries to use npm:
1. Ensure `packageManager` field is in `package.json`
2. Verify `pnpm-lock.yaml` exists and is committed
3. Check that `.npmrc` has `package-lock=false`
4. Try explicitly setting pnpm version in EAS config (if needed)

## Notes

- EAS Build supports pnpm through the `packageManager` field
- The `pnpm-lock.yaml` file must be committed to the repository
- All dependencies are now properly locked in `pnpm-lock.yaml`
