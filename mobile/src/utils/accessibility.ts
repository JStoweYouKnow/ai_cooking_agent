/**
 * Accessibility Utilities
 * Helpers for making the app accessible to all users
 */

import { AccessibilityInfo, Platform } from "react-native";

/**
 * Common accessibility roles
 */
export type AccessibilityRole =
  | "none"
  | "button"
  | "link"
  | "search"
  | "image"
  | "text"
  | "adjustable"
  | "header"
  | "summary"
  | "imagebutton"
  | "checkbox"
  | "radio"
  | "switch"
  | "tab"
  | "tablist"
  | "timer"
  | "toolbar"
  | "menu"
  | "menubar"
  | "menuitem"
  | "progressbar"
  | "spinbutton"
  | "scrollbar"
  | "list"
  | "alert";

/**
 * Accessibility props for common UI elements
 */
export interface A11yProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | "mixed";
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
}

/**
 * Create accessibility props for a button
 */
export const buttonA11y = (
  label: string,
  hint?: string,
  options?: { disabled?: boolean; selected?: boolean }
): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: "button",
  accessibilityState: {
    disabled: options?.disabled,
    selected: options?.selected,
  },
});

/**
 * Create accessibility props for a link
 */
export const linkA11y = (label: string, hint?: string): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint || "Opens in browser",
  accessibilityRole: "link",
});

/**
 * Create accessibility props for an image
 */
export const imageA11y = (description: string): A11yProps => ({
  accessible: true,
  accessibilityLabel: description,
  accessibilityRole: "image",
});

/**
 * Create accessibility props for a header
 */
export const headerA11y = (level: 1 | 2 | 3 | 4 | 5 | 6 = 1): A11yProps => ({
  accessible: true,
  accessibilityRole: "header",
  // On iOS, we can specify the heading level
  ...(Platform.OS === "ios" && {
    accessibilityTraits: "header",
  }),
});

/**
 * Create accessibility props for a checkbox/toggle
 */
export const checkboxA11y = (
  label: string,
  checked: boolean,
  hint?: string
): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: "checkbox",
  accessibilityState: {
    checked,
  },
});

/**
 * Create accessibility props for a switch
 */
export const switchA11y = (
  label: string,
  enabled: boolean,
  hint?: string
): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityRole: "switch",
  accessibilityState: {
    checked: enabled,
  },
});

/**
 * Create accessibility props for a text input
 */
export const inputA11y = (
  label: string,
  hint?: string,
  options?: { disabled?: boolean }
): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint,
  accessibilityState: {
    disabled: options?.disabled,
  },
});

/**
 * Create accessibility props for a search input
 */
export const searchA11y = (placeholder?: string): A11yProps => ({
  accessible: true,
  accessibilityLabel: placeholder || "Search",
  accessibilityHint: "Enter search terms",
  accessibilityRole: "search",
});

/**
 * Create accessibility props for a list item
 */
export const listItemA11y = (
  label: string,
  position?: { index: number; total: number }
): A11yProps => ({
  accessible: true,
  accessibilityLabel: position
    ? `${label}, item ${position.index + 1} of ${position.total}`
    : label,
});

/**
 * Create accessibility props for a progress indicator
 */
export const progressA11y = (
  label: string,
  progress: number,
  total: number = 100
): A11yProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityRole: "progressbar",
  accessibilityValue: {
    min: 0,
    max: total,
    now: progress,
    text: `${Math.round((progress / total) * 100)}%`,
  },
});

/**
 * Create accessibility props for a tab
 */
export const tabA11y = (
  label: string,
  selected: boolean,
  position?: { index: number; total: number }
): A11yProps => ({
  accessible: true,
  accessibilityLabel: position
    ? `${label}, tab ${position.index + 1} of ${position.total}`
    : label,
  accessibilityRole: "tab",
  accessibilityState: {
    selected,
  },
});

/**
 * Create accessibility props for an alert/error message
 */
export const alertA11y = (message: string): A11yProps => ({
  accessible: true,
  accessibilityLabel: message,
  accessibilityRole: "alert",
  accessibilityLiveRegion: "assertive" as any,
});

/**
 * Announce a message to screen readers
 */
export const announceForAccessibility = (message: string): void => {
  AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Check if a screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  return AccessibilityInfo.isScreenReaderEnabled();
};

/**
 * Subscribe to screen reader status changes
 */
export const subscribeToScreenReaderChanges = (
  callback: (enabled: boolean) => void
): (() => void) => {
  const subscription = AccessibilityInfo.addEventListener(
    "screenReaderChanged",
    callback
  );
  return () => subscription.remove();
};

/**
 * Check if reduce motion is enabled
 */
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  return AccessibilityInfo.isReduceMotionEnabled();
};

/**
 * Subscribe to reduce motion preference changes
 */
export const subscribeToReduceMotionChanges = (
  callback: (enabled: boolean) => void
): (() => void) => {
  const subscription = AccessibilityInfo.addEventListener(
    "reduceMotionChanged",
    callback
  );
  return () => subscription.remove();
};

/**
 * Hook to get accessibility info
 * Usage: const { isScreenReaderEnabled, isReduceMotionEnabled } = useAccessibilityInfo();
 */
export const createAccessibilityHook = () => {
  // This would need to be used with React hooks in a component
  // Provided here as a pattern example
  return {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    announceForAccessibility,
    subscribeToScreenReaderChanges,
    subscribeToReduceMotionChanges,
  };
};

export default {
  button: buttonA11y,
  link: linkA11y,
  image: imageA11y,
  header: headerA11y,
  checkbox: checkboxA11y,
  switch: switchA11y,
  input: inputA11y,
  search: searchA11y,
  listItem: listItemA11y,
  progress: progressA11y,
  tab: tabA11y,
  alert: alertA11y,
  announce: announceForAccessibility,
  isScreenReaderEnabled,
  isReduceMotionEnabled,
};
