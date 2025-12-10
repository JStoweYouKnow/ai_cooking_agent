import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius, shadows, gradients } from '../styles/theme';
import { BlurView } from 'expo-blur';

/**
 * Converts Ionicons icon names to human-readable accessibility labels
 */
const humanizeIcon = (icon: keyof typeof Ionicons.glyphMap): string => {
  // Common icon name mappings
  const iconMap: Record<string, string> = {
    'arrow-back': 'Back',
    'arrow-forward': 'Forward',
    'arrow-up': 'Up',
    'arrow-down': 'Down',
    'close': 'Close',
    'menu': 'Menu',
    'search': 'Search',
    'notifications': 'Notifications',
    'notifications-outline': 'Notifications',
    'settings': 'Settings',
    'settings-outline': 'Settings',
    'heart': 'Like',
    'heart-outline': 'Like',
    'share': 'Share',
    'share-outline': 'Share',
    'add': 'Add',
    'add-circle': 'Add',
    'add-circle-outline': 'Add',
    'remove': 'Remove',
    'remove-circle': 'Remove',
    'remove-circle-outline': 'Remove',
    'checkmark': 'Done',
    'checkmark-circle': 'Done',
    'checkmark-circle-outline': 'Done',
    'chevron-back': 'Back',
    'chevron-forward': 'Forward',
    'chevron-up': 'Up',
    'chevron-down': 'Down',
    'ellipsis-horizontal': 'More options',
    'ellipsis-vertical': 'More options',
    'filter': 'Filter',
    'filter-outline': 'Filter',
    'trash': 'Delete',
    'trash-outline': 'Delete',
    'pencil': 'Edit',
    'pencil-outline': 'Edit',
    'save': 'Save',
    'save-outline': 'Save',
    'home': 'Home',
    'home-outline': 'Home',
    'person': 'Profile',
    'person-outline': 'Profile',
    'cart': 'Cart',
    'cart-outline': 'Cart',
  };

  // Check if we have a direct mapping
  if (iconMap[icon]) {
    return iconMap[icon];
  }

  // Convert kebab-case or camelCase to readable words
  // e.g., "arrow-back" -> "Arrow Back", "notificationsOutline" -> "Notifications Outline"
  const readable = icon
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to words
    .replace(/-/g, ' ') // kebab-case to words
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word

  return readable;
};

interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'default' | 'gradient' | 'transparent' | 'blur';
  leftAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label?: string;
  };
  rightActions?: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label?: string;
    badge?: number;
  }>;
  showShadow?: boolean;
  large?: boolean;
}

/**
 * Production-ready navigation header designed by a senior UX/UI designer
 *
 * Features:
 * - Multiple variants for different contexts
 * - Smooth blur effects (iOS)
 * - Sophisticated gradients
 * - Badge support for notifications
 * - Large title mode for important screens
 * - Proper safe area handling
 * - Accessibility optimized
 */
const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  subtitle,
  variant = 'default',
  leftAction,
  rightActions = [],
  showShadow = true,
  large = false,
}) => {
  const insets = useSafeAreaInsets();
  // Calculate status bar height dynamically with fallback for Android
  const statusBarHeight = Platform.OS === 'ios' 
    ? insets.top 
    : (StatusBar.currentHeight || 24);

  const renderActionButton = (
    icon: keyof typeof Ionicons.glyphMap,
    onPress: () => void,
    label?: string,
    badge?: number
  ) => {
    const accessibilityLabel = label ?? humanizeIcon(icon);
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.actionButton}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
      <View>
        <Ionicons
          name={icon}
          size={24}
          color={variant === 'gradient' ? colors.text.inverse : colors.navy}
        />
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  const renderContent = () => (
    <View
      style={[
        styles.content,
        Platform.OS === 'android' && { paddingTop: statusBarHeight + spacing.sm },
        large && styles.contentLarge,
      ]}
    >
      {/* Left Section */}
      <View style={styles.leftSection}>
        {leftAction && (
          <View style={styles.leftActionContainer}>
            {renderActionButton(leftAction.icon, leftAction.onPress, leftAction.label)}
          </View>
        )}

        {/* Title Section */}
        <View style={[styles.titleContainer, leftAction && styles.titleWithLeft]}>
          <Text
            style={[
              large ? styles.titleLarge : styles.title,
              variant === 'gradient' && styles.titleLight,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                variant === 'gradient' && styles.subtitleLight,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Right Actions */}
      {rightActions.length > 0 && (
        <View style={styles.rightSection}>
          {rightActions.map((action, index) => (
            <View key={index} style={styles.actionContainer}>
              {renderActionButton(action.icon, action.onPress, action.label, action.badge)}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Gradient variant
  if (variant === 'gradient') {
    return (
      <View style={[styles.container, showShadow && styles.containerWithShadow]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={gradients.premium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientContainer,
            { paddingTop: statusBarHeight },
            large && styles.gradientContainerLarge,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </View>
    );
  }

  // Blur variant (iOS only)
  if (variant === 'blur' && Platform.OS === 'ios') {
    return (
      <View style={[styles.container, showShadow && styles.containerWithShadow]}>
        <StatusBar barStyle="dark-content" />
        <BlurView
          intensity={95}
          tint="light"
          style={[styles.blurContainer, { paddingTop: statusBarHeight }]}
        >
          {renderContent()}
        </BlurView>
      </View>
    );
  }

  // Transparent variant
  if (variant === 'transparent') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderContent()}
      </View>
    );
  }

  // Default variant
  return (
    <View style={[styles.container, showShadow && styles.containerWithShadow]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.defaultContainer, large && styles.defaultContainerLarge]}>
        {renderContent()}
      </View>
    </View>
  );
};

const HEADER_HEIGHT = 56;
const HEADER_HEIGHT_LARGE = 96;

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  containerWithShadow: {
    ...shadows.medium,
  },
  defaultContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  defaultContainerLarge: {
    paddingBottom: spacing.md,
  },
  gradientContainer: {
    // paddingTop is set dynamically via inline styles
  },
  gradientContainerLarge: {
    paddingBottom: spacing.md,
  },
  blurContainer: {
    // paddingTop is set dynamically via inline styles
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: HEADER_HEIGHT,
  },
  contentLarge: {
    minHeight: HEADER_HEIGHT_LARGE,
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 44, // Minimum touch target
  },
  leftActionContainer: {
    marginRight: spacing.xs,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleWithLeft: {
    paddingLeft: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    letterSpacing: -0.5,
  },
  titleLarge: {
    fontSize: 34,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    letterSpacing: -1,
    lineHeight: 40,
  },
  titleLight: {
    color: colors.text.inverse,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
    letterSpacing: 0,
  },
  subtitleLight: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  actionContainer: {
    marginLeft: spacing.xs,
  },
  actionButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.russet,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
});

export default NavigationHeader;
