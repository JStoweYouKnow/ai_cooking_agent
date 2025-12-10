import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing, shadows } from "../styles/theme";

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
  accessibilityLabel?: string;
}

const ICON_SIZES = {
  sm: 44,
  md: 52,
  lg: 60,
};

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = "primary",
  size = "md",
  style,
  accessibilityLabel,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.base,
      styles[variant],
      {
        width: ICON_SIZES[size],
        height: ICON_SIZES[size],
        borderRadius: ICON_SIZES[size] / 2,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      },
      style,
    ]}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    {icon}
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
  },
  primary: {
    backgroundColor: colors.olive,
    ...shadows.small,
  },
  secondary: {
    backgroundColor: colors.russet,
    ...shadows.small,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.olive,
    backgroundColor: 'transparent',
  },
});

export default IconButton;

