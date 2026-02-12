/**
 * Premium Feature Gating Utilities
 * Defines free tier limits and premium feature checks
 */

import { Platform } from "react-native";

// Free tier limits
export const FREE_TIER_LIMITS = {
  RECIPES_SAVED: 10, // Maximum recipes free users can save
  RECIPES_IMPORTED: 5, // Maximum recipes free users can import from URLs
  AI_RECIPES_GENERATED: 3, // Maximum AI-generated recipes per month
  SHOPPING_LISTS: 3, // Maximum shopping lists
  EXPORT_FORMATS: ["csv"], // Only CSV export for free users
  ADVANCED_FEATURES: false, // No advanced features
} as const;

// Premium features list
export const PREMIUM_FEATURES = {
  UNLIMITED_RECIPES: "unlimited_recipes",
  UNLIMITED_IMPORTS: "unlimited_imports",
  AI_RECIPE_GENERATION: "ai_recipe_generation",
  ADVANCED_SHOPPING_LISTS: "advanced_shopping_lists",
  ALL_EXPORT_FORMATS: "all_export_formats",
  MEAL_PLANNING: "meal_planning",
  NUTRITION_ANALYSIS: "nutrition_analysis",
  RECIPE_SCALING: "recipe_scaling",
  PDF_EXPORT: "pdf_export",
  PRIORITY_SUPPORT: "priority_support",
} as const;

export type PremiumFeature = typeof PREMIUM_FEATURES[keyof typeof PREMIUM_FEATURES];

/**
 * Check if user has active subscription (iOS or server-side)
 */
export function hasActiveSubscription(
  hasIOSSubscription: boolean,
  hasServerSubscription: boolean
): boolean {
  if (Platform.OS === "ios") {
    return hasIOSSubscription || hasServerSubscription;
  }
  return hasServerSubscription;
}

/**
 * Check if user can perform a premium action
 */
export function canUsePremiumFeature(
  feature: PremiumFeature,
  hasIOSSubscription: boolean,
  hasServerSubscription: boolean,
  currentUsage?: number,
  limit?: number
): boolean {
  const hasSubscription = hasActiveSubscription(hasIOSSubscription, hasServerSubscription);
  
  if (hasSubscription) {
    return true; // Premium users have unlimited access
  }

  // Check usage limits for free users
  if (currentUsage !== undefined && limit !== undefined) {
    return currentUsage < limit;
  }

  // Default: feature requires premium
  return false;
}

/**
 * Get remaining free tier usage
 */
export function getRemainingUsage(currentUsage: number, limit: number): number {
  return Math.max(0, limit - currentUsage);
}

/**
 * Get usage percentage (0-100)
 */
export function getUsagePercentage(currentUsage: number, limit: number): number {
  return Math.min(100, Math.round((currentUsage / limit) * 100));
}

/**
 * Format usage message for display
 */
export function formatUsageMessage(
  currentUsage: number,
  limit: number,
  itemName: string
): string {
  const remaining = getRemainingUsage(currentUsage, limit);
  if (remaining === 0) {
    return `You've reached your limit of ${limit} ${itemName}. Upgrade to Premium for unlimited access.`;
  }
  return `${remaining} of ${limit} ${itemName} remaining`;
}
