import React, { ReactNode } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { borderRadius, shadows, colors } from "../styles/theme";

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "premium";
}

/**
 * Enhanced GlassCard with sophisticated glassmorphism effect
 * Now includes subtle inner shadows and better gradient overlays
 */
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = "default"
}) => {
  if (variant === "premium") {
    return (
      <View style={[styles.premiumContainer, style]}>
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.95)',
            'rgba(255, 255, 255, 0.85)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumGradient}
        >
          <View style={styles.glassOverlay}>
            {children}
          </View>
        </LinearGradient>
        {/* Subtle accent border on top */}
        <View style={styles.accentBorder} />
      </View>
    );
  }

  return (
    <View style={[
      styles.card,
      variant === "elevated" && styles.elevatedCard,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: borderRadius.xl,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...shadows.medium,
  },
  elevatedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    ...shadows.large,
  },
  premiumContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.premium,
  },
  premiumGradient: {
    borderRadius: borderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(119, 133, 106, 0.15)',
  },
  glassOverlay: {
    flex: 1,
  },
  accentBorder: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: colors.olive,
    opacity: 0.3,
    borderRadius: borderRadius.full,
  },
});

export default GlassCard;
