import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  ScrollView,
  Alert,
  Vibration,
  AccessibilityInfo,
  Share,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Speech from "expo-speech";
import GradientButton from "../../components/GradientButton";
import { colors, spacing, typography, borderRadius, shadows } from "../../styles/theme";
import { trpc } from "../../api/trpc";
import {
  stepCompletionHaptics,
  celebrationHaptics,
  mediumImpact,
  successNotification,
} from "../../utils/haptics";

// Timer parsing regex patterns
const TIMER_PATTERNS = [
  /(\d+)\s*(?:to\s*\d+\s*)?minutes?/i,
  /(\d+)\s*(?:to\s*\d+\s*)?mins?/i,
  /(\d+)\s*(?:to\s*\d+\s*)?hours?/i,
  /(\d+)\s*(?:to\s*\d+\s*)?seconds?/i,
];

/**
 * Extract timer duration from step text
 * Returns duration in seconds, or null if no timer found
 */
function extractTimerFromStep(stepText: string): { duration: number; label: string } | null {
  // Check for minutes
  const minuteMatch = stepText.match(/(\d+)\s*(?:to\s*(\d+)\s*)?(?:minutes?|mins?)/i);
  if (minuteMatch) {
    const minutes = parseInt(minuteMatch[2] || minuteMatch[1], 10);
    return { duration: minutes * 60, label: `${minutes} min` };
  }
  
  // Check for hours
  const hourMatch = stepText.match(/(\d+)\s*(?:to\s*(\d+)\s*)?hours?/i);
  if (hourMatch) {
    const hours = parseInt(hourMatch[2] || hourMatch[1], 10);
    return { duration: hours * 3600, label: `${hours} hr` };
  }
  
  // Check for seconds (for quick steps)
  const secondMatch = stepText.match(/(\d+)\s*(?:to\s*(\d+)\s*)?seconds?/i);
  if (secondMatch) {
    const seconds = parseInt(secondMatch[2] || secondMatch[1], 10);
    if (seconds >= 10) { // Only show timer for 10+ seconds
      return { duration: seconds, label: `${seconds} sec` };
    }
  }
  
  return null;
}

const getScreenDimensions = () => {
  const { width, height } = Dimensions.get("window");
  return { width, height };
};

const COOKING_STEP_STORAGE_KEY = (recipeId: number) => `cooking_mode_step_${recipeId}`;

interface CookingModeScreenProps {
  visible: boolean;
  steps: string[];
  recipeId?: number;
  recipeName?: string;
  onClose: () => void;
  onCookingComplete?: () => void;
}

