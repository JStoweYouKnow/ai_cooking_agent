/**
 * RevenueCat Context
 * Provides iOS in-app purchase state and functions throughout the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AppState, Platform } from "react-native";
import {
  CustomerInfo,
  PurchasesPackage,
  PurchasesOffering,
} from "react-native-purchases";
import { useAuth } from "./AuthContext";
import * as revenueCatService from "../services/revenueCat";
import type { IntroEligibilityMap } from "../services/revenueCat";
import { REVENUECAT_PRODUCT_IDS } from "../services/revenueCat";
import { addBreadcrumb } from "../utils/analytics";

interface RevenueCatContextType {
  /** Whether RevenueCat SDK is initialized */
  isInitialized: boolean;
  /** Whether a purchase/restore operation is in progress */
  isLoading: boolean;
  /** Current customer info from RevenueCat */
  customerInfo: CustomerInfo | null;
  /** Available subscription offerings */
  offerings: PurchasesOffering | null;
  /** Intro/trial eligibility per product ID (iOS). ELIGIBLE = 0. */
  introEligibility: IntroEligibilityMap;
  /** Whether user has an active subscription via RevenueCat */
  hasActiveSubscription: boolean;
  /** Purchase a subscription package */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Purchase by product ID */
  purchaseByProductId: (productId: string) => Promise<boolean>;
  /** Restore previous purchases */
  restorePurchases: () => Promise<boolean>;
  /** Refresh customer info from RevenueCat */
  refreshCustomerInfo: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(
  undefined
);

export const useRevenueCat = (): RevenueCatContextType => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error("useRevenueCat must be used within a RevenueCatProvider");
  }
  return context;
};

interface RevenueCatProviderProps {
  children: ReactNode;
}

export const RevenueCatProvider: React.FC<RevenueCatProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);

  // Initialize RevenueCat when user is authenticated on iOS
  useEffect(() => {
    const initialize = async () => {
      // Only initialize on iOS
      if (Platform.OS !== "ios") {
        return;
      }

      // Need authenticated user
      if (!isAuthenticated || !user?.id) {
        return;
      }

      setIsLoading(true);
      try {
        console.log("[RevenueCatContext] Initializing for user:", user.id);
        await revenueCatService.initializeRevenueCat(user.id);

        // Check if initialization was successful (even if there was a non-critical error)
        if (revenueCatService.isRevenueCatInitialized()) {
          // Fetch initial data in parallel
          const [info, currentOfferings] = await Promise.all([
            revenueCatService.getCustomerInfo(),
            revenueCatService.getOfferings(),
          ]);

          setCustomerInfo(info);
          setOfferings(currentOfferings);
          setIsInitialized(true);
          addBreadcrumb("entitlement", "RevenueCat init", {
            hasActive: revenueCatService.hasAnyActiveSubscription(info),
            entitlements: Object.keys(info?.entitlements?.active ?? {}),
          });
          const productIds = [
            REVENUECAT_PRODUCT_IDS.PREMIUM_MONTHLY,
            REVENUECAT_PRODUCT_IDS.PREMIUM_YEARLY,
            REVENUECAT_PRODUCT_IDS.FAMILY_MONTHLY,
            REVENUECAT_PRODUCT_IDS.FAMILY_YEARLY,
          ];
          revenueCatService.checkIntroEligibility(productIds).then(setIntroEligibility).catch(() => {});
          console.log("[RevenueCatContext] Initialization complete");
        } else {
          console.warn("[RevenueCatContext] Initialization did not complete successfully");
        }
      } catch (error) {
        // Check if this is the known SDK tracking error (non-critical)
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTrackingError = errorMessage.includes("tracking event") && 
                                 (errorMessage.includes("search") || errorMessage.includes("undefined"));
        
        if (isTrackingError) {
          // This is a known non-critical error - SDK is still functional
          console.warn("[RevenueCatContext] Non-critical tracking error (can be ignored):", errorMessage);
          // Try to continue initialization
          if (revenueCatService.isRevenueCatInitialized()) {
            try {
              const [info, currentOfferings] = await Promise.all([
                revenueCatService.getCustomerInfo(),
                revenueCatService.getOfferings(),
              ]);
              setCustomerInfo(info);
              setOfferings(currentOfferings);
              setIsInitialized(true);
            } catch (fetchError) {
              console.error("[RevenueCatContext] Error fetching customer info after tracking error:", fetchError);
            }
          }
        } else {
          console.error("[RevenueCatContext] Initialization error:", error);
          // Don't throw - just log. App should still work, just without iOS purchases
        }
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [isAuthenticated, user?.id]);

  // Cleanup on logout
  useEffect(() => {
    if (!isAuthenticated && isInitialized) {
      console.log("[RevenueCatContext] User logged out, cleaning up");
      revenueCatService.logoutRevenueCat();
      setIsInitialized(false);
      setCustomerInfo(null);
      setOfferings(null);
      setIntroEligibility({});
    }
  }, [isAuthenticated, isInitialized]);

  // Refresh customer info
  const refreshCustomerInfo = useCallback(async () => {
    if (Platform.OS !== "ios" || !isInitialized) {
      return;
    }

    try {
      const info = await revenueCatService.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error("[RevenueCatContext] Error refreshing customer info:", error);
    }
  }, [isInitialized]);

  // Auto-refresh entitlements when app comes to foreground
  useEffect(() => {
    if (Platform.OS !== "ios" || !isInitialized) return;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refreshCustomerInfo();
      }
    });
    return () => sub.remove();
  }, [isInitialized, refreshCustomerInfo]);

  // Purchase a package
  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      if (Platform.OS !== "ios") {
        return false;
      }

      setIsLoading(true);
      try {
        const info = await revenueCatService.purchasePackage(pkg);
        if (info) {
          setCustomerInfo(info);
          addBreadcrumb("purchase", "Package purchased", { active: revenueCatService.hasAnyActiveSubscription(info) });
          return revenueCatService.hasAnyActiveSubscription(info);
        }
        return false;
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Purchase by product ID
  const purchaseByProductId = useCallback(
    async (productId: string): Promise<boolean> => {
      if (Platform.OS !== "ios" || !isInitialized) {
        return false;
      }

      setIsLoading(true);
      try {
        const pkg = await revenueCatService.findPackageByProductId(productId);
        if (!pkg) {
          throw new Error("Product not available");
        }

        const info = await revenueCatService.purchasePackage(pkg);
        if (info) {
          setCustomerInfo(info);
          addBreadcrumb("purchase", "Purchased by product id", { productId, active: revenueCatService.hasAnyActiveSubscription(info) });
          return revenueCatService.hasAnyActiveSubscription(info);
        }
        return false;
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [isInitialized]
  );

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "ios") {
      return false;
    }

    setIsLoading(true);
    try {
      const info = await revenueCatService.restorePurchases();
      if (info) {
        setCustomerInfo(info);
        return revenueCatService.hasAnyActiveSubscription(info);
      }
      return false;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if user has active subscription
  const hasActiveSubscription = revenueCatService.hasAnyActiveSubscription(
    customerInfo
  );

  const value: RevenueCatContextType = {
    isInitialized,
    isLoading,
    customerInfo,
    offerings,
    introEligibility,
    hasActiveSubscription,
    purchasePackage,
    purchaseByProductId,
    restorePurchases,
    refreshCustomerInfo,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};
