import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetwork } from "../contexts/NetworkContext";
import { colors, spacing, typography } from "../styles/theme";

interface OfflineBannerProps {
  onRetry?: () => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ onRetry }) => {
  const { isConnected, isInternetReachable, checkConnection } = useNetwork();
  const insets = useSafeAreaInsets();

  // Show banner if not connected or internet is not reachable
  const showBanner = !isConnected || !isInternetReachable;

  if (!showBanner) return null;

  const handleRetry = async () => {
    await checkConnection();
    onRetry?.();
  };

  return (
    <View style={[styles.container, { top: insets.top }]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={20} color="#fff" />
        <Text style={styles.text}>
          {!isConnected ? "No network connection" : "Internet unavailable"}
        </Text>
        <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
          <Ionicons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: colors.russet,
    zIndex: 9998,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  text: {
    color: "#fff",
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    marginLeft: spacing.sm,
    flex: 1,
  },
  retryButton: {
    padding: spacing.xs,
  },
});

export default OfflineBanner;
