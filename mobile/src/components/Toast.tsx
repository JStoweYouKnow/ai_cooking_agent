import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography, shadows } from '../styles/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [animatedValue] = useState(new Animated.Value(0));

  const hideToast = useCallback(() => {
    Animated.timing(animatedValue, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setToast(null)
    );
  }, [animatedValue]);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      setToast({ message, type });
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(animatedValue, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setToast(null));
    },
    [animatedValue]
  );

  const contextValue = useMemo(
    () => ({
      showToast,
      hideToast,
    }),
    [showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            styles[toast.type],
            {
              opacity: animatedValue,
              transform: [
                {
                  translateY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.toastContent}>
            <Ionicons
              name={
                toast.type === 'success'
                  ? 'checkmark-circle'
                  : toast.type === 'error'
                  ? 'alert-circle'
                  : 'information-circle'
              }
              size={24}
              color={colors.text.inverse}
              style={styles.toastIcon}
            />
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
          <TouchableOpacity onPress={hideToast} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={20} color={colors.text.inverse} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.large,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toastIcon: {
    marginRight: spacing.sm,
  },
  toastText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    marginRight: spacing.sm,
  },
  success: {
    backgroundColor: colors.success,
  },
  error: {
    backgroundColor: colors.error,
  },
  info: {
    backgroundColor: colors.info,
  },
});

