import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "./trpc";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Get the base URL for the API
// In development, this should point to your local server
// In production, this should point to your production server
export const getBaseUrl = () => {
  if (__DEV__) {
    // Prefer explicit env override
    if (process.env.EXPO_PUBLIC_API_URL) {
      console.log("[API] Using env base URL:", process.env.EXPO_PUBLIC_API_URL);
      return process.env.EXPO_PUBLIC_API_URL;
    }

    // Derive host from dev server (helps on device where localhost is wrong)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(":")[0];
      const derived = `http://${host}:3000`;
      console.log("[API] Derived dev base URL from hostUri:", derived);
      return derived;
    }

    // Fallback to remembered LAN IP
    const fallback = "http://192.168.1.94:3000";
    console.log("[API] Using fallback base URL:", fallback);
    return fallback;
  }
  // Production URL
  return process.env.EXPO_PUBLIC_API_URL || "https://sous.projcomfort.com";
};

// Callback for handling unauthorized errors (set by AuthContext)
let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

export const clearOnUnauthorizedCallback = () => {
  onUnauthorizedCallback = null;
};

// Create a query client with timeout and retry configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      retry: 2, // Retry critical mutations up to 2 times
      retryDelay: (attemptIndex) => {
        const baseMs = 1000 * Math.pow(2, attemptIndex);
        const jitter = Math.random() * 500;
        return Math.min(baseMs + jitter, 10000);
      },
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 6, // 6 hours
});

// Handle unauthorized errors
const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;

  const isUnauthorized =
    error.message === "Unauthorized" ||
    error.data?.code === "UNAUTHORIZED" ||
    error.message?.includes("jwt expired") ||
    error.message?.includes("invalid token");

  if (!isUnauthorized) return;

  console.error("[API Auth Error] User is unauthorized - triggering logout");

  // Clear the token and trigger logout via callback
  if (onUnauthorizedCallback) {
    onUnauthorizedCallback();
  }
};

// Subscribe to query errors
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

// Subscribe to mutation errors
queryClient.getMutationCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Create tRPC client with timeout
// @ts-ignore - tRPC types are complex, runtime works correctly
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        // Get auth token from secure storage
        const token = await SecureStore.getItemAsync("auth_token");
        const headers: Record<string, string> = {};
        if (token) {
          headers.authorization = `Bearer ${token}`;
          console.log("[API] Sending Authorization header with token:", token.substring(0, 20) + "...");
        } else {
          console.log("[API] No auth token found in SecureStore");
        }
        return headers;
      },
      fetch: async (url, options) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          return response;
        } catch (error: any) {
          if (error.name === "AbortError") {
            throw new Error("Request timeout - please check your connection and try again");
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }
      },
    }),
  ],
});

// Re-export trpc instance for use in components
export { trpc };
