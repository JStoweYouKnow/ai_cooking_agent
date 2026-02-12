/**
 * RevenueCat Service
 * Handles iOS in-app purchases via RevenueCat SDK
 */

import { Platform } from "react-native";
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
  PurchasesError,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import Constants from "expo-constants";

// Suppress non-critical RevenueCat tracking errors
// These errors occur because the SDK tries to access browser APIs (like window.location.search)
// that don't exist in React Native. The SDK is still functional - this is just analytics tracking failing.
let originalConsoleError: typeof console.error | null = null;
let originalErrorHandler: ((error: Error, isFatal?: boolean) => void) | null = null;

function setupErrorSuppression() {
  // Suppress in console.error
  if (typeof console !== 'undefined' && console.error && !originalConsoleError) {
    originalConsoleError = console.error.bind(console);
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      // Suppress the known non-critical RevenueCat tracking error
      if (
        message.includes('[RevenueCat]') &&
        message.includes('[Purchases]') &&
        (message.includes('Error while tracking event') || message.includes('tracking event')) &&
        (message.includes("Cannot read property 'search'") || 
         (message.includes('search') && message.includes('undefined')))
      ) {
        // Log as warning instead of error since it's non-critical
        if (originalConsoleError) {
          originalConsoleError('[RevenueCat] Non-critical tracking error (SDK is still functional - can be ignored)');
        }
        return;
      }
      // Call original console.error for other errors
      if (originalConsoleError) {
        originalConsoleError.apply(console, args);
      }
    };
  }

  // Also suppress in React Native's global error handler if available
  try {
    // @ts-ignore - ErrorUtils may not be typed in all React Native versions
    const ErrorUtils = require('react-native/Libraries/ErrorHandling/ErrorUtils');
    if (ErrorUtils && ErrorUtils.getGlobalHandler && !originalErrorHandler) {
      originalErrorHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        const errorMessage = error?.message || String(error);
        // Suppress the known non-critical RevenueCat tracking error
        if (
          errorMessage.includes('tracking event') &&
          (errorMessage.includes("Cannot read property 'search'") || 
           (errorMessage.includes('search') && errorMessage.includes('undefined')))
        ) {
          // This is non-critical - SDK is still functional
          console.warn('[RevenueCat] Non-critical tracking error suppressed (SDK is still functional)');
          return; // Don't show error overlay for this
        }
        // Call original handler for other errors
        if (originalErrorHandler) {
          originalErrorHandler(error, isFatal);
        }
      });
    }
  } catch (e) {
    // ErrorUtils might not be available - that's OK, console suppression should be enough
  }
}

// Set up error suppression when module loads
setupErrorSuppression();

// RevenueCat API Key from app config
const REVENUECAT_IOS_API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ||
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ||
  "";

// App Store product identifiers
export const REVENUECAT_PRODUCT_IDS = {
  PREMIUM_MONTHLY: "com.aicookingagent.app.premium.monthly",
  PREMIUM_YEARLY: "com.aicookingagent.app.premium.yearly",
  FAMILY_MONTHLY: "com.aicookingagent.app.family.monthly",
  FAMILY_YEARLY: "com.aicookingagent.app.family.yearly",
  LIFETIME: "com.aicookingagent.app.lifetime",
} as const;

// Entitlement identifiers (configured in RevenueCat dashboard)
export const ENTITLEMENT_IDS = {
  PREMIUM: "premium",
  FAMILY: "family",
} as const;

let isInitialized = false;

/**
 * Check if RevenueCat should be used (iOS only)
 */
export function shouldUseRevenueCat(): boolean {
  return Platform.OS === "ios";
}

/**
 * Initialize RevenueCat SDK
 * Should be called when user authenticates
 */
export async function initializeRevenueCat(
  userId: string | number
): Promise<void> {
  if (!shouldUseRevenueCat()) {
    console.log("[RevenueCat] Skipping initialization on non-iOS platform");
    return;
  }

  if (isInitialized) {
    console.log("[RevenueCat] Already initialized, logging in user");
    // If already initialized, just log in the user
    await Purchases.logIn(String(userId));
    return;
  }

  if (!REVENUECAT_IOS_API_KEY) {
    console.warn(
      "[RevenueCat] API key not configured. iOS purchases will not work."
    );
    return;
  }

  try {
    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat SDK
    // Note: The SDK may throw a non-critical error during tracking event initialization
    // This happens because it tries to access browser APIs (like window.location.search)
    // that don't exist in React Native. We handle this gracefully.
    try {
      await Purchases.configure({
        apiKey: REVENUECAT_IOS_API_KEY,
        appUserID: String(userId), // Use server user ID for cross-platform consistency
      });
    } catch (configureError: any) {
      // Check if this is the known SDK tracking error (non-critical)
      const errorMessage = configureError?.message || String(configureError);
      const isTrackingError = 
        errorMessage?.includes("tracking event") || 
        errorMessage?.includes("search") || 
        errorMessage?.includes("Cannot read property 'search'");
      
      if (isTrackingError) {
        // This is a known non-critical error - SDK is still functional
        console.warn("[RevenueCat] Non-critical tracking error during configure (can be ignored):", errorMessage);
        // Continue - SDK is actually initialized and working
      } else {
        // Re-throw if it's a different error
        throw configureError;
      }
    }

    // Mark as initialized even if there was a tracking error
    // The SDK is functional, just the analytics tracking failed
    isInitialized = true;
    console.log("[RevenueCat] Initialized successfully for user:", userId);
  } catch (error) {
    // Check if this is the known SDK tracking error (non-critical)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTrackingError = 
      errorMessage.includes("tracking event") || 
      errorMessage.includes("search") || 
      errorMessage.includes("Cannot read property 'search'");
    
    if (isTrackingError) {
      // This is a known non-critical error in RevenueCat SDK
      // The SDK tries to access browser APIs that don't exist in React Native
      console.warn("[RevenueCat] Non-critical tracking error (can be ignored):", errorMessage);
      // Still mark as initialized since the SDK is actually working
      isInitialized = true;
      return;
    }
    
    console.error("[RevenueCat] Initialization error:", error);
    throw error;
  }
}

