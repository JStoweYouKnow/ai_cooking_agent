import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { useGlobalSearch } from "../../contexts/SearchContext";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
  showSearch?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  style,
  showSearch,
  showBack,
  onBackPress,
}) => {
  const { openSearch } = useGlobalSearch();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        {showBack && onBackPress && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.navy} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title} allowFontScaling>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} allowFontScaling>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {(showSearch || (actionLabel && onActionPress)) && (
        <View style={styles.actionRow}>
          {showSearch && (
            <TouchableOpacity style={styles.iconButton} onPress={openSearch} accessibilityLabel="Search">
              <Ionicons name="search" size={20} color={colors.navy} />
            </TouchableOpacity>
          )}
          {actionLabel && onActionPress && (
            <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
              <Text style={styles.actionText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    letterSpacing: 0.2,
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "flex-start",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  actionButton: {
    backgroundColor: colors.olive,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  actionText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default ScreenHeader;

