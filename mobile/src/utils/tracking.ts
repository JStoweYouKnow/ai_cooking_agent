/**
 * App Tracking Transparency (ATT) Utilities
 * Required for iOS 14.5+ when using analytics/advertising
 */

import { Platform } from "react-native";
import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
  PermissionStatus,
} from "expo-tracking-transparency";
import * as Application from "expo-application";

export type TrackingStatus = "granted" | "denied" | "undetermined" | "restricted";

interface TrackingPermission {
  status: TrackingStatus;
  canAskAgain: boolean;
}

/**
 * Check current tracking permission status
 */
export const getTrackingStatus = async (): Promise<TrackingPermission> => {
  // Only relevant on iOS 14.5+
  if (Platform.OS !== "ios") {
    return { status: "granted", canAskAgain: false };
  }

  try {
    const { status, canAskAgain } = await getTrackingPermissionsAsync();
    return {
      status: mapPermissionStatus(status),
      canAskAgain,
    };
  } catch (error) {
    console.warn("[Tracking] Error getting tracking status:", error);
    return { status: "undetermined", canAskAgain: true };
  }
};

/**
 * Request tracking permission from the user
 * Should be called BEFORE initializing analytics
 */
export const requestTrackingPermission = async (): Promise<TrackingPermission> => {
  // Only relevant on iOS
  if (Platform.OS !== "ios") {
    return { status: "granted", canAskAgain: false };
  }

  try {
    const { status, canAskAgain } = await requestTrackingPermissionsAsync();
    console.log("[Tracking] Permission result:", status);
    return {
      status: mapPermissionStatus(status),
      canAskAgain,
    };
  } catch (error) {
    console.error("[Tracking] Error requesting permission:", error);
    return { status: "denied", canAskAgain: false };
  }
};

/**
 * Check if tracking is allowed
 */
export const isTrackingAllowed = async (): Promise<boolean> => {
  const { status } = await getTrackingStatus();
  return status === "granted";
};

/**
 * Map Expo permission status to our simpler type
 */
const mapPermissionStatus = (status: PermissionStatus): TrackingStatus => {
  switch (status) {
    case PermissionStatus.GRANTED:
      return "granted";
    case PermissionStatus.DENIED:
      return "denied";
    case PermissionStatus.UNDETERMINED:
      return "undetermined";
    default:
      return "restricted";
  }
};

/**
 * Get app information for analytics
 */
export const getAppInfo = () => {
  return {
    appVersion: Application.nativeApplicationVersion || "unknown",
    buildVersion: Application.nativeBuildVersion || "unknown",
    bundleId: Application.applicationId || "unknown",
  };
};

/**
 * Initialize tracking with ATT prompt
 * Call this at app startup, before analytics
 */
export const initializeTracking = async (): Promise<boolean> => {
  // Skip in development
  if (__DEV__) {
    console.log("[Tracking] Skipping ATT in development");
    return true;
  }

  // Check if already determined
  const current = await getTrackingStatus();

  if (current.status === "undetermined" && current.canAskAgain) {
    // Request permission
    const result = await requestTrackingPermission();
    return result.status === "granted";
  }

  return current.status === "granted";
};

export default {
  getStatus: getTrackingStatus,
  requestPermission: requestTrackingPermission,
  isAllowed: isTrackingAllowed,
  initialize: initializeTracking,
  getAppInfo,
};
