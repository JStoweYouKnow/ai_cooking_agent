import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    accessibilityLabel?: string;
    accessibilityHint?: string;
  };
  variant?: 'default' | 'large' | 'minimal';
  style?: any;
}

/**
 * Production-ready section header for content organization
 *
 * Design principles:
 * - Clear visual hierarchy
 * - Scannable content
 * - Tasteful typography
 * - Proper spacing rhythm
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  variant = 'default',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text
          style={[
            variant === 'large' ? styles.titleLarge : styles.title,
            variant === 'minimal' && styles.titleMinimal,
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>

      {action && (
        <TouchableOpacity
          onPress={action.onPress}
          style={styles.actionButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel || action.label}
          accessibilityHint={action.accessibilityHint}
        >
          <Text style={styles.actionLabel}>{action.label}</Text>
          {action.icon && (
            <Ionicons name={action.icon} size={16} color={colors.olive} style={styles.actionIcon} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  titleLarge: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    letterSpacing: -0.8,
    marginBottom: spacing.sm,
  },
  titleMinimal: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionLabel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.olive,
  },
  actionIcon: {
    marginLeft: 4,
  },
});

export default SectionHeader;
