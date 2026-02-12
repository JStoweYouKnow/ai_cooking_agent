/**
 * OTA (Over-The-Air) Updates Configuration
 * Handles automatic updates via Expo Updates
 */

import * as Updates from "expo-updates";
import { Alert, AppState, AppStateStatus } from "react-native";
import { captureMessage } from "./sentry";

interface UpdateCheckResult {
  isAvailable: boolean;
  manifest?: Updates.UpdateManifest | null;
}

interface UpdateConfig {
  checkOnForeground: boolean;
  checkIntervalMs: number;
  promptUser: boolean;
  autoReload: boolean;
}

// Default configuration
const config: UpdateConfig = {
  checkOnForeground: true, // Check when app comes to foreground
  checkIntervalMs: 1000 * 60 * 30, // Check every 30 minutes
  promptUser: true, // Ask user before reloading
  autoReload: false, // Don't auto-reload by default
};

let lastCheckTime = 0;
let isChecking = false;

/**
 * Configure update behavior
 */
export const configureUpdates = (options: Partial<UpdateConfig>): void => {
  Object.assign(config, options);
};

/**
 * Check if updates are available
 */
export const checkForUpdates = async (): Promise<UpdateCheckResult> => {
  // Skip in development
  if (__DEV__) {
    return { isAvailable: false };
  }

  // Prevent concurrent checks
  if (isChecking) {
    return { isAvailable: false };
  }

  // Throttle checks
  const now = Date.now();
  if (now - lastCheckTime < config.checkIntervalMs) {
    return { isAvailable: false };
  }

  try {
    isChecking = true;
    lastCheckTime = now;

    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      console.log("[Updates] Update available:", update.manifest?.id);
      captureMessage("OTA update available", "info", {
        manifestId: update.manifest?.id,
      });

      return {
        isAvailable: true,
        manifest: update.manifest,
      };
    }

    return { isAvailable: false };
  } catch (error: any) {
    console.warn("[Updates] Error checking for updates:", error);
    // Don't report expected errors
    if (!error.message?.includes("No update available")) {
      captureMessage("Update check failed", "warning", {
        error: error.message,
      });
    }
    return { isAvailable: false };
  } finally {
    isChecking = false;
  }
};

/**
 * Download and apply an available update
 */
export const downloadAndApplyUpdate = async (promptReload = true): Promise<boolean> => {
  // Skip in development
  if (__DEV__) {
    return false;
  }

  try {
    console.log("[Updates] Downloading update...");

    const result = await Updates.fetchUpdateAsync();

    if (!result.isNew) {
      console.log("[Updates] No new update downloaded");
      return false;
    }

    console.log("[Updates] Update downloaded, manifest:", result.manifest?.id);

    if (config.autoReload) {
      // Auto-reload immediately
      await Updates.reloadAsync();
      return true;
    }

    if (promptReload && config.promptUser) {
      // Ask user to reload
      Alert.alert(
        "Update Available",
        "A new version has been downloaded. Restart now to apply the update?",
        [
          {
            text: "Later",
            style: "cancel",
          },
          {
            text: "Restart",
            onPress: async () => {
              try {
                await Updates.reloadAsync();
              } catch (error) {
                console.error("[Updates] Reload failed:", error);
              }
            },
          },
        ],
        { cancelable: true }
      );
    }

    return true;
  } catch (error: any) {
    console.error("[Updates] Error downloading update:", error);
    captureMessage("Update download failed", "error", {
      error: error.message,
    });
    return false;
  }
};

/**
 * Check and download updates silently
 */
export const checkAndDownloadUpdates = async (): Promise<void> => {
  const { isAvailable } = await checkForUpdates();

  if (isAvailable) {
    await downloadAndApplyUpdate();
  }
};

/**
 * Initialize automatic update checking
 */
export const initializeUpdates = (): (() => void) => {
  // Skip in development
  if (__DEV__) {
    console.log("[Updates] Skipping initialization in development");
    return () => {};
  }

  // Check on startup
  setTimeout(() => {
    checkAndDownloadUpdates();
  }, 5000); // Delay initial check by 5 seconds

  // Set up periodic check
  const intervalId = setInterval(() => {
    if (AppState.currentState === "active") {
      checkAndDownloadUpdates();
    }
  }, config.checkIntervalMs);

  // Check when app comes to foreground
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === "active" && config.checkOnForeground) {
      checkAndDownloadUpdates();
    }
  };

  const subscription = AppState.addEventListener("change", handleAppStateChange);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    subscription.remove();
  };
};

/**
 * Get current update info
 */
export const getCurrentUpdateInfo = (): {
  isEmbeddedLaunch: boolean;
  updateId: string | null;
  channel: string | null;
  createdAt: Date | null;
} => {
  return {
    isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    updateId: Updates.updateId,
    channel: Updates.channel,
    createdAt: Updates.createdAt,
  };
};

/**
 * Force reload the app (useful for testing)
 */
export const forceReload = async (): Promise<void> => {
  if (__DEV__) {
    console.log("[Updates] Force reload not available in development");
    return;
  }

  try {
    await Updates.reloadAsync();
  } catch (error) {
    console.error("[Updates] Force reload failed:", error);
  }
};

export default {
  configure: configureUpdates,
  check: checkForUpdates,
  download: downloadAndApplyUpdate,
  checkAndDownload: checkAndDownloadUpdates,
  initialize: initializeUpdates,
  getInfo: getCurrentUpdateInfo,
  reload: forceReload,
};