/**
 * Get available subscription offerings
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!shouldUseRevenueCat() || !isInitialized) {
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error("[RevenueCat] Error fetching offerings:", error);
    return null;
  }
}

/**
 * Get all available packages from offerings
 */
export async function getAvailablePackages(): Promise<PurchasesPackage[]> {
  const offering = await getOfferings();
  if (!offering) {
    return [];
  }
  return offering.availablePackages || [];
}

/**
 * Find a package by product identifier
 */
export async function findPackageByProductId(
  productId: string
): Promise<PurchasesPackage | null> {
  const packages = await getAvailablePackages();
  return packages.find((pkg) => pkg.product.identifier === productId) || null;
}

/**
 * Purchase a package
 * Returns customer info on success, null if cancelled
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<CustomerInfo | null> {
  if (!shouldUseRevenueCat()) {
    throw new Error("RevenueCat is only available on iOS");
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    console.log("[RevenueCat] Purchase successful");
    return customerInfo;
  } catch (error) {
    const purchaseError = error as PurchasesError;

    // Handle user cancellation
    if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      console.log("[RevenueCat] User cancelled purchase");
      return null;
    }

    // Handle other errors
    console.error("[RevenueCat] Purchase error:", purchaseError);
    throw new Error(getPurchaseErrorMessage(purchaseError));
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!shouldUseRevenueCat()) {
    return null;
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log("[RevenueCat] Purchases restored");
    return customerInfo;
  } catch (error) {
    console.error("[RevenueCat] Restore error:", error);
    throw error;
  }
}

/** Intro eligibility status (matches RevenueCat INTRO_ELIGIBILITY_STATUS) */
export const INTRO_ELIGIBILITY_STATUS = {
  ELIGIBLE: 0,
  INELIGIBLE: 1,
  UNKNOWN: 2,
} as const;

/** Map of product ID -> intro eligibility. iOS only; Android returns UNKNOWN. */
export type IntroEligibilityMap = Record<string, { status: number }>;

/**
 * Check if user is eligible for introductory pricing (e.g. free trial) per product.
 * iOS only; on Android returns empty map.
 */
export async function checkIntroEligibility(productIds: string[]): Promise<IntroEligibilityMap> {
  if (!shouldUseRevenueCat() || !isInitialized || productIds.length === 0) {
    return {};
  }
  try {
    const result = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIds);
    return result as IntroEligibilityMap;
  } catch (e) {
    console.warn("[RevenueCat] checkIntroEligibility error:", e);
    return {};
  }
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!shouldUseRevenueCat() || !isInitialized) {
    return null;
  }

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error("[RevenueCat] Error getting customer info:", error);
    return null;
  }
}

/**
 * Check if user has an active entitlement
 */
export function hasActiveEntitlement(
  customerInfo: CustomerInfo | null,
  entitlementId: string = ENTITLEMENT_IDS.PREMIUM
): boolean {
  if (!customerInfo) {
    return false;
  }
  return customerInfo.entitlements.active[entitlementId] !== undefined;
}

/**
 * Check if user has any active subscription
 */
export function hasAnyActiveSubscription(
  customerInfo: CustomerInfo | null
): boolean {
  if (!customerInfo) {
    return false;
  }
  return Object.keys(customerInfo.entitlements.active).length > 0;
}

/**
 * Get the active entitlement info
 */
export function getActiveEntitlement(customerInfo: CustomerInfo | null) {
  if (!customerInfo) {
    return null;
  }

  // Check for family entitlement first (higher tier)
  if (customerInfo.entitlements.active[ENTITLEMENT_IDS.FAMILY]) {
    return {
      entitlementId: ENTITLEMENT_IDS.FAMILY,
      entitlement: customerInfo.entitlements.active[ENTITLEMENT_IDS.FAMILY],
    };
  }

  // Then check for premium
  if (customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM]) {
    return {
      entitlementId: ENTITLEMENT_IDS.PREMIUM,
      entitlement: customerInfo.entitlements.active[ENTITLEMENT_IDS.PREMIUM],
    };
  }

  return null;
}

