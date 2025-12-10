import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "./trpc";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get the base URL for the API
// In development, this should point to your local server
// In production, this should point to your production server
export const getBaseUrl = () => {
  if (__DEV__) {
    // Use IP address for better compatibility with iOS Simulator
    // iOS Simulator sometimes can't reach localhost
    // Your machine's IP: 192.168.1.94
    // To use localhost instead, change to: "http://localhost:3000"
    const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.94:3000";
    console.log("[API] Using base URL:", API_URL);
    return API_URL;
  }
  // Production URL
  return process.env.EXPO_PUBLIC_API_URL || "https://sous.projcomfort.com";
};

// Create a query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,
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

  const isUnauthorized = error.message === "Unauthorized" || error.data?.code === "UNAUTHORIZED";

  if (!isUnauthorized) return;

  // In React Native, we'll handle this through navigation context
  // This will be set up when we create the auth context
  console.error("[API Auth Error] User is unauthorized");
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

// Create tRPC client
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
    }),
  ],
});

// Re-export trpc instance for use in components
export { trpc };
