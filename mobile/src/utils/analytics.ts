/**
 * Analytics Tracking Utility
 * Provider-agnostic analytics interface
 * Can be connected to Mixpanel, Amplitude, Firebase, etc.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Analytics event types
export type AnalyticsEvent =
  | "app_open"
  | "app_close"
  | "login"
  | "logout"
  | "signup"
  | "recipe_view"
  | "recipe_create"
  | "recipe_import"
  | "recipe_favorite"
  | "recipe_share"
  | "recipe_delete"
  | "shopping_list_create"
  | "shopping_list_item_add"
  | "shopping_list_item_toggle"
  | "shopping_list_share"
  | "ingredient_add"
  | "ingredient_scan"
  | "search"
  | "error"
  | "screen_view"
  | "button_press"
  | "feature_use";

interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  userId: string | null;
  sessionId: string;
}

interface EventData {
  [key: string]: string | number | boolean | null | undefined;
}

// Configuration
const config: AnalyticsConfig = {
  enabled: !__DEV__, // Disable in development by default
  debug: __DEV__,
  userId: null,
  sessionId: generateSessionId(),
};

// Event queue for batching
let eventQueue: Array<{ event: AnalyticsEvent; data: EventData; timestamp: number }> = [];
let flushTimeout: NodeJS.Timeout | null = null;

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize analytics
 */
export const initAnalytics = async (options?: { enabled?: boolean; debug?: boolean }) => {
  if (options?.enabled !== undefined) config.enabled = options.enabled;
  if (options?.debug !== undefined) config.debug = options.debug;

  // Load persisted user ID
  try {
    const persistedUserId = await AsyncStorage.getItem("analytics_user_id");
    if (persistedUserId) {
      config.userId = persistedUserId;
    }
  } catch (error) {
    console.warn("[Analytics] Failed to load persisted user ID:", error);
  }

  // Track app open
  track("app_open", { session_id: config.sessionId });

  if (config.debug) {
    console.log("[Analytics] Initialized", { enabled: config.enabled, sessionId: config.sessionId });
  }
};

/**
 * Set the current user for analytics
 */
export const setAnalyticsUser = async (userId: string | number | null) => {
  config.userId = userId ? String(userId) : null;

  if (userId) {
    try {
      await AsyncStorage.setItem("analytics_user_id", String(userId));
    } catch (error) {
      console.warn("[Analytics] Failed to persist user ID:", error);
    }
  } else {
    try {
      await AsyncStorage.removeItem("analytics_user_id");
    } catch (error) {
      console.warn("[Analytics] Failed to remove user ID:", error);
    }
  }

  if (config.debug) {
    console.log("[Analytics] User set:", userId);
  }
};

/**
 * Track an event
 */
export const track = (event: AnalyticsEvent, data?: EventData) => {
  if (!config.enabled && !config.debug) return;

  const eventPayload = {
    event,
    data: {
      ...data,
      user_id: config.userId,
      session_id: config.sessionId,
      platform: "mobile",
      timestamp: new Date().toISOString(),
    },
    timestamp: Date.now(),
  };

  if (config.debug) {
    console.log("[Analytics] Track:", event, data);
  }

  if (config.enabled) {
    // Add to queue
    eventQueue.push(eventPayload);

    // Schedule flush
    if (!flushTimeout) {
      flushTimeout = setTimeout(flushEvents, 5000); // Flush every 5 seconds
    }

    // Flush immediately if queue is large
    if (eventQueue.length >= 10) {
      flushEvents();
    }
  }
};

/**
 * Track a screen view
 */
export const trackScreen = (screenName: string, params?: Record<string, any>) => {
  track("screen_view", {
    screen_name: screenName,
    ...params,
  });
};

/**
 * Track an error
 */
export const trackError = (error: Error, context?: Record<string, any>) => {
  track("error", {
    error_name: error.name,
    error_message: error.message,
    ...context,
  });
};

/**
 * Add a breadcrumb for Sentry/analytics (AI, imports, purchases).
 * Call from critical user actions for better error context.
 */
export const addBreadcrumb = (category: string, message: string, data?: Record<string, unknown>) => {
  try {
    const sentry = require("./sentry");
    if (sentry.addBreadcrumb) sentry.addBreadcrumb(category, message, data);
  } catch {
    // Sentry not available
  }
  if (config.debug) {
    console.log("[Analytics] Breadcrumb:", category, message, data);
  }
};

/**
 * Flush events to analytics provider
 * Replace this with your actual analytics provider implementation
 */
const flushEvents = async () => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  try {
    // TODO: Replace with actual analytics provider
    // Example for a custom backend:
    // await fetch('https://your-analytics-endpoint.com/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ events: eventsToSend }),
    // });

    // For now, just log in debug mode
    if (config.debug) {
      console.log("[Analytics] Would send events:", eventsToSend.length);
    }

    // Persist events locally for debugging
    if (__DEV__) {
      try {
        const existing = await AsyncStorage.getItem("analytics_events_debug");
        const events = existing ? JSON.parse(existing) : [];
        events.push(...eventsToSend);
        // Keep only last 100 events
        const trimmed = events.slice(-100);
        await AsyncStorage.setItem("analytics_events_debug", JSON.stringify(trimmed));
      } catch (e) {
        // Ignore storage errors
      }
    }
  } catch (error) {
    console.warn("[Analytics] Failed to flush events:", error);
    // Re-add events to queue for retry
    eventQueue = [...eventsToSend, ...eventQueue];
  }
};

/**
 * Enable or disable tracking (for ATT compliance)
 */
export const setTrackingEnabled = (enabled: boolean) => {
  config.enabled = enabled;
  if (config.debug) {
    console.log("[Analytics] Tracking enabled:", enabled);
  }
};

/**
 * Track an event (alias for track)
 */
export const trackEvent = (event: string, data?: EventData) => {
  track(event as AnalyticsEvent, data);
};

/**
 * Identify a user with additional properties
 */
export const identifyUser = async (
  userId: string | number,
  traits?: Record<string, string | number | boolean | null>
) => {
  await setAnalyticsUser(userId);

  if (traits) {
    track("feature_use", {
      feature: "user_identify",
      ...traits,
    });
  }

  if (config.debug) {
    console.log("[Analytics] User identified:", userId, traits);
  }
};

/**
 * Get debug events (development only)
 */
export const getDebugEvents = async (): Promise<any[]> => {
  if (!__DEV__) return [];

  try {
    const events = await AsyncStorage.getItem("analytics_events_debug");
    return events ? JSON.parse(events) : [];
  } catch {
    return [];
  }
};

/**
 * Clear debug events (development only)
 */
export const clearDebugEvents = async () => {
  if (!__DEV__) return;

  try {
    await AsyncStorage.removeItem("analytics_events_debug");
  } catch {
    // Ignore
  }
};

export default {
  init: initAnalytics,
  setUser: setAnalyticsUser,
  track,
  trackEvent,
  trackScreen,
  trackError,
  setTrackingEnabled,
  identifyUser,
};
