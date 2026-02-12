import React from 'react';
import { View, Text, StyleSheet, ImageSourcePropType, Image, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../styles/theme';
import GradientButton from './GradientButton';

interface EmptyStateProps {
  title: string;
  description?: string;
  illustration?: ImageSourcePropType;
  icon?: keyof typeof Ionicons.glyphMap;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'minimal' | 'compact' | 'error';
  style?: ViewStyle;
}

/**
 * Production-ready EmptyState component for zero-data scenarios
 *
 * Features:
 * - Icon or custom illustration support
 * - Multiple variants (default, minimal, compact)
 * - Glassmorphic background
 * - Primary and secondary actions
 * - Accessible with proper labels
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon="restaurant-outline"
 *   title="No recipes yet"
 *   description="Start by adding your first recipe or importing from a URL"
 *   primaryActionLabel="Add Recipe"
 *   onPrimaryAction={() => navigation.navigate('AddRecipe')}
 * />
 * ```
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  illustration,
  icon,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  style,
}) => {
  const combinedLabel = description ? `${title}. ${description}` : title;
  const isError = variant === 'error';
  const iconName = isError ? (icon ?? 'alert-circle-outline') : icon;

  return (
    <View
      style={[
        styles.container,
        variant === 'minimal' && styles.containerMinimal,
        variant === 'compact' && styles.containerCompact,
        isError && styles.containerError,
        style
      ]}
      accessible
      accessibilityLabel={combinedLabel}
    >
      {/* Illustration or Icon */}
      {illustration ? (
        <Image source={illustration} style={styles.illustration} resizeMode="contain" />
      ) : iconName ? (
        <View style={[styles.iconContainer, isError && styles.iconContainerError]}>
          <Ionicons name={iconName} size={64} color={isError ? colors.error : colors.text.tertiary} />
        </View>
      ) : null}

      {/* Title */}
      <Text style={[styles.title, variant === 'compact' && styles.titleCompact]} allowFontScaling>
        {title}
      </Text>

      {/* Description */}
      {description ? (
        <Text style={[styles.description, variant === 'compact' && styles.descriptionCompact]} allowFontScaling>
          {description}
        </Text>
      ) : null}

      {/* Actions */}
      {(primaryActionLabel || secondaryActionLabel) && (
        <View style={[styles.actions, variant === 'compact' && styles.actionsCompact]}>
          {primaryActionLabel && onPrimaryAction && (
            <GradientButton
              title={primaryActionLabel}
              onPress={onPrimaryAction}
              style={[styles.primaryButton, isError && styles.primaryButtonError]}
              accessibilityLabel={primaryActionLabel}
              accessibilityHint={isError ? "Retries the failed action" : "Performs the primary action for this state"}
            />
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <GradientButton
              title={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="secondary"
              style={styles.secondaryButton}
              accessibilityLabel={secondaryActionLabel}
              accessibilityHint="Performs the secondary action for this state"
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xl,
  },
  containerMinimal: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
  containerCompact: {
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  containerError: {
    borderColor: colors.error,
  },
  iconContainerError: {
    backgroundColor: colors.error + '18',
  },
  primaryButtonError: {
    // optional: use error tint
  },
  illustration: {
    width: 160,
    height: 160,
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: typography.fontSize.lg,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  descriptionCompact: {
    fontSize: typography.fontSize.sm,
    maxWidth: 280,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionsCompact: {
    marginTop: spacing.md,
  },
  primaryButton: {
    minWidth: 140,
  },
  secondaryButton: {
    minWidth: 140,
  },
});

export default EmptyState;

