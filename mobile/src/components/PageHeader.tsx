import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, gradients } from '../styles/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'default' | 'gradient';
}

/**
 * Sophisticated page header with optional gradient background
 * Provides consistent navigation and branding across screens
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  variant = 'default',
}) => {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={styles.content}>
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backButton,
              {
                backgroundColor:
                  variant === 'gradient'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Back"
            accessibilityRole="button"
            accessibilityHint="Navigates to the previous screen"
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={variant === 'gradient' ? colors.text.inverse : colors.navy}
            />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              variant === 'gradient' && styles.titleGradient,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                variant === 'gradient' && styles.subtitleGradient,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && <View style={styles.rightSection}>{rightAction}</View>}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={gradients.premium}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientContainer, { paddingTop: insets.top }]}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gradientContainer: {
    paddingBottom: spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    minHeight: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: spacing.sm,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  titleGradient: {
    color: colors.text.inverse,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  subtitleGradient: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  rightSection: {
    marginLeft: spacing.md,
  },
});

export default PageHeader;
