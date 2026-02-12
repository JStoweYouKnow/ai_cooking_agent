/**
 * Haptic Feedback Utilities
 * Provides consistent haptic feedback throughout the app
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Check if haptics are available on this device
 */
export function isHapticsAvailable(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/**
 * Light impact - for small UI interactions
 * Use for: toggles, selections, minor feedback
 */
export async function lightImpact(): Promise<void> {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Silently fail - haptics not critical
    console.debug("[Haptics] Light impact failed:", error);
  }
}

/**
 * Medium impact - for standard interactions
 * Use for: button presses, card taps, navigation
 */
export async function mediumImpact(): Promise<void> {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.debug("[Haptics] Medium impact failed:", error);
  }
}

/**
 * Heavy impact - for significant actions
 * Use for: completing tasks, major state changes
 */
export async function heavyImpact(): Promise<void> {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.debug("[Haptics] Heavy impact failed:", error);
  }
}

/**
 * Selection feedback - for picker/selection changes
 * Use for: date pickers, sliders, option selectors
 */
export async function selectionFeedback(): Promise<void> {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.debug("[Haptics] Selection feedback failed:", error);
  }
}

/**
 * Success notification - for completed actions
 * Use for: save success, recipe cooked, purchase complete
 */
export async function successNotification(): Promise<void> {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.debug("[Haptics] Success notification failed:", error);
  }
}

/**
 * Warning notification - for attention-needed states
 * Use for: validation errors, limit warnings
 */
export async function warningNotification(): Promise<void> {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.debug("[Haptics] Warning notification failed:", error);
  }
}

/**
 * Error notification - for failed actions
 * Use for: errors, failed saves, network issues
 */
export async function errorNotification(): Promise<void> {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.debug("[Haptics] Error notification failed:", error);
  }
}

/**
 * Celebration haptics - for big achievements
 * Use for: first recipe cooked, subscription purchased
 */
export async function celebrationHaptics(): Promise<void> {
  if (!isHapticsAvailable()) return;
  try {
    // Triple success pattern
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((resolve) => setTimeout(resolve, 150));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.debug("[Haptics] Celebration haptics failed:", error);
  }
}

/**
 * Step completion haptics - for cooking step navigation
 */
export async function stepCompletionHaptics(): Promise<void> {
  if (!isHapticsAvailable()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.debug("[Haptics] Step completion failed:", error);
  }
}

export default {
  lightImpact,
  mediumImpact,
  heavyImpact,
  selectionFeedback,
  successNotification,
  warningNotification,
  errorNotification,
  celebrationHaptics,
  stepCompletionHaptics,
  isHapticsAvailable,
};
