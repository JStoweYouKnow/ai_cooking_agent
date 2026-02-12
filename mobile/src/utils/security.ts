/**
 * Security Utilities
 * Jailbreak/root detection and security checks
 */

import { Platform } from "react-native";
import * as Device from "expo-device";
import * as FileSystem from "expo-file-system";

interface SecurityCheckResult {
  isSecure: boolean;
  issues: string[];
}

/**
 * Paths that indicate a jailbroken iOS device
 */
const JAILBREAK_PATHS_IOS = [
  "/Applications/Cydia.app",
  "/Library/MobileSubstrate/MobileSubstrate.dylib",
  "/bin/bash",
  "/usr/sbin/sshd",
  "/etc/apt",
  "/private/var/lib/apt",
  "/usr/bin/ssh",
  "/private/var/lib/cydia",
  "/private/var/stash",
  "/usr/libexec/sftp-server",
  "/usr/bin/cycript",
  "/usr/local/bin/cycript",
  "/usr/lib/libcycript.dylib",
  "/var/cache/apt",
  "/var/lib/apt",
  "/var/lib/cydia",
  "/var/tmp/cydia.log",
  "/Applications/Sileo.app",
  "/var/binpack",
  "/Library/PreferenceBundles/LibertyPref.bundle",
  "/Library/PreferenceBundles/ShadowPreferences.bundle",
  "/Library/PreferenceBundles/ABypassPrefs.bundle",
  "/Library/PreferenceBundles/FlyJBPrefs.bundle",
  "/usr/lib/libhooker.dylib",
  "/usr/lib/libsubstitute.dylib",
  "/usr/lib/substitute-loader.dylib",
  "/usr/lib/TweakInject.dylib",
  "/var/binpack/Applications/loader.app",
];

/**
 * Paths that indicate a rooted Android device
 */
const ROOT_PATHS_ANDROID = [
  "/system/app/Superuser.apk",
  "/system/xbin/su",
  "/system/bin/su",
  "/sbin/su",
  "/data/local/xbin/su",
  "/data/local/bin/su",
  "/data/local/su",
  "/su/bin/su",
  "/system/sd/xbin/su",
  "/system/bin/failsafe/su",
  "/system/bin/.ext/.su",
  "/system/usr/we-need-root/su-backup",
  "/system/xbin/mu",
  "/system/app/Magisk.apk",
  "/sbin/magisk",
  "/data/adb/magisk",
];

/**
 * Check if a file path exists
 */
const pathExists = async (path: string): Promise<boolean> => {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
};

/**
 * Check for jailbreak on iOS
 */
const checkJailbreakiOS = async (): Promise<string[]> => {
  const issues: string[] = [];

  // Check common jailbreak paths
  for (const path of JAILBREAK_PATHS_IOS) {
    if (await pathExists(path)) {
      issues.push(`Suspicious file found: ${path}`);
      break; // One is enough to flag
    }
  }

  // Check if we can write to system directories (shouldn't be possible on stock iOS)
  try {
    const testPath = "/private/test_jb_check.txt";
    await FileSystem.writeAsStringAsync(testPath, "test");
    await FileSystem.deleteAsync(testPath, { idempotent: true });
    issues.push("Writable system directory detected");
  } catch {
    // Expected to fail on non-jailbroken device
  }

  return issues;
};

/**
 * Check for root on Android
 */
const checkRootAndroid = async (): Promise<string[]> => {
  const issues: string[] = [];

  // Check common root paths
  for (const path of ROOT_PATHS_ANDROID) {
    if (await pathExists(path)) {
      issues.push(`Suspicious file found: ${path}`);
      break; // One is enough to flag
    }
  }

  // Check build tags for test-keys (indicates custom ROM)
  // Note: This requires native module access which expo-device doesn't provide
  // In a production app, you'd use a native module for this

  return issues;
};

/**
 * Check if device is running in an emulator
 */
export const isEmulator = (): boolean => {
  return !Device.isDevice;
};

/**
 * Check if device is jailbroken (iOS) or rooted (Android)
 */
export const isDeviceCompromised = async (): Promise<SecurityCheckResult> => {
  const issues: string[] = [];

  // Skip in development
  if (__DEV__) {
    return { isSecure: true, issues: [] };
  }

  // Skip on emulator (expected for testing)
  if (isEmulator()) {
    return { isSecure: true, issues: [] };
  }

  try {
    if (Platform.OS === "ios") {
      const jbIssues = await checkJailbreakiOS();
      issues.push(...jbIssues);
    } else if (Platform.OS === "android") {
      const rootIssues = await checkRootAndroid();
      issues.push(...rootIssues);
    }
  } catch (error) {
    console.warn("[Security] Error during security check:", error);
  }

  return {
    isSecure: issues.length === 0,
    issues,
  };
};

/**
 * Check if app is running in a debugger
 */
export const isDebuggerAttached = (): boolean => {
  // In React Native, __DEV__ indicates debug mode
  return __DEV__;
};

/**
 * Get device security info
 */
export const getSecurityInfo = async (): Promise<{
  isEmulator: boolean;
  isDebugMode: boolean;
  isCompromised: boolean;
  deviceType: string | null;
  osVersion: string | null;
}> => {
  const compromisedCheck = await isDeviceCompromised();

  return {
    isEmulator: isEmulator(),
    isDebugMode: __DEV__,
    isCompromised: !compromisedCheck.isSecure,
    deviceType: Device.deviceType?.toString() || null,
    osVersion: Device.osVersion,
  };
};

/**
 * Perform all security checks and optionally block compromised devices
 */
export const performSecurityCheck = async (options?: {
  blockCompromised?: boolean;
  blockEmulator?: boolean;
  onCompromised?: (issues: string[]) => void;
}): Promise<boolean> => {
  const { blockCompromised = false, blockEmulator = false, onCompromised } = options || {};

  // Check emulator
  if (blockEmulator && isEmulator()) {
    console.warn("[Security] App running on emulator");
    return false;
  }

  // Check for jailbreak/root
  const result = await isDeviceCompromised();

  if (!result.isSecure) {
    console.warn("[Security] Device security issues detected:", result.issues);

    if (onCompromised) {
      onCompromised(result.issues);
    }

    if (blockCompromised) {
      return false;
    }
  }

  return true;
};

export default {
  isEmulator,
  isDeviceCompromised,
  isDebuggerAttached,
  getSecurityInfo,
  performSecurityCheck,
};
