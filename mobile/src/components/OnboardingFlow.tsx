/**
 * Onboarding Flow Component
 * First-time user tutorial showing key features and value proposition
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import GradientButton from "./GradientButton";
import { colors, spacing, typography, borderRadius } from "../styles/theme";
import { CREATOR_CONFIG } from "../constants/creator";

const { width } = Dimensions.get("window");

interface OnboardingSlide {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    title: "Welcome to Sous",
    description: `Your AI-powered cooking assistant, trusted by ${CREATOR_CONFIG.name} and thousands of home chefs.`,
    icon: "restaurant",
    gradient: ["#8B7355", "#A67C52"],
  },
  {
    title: "Discover Recipes",
    description: "Search thousands of recipes from top sources. Find meals based on what's in your pantry.",
    icon: "search",
    gradient: ["#A67C52", "#D4AF37"],
  },
  {
    title: "Smart Shopping Lists",
    description: "Generate shopping lists from recipes. Never forget an ingredient again.",
    icon: "list",
    gradient: ["#D4AF37", "#8B7355"],
  },
  {
    title: "AI-Powered Features",
    description: "Get personalized meal suggestions, recipe scaling, and cooking tips powered by AI.",
    icon: "sparkles",
    gradient: ["#8B7355", "#A67C52"],
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    console.log("[OnboardingFlow] Next button pressed, currentSlide:", currentSlide);
    if (currentSlide < ONBOARDING_SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      console.log("[OnboardingFlow] Last slide, calling onComplete");
      onComplete();
    }
  };

  const handleSkip = () => {
    console.log("[OnboardingFlow] Skip button pressed");
    if (onSkip) {
      onSkip();
    } else {
      console.log("[OnboardingFlow] No onSkip handler, calling onComplete");
      onComplete();
    }
  };

  const slide = ONBOARDING_SLIDES[currentSlide];
  const isLastSlide = currentSlide === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient colors={slide.gradient} style={styles.gradient}>
        {/* Skip button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          accessibilityHint="Skip the tutorial and go to the app"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slide content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          accessible
          accessibilityLabel={`${slide.title}. ${slide.description}`}
        >
          <View style={styles.iconContainer}>
            <Ionicons name={slide.icon} size={80} color={colors.text.inverse} />
          </View>

          <Text style={styles.title} accessibilityRole="header">{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>

          {/* Creator endorsement on first slide */}
          {currentSlide === 0 && (
            <View style={styles.endorsementCard}>
              <Text style={styles.endorsementText}>
                "{CREATOR_CONFIG.endorsement}"
              </Text>
              <Text style={styles.endorsementAuthor}>
                - {CREATOR_CONFIG.name}
              </Text>
            </View>
          )}

          {/* Progress indicators */}
          <View style={styles.progressContainer}>
            {ONBOARDING_SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentSlide && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </ScrollView>

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {currentSlide > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentSlide(currentSlide - 1)}
              accessibilityRole="button"
              accessibilityLabel="Previous slide"
              accessibilityHint="Go back to previous onboarding slide"
            >
              <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          <GradientButton
            title={isLastSlide ? "Get Started" : "Next"}
            onPress={() => {
              console.log("[OnboardingFlow] GradientButton pressed, isLastSlide:", isLastSlide);
              handleNext();
            }}
            style={styles.nextButton}
            textStyle={styles.nextButtonText}
            disabled={false}
            accessibilityLabel={isLastSlide ? "Get started" : "Next slide"}
            accessibilityHint={isLastSlide ? "Finish onboarding and open the app" : "Continue to next slide"}
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.lg,
    zIndex: 1,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: typography.fontSize.md,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.xxl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl * 1.5,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.lg,
    color: colors.text.inverse,
    textAlign: "center",
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.lg,
    marginBottom: spacing.xl,
  },
  endorsementCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  endorsementText: {
    fontSize: typography.fontSize.md,
    color: colors.text.inverse,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  endorsementAuthor: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    textAlign: "center",
    fontWeight: typography.fontWeight.semibold,
  },
  progressContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  progressDotActive: {
    backgroundColor: colors.text.inverse,
    width: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.sm,
  },
  backText: {
    fontSize: typography.fontSize.md,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.medium,
  },
  nextButton: {
    flex: 1,
  },
  nextButtonText: {
    color: colors.text.inverse,
  },
});

export default OnboardingFlow;
