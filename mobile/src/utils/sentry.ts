/**
 * Sentry Crash Reporting Configuration
 * Initialize in App.tsx before any other code runs
 */

import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

// Get Sentry DSN from environment or app config
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || Constants.expoConfig?.extra?.sentryDsn;

// Determine environment
const getEnvironment = (): string => {
  if (__DEV__) return "development";
  if (Constants.expoConfig?.extra?.environment) {
    return Constants.expoConfig.extra.environment;
  }
  return "production";
};

/**
 * Initialize Sentry - call this as early as possible in your app
 */
export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.log("[Sentry] No DSN configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: getEnvironment(),
    enabled: !__DEV__, // Disable in development
    debug: __DEV__, // Enable debug mode in development

    // Performance Monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 20% of transactions in production

    // Session Replay (if available)
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,

    // Automatically capture unhandled errors
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers["Authorization"];
        delete event.request.headers["authorization"];
      }

      // Remove user email if present (keep id for tracking)
      if (event.user?.email) {
        delete event.user.email;
      }

      return event;
    },

    // Ignore common non-actionable errors
    ignoreErrors: [
      "Network request failed",
      "Request timeout",
      "AbortError",
      "Failed to fetch",
    ],
  });

  console.log("[Sentry] Initialized for environment:", getEnvironment());
};

/**
 * Set user context for error tracking
 */
export const setUserContext = (userId: number | null, username?: string) => {
  if (userId) {
    Sentry.setUser({
      id: String(userId),
      username: username,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Capture a custom error with additional context
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

/**
 * Capture a message with severity level
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>
) => {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureMessage(message);
  });
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  category: string,
  message: string,
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
};

/**
 * Start a performance transaction
 */
export const startTransaction = (name: string, op: string) => {
  return Sentry.startInactiveSpan({ name, op });
};

export default Sentry;