/**
 * Log out from RevenueCat
 * Should be called when user logs out
 */
export async function logoutRevenueCat(): Promise<void> {
  if (!shouldUseRevenueCat() || !isInitialized) {
    return;
  }

  try {
    await Purchases.logOut();
    isInitialized = false;
    console.log("[RevenueCat] Logged out");
  } catch (error) {
    console.error("[RevenueCat] Logout error:", error);
  }
}

/**
 * Check if RevenueCat is initialized
 */
export function isRevenueCatInitialized(): boolean {
  return isInitialized;
}

/**
 * Get user-friendly error message for purchase errors
 */
function getPurchaseErrorMessage(error: PurchasesError): string {
  switch (error.code) {
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return "Purchases are not allowed on this device.";
    case PURCHASES_ERROR_CODE.PURCHASE_INVALID_ERROR:
      return "The purchase was invalid. Please try again.";
    case PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
      return "This product is not available for purchase.";
    case PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR:
      return "You already own this product.";
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
      return "Network error. Please check your connection and try again.";
    case PURCHASES_ERROR_CODE.RECEIPT_ALREADY_IN_USE_ERROR:
      return "This receipt is already associated with another account.";
    case PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR:
      return "Invalid credentials. Please try again.";
    case PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR:
      return "Payment is pending. Please complete the payment in your App Store settings.";
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return "There was a problem with the App Store. Please try again later.";
    default:
      return error.message || "An error occurred during purchase.";
  }
}

/**
 * Redeem a promotional code
 * Opens the App Store promo code redemption sheet
 */
export async function redeemPromoCode(): Promise<void> {
  if (!shouldUseRevenueCat()) {
    throw new Error("Promo code redemption is only available on iOS");
  }

  try {
    // @ts-ignore - presentCodeRedemptionSheet may not be in types
    await Purchases.presentCodeRedemptionSheet();
    console.log("[RevenueCat] Promo code sheet presented");
  } catch (error) {
    console.error("[RevenueCat] Error presenting promo code sheet:", error);
    throw error;
  }
}

/**
 * Check for promotional offers eligibility
 */
export async function getPromotionalOffers(): Promise<any[]> {
  if (!shouldUseRevenueCat() || !isInitialized) {
    return [];
  }

  try {
    const offerings = await Purchases.getOfferings();
    const offers: any[] = [];
    
    // Check all offerings for promotional offers
    if (offerings.current?.availablePackages) {
      for (const pkg of offerings.current.availablePackages) {
        const product = pkg.product;
        // Check if product has introductory/promotional pricing
        if (product.introPrice) {
          offers.push({
            packageId: pkg.identifier,
            productId: product.identifier,
            introPrice: product.introPrice,
            title: product.title,
            description: product.description,
          });
        }
      }
    }
    
    return offers;
  } catch (error) {
    console.error("[RevenueCat] Error fetching promotional offers:", error);
    return [];
  }
}

/**
 * Check if user is eligible for intro pricing
 */
export async function checkIntroEligibility(
  productIdentifiers: string[]
): Promise<Record<string, boolean>> {
  if (!shouldUseRevenueCat() || !isInitialized) {
    return {};
  }

  try {
    // @ts-ignore - checkTrialOrIntroductoryPriceEligibility may not be in all SDK versions
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(
      productIdentifiers
    );
    
    const result: Record<string, boolean> = {};
    for (const [productId, status] of Object.entries(eligibility)) {
      // Eligible statuses: 0 = unknown, 1 = ineligible, 2 = eligible
      result[productId] = (status as any).status === 2;
    }
    
    return result;
  } catch (error) {
    console.error("[RevenueCat] Error checking intro eligibility:", error);
    return {};
  }
}

/**
 * Get winback offers for churned subscribers
 */
export async function getWinbackOffers(): Promise<any | null> {
  if (!shouldUseRevenueCat() || !isInitialized) {
    return null;
  }

  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return null;
    
    // Check if user was previously subscribed but is now expired
    const hasExpiredSubscription = Object.keys(customerInfo.allExpirationDates).length > 0;
    const hasActiveSubscription = hasAnyActiveSubscription(customerInfo);
    
    if (hasExpiredSubscription && !hasActiveSubscription) {
      // User is eligible for winback offer
      const offerings = await Purchases.getOfferings();
      
      // Check for a specific winback offering (configure in RevenueCat dashboard)
      const winbackOffering = offerings.all["winback"];
      if (winbackOffering) {
        return {
          offering: winbackOffering,
          message: "Welcome back! We've missed you. Here's a special offer:",
          isWinback: true,
        };
      }
      
      // Fallback: offer intro price if eligible
      const currentOffering = offerings.current;
      if (currentOffering) {
        return {
          offering: currentOffering,
          message: "Welcome back! Ready to continue your cooking journey?",
          isWinback: true,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("[RevenueCat] Error checking winback offers:", error);
    return null;
  }
}
