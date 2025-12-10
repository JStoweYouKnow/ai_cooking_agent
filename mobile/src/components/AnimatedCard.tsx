import React, { useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, animations } from '../styles/theme';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'premium';
  disabled?: boolean;
}

/**
 * Sophisticated card with smooth press animations
 * Adds subtle scale and shadow effects for premium feel
 */
const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: animations.timing.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0,
        duration: animations.timing.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const shadowStyle = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const variantStyles = {
    default: styles.cardDefault,
    elevated: styles.cardElevated,
    premium: styles.cardPremium,
  };

  const content = (
    <Animated.View
      style={[
        styles.card,
        variantStyles[variant],
        {
          transform: [{ scale: scaleAnim }],
          shadowOffset: {
            width: 0,
            height: shadowStyle,
          },
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  if (!onPress || disabled) {
    return content;
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardDefault: {
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  cardElevated: {
    backgroundColor: colors.surface,
    ...shadows.medium,
  },
  cardPremium: {
    backgroundColor: colors.surface,
    ...shadows.premium,
  },
});

export default AnimatedCard;
