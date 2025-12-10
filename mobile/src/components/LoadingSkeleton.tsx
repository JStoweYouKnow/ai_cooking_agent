import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius } from '../styles/theme';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadiusOverride?: number;
  variant?: 'rect' | 'circle';
  style?: ViewStyle;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadiusOverride,
  variant = 'rect',
  style,
}) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  const radius = variant === 'circle' ? height / 2 : borderRadiusOverride ?? borderRadius.md;

  return (
    <Animated.View style={[styles.container, { width, height, borderRadius: radius }, style]}>
      <Animated.View style={[styles.shimmerWrapper, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    marginVertical: 4,
  },
  shimmerWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
});

export default LoadingSkeleton;

