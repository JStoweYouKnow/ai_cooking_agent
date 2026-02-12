/**
 * App Version Check Utility
 * Checks if the app version meets minimum requirements
 */

import { Alert, Linking, Platform } from "react-native";
import * as Application from "expo-application";

interface VersionCheckResult {
  isSupported: boolean;
  currentVersion: string;
  minimumVersion: string | null;
  updateUrl: string | null;
}

// App Store / Play Store URLs
const STORE_URLS = {
  ios: "https://apps.apple.com/app/sous-cooking/id123456789", // Replace with actual App Store ID
  android: "https://play.google.com/store/apps/details?id=com.sous.cooking", // Replace with actual package
};

/**
 * Compare semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  const maxLength = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLength; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }

  return 0;
};

/**
 * Get current app version
 */
export const getAppVersion = (): string => {
  return Application.nativeApplicationVersion || "0.0.0";
};

/**
 * Get build number
 */
export const getBuildNumber = (): string => {
  return Application.nativeBuildVersion || "0";
};

/**
 * Check if current version meets minimum requirements
 */
export const checkMinimumVersion = async (
  minimumVersion: string
): Promise<VersionCheckResult> => {
  const currentVersion = getAppVersion();
  const isSupported = compareVersions(currentVersion, minimumVersion) >= 0;

  return {
    isSupported,
    currentVersion,
    minimumVersion,
    updateUrl: Platform.OS === "ios" ? STORE_URLS.ios : STORE_URLS.android,
  };
};

/**
 * Check version against API and show update prompt if needed
 */
export const checkVersionWithAPI = async (
  apiMinVersion: string | null
): Promise<boolean> => {
  if (!apiMinVersion) {
    return true; // No minimum version requirement
  }

  const result = await checkMinimumVersion(apiMinVersion);

  if (!result.isSupported) {
    showForceUpdateAlert(result);
    return false;
  }

  return true;
};

/**
 * Show force update alert
 */
export const showForceUpdateAlert = (result: VersionCheckResult): void => {
  Alert.alert(
    "Update Required",
    `Your app version (${result.currentVersion}) is no longer supported. Please update to version ${result.minimumVersion} or later to continue using Sous.`,
    [
      {
        text: "Update Now",
        onPress: () => {
          if (result.updateUrl) {
            Linking.openURL(result.updateUrl);
          }
        },
      },
    ],
    { cancelable: false }
  );
};

/**
 * Show optional update alert
 */
export const showOptionalUpdateAlert = (
  currentVersion: string,
  latestVersion: string,
  updateUrl: string
): void => {
  Alert.alert(
    "Update Available",
    `A new version (${latestVersion}) is available. You're currently on ${currentVersion}.`,
    [
      { text: "Later", style: "cancel" },
      {
        text: "Update",
        onPress: () => Linking.openURL(updateUrl),
      },
    ]
  );
};

/**
 * Get full version info for debugging
 */
export const getVersionInfo = () => {
  return {
    version: getAppVersion(),
    build: getBuildNumber(),
    bundleId: Application.applicationId,
    platform: Platform.OS,
    platformVersion: Platform.Version,
  };
};

export default {
  getVersion: getAppVersion,
  getBuild: getBuildNumber,
  checkMinimum: checkMinimumVersion,
  checkWithAPI: checkVersionWithAPI,
  showForceUpdate: showForceUpdateAlert,
  showOptionalUpdate: showOptionalUpdateAlert,
  getInfo: getVersionInfo,
  compareVersions,
};
