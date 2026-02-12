import React, { useRef } from "react";
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Animated, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, borderRadius, typography, shadows, animations, gradients } from "../styles/theme";
import { lightImpact } from "../utils/haptics";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "olive";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  numberOfLines?: number;
}

/**
 * Enhanced GradientButton with smooth press animations
 * Adds subtle scale effect for premium feel
 */
const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
  accessibilityHint,
  numberOfLines,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    lightImpact();
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const gradientColors = {
    primary: gradients.primary,
    secondary: gradients.secondary,
    olive: gradients.olive,
  } as const;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[styles.container, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={gradientColors[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            numberOfLines && numberOfLines > 1 && styles.gradientWrap,
            (disabled || loading) && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : numberOfLines && numberOfLines > 1 ? (
            <View style={styles.textWrapper}>
              {icon && icon}
              <Text
                style={[
                  styles.text,
                  !icon && styles.textNoIcon,
                  styles.textWrap,
                  textStyle,
                ]}
                numberOfLines={numberOfLines}
              >
                {title}
              </Text>
            </View>
          ) : (
            <>
              {icon && icon}
              <Text
                style={[styles.text, !icon && styles.textNoIcon, textStyle]}
                numberOfLines={numberOfLines}
              >
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    ...shadows.medium,
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minHeight: 48,
  },
  gradientWrap: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: 8,
  },
  textWrapper: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    textAlign: "center",
    marginLeft: 0,
    width: "100%",
  },
  textNoIcon: {
    marginLeft: 0,
  },
});

export default GradientButton;
