import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, borderRadius, spacing, shadows, animations } from '../styles/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapHeight?: number; // value between 0-1 representing screen height
  contentStyle?: ViewStyle;
  enableBackdropDismiss?: boolean;
}

/**
 * Production-ready BottomSheet component for modals and actions
 *
 * Features:
 * - Smooth slide-up animation with spring physics
 * - Backdrop dismiss (can be disabled)
 * - Drag handle for visual affordance
 * - Configurable snap height
 * - Prevents accidental dismissal when tapping inside
 * - Proper safe area handling
 *
 * Usage:
 * ```tsx
 * <BottomSheet
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   snapHeight={0.7}
 * >
 *   <Text>Your content here</Text>
 * </BottomSheet>
 * ```
 */
const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  snapHeight = 0.6,
  contentStyle,
  enableBackdropDismiss = true,
}) => {
  const translateY = useRef(new Animated.Value(1)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 300,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: animations.timing.fast,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 1,
          duration: animations.timing.normal,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: animations.timing.fast,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  const handleBackdropPress = () => {
    if (enableBackdropDismiss) {
      onClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      accessibilityViewIsModal
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
        accessibilityRole="button"
        accessibilityLabel="Close sheet"
      >
        <Animated.View
          style={[
            styles.backdropOverlay,
            {
              opacity: backdropOpacity,
            },
          ]}
        />
        <TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.sheet,
              {
                transform: [
                  {
                    translateY: translateY.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1000],
                    }),
                  },
                ],
                height: `${snapHeight * 100}%`,
              },
              contentStyle,
            ]}
          >
            <KeyboardAvoidingView
              style={styles.keyboardAvoider}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
            >
              <TouchableOpacity
                onPress={onClose}
                style={styles.handleContainer}
                hitSlop={{ top: 20, bottom: 20, left: 50, right: 50 }}
              >
                <View style={styles.handle} />
              </TouchableOpacity>
              <ScrollView
                contentContainerStyle={styles.contentScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    ...shadows.premium,
  },
  keyboardAvoider: {
    flex: 1,
  },
  handleContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.text.tertiary,
    opacity: 0.3,
  },
  contentScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
  },
});

export default BottomSheet;

