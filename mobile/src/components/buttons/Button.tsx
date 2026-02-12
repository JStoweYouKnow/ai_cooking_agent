/**
 * Production Button Component
 *
 * The only Button you'll ever need for iOS. Enforces consistent styling
 * across the entire codebase with Pressable, perfect iOS feedback, and
 * full accessibility support. Uses theme typography and design tokens.
 *
 * @example
 * ```tsx
 * <Button title="Save" onPress={handleSave} variant="primary" />
 * <Button title="Cancel" onPress={handleCancel} variant="outline" size="small" />
 * <Button title="Delete" onPress={handleDelete} variant="danger" loading={isDeleting} />
 * ```
 */

import React, { useCallback, useRef } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextStyle,
  StyleProp,
  Animated,
} from "react-native";
import { colors, typography, borderRadius } from "../../styles/theme";

// Design system colors (aligned with theme)
const BUTTON_COLORS = {
  primary: colors.olive,
  primaryFg: colors.text.inverse,
  secondary: "#E8E8E8",
  secondaryFg: colors.text.secondary,
  outline: colors.olive,
  danger: "#F44336",
  dangerFg: colors.text.inverse,
  ghost: colors.text.secondary,
  disabled: "rgba(0,0,0,0.26)",
} as const;

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps {
  /** Button label text */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Semantic variant - determines color scheme. Default: primary */
  variant?: ButtonVariant;
  /** Size variant. Default: medium (44px - iOS min touch target) */
  size?: ButtonSize;
  /** Show loading state with spinner */
  loading?: boolean;
  /** Disable button with visual feedback */
  disabled?: boolean;
  /** Custom container styles */
  style?: StyleProp<ViewStyle>;
  /** Custom text styles */
  textStyle?: StyleProp<TextStyle>;
  /** Left icon/element */
  iconLeft?: React.ReactNode;
  /** Right icon/element */
  iconRight?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Accessibility label (defaults to title) */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
  accessibilityHint?: string;
}

/**
 * Button - Production-ready, iOS-optimized Pressable button.
 */
const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  style,
  textStyle,
  iconLeft,
  iconRight,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(() => {
    if (isDisabled) return;
    if (Platform.OS === "ios") {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.97,
          useNativeDriver: true,
          speed: 80,
          bounciness: 6,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDisabled, scaleAnim, opacityAnim]);

  const handlePressOut = useCallback(() => {
    if (isDisabled) return;
    if (Platform.OS === "ios") {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 80,
          bounciness: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDisabled, scaleAnim, opacityAnim]);

  const spinnerColor =
    variant === "primary" || variant === "danger" ? BUTTON_COLORS.primaryFg : BUTTON_COLORS.outline;

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`${variant}Variant`],
    styles[`${size}Size`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
  ];

  const textStyleResolved: TextStyle[] = [
    styles.textBase,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
  ];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={({ pressed }) => [
        ...containerStyle,
        style,
        Platform.OS === "ios" && pressed && !isDisabled && styles.pressedOverlay,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={spinnerColor} />
        ) : (
          <>
            {iconLeft && <>{iconLeft}</>}
            <Text style={[...textStyleResolved, textStyle]} numberOfLines={1} allowFontScaling={false}>
              {title}
            </Text>
            {iconRight && <>{iconRight}</>}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pressedOverlay: {
    opacity: 0.95,
  },

  // Variants (theme colors)
  primaryVariant: {
    backgroundColor: BUTTON_COLORS.primary,
  },
  primaryText: {
    color: BUTTON_COLORS.primaryFg,
    fontWeight: typography.fontWeight.semibold,
  },

  secondaryVariant: {
    backgroundColor: BUTTON_COLORS.secondary,
  },
  secondaryText: {
    color: BUTTON_COLORS.secondaryFg,
    fontWeight: typography.fontWeight.medium,
  },

  outlineVariant: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: BUTTON_COLORS.outline,
  },
  outlineText: {
    color: BUTTON_COLORS.outline,
    fontWeight: typography.fontWeight.semibold,
  },

  dangerVariant: {
    backgroundColor: BUTTON_COLORS.danger,
  },
  dangerText: {
    color: BUTTON_COLORS.dangerFg,
    fontWeight: typography.fontWeight.semibold,
  },

  ghostVariant: {
    backgroundColor: "transparent",
  },
  ghostText: {
    color: BUTTON_COLORS.ghost,
    fontWeight: typography.fontWeight.medium,
  },

  // Sizes (theme typography)
  smallSize: {
    height: 36,
    paddingHorizontal: 16,
  },
  smallText: {
    fontSize: typography.fontSize.sm,
  },

  mediumSize: {
    height: 44, // iOS minimum touch target
    paddingHorizontal: 24,
  },
  mediumText: {
    fontSize: typography.fontSize.md,
  },

  largeSize: {
    height: 52,
    paddingHorizontal: 32,
  },
  largeText: {
    fontSize: typography.fontSize.lg,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },

  // Layout
  fullWidth: {
    width: "100%",
  },

  // Text base (SF Pro implied via system default)
  textBase: {
    textAlign: "center",
  },
});

export default Button;
