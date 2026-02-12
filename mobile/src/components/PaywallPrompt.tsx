/**
 * PaywallPrompt Component
 * Displays upgrade prompts when users hit free tier limits
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import GlassCard from "./GlassCard";
import GradientButton from "./GradientButton";
import { colors, spacing, typography, borderRadius } from "../styles/theme";

interface PaywallPromptProps {
  /** Feature that requires premium */
  feature: string;
  /** Current usage count */
  currentUsage?: number;
  /** Usage limit for free tier */
  limit?: number;
  /** Custom message to display */
  message?: string;
  /** Callback when user taps upgrade */
  onUpgrade?: () => void;
  /** Variant: inline (card) or modal (full screen) */
  variant?: "inline" | "modal";
  /** Show close button (for modal variant) */
  showClose?: boolean;
  /** Callback when user closes */
  onClose?: () => void;
  /** Creator endorsement (e.g. Eitan) - show hero in modal */
  creatorName?: string;
  creatorEndorsement?: string;
}

const PaywallPrompt: React.FC<PaywallPromptProps> = ({
  feature,
  currentUsage,
  limit,
  message,
  onUpgrade,
  variant = "inline",
  showClose = false,
  onClose,
  creatorName,
  creatorEndorsement,
}) => {
  const navigation = useNavigation();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Navigate to subscription screen
      navigation.navigate("More" as never, { screen: "Subscription" } as never);
    }
  };

  const displayMessage =
    message ||
    (currentUsage !== undefined && limit !== undefined
      ? `You've used ${currentUsage} of ${limit} free ${feature}. Upgrade to Premium for unlimited access.`
      : `${feature} is a Premium feature. Upgrade to unlock.`);

  if (variant === "modal") {
    return (
      <View style={styles.modalOverlay}>
        <GlassCard style={styles.modalCard}>
          {showClose && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              accessibilityHint="Dismisses the upgrade prompt"
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          {(creatorName || creatorEndorsement) ? (
            <View style={styles.creatorHero}>
              {creatorName ? (
                <Text style={styles.creatorName}>Recommended by {creatorName}</Text>
              ) : null}
              {creatorEndorsement ? (
                <Text style={styles.creatorEndorsement}>"{creatorEndorsement}"</Text>
              ) : null}
            </View>
          ) : null}
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={48} color={colors.olive} />
          </View>
          <Text style={styles.modalTitle}>Unlock Premium</Text>
          <Text style={styles.modalMessage}>{displayMessage}</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.olive} />
              <Text style={styles.featureText}>Unlimited {feature}</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.olive} />
              <Text style={styles.featureText}>All Premium features</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.olive} />
              <Text style={styles.featureText}>Ad-free experience</Text>
            </View>
          </View>
          <GradientButton
            title="Upgrade to Premium"
            onPress={handleUpgrade}
            style={styles.upgradeButton}
            accessibilityLabel="Upgrade to Premium"
            accessibilityHint="Opens the subscription screen"
          />
          <TouchableOpacity
            onPress={onClose}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Maybe later"
            accessibilityHint="Dismisses the upgrade prompt"
          >
            <Text style={styles.cancelText}>Maybe Later</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    );
  }

  // Inline variant
  return (
    <GlassCard style={styles.inlineCard}>
      <View style={styles.inlineContent}>
        <View style={styles.iconRow}>
          <Ionicons name="lock-closed" size={20} color={colors.olive} />
          <Text style={styles.inlineTitle}>Premium Feature</Text>
        </View>
        <Text style={styles.inlineMessage}>{displayMessage}</Text>
        <GradientButton
          title="Upgrade Now"
          onPress={handleUpgrade}
          variant="olive"
          style={styles.inlineButton}
          accessibilityLabel="Upgrade now"
          accessibilityHint="Opens the subscription screen"
        />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    maxWidth: 400,
    width: "90%",
  },
  closeButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  creatorHero: {
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: "rgba(139, 115, 85, 0.12)",
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.olive,
  },
  creatorName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  creatorEndorsement: {
    fontSize: typography.fontSize.sm,
    fontStyle: "italic",
    color: colors.text.primary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.md,
  },
  featuresList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  upgradeButton: {
    marginBottom: spacing.md,
  },
  cancelButton: {
    padding: spacing.sm,
    alignItems: "center",
  },
  cancelText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  inlineCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  inlineContent: {
    gap: spacing.sm,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  inlineTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy,
  },
  inlineMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
  inlineButton: {
    marginTop: spacing.xs,
  },
});

export default PaywallPrompt;
