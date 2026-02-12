import React, { useState, useCallback } from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";
import { colors } from "../styles/theme";

interface PressableButtonProps extends TouchableOpacityProps {
  /**
   * If true, shows a loading indicator and disables the button
   */
  loading?: boolean;
  /**
   * Debounce time in ms to prevent double-taps (default: 500)
   */
  debounceTime?: number;
  /**
   * Color of the loading indicator
   */
  loadingColor?: string;
  /**
   * Size of the loading indicator
   */
  loadingSize?: "small" | "large";
}

/**
 * A button component that prevents double-taps and shows loading state
 * Use this instead of TouchableOpacity for any action that triggers an API call
 */
const PressableButton: React.FC<PressableButtonProps> = ({
  onPress,
  disabled,
  loading = false,
  debounceTime = 500,
  loadingColor = colors.olive,
  loadingSize = "small",
  children,
  style,
  ...props
}) => {
  const [isDebouncing, setIsDebouncing] = useState(false);

  const handlePress = useCallback(
    (event: any) => {
      if (isDebouncing || loading || disabled) return;

      setIsDebouncing(true);

      // Call the onPress handler
      onPress?.(event);

      // Reset debounce after delay
      setTimeout(() => {
        setIsDebouncing(false);
      }, debounceTime);
    },
    [onPress, isDebouncing, loading, disabled, debounceTime]
  );

  const isDisabled = disabled || loading || isDebouncing;

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      disabled={isDisabled}
      style={[style, isDisabled && styles.disabled]}
      activeOpacity={0.7}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={loadingSize} color={loadingColor} />
        </View>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PressableButton;
