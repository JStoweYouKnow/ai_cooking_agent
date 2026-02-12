/**
 * useSubscription Hook
 * Centralized hook for subscription status and premium feature checks
 */

import { useMemo, useCallback } from "react";
import { Platform } from "react-native";
import { useRevenueCat } from "../contexts/RevenueCatContext";
import { trpc } from "../api/trpc";
import {
  hasActiveSubscription,
  canUsePremiumFeature,
  FREE_TIER_LIMITS,
  type PremiumFeature,
} from "../utils/premiumFeatures";
import { isDemoMode } from "../constants/demo";

export function useSubscription() {
  const { hasActiveSubscription: hasIOSSubscription } = useRevenueCat();
  const { data: hasServerSubscription } = trpc.subscription.hasActive.useQuery();
  const { data: subscription } = trpc.subscription.get.useQuery();

  const isPremium = useMemo(() => {
    if (isDemoMode()) return true;
    return hasActiveSubscription(
      hasIOSSubscription,
      hasServerSubscription || false
    );
  }, [hasIOSSubscription, hasServerSubscription]);

  const checkPremiumFeature = useCallback(
    (
      feature: PremiumFeature,
      currentUsage?: number,
      limit?: number
    ): boolean => {
      if (isDemoMode()) return true;
      return canUsePremiumFeature(
        feature,
        hasIOSSubscription,
        hasServerSubscription || false,
        currentUsage,
        limit
      );
    },
    [hasIOSSubscription, hasServerSubscription]
  );

  return {
    isPremium,
    hasIOSSubscription,
    hasServerSubscription: hasServerSubscription || false,
    subscription,
    checkPremiumFeature,
    freeTierLimits: FREE_TIER_LIMITS,
  };
}
