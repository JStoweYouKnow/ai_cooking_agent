/**
 * SSL Certificate Pinning Configuration
 *
 * For Expo managed workflow, SSL pinning requires native code via a config plugin
 * or using EAS Build with custom native modules.
 *
 * This file provides:
 * 1. Certificate hash configuration for pinning
 * 2. Validation utilities
 * 3. Instructions for implementation
 *
 * IMPLEMENTATION OPTIONS:
 *
 * Option 1: Use expo-dev-client with react-native-ssl-pinning
 *   - npm install react-native-ssl-pinning
 *   - Requires custom dev client build
 *
 * Option 2: Use network_security_config.xml (Android) + Info.plist (iOS)
 *   - Create android/app/src/main/res/xml/network_security_config.xml
 *   - Requires ejecting or using config plugin
 *
 * Option 3: Use a proxy/CDN with pinning (Cloudflare, AWS CloudFront)
 *   - Pin at the infrastructure level
 *   - Simpler but less control
 */

// Production API domain
export const PINNED_DOMAINS = {
  api: "sous.projcomfort.com",
};

/**
 * SHA-256 certificate hashes for pinning
 * Generate with: openssl s_client -connect sous.projcomfort.com:443 | openssl x509 -pubkey | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | base64
 *
 * IMPORTANT: Include backup pins (at least 2) to prevent lockout during cert rotation
 */
export const CERTIFICATE_HASHES = {
  // Primary certificate hash - UPDATE THIS with your actual certificate hash
  primary: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  // Backup certificate hash (for rotation) - UPDATE THIS
  backup: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=",
  // Let's Encrypt root certificate (commonly used)
  letsEncryptRoot: "C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=",
};

/**
 * Network security config for Android (place in android/app/src/main/res/xml/)
 *
 * network_security_config.xml:
 * ```xml
 * <?xml version="1.0" encoding="utf-8"?>
 * <network-security-config>
 *   <domain-config cleartextTrafficPermitted="false">
 *     <domain includeSubdomains="true">sous.projcomfort.com</domain>
 *     <pin-set expiration="2025-12-31">
 *       <pin digest="SHA-256">PRIMARY_HASH_HERE</pin>
 *       <pin digest="SHA-256">BACKUP_HASH_HERE</pin>
 *     </pin-set>
 *   </domain-config>
 * </network-security-config>
 * ```
 */

/**
 * Check if running in production (pinning should only be enforced in production)
 */
export const shouldEnforcePinning = (): boolean => {
  return !__DEV__;
};

/**
 * Get pinning configuration for use with native modules
 */
export const getPinningConfig = () => ({
  domains: PINNED_DOMAINS,
  hashes: CERTIFICATE_HASHES,
  enforced: shouldEnforcePinning(),
});

/**
 * Validate that a domain is in our pinned list
 */
export const isPinnedDomain = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return Object.values(PINNED_DOMAINS).includes(urlObj.hostname);
  } catch {
    return false;
  }
};

/**
 * Log pinning status for debugging
 */
export const logPinningStatus = (): void => {
  if (__DEV__) {
    console.log("[SSL Pinning] Development mode - pinning disabled");
    console.log("[SSL Pinning] Pinned domains:", PINNED_DOMAINS);
  } else {
    console.log("[SSL Pinning] Production mode - pinning should be enforced");
    console.log("[SSL Pinning] Ensure native pinning is configured");
  }
};

export default {
  domains: PINNED_DOMAINS,
  hashes: CERTIFICATE_HASHES,
  shouldEnforce: shouldEnforcePinning,
  getConfig: getPinningConfig,
  isPinned: isPinnedDomain,
  logStatus: logPinningStatus,
};
