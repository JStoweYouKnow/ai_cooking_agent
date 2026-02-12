/**
 * Biometric Authentication Utility
 * Supports Face ID, Touch ID, and Android Biometrics
 */

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform, Alert } from "react-native";

// Storage keys
const BIOMETRICS_ENABLED_KEY = "biometrics_enabled";
const BIOMETRICS_CREDENTIALS_KEY = "biometrics_credentials";

export type BiometricType = "fingerprint" | "facial" | "iris" | "none";

interface BiometricsStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: BiometricType;
  isEnabled: boolean;
}

/**
 * Get the type of biometric authentication available
 */
const getBiometricType = async (): Promise<BiometricType> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return "facial";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "fingerprint";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return "iris";
    }
  } catch (error) {
    console.error("[Biometrics] Error getting biometric type:", error);
  }

  return "none";
};

/**
 * Get user-friendly name for biometric type
 */
export const getBiometricName = (type: BiometricType): string => {
  switch (type) {
    case "facial":
      return Platform.OS === "ios" ? "Face ID" : "Face Recognition";
    case "fingerprint":
      return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
    case "iris":
      return "Iris Recognition";
    default:
      return "Biometric Authentication";
  }
};

/**
 * Check biometrics availability and status
 */
export const checkBiometricsStatus = async (): Promise<BiometricsStatus> => {
  try {
    // Check if device supports biometrics
    const isAvailable = await LocalAuthentication.hasHardwareAsync();

    // Check if biometrics are enrolled
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    // Get biometric type
    const biometricType = await getBiometricType();

    // Check if user has enabled biometrics in the app
    let isEnabled = false;
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
      isEnabled = enabled === "true";
    } catch {
      // Ignore storage errors
    }

    return {
      isAvailable,
      isEnrolled,
      biometricType,
      isEnabled: isEnabled && isAvailable && isEnrolled,
    };
  } catch (error) {
    console.error("[Biometrics] Error checking status:", error);
    return {
      isAvailable: false,
      isEnrolled: false,
      biometricType: "none",
      isEnabled: false,
    };
  }
};

/**
 * Prompt user for biometric authentication
 */
export const authenticateWithBiometrics = async (
  reason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const status = await checkBiometricsStatus();

    if (!status.isAvailable) {
      return { success: false, error: "Biometric authentication not available on this device" };
    }

    if (!status.isEnrolled) {
      return { success: false, error: "No biometrics enrolled. Please set up biometrics in device settings." };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason || "Authenticate to continue",
      cancelLabel: "Cancel",
      disableDeviceFallback: false, // Allow PIN/password fallback
      fallbackLabel: "Use Passcode",
    });

    if (result.success) {
      return { success: true };
    } else {
      let errorMessage = "Authentication failed";

      switch (result.error) {
        case "user_cancel":
          errorMessage = "Authentication cancelled";
          break;
        case "user_fallback":
          errorMessage = "User chose to use passcode";
          break;
        case "system_cancel":
          errorMessage = "Authentication was cancelled by the system";
          break;
        case "not_enrolled":
          errorMessage = "No biometrics enrolled";
          break;
        case "lockout":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case "lockout_permanent":
          errorMessage = "Biometrics locked. Please unlock device first.";
          break;
        default:
          errorMessage = result.error || "Authentication failed";
      }

      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error("[Biometrics] Authentication error:", error);
    return { success: false, error: error.message || "Authentication error" };
  }
};

/**
 * Enable biometric login for the current user
 */
export const enableBiometricLogin = async (authToken: string): Promise<boolean> => {
  try {
    const status = await checkBiometricsStatus();

    if (!status.isAvailable || !status.isEnrolled) {
      Alert.alert(
        "Biometrics Unavailable",
        "Please set up biometric authentication in your device settings first."
      );
      return false;
    }

    // Authenticate before enabling
    const authResult = await authenticateWithBiometrics(
      `Authenticate to enable ${getBiometricName(status.biometricType)}`
    );

    if (!authResult.success) {
      if (authResult.error !== "Authentication cancelled") {
        Alert.alert("Authentication Failed", authResult.error);
      }
      return false;
    }

    // Store credentials securely
    await SecureStore.setItemAsync(BIOMETRICS_CREDENTIALS_KEY, authToken, {
      requireAuthentication: false, // We'll handle auth ourselves
    });

    // Mark biometrics as enabled
    await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, "true");

    return true;
  } catch (error: any) {
    console.error("[Biometrics] Error enabling:", error);
    Alert.alert("Error", "Failed to enable biometric login. Please try again.");
    return false;
  }
};

/**
 * Disable biometric login
 */
export const disableBiometricLogin = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(BIOMETRICS_CREDENTIALS_KEY);
    await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, "false");
    return true;
  } catch (error) {
    console.error("[Biometrics] Error disabling:", error);
    return false;
  }
};

/**
 * Attempt biometric login
 * Returns the stored auth token if successful
 */
export const biometricLogin = async (): Promise<{ success: boolean; token?: string; error?: string }> => {
  try {
    const status = await checkBiometricsStatus();

    if (!status.isEnabled) {
      return { success: false, error: "Biometric login not enabled" };
    }

    // Authenticate
    const authResult = await authenticateWithBiometrics("Log in with biometrics");

    if (!authResult.success) {
      return { success: false, error: authResult.error };
    }

    // Retrieve stored credentials
    const token = await SecureStore.getItemAsync(BIOMETRICS_CREDENTIALS_KEY);

    if (!token) {
      // Token was cleared, disable biometrics
      await disableBiometricLogin();
      return { success: false, error: "Stored credentials not found. Please log in again." };
    }

    return { success: true, token };
  } catch (error: any) {
    console.error("[Biometrics] Login error:", error);
    return { success: false, error: error.message || "Biometric login failed" };
  }
};

export default {
  checkStatus: checkBiometricsStatus,
  authenticate: authenticateWithBiometrics,
  enable: enableBiometricLogin,
  disable: disableBiometricLogin,
  login: biometricLogin,
  getName: getBiometricName,
};