const CookingModeScreen: React.FC<CookingModeScreenProps> = ({
  visible,
  steps,
  recipeId,
  recipeName,
  onClose,
  onCookingComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [dimensions, setDimensions] = useState(getScreenDimensions());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerLabel, setTimerLabel] = useState("");
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const utils = trpc.useUtils();
  
  const markAsCookedMutation = trpc.recipes.markAsCooked.useMutation({
    onSuccess: () => {
      utils.recipes.getById.invalidate();
      utils.recipes.list.invalidate();
    },
  });

  // Voice readout function
  const speakStep = useCallback(async (stepText: string) => {
    if (!voiceEnabled) return;
    
    try {
      // Stop any current speech
      await Speech.stop();
      setIsSpeaking(true);
      
      await Speech.speak(stepText, {
        language: "en-US",
        pitch: 1.0,
        rate: 0.9, // Slightly slower for cooking
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error("[CookingMode] Speech error:", error);
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  // Stop speech when closing
  useEffect(() => {
    return () => {
      Speech.stop();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Clamp step index to valid bounds (defined early for use throughout component)
  const clampStepIndex = (index: number): number => {
    return Math.max(0, Math.min(index, steps.length - 1));
  };

  // Ensure currentStepIndex is always within bounds
  const safeStepIndex = clampStepIndex(currentStepIndex);
  
  // Speak current step when it changes
  useEffect(() => {
    if (visible && steps[safeStepIndex] && voiceEnabled) {
      speakStep(steps[safeStepIndex]);
    }
  }, [safeStepIndex, visible, voiceEnabled, speakStep, steps]);

  // Timer countdown effect
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerActive, timerSeconds]);

  // Handle timer completion side effects
  useEffect(() => {
    if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      successNotification();
      Vibration.vibrate([0, 500, 200, 500, 200, 500]); // Distinctive pattern
      Alert.alert("Timer Complete! ⏰", `${timerLabel} timer is done!`);
    }
  }, [timerSeconds, timerActive, timerLabel]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Start timer for current step
  const handleStartTimer = () => {
    const timerInfo = extractTimerFromStep(steps[safeStepIndex] || "");
    if (timerInfo) {
      setTimerSeconds(timerInfo.duration);
      setTimerLabel(timerInfo.label);
      setTimerActive(true);
      mediumImpact();
    }
  };

  // Stop timer
  const handleStopTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
  };

  // Check if current step has a timer (moved before use)
  const currentStepTimer = extractTimerFromStep(steps[safeStepIndex] || "");

  // Quick voice command buttons
  const quickCommands = [
    { label: "Next", command: "next", icon: "arrow-forward" },
    { label: "Repeat", command: "repeat", icon: "refresh" },
    { label: "Timer", command: `set timer for ${currentStepTimer?.duration ? Math.floor(currentStepTimer.duration / 60) : 5} minutes`, icon: "timer" },
  ];

  const handleNext = async () => {
    if (safeStepIndex < steps.length - 1) {
      await stepCompletionHaptics();
      setCurrentStepIndex((prev) => clampStepIndex(prev + 1));
    } else {
      // Show completion modal instead of closing immediately
      await celebrationHaptics();
      setShowCompletionModal(true);
      // Animate confetti
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePrev = async () => {
    if (safeStepIndex > 0) {
      await mediumImpact();
      setCurrentStepIndex((prev) => clampStepIndex(prev - 1));
    }
  };

  // Voice command handlers
  const handleVoiceCommand = useCallback(async (command: string) => {
    if (!voiceCommandsEnabled) return;
    
    await mediumImpact();
    setLastCommand(command);
    
    // Execute command
    switch (command.toLowerCase()) {
      case "next":
      case "next step":
        handleNext();
        break;
      case "previous":
      case "previous step":
      case "back":
        handlePrev();
        break;
      case "repeat":
      case "repeat step":
        if (steps[safeStepIndex]) {
          await speakStep(steps[safeStepIndex]);
        }
        break;
      case "stop":
      case "stop timer":
        handleStopTimer();
        await Speech.speak("Timer stopped");
        break;
      default:
        // Try to parse timer command
        const timerMatch = command.match(/(?:set|start)\s+timer\s+(?:for\s+)?(\d+)\s*(?:minutes?|mins?|min)/i);
        if (timerMatch) {
          const minutes = parseInt(timerMatch[1], 10);
          setTimerSeconds(minutes * 60);
          setTimerLabel(`${minutes} min`);
          setTimerActive(true);
          await Speech.speak(`Timer set for ${minutes} minutes`);
        } else {
          await Speech.speak("Command not recognized");
        }
    }
    
    // Clear command after 2 seconds
    setTimeout(() => setLastCommand(null), 2000);
  }, [voiceCommandsEnabled, safeStepIndex, steps, handleNext, handlePrev, speakStep]);

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

  // Restore last step when reopening (persisted in AsyncStorage)
  useEffect(() => {
    if (!visible || !recipeId || steps.length === 0) return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(COOKING_STEP_STORAGE_KEY(recipeId));
        const saved = raw != null ? parseInt(raw, 10) : 0;
        if (saved > 0 && saved < steps.length) {
          setCurrentStepIndex(saved);
          setShowResumeBanner(true);
        }
      } catch {
        // ignore
      }
    })();
  }, [visible, recipeId, steps.length]);

  // Persist current step index when it changes (for resume on reopen)
  useEffect(() => {
    if (!visible || recipeId == null) return;
    AsyncStorage.setItem(COOKING_STEP_STORAGE_KEY(recipeId), String(currentStepIndex)).catch(() => {});
  }, [visible, recipeId, currentStepIndex]);

  // Determine if device is in landscape mode
  const isLandscape = dimensions.width > dimensions.height;

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


  const handleShareCooked = async () => {
    try {
      await Share.share({
        message: `I just cooked "${recipeName || "a recipe"}" with Sous! 🍳`,
        title: "I cooked it!",
      });
    } catch {
      // User cancelled or share failed - ignore
    }
  };

  const handleMarkAsCooked = async () => {
    if (recipeId) {
      try {
        await AsyncStorage.removeItem(COOKING_STEP_STORAGE_KEY(recipeId));
      } catch { /* ignore */ }
      try {
        await markAsCookedMutation.mutateAsync({ id: recipeId });
        await celebrationHaptics();
        Alert.alert(
          "Congratulations! 🎉",
          `You've successfully cooked ${recipeName || "this recipe"}! Great job!`,
          [
            { text: "Share", onPress: handleShareCooked },
            { text: "Thanks!", onPress: handleClose },
          ]
        );
        onCookingComplete?.();
      } catch (error) {
        console.error("Failed to mark recipe as cooked:", error);
        Alert.alert(
          "Couldn't save",
          "Failed to mark recipe as cooked. Check your connection and try again.",
          [
            { text: "Retry", onPress: () => handleMarkAsCooked() },
            { text: "Close", onPress: handleClose, style: "cancel" },
          ]
        );
      }
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowResumeBanner(false);
    setShowCompletionModal(false);
    confettiAnim.setValue(0);
    onClose();
  };

  const handleSkipMarking = () => {
    if (recipeId != null) {
      AsyncStorage.removeItem(COOKING_STEP_STORAGE_KEY(recipeId)).catch(() => {});
    }
    setShowResumeBanner(false);
    setShowCompletionModal(false);
    setCurrentStepIndex(0);
    confettiAnim.setValue(0);
    onClose();
  };

  // Get current step text using the safe index (already declared above)
  const currentStepText = steps[safeStepIndex] || "";

  // Announce step changes for screen readers
  useEffect(() => {
    if (visible && currentStepText) {
      AccessibilityInfo.announceForAccessibility?.(
        `Step ${safeStepIndex + 1} of ${steps.length}. ${currentStepText}`
      );
    }
  }, [visible, safeStepIndex, steps.length, currentStepText]);

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
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close cooking mode"
          accessibilityHint="Exits cooking mode and returns to recipe"
        >
          <Ionicons name="close" size={28} color={colors.text.inverse} />
        </TouchableOpacity>

        {/* Resume / Undo banner when reopening */}
        {showResumeBanner && (
          <View style={styles.resumeBanner}>
            <Text style={styles.resumeBannerText}>
              You left off at step {safeStepIndex + 1}
            </Text>
            <View style={styles.resumeBannerActions}>
              <TouchableOpacity
                style={styles.resumeBannerButton}
                onPress={() => {
                  mediumImpact();
                  const prev = Math.max(0, safeStepIndex - 1);
                  setCurrentStepIndex(prev);
                  if (recipeId != null) {
                    AsyncStorage.setItem(COOKING_STEP_STORAGE_KEY(recipeId), String(prev)).catch(() => {});
                  }
                  setShowResumeBanner(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Undo last step"
              >
                <Ionicons name="arrow-undo" size={18} color={colors.text.inverse} />
                <Text style={styles.resumeBannerButtonText}>Undo last step</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resumeBannerButton, styles.resumeBannerButtonPrimary]}
                onPress={() => {
                  mediumImpact();
                  setShowResumeBanner(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Resume from here"
              >
                <Text style={styles.resumeBannerButtonText}>Resume</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Voice Controls */}
        <View style={styles.voiceControls} accessibilityRole="toolbar" accessibilityLabel="Cooking controls">
          <TouchableOpacity
            style={styles.voiceButton}
            accessibilityRole="button"
            accessibilityLabel={voiceEnabled ? "Voice guidance on" : "Voice guidance off"}
            accessibilityHint="Double tap to toggle step readout"
            onPress={() => {
              setVoiceEnabled(!voiceEnabled);
              if (voiceEnabled) {
                Speech.stop();
                setIsSpeaking(false);
              }
              mediumImpact();
            }}
          >
            <Ionicons 
              name={voiceEnabled ? "volume-high" : "volume-mute"} 
              size={24} 
              color={colors.text.inverse} 
            />
          </TouchableOpacity>
          
          {/* Voice Commands Toggle */}
          <TouchableOpacity
            style={[styles.voiceButton, voiceCommandsEnabled && styles.voiceButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={voiceCommandsEnabled ? "Voice commands on" : "Voice commands off"}
            accessibilityHint="Double tap to toggle hands-free voice commands"
            onPress={() => {
              setVoiceCommandsEnabled(!voiceCommandsEnabled);
              mediumImpact();
              if (!voiceCommandsEnabled) {
                Speech.speak("Voice commands enabled. Tap buttons to control cooking hands-free.");
              }
            }}
          >
            <Ionicons 
              name={voiceCommandsEnabled ? "mic" : "mic-outline"} 
              size={24} 
              color={colors.text.inverse} 
            />
          </TouchableOpacity>
        </View>

        {/* Voice Command Buttons */}
        {voiceCommandsEnabled && (
          <View style={styles.voiceCommandButtons} accessibilityLabel="Voice command shortcuts" accessibilityRole="menu">
            <TouchableOpacity
              style={styles.voiceCommandButton}
              onPress={() => handleVoiceCommand("next")}
              accessibilityRole="button"
              accessibilityLabel="Next step"
              accessibilityHint="Advances to the next cooking step"
            >
              <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} />
              <Text style={styles.voiceCommandText}>Next</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.voiceCommandButton}
              onPress={() => handleVoiceCommand("repeat")}
              accessibilityRole="button"
              accessibilityLabel="Repeat step"
              accessibilityHint="Repeats the current step readout"
            >
              <Ionicons name="refresh" size={20} color={colors.text.inverse} />
              <Text style={styles.voiceCommandText}>Repeat</Text>
            </TouchableOpacity>
            {currentStepTimer && (
              <TouchableOpacity
                style={styles.voiceCommandButton}
                onPress={() => handleVoiceCommand(`set timer for ${Math.floor(currentStepTimer.duration / 60)} minutes`)}
                accessibilityRole="button"
                accessibilityLabel={`Start ${currentStepTimer.label} timer`}
                accessibilityHint="Starts a countdown timer for this step"
              >
                <Ionicons name="timer" size={20} color={colors.text.inverse} />
                <Text style={styles.voiceCommandText}>Timer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {lastCommand && (
          <View style={styles.commandFeedback}>
            <Text style={styles.commandFeedbackText}>✓ {lastCommand}</Text>
          </View>
        )}

        {/* Timer Display */}
        {(timerActive || currentStepTimer) && (
          <View style={styles.timerContainer}>
            {timerActive ? (
              <TouchableOpacity
                style={styles.timerDisplay}
                onPress={handleStopTimer}
                accessibilityRole="button"
                accessibilityLabel={`Timer running: ${formatTime(timerSeconds)} remaining`}
                accessibilityHint="Double tap to stop the timer"
              >
                <Ionicons name="timer" size={20} color={colors.text.inverse} />
                <Text style={styles.timerText}>{formatTime(timerSeconds)}</Text>
                <Ionicons name="stop-circle" size={20} color={colors.russet} />
              </TouchableOpacity>
            ) : currentStepTimer ? (
              <TouchableOpacity
                style={styles.timerButton}
                onPress={handleStartTimer}
                accessibilityRole="button"
                accessibilityLabel={`Start ${currentStepTimer.label} timer`}
                accessibilityHint="Starts countdown timer for this step"
              >
                <Ionicons name="timer-outline" size={20} color={colors.olive} />
                <Text style={styles.timerButtonText}>Start {currentStepTimer.label} Timer</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

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

              <View
                style={styles.stepContent}
                accessible
                accessibilityLabel={`Step ${safeStepIndex + 1} of ${steps.length}. ${currentStepText}`}
                accessibilityRole="summary"
              >
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

        <View style={[styles.controls, isLandscape && styles.controlsLandscape]} accessibilityRole="toolbar" accessibilityLabel="Step navigation">
          <GradientButton
            title="Previous"
            variant="secondary"
            onPress={handlePrev}
            disabled={safeStepIndex === 0}
            style={styles.controlButton}
            accessibilityLabel="Previous step"
            accessibilityHint={safeStepIndex === 0 ? "You are on the first step" : "Go back to previous step"}
          />
          <GradientButton
            title={safeStepIndex === steps.length - 1 ? "Finish Cooking" : "Next"}
            onPress={handleNext}
            style={styles.controlButton}
            accessibilityLabel={safeStepIndex === steps.length - 1 ? "Finish cooking" : "Next step"}
            accessibilityHint={safeStepIndex === steps.length - 1 ? "Complete recipe and mark as cooked" : "Advance to next step"}
          />
        </View>

        {/* Completion Modal */}
        <Modal
          visible={showCompletionModal}
          animationType="fade"
          transparent
          onRequestClose={handleSkipMarking}
        >
          <View style={styles.completionOverlay}>
            <Animated.View
              style={[
                styles.completionCard,
                {
                  transform: [
                    {
                      scale: confettiAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 1.05, 1],
                      }),
                    },
                  ],
                  opacity: confettiAnim,
                },
              ]}
            >
              <LinearGradient
                colors={[colors.olive, colors.russet]}
                style={styles.completionGradient}
              >
                <Ionicons name="checkmark-circle" size={80} color={colors.text.inverse} />
                <Text style={styles.completionTitle}>You Did It!</Text>
                <Text style={styles.completionSubtitle}>
                  {recipeName ? `"${recipeName}" is complete!` : "Recipe complete!"}
                </Text>

                {recipeId && (
                  <GradientButton
                    title="Mark as Cooked 🎉"
                    onPress={handleMarkAsCooked}
                    variant="secondary"
                    style={styles.completionButton}
                    disabled={markAsCookedMutation.isPending}
                    accessibilityLabel="Mark recipe as cooked"
                    accessibilityHint="Saves this recipe to your cooking history"
                  />
                )}

                <TouchableOpacity
                  onPress={handleShareCooked}
                  style={styles.shareButton}
                  accessibilityRole="button"
                  accessibilityLabel="Share I cooked this"
                  accessibilityHint="Shares your cooking achievement to social media or messages"
                >
                  <Ionicons name="share-social-outline" size={20} color={colors.text.inverse} />
                  <Text style={styles.shareButtonText}>Share I cooked this</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSkipMarking}
                  style={styles.skipButton}
                  accessibilityRole="button"
                  accessibilityLabel={recipeId ? "Skip marking as cooked" : "Close"}
                  accessibilityHint="Closes without saving to cooking history"
                >
                  <Text style={styles.skipButtonText}>
                    {recipeId ? "Skip for now" : "Close"}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          </View>
        </Modal>
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
  resumeBanner: {
    position: "absolute",
    top: spacing.xl + 48,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: "column",
    gap: spacing.sm,
  },
  resumeBannerText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    textAlign: "center",
  },
  resumeBannerActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
  },
  resumeBannerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  resumeBannerButtonPrimary: {
    backgroundColor: colors.olive,
  },
  resumeBannerButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  timerContainer: {
    position: "absolute",
    top: spacing.xl * 2.5,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    alignItems: "center",
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.olive,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  timerText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  timerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  timerButtonText: {
    color: colors.olive,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
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
  // Completion modal styles
  completionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  completionCard: {
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    width: "100%",
    maxWidth: 340,
  },
  completionGradient: {
    padding: spacing.xxl,
    alignItems: "center",
  },
  completionTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  completionSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.inverse,
    opacity: 0.9,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  completionButton: {
    width: "100%",
    marginBottom: spacing.sm,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    opacity: 0.95,
  },
  shareButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  skipButton: {
    paddingVertical: spacing.md,
  },
  voiceControls: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
    zIndex: 10,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceButtonActive: {
    backgroundColor: colors.olive,
  },
  voiceCommandButtons: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  voiceCommandButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.olive,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    ...shadows.medium,
  },
  voiceCommandText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  commandFeedback: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  commandFeedbackText: {
    backgroundColor: colors.success,
    color: colors.text.inverse,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  skipButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    opacity: 0.8,
  },
});

export default CookingModeScreen;

