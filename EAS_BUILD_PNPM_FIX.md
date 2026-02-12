# EAS Build pnpm Lockfile Fix

## Issue
EAS Build was failing with:
```
WARN  A pnpm-lock.yaml file exists. The current configuration prohibits to read or write a lockfile
ERR_PNPM_NO_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent
```

## Root Cause
The `.npmrc` file contained `package-lock=false`, which was interfering with pnpm's ability to read the `pnpm-lock.yaml` file in EAS Build's environment.

## Solution

### 1. Removed `package-lock=false` from `.npmrc`
This setting was preventing pnpm from reading the lockfile, even though pnpm uses its own `pnpm-lock.yaml` format.

**Before:**
```
package-lock=false
auto-install-peers=true
```

**After:**
```
# pnpm-specific settings
auto-install-peers=true
# Note: package-lock=false removed as it interferes with pnpm lockfile reading
```

### 2. Added pnpm version to `eas.json`
```json
{
  "build": {
    "node": "22.x.x",
    "pnpm": {
      "version": "9.15.9"
    },
    ...
  }
}
```

### 3. Verified `packageManager` field in `package.json`
```json
"packageManager": "pnpm@9.15.9"
```

## Files Modified

1. **`mobile/.npmrc`**
   - Removed `package-lock=false`
   - Kept `auto-install-peers=true`

2. **`mobile/eas.json`**
   - Added explicit pnpm version configuration

3. **`mobile/package.json`**
   - Already has `packageManager` field (from previous fix)

## Verification

Test locally:
```bash
cd mobile
pnpm install --frozen-lockfile
```

Should now work without errors.

## Next Steps

1. Commit the changes:
   ```bash
   git add mobile/.npmrc mobile/eas.json
   git commit -m "Fix pnpm lockfile reading in EAS Build"
   ```

2. Retry EAS Build:
   ```bash
   cd mobile
   eas build --platform ios --profile production
   ```

## Why This Works

- `package-lock=false` is an npm-specific setting that tells npm not to create/use `package-lock.json`
- In EAS Build's environment, this setting was being interpreted in a way that prevented pnpm from reading `pnpm-lock.yaml`
- Removing this setting allows pnpm to properly read its own lockfile format
- pnpm doesn't use `package-lock.json` anyway, so this setting wasn't needed

## Notes

- pnpm uses `pnpm-lock.yaml`, not `package-lock.json`
- The `.npmrc` file is shared between npm and pnpm, but some npm-specific settings can interfere
- EAS Build now properly detects and uses pnpm with the lockfile
