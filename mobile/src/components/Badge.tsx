import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors, borderRadius, typography } from "../styles/theme";

interface BadgeProps {
  label: string;
  variant?: "ai" | "difficulty" | "cuisine" | "default";
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({ label, variant = "default", style }) => {
  const variantStyles = {
    ai: { backgroundColor: '#FFD700', color: '#333' },
    difficulty: { backgroundColor: colors.russet, color: '#fff' },
    cuisine: { backgroundColor: colors.olive, color: '#fff' },
    default: { backgroundColor: colors.tan, color: colors.navy },
  };

  const { backgroundColor, color } = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      {variant === 'ai' && <Text style={[styles.text, { color }]}>✨ </Text>}
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  text: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default Badge;
