/**
 * Lazy Screen Loading Utility
 * Enables code splitting and lazy loading for React Navigation screens
 */

import React, { Suspense, ComponentType } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "../styles/theme";

/**
 * Loading fallback component shown while screen is loading
 */
const ScreenLoadingFallback: React.FC = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={colors.olive} />
  </View>
);

/**
 * Create a lazy-loaded screen component
 *
 * Usage:
 * ```
 * const LazySettingsScreen = createLazyScreen(
 *   () => import('../screens/Settings/SettingsScreen')
 * );
 * ```
 */
export function createLazyScreen<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
): React.FC<P> {
  const LazyComponent = React.lazy(importFn);

  const LazyScreen: React.FC<P> = (props) => (
    <Suspense fallback={<ScreenLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return LazyScreen;
}

/**
 * HOC to wrap a component with Suspense boundary
 * Useful for screens that may have lazy-loaded children
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  FallbackComponent: ComponentType = ScreenLoadingFallback
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <Suspense fallback={<FallbackComponent />}>
      <Component {...props} />
    </Suspense>
  );

  return WrappedComponent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.cream,
  },
});

export default {
  createLazyScreen,
  withSuspense,
  ScreenLoadingFallback,
};
