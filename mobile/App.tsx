import React, { useEffect } from "react";
import { View, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { trpc, queryClient, trpcClient } from "./src/api/client";
import { AuthProvider } from "./src/contexts/AuthContext";
import { NetworkProvider } from "./src/contexts/NetworkContext";
import { ToastProvider } from "./src/contexts/ToastContext";
import { RevenueCatProvider } from "./src/contexts/RevenueCatContext";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";
import RootErrorBoundary from "./src/components/RootErrorBoundary";
import OfflineBanner from "./src/components/OfflineBanner";
import OnboardingWrapper from "./src/components/OnboardingWrapper";

// Production services
import { initSentry } from "./src/utils/sentry";
import { initAnalytics, trackEvent, setTrackingEnabled } from "./src/utils/analytics";
import { initializeUpdates } from "./src/utils/updates";
import { initializeTracking } from "./src/utils/tracking";
import { checkVersionWithAPI, getVersionInfo } from "./src/utils/versionCheck";

// Initialize Sentry as early as possible (crash reporting always enabled)
try {
  initSentry();
} catch (error) {
  console.error("[App] Failed to initialize Sentry:", error);
}

// Analytics will be enabled after ATT consent
try {
  initAnalytics();
} catch (error) {
  console.error("[App] Failed to initialize Analytics:", error);
}

console.log("[App] All imports loaded successfully");

// Set notification handler with error handling
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.error("[App] Failed to set notification handler:", error);
}

export default function App() {
  console.log("[App] Component rendering...");

  // @ts-ignore - tRPC types are complex, runtime works correctly
  const TRPCProvider = trpc.Provider;

  // Initialize OTA updates, ATT, version check, and track app launch
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const initializeApp = async () => {
      try {
        // Log version info for debugging
        const versionInfo = getVersionInfo();
        console.log("[App] Version info:", versionInfo);

        // Check minimum version requirement (can be fetched from server config)
        // For now, we check against a hardcoded minimum or skip if not configured
        // In production, fetch this from your API's health/config endpoint
        const MIN_SUPPORTED_VERSION = process.env.EXPO_PUBLIC_MIN_APP_VERSION || null;
        if (MIN_SUPPORTED_VERSION) {
          try {
            const versionOk = await checkVersionWithAPI(MIN_SUPPORTED_VERSION);
            if (!versionOk) {
              // Version check failed - user will see force update alert
              // Don't continue initialization
              return;
            }
          } catch (error) {
            console.error("[App] Error checking version:", error);
            // Continue initialization even if version check fails
          }
        }

        // Check if component unmounted before continuing
        if (!isMounted || abortController.signal.aborted) return;

        // Request ATT permission (iOS 14.5+) before tracking
        let trackingAllowed = false;
        try {
          trackingAllowed = await initializeTracking();
        } catch (error) {
          console.error("[App] Error initializing tracking:", error);
          // Continue with tracking disabled if initialization fails
        }

        // Check if component unmounted before setting state
        if (!isMounted || abortController.signal.aborted) return;

        setTrackingEnabled(trackingAllowed);

        // Track app launch (only if allowed)
        if (trackingAllowed) {
          try {
            trackEvent("app_launched", {
              timestamp: new Date().toISOString(),
              app_version: versionInfo.version,
              build_number: versionInfo.build,
            });
          } catch (error) {
            console.error("[App] Error tracking app launch:", error);
            // Don't block initialization if tracking fails
          }
        }
      } catch (error) {
        console.error("[App] Error in initializeApp:", error);
        // Log error but don't throw - allow app to continue
      }
    };

    // Handle promise rejection
    initializeApp().catch((error) => {
      console.error("[App] Unhandled error in initializeApp:", error);
    });

    // Start OTA update checking
    const cleanupUpdates = initializeUpdates();

    return () => {
      isMounted = false;
      abortController.abort();
      cleanupUpdates();
    };
  }, []);

  console.log("[App] Rendering full app with providers");
  
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent TRPCProvider={TRPCProvider} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Inner component that can use the theme context
function AppContent({ TRPCProvider }: { TRPCProvider: any }) {
  const { isDark, colors } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#F5F5F0" }}>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider client={trpcClient} queryClient={queryClient}>
          <NetworkProvider>
            <AuthProvider>
              <RevenueCatProvider>
                <ToastProvider>
                  <RootErrorBoundary>
                    <OnboardingWrapper>
                      <RootNavigator />
                      <OfflineBanner />
                    </OnboardingWrapper>
                  </RootErrorBoundary>
                  <StatusBar style={isDark ? "light" : "dark"} />
                </ToastProvider>
              </RevenueCatProvider>
            </AuthProvider>
          </NetworkProvider>
        </TRPCProvider>
      </QueryClientProvider>
    </View>
  );
}

