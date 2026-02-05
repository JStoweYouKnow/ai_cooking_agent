/**
 * OnboardingWrapper Component
 * Shows onboarding flow for first-time users
 */

import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnboardingFlow from "./OnboardingFlow";

const ONBOARDING_COMPLETE_KEY = "@sous_onboarding_complete";

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ children }) => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      // If onboarding is complete, don't show it (showOnboarding = false means don't show)
      // If onboarding is NOT complete, show it (showOnboarding = true means show onboarding)
      setShowOnboarding(hasSeenOnboarding !== "true");
    } catch (error) {
      console.error("[OnboardingWrapper] Error checking onboarding status:", error);
      // Default to showing onboarding if we can't check
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = async () => {
    console.log("[OnboardingWrapper] handleOnboardingComplete called");
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
      console.log("[OnboardingWrapper] Onboarding status saved successfully");
      // Mark onboarding as complete - don't show it anymore
      setShowOnboarding(false);
    } catch (error) {
      console.error("[OnboardingWrapper] Error saving onboarding status:", error);
      // Even if save fails, hide onboarding to prevent stuck state
      setShowOnboarding(false);
    }
  };

  // Show loading while checking status
  if (showOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Show onboarding if not completed
  // showOnboarding === true means we should show onboarding
  if (showOnboarding === true) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} onSkip={handleOnboardingComplete} />;
  }

  // Show main app
  return <>{children}</>;
};

export default OnboardingWrapper;
