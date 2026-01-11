import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  ScaledSize,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GradientButton from "../../components/GradientButton";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";

const getScreenDimensions = () => {
  const { width, height } = Dimensions.get("window");
  return { width, height };
};

interface CookingModeScreenProps {
  visible: boolean;
  steps: string[];
  onClose: () => void;
}

const CookingModeScreen: React.FC<CookingModeScreenProps> = ({
  visible,
  steps,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dimensions, setDimensions] = useState(getScreenDimensions());
  const pan = useRef(new Animated.ValueXY()).current;

  // Detect orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Ensure step index stays within bounds when steps change
  useEffect(() => {
    if (steps.length > 0) {
      setCurrentStepIndex((prev) => {
        const clamped = Math.max(0, Math.min(prev, steps.length - 1));
        return clamped;
      });
    }
  }, [steps.length]);

  // Determine if device is in landscape mode
  const isLandscape = dimensions.width > dimensions.height;

  // Clamp step index to valid bounds
  const clampStepIndex = (index: number): number => {
    return Math.max(0, Math.min(index, steps.length - 1));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = dimensions.width * 0.25;
        if (gestureState.dx > swipeThreshold && currentStepIndex > 0) {
          // Swipe right - previous step
          setCurrentStepIndex((prev) => clampStepIndex(prev - 1));
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        } else if (gestureState.dx < -swipeThreshold && currentStepIndex < steps.length - 1) {
          // Swipe left - next step
          setCurrentStepIndex((prev) => clampStepIndex(prev + 1));
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => clampStepIndex(prev + 1));
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => clampStepIndex(prev - 1));
    }
  };

  // Ensure currentStepIndex is always within bounds
  const safeStepIndex = clampStepIndex(currentStepIndex);
  const currentStepText = steps[safeStepIndex] || "";

  if (!visible || steps.length === 0) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      supportedOrientations={["portrait", "portrait-upside-down", "landscape", "landscape-left", "landscape-right"]}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color={colors.text.inverse} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.content,
            isLandscape && styles.contentLandscape,
            {
              transform: [{ translateX: pan.x }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Step indicator and content arranged based on orientation */}
          {isLandscape ? (
            // Landscape layout: side-by-side
            <View style={styles.landscapeContainer}>
              <View style={styles.landscapeLeft}>
                <View style={styles.stepIndicator}>
                  <Text style={styles.stepCounter}>
                    Step {safeStepIndex + 1} of {steps.length}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${((safeStepIndex + 1) / steps.length) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.stepNumber, styles.stepNumberLandscape]}>
                  {safeStepIndex + 1}
                </Text>
              </View>

              <View style={styles.landscapeRight}>
                <ScrollView 
                  style={styles.scrollContainer}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={[styles.stepText, styles.stepTextLandscape]}>
                    {currentStepText}
                  </Text>
                </ScrollView>
                <View style={styles.hintContainer}>
                  <Ionicons name="swap-horizontal" size={20} color={colors.text.secondary} />
                  <Text style={styles.hintText}>Swipe left/right to navigate</Text>
                </View>
              </View>
            </View>
          ) : (
            // Portrait layout: stacked vertically
            <>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepCounter}>
                  Step {safeStepIndex + 1} of {steps.length}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${((safeStepIndex + 1) / steps.length) * 100}%` },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.stepContent}>
                <Text style={styles.stepNumber}>{safeStepIndex + 1}</Text>
                <ScrollView 
                  style={styles.scrollContainer}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.stepText}>{currentStepText}</Text>
                </ScrollView>
              </View>

              <View style={styles.hintContainer}>
                <Ionicons name="swap-horizontal" size={20} color={colors.text.secondary} />
                <Text style={styles.hintText}>Swipe left/right to navigate</Text>
              </View>
            </>
          )}
        </Animated.View>

        <View style={[styles.controls, isLandscape && styles.controlsLandscape]}>
          <GradientButton
            title="Previous"
            variant="secondary"
            onPress={handlePrev}
            disabled={safeStepIndex === 0}
            style={styles.controlButton}
          />
          <GradientButton
            title={safeStepIndex === steps.length - 1 ? "Done" : "Next"}
            onPress={handleNext}
            style={styles.controlButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  closeButton: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.lg,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2,
  },
  contentLandscape: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  stepIndicator: {
    marginBottom: spacing.xl,
  },
  stepCounter: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.olive,
    borderRadius: borderRadius.full,
  },
  stepContent: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: spacing.lg,
  },
  stepNumber: {
    fontSize: 72,
    fontWeight: typography.fontWeight.bold,
    color: colors.olive,
    marginBottom: spacing.lg,
  },
  stepNumberLandscape: {
    fontSize: 96,
    marginBottom: 0,
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stepText: {
    fontSize: typography.fontSize.xxl,
    color: colors.text.inverse,
    textAlign: "center",
    lineHeight: 36,
  },
  stepTextLandscape: {
    fontSize: typography.fontSize.xl,
    lineHeight: 32,
    textAlign: "left",
    paddingHorizontal: 0,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  hintText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  controls: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  controlsLandscape: {
    paddingVertical: spacing.sm,
  },
  controlButton: {
    flex: 1,
  },
  // Landscape-specific layouts
  landscapeContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxl,
  },
  landscapeLeft: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  landscapeRight: {
    flex: 2,
    justifyContent: "flex-start",
    paddingTop: spacing.lg,
  },
});

export default CookingModeScreen;

