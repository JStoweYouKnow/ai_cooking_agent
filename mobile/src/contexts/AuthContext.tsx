import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { AuthUser } from "../types";
import { trpcClient, setOnUnauthorizedCallback, clearOnUnauthorizedCallback } from "../api/client";
import { identifyUser, setAnalyticsUser, track } from "../utils/analytics";
import { isDemoMode, DEMO_USER_OPEN_ID } from "../constants/demo";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (openId: string) => Promise<void>;
  loginWithOAuth: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  // Return values directly without spreading to avoid React Native serialization issues
  // Ensure boolean values are primitive booleans
  return {
    user: context.user,
    isLoading: Boolean(context.isLoading),
    isAuthenticated: Boolean(context.isAuthenticated),
    login: context.login,
    loginWithOAuth: context.loginWithOAuth,
    logout: context.logout,
    refreshUser: context.refreshUser,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isMountedRef = useRef(true);

  // Handle forced logout from API unauthorized errors
  const handleUnauthorized = useCallback(async () => {
    console.log("[AuthProvider] Unauthorized callback triggered - logging out");
    try {
      await SecureStore.deleteItemAsync("auth_token");
    } catch (e) {
      console.error("[AuthProvider] Error clearing token on unauthorized:", e);
    }
    if (isMountedRef.current) {
      setUser(null);
      Alert.alert(
        "Session Expired",
        "Your session has expired. Please log in again.",
        [{ text: "OK" }]
      );
    }
  }, []);

  // Register unauthorized callback on mount
  useEffect(() => {
    isMountedRef.current = true;
    setOnUnauthorizedCallback(handleUnauthorized);

    return () => {
      isMountedRef.current = false;
      clearOnUnauthorizedCallback();
    };
  }, [handleUnauthorized]);

  useEffect(() => {
    console.log("[AuthProvider] Component mounted, calling loadUser...");
    loadUser();
  }, []);

  const loadUser = async () => {
    const AUTH_TIMEOUT_MS = 10000; // 10 seconds timeout
    let timeoutId: NodeJS.Timeout | null = null;
    const abortController = new AbortController();
    
    try {
      console.log("[AuthProvider] loadUser started");
      setIsLoading(true);
      
      // Set timeout to prevent infinite loading
      const timeoutPromise = new Promise<void>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.warn("[AuthProvider] loadUser timeout - showing login screen");
          abortController.abort();
          reject(new Error("Auth check timeout - backend may be unreachable"));
        }, AUTH_TIMEOUT_MS);
      });

      const loadUserPromise = (async () => {
        try {
          // Check if cancelled before starting
          if (abortController.signal.aborted) {
            throw new Error("Operation cancelled");
          }

          // Demo mode: skip token check, auto-login as demo user
          if (isDemoMode()) {
            console.log("[AuthProvider] Demo mode - auto-logging in as demo user");
            await login(DEMO_USER_OPEN_ID);
            return;
          }

          console.log("[AuthProvider] Checking SecureStore for auth token...");
          let token: string | null = null;
          try {
            token = await SecureStore.getItemAsync("auth_token");
            // Check if cancelled after await
            if (abortController.signal.aborted) {
              throw new Error("Operation cancelled");
            }
            console.log("[AuthProvider] Token check result:", token ? "Token found" : "No token");
          } catch (storeError: any) {
            // If cancelled, rethrow the cancellation error
            if (abortController.signal.aborted) {
              throw new Error("Operation cancelled");
            }
            console.error("[AuthProvider] Error accessing SecureStore:", storeError);
            // SecureStore might not be available, continue without token
            console.log("[AuthProvider] Continuing without token due to SecureStore error");
          }
          
          if (token) {
            // Use tRPC client directly instead of query hook to avoid serialization issues
            try {
              // Check if cancelled before API call
              if (abortController.signal.aborted) {
                throw new Error("Operation cancelled");
              }

              console.log("[AuthProvider] Fetching user data from API...");
              // @ts-ignore - tRPC client types are complex, runtime works correctly
              const userData = await (trpcClient as any).auth.me.query();
              
              // Check if cancelled after await
              if (abortController.signal.aborted) {
                throw new Error("Operation cancelled");
              }

              console.log("[AuthProvider] API response received:", userData ? "User data present" : "No user data");
              
              if (userData && userData.id) {
                // Check if cancelled before state update
                if (abortController.signal.aborted) {
                  throw new Error("Operation cancelled");
                }

                // Transform server User to mobile AuthUser
                const authUser: AuthUser = {
                  id: userData.id,
                  openId: userData.openId,
                  name: userData.name,
                  email: userData.email,
                  role: userData.role || "user",
                };
                console.log("[Auth] User loaded successfully:", { id: authUser.id, openId: authUser.openId, name: authUser.name });
                setUser(authUser);
                console.log("[Auth] User state updated, isAuthenticated should be:", Boolean(authUser));
              } else {
                // Check if cancelled before clearing token
                if (abortController.signal.aborted) {
                  throw new Error("Operation cancelled");
                }

                // Token is invalid, clear it
                console.log("[AuthProvider] Invalid user data, clearing token");
                try {
                  await SecureStore.deleteItemAsync("auth_token");
                } catch (storeError) {
                  console.error("[AuthProvider] Error clearing token:", storeError);
                }
              }
            } catch (error: any) {
              // If cancelled, rethrow the cancellation error
              if (abortController.signal.aborted) {
                throw new Error("Operation cancelled");
              }

              // API call failed, clear token
              console.error("[AuthProvider] Error fetching user:", error);
              console.error("[AuthProvider] Error details:", {
                message: error?.message,
                code: error?.code,
                data: error?.data,
              });
              // Don't clear token on network errors - might be temporary
              if (error?.message?.includes("Network request failed")) {
                console.warn("[Auth] Network error - backend may not be running or unreachable");
              } else {
                // Check if cancelled before clearing token
                if (abortController.signal.aborted) {
                  throw new Error("Operation cancelled");
                }

                try {
                  await SecureStore.deleteItemAsync("auth_token");
                } catch (storeError) {
                  console.error("[AuthProvider] Error clearing token:", storeError);
                }
              }
            }
          } else {
            console.log("[AuthProvider] No token found, user will see login screen");
          }
        } catch (error) {
          // Don't log cancellation errors as errors
          if (error instanceof Error && error.message === "Operation cancelled") {
            throw error;
          }
          console.error("[AuthProvider] Error in loadUserPromise:", error);
          throw error;
        }
      })();

      // Race between timeout and actual load, with proper error handling
      await Promise.race([
        loadUserPromise.catch(error => {
          // Attach catch to prevent unhandled rejection
          if (error instanceof Error && error.message === "Operation cancelled") {
            throw error;
          }
          throw error;
        }),
        timeoutPromise
      ]);
    } catch (error: any) {
      console.error("[AuthProvider] Error loading user (final catch):", error);
      // On timeout or other errors, ensure we show login screen
      if (error?.message?.includes("timeout")) {
        console.log("[AuthProvider] Timeout occurred - proceeding to show login screen");
      } else if (error?.message?.includes("Operation cancelled")) {
        console.log("[AuthProvider] Operation was cancelled (timeout or abort)");
      } else {
        try {
          await SecureStore.deleteItemAsync("auth_token");
        } catch (storeError) {
          console.error("[AuthProvider] Error clearing token (final catch):", storeError);
        }
      }
    } finally {
      // Centralized timeout cleanup - only place where clearTimeout is called
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        console.log("[AuthProvider] loadUser completed, setting isLoading to false");
        setIsLoading(false);
      } else {
        console.log("[AuthProvider] loadUser completed but component unmounted, skipping state update");
      }
    }
  };

  const login = async (openId: string) => {
    try {
      setIsLoading(true);
      // Store the openId as auth token (for backward compatibility)
      try {
        await SecureStore.setItemAsync("auth_token", openId);
        console.log("[Auth] Stored auth token:", openId.substring(0, 10) + "...");
      } catch (storeError) {
        console.error("[Auth] Error storing token in SecureStore:", storeError);
        throw new Error("Failed to store authentication token");
      }
      
      // Directly fetch user instead of calling loadUser (which might have error handling that clears token)
      try {
        // @ts-ignore - tRPC client types are complex, runtime works correctly
        const { getBaseUrl } = await import("../api/client");
        const baseUrl = getBaseUrl();
        console.log("[Auth] Attempting to fetch user from:", `${baseUrl}/api/trpc/auth.me`);
        
        const userData = await (trpcClient as any).auth.me.query();
        console.log("[Auth] Raw userData from server:", JSON.stringify(userData, null, 2));
        console.log("[Auth] userData type:", typeof userData);
        console.log("[Auth] userData is null?", userData === null);
        console.log("[Auth] userData is undefined?", userData === undefined);
        console.log("[Auth] userData.id:", userData?.id);
        console.log("[Auth] userData keys:", userData ? Object.keys(userData) : "N/A");
        
        if (userData && typeof userData === 'object' && 'id' in userData && userData.id != null) {
          const authUser: AuthUser = {
            id: userData.id,
            openId: userData.openId,
            name: userData.name,
            email: userData.email,
            role: userData.role || "user",
          };
          console.log("[Auth] User loaded successfully:", { id: authUser.id, openId: authUser.openId, name: authUser.name });
          // Set user state - this should trigger navigation update
          setUser(authUser);

          // Identify user for analytics (fire-and-forget)
          try {
            await identifyUser(authUser.id, {
              email: authUser.email || null,
              name: authUser.name || null,
              role: authUser.role,
            });
            track("login", { method: "openid" });
          } catch (error) {
            console.warn("[Auth] Analytics error during login (non-blocking):", error);
            // Continue login flow even if analytics fails
          }

          // Small delay to ensure state update propagates
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log("[Auth] User state set, navigation should update");
        } else {
          console.error("[Auth] User data missing id or invalid response. Full data:", userData);
          const errorDetails = userData === null 
            ? "Server returned null (user not authenticated)"
            : userData === undefined
            ? "Server returned undefined (user not found)"
            : !('id' in userData)
            ? "Server response missing 'id' field"
            : userData.id == null
            ? `Server response has null/undefined id: ${userData.id}`
            : "Unknown error";
          console.error("[Auth] Error details:", errorDetails);
          try {
            await SecureStore.deleteItemAsync("auth_token");
          } catch (storeError) {
            console.error("[Auth] Error clearing token:", storeError);
          }
          throw new Error(`Authentication failed: ${errorDetails}. Please try logging in again.`);
        }
      } catch (error: any) {
        console.error("[Auth] Failed to fetch user after login:", error);
        const { getBaseUrl } = await import("../api/client");
        const baseUrl = getBaseUrl();
        
        // Don't clear token on network errors - might be temporary
        if (error?.message?.includes("Network request failed") || error?.message?.includes("fetch")) {
          const errorMsg = `Cannot connect to server at ${baseUrl}. Please ensure the backend server is running.`;
          console.error("[Auth]", errorMsg);
          throw new Error(errorMsg);
        }
        try {
          await SecureStore.deleteItemAsync("auth_token");
        } catch (storeError) {
          console.error("[Auth] Error clearing token:", storeError);
        }
        throw new Error(error?.message || "Failed to authenticate. Please try again.");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOAuth = async () => {
    try {
      setIsLoading(true);
      const { getServerOAuthLoginUrl } = await import("../utils/oauth");
      const { getBaseUrl } = await import("../api/client");
      
      const baseUrl = getBaseUrl();
      const oauthUrl = getServerOAuthLoginUrl(baseUrl);
      
      if (!oauthUrl) {
        // OAuth is optional - show a friendly message
        Alert.alert(
          "OAuth Not Available",
          "OAuth login is not configured. Please use email login instead.",
          [{ text: "OK" }]
        );
        return;
      }

      // Use expo-web-browser to open OAuth URL
      const { openBrowserAsync } = await import("expo-web-browser");
      
      // Open browser and wait for user to complete OAuth
      const result = await openBrowserAsync(oauthUrl, {
        showInRecents: true,
      });

      if (result.type === "cancel") {
        throw new Error("OAuth login was cancelled");
      }

      // After OAuth completes, the server redirects to /api/oauth/mobile-callback
      // which returns JSON with sessionToken. However, we can't directly capture this
      // from the browser. Instead, we'll use a workaround:
      // 1. Store a temporary state
      // 2. Poll the server or use deep linking
      
      // For now, show a message that user needs to manually enter their email
      // In a production app, you'd implement deep linking or use expo-auth-session
      Alert.alert(
        "OAuth Complete",
        "Please enter your email address to complete login. Your OAuth session will be linked to your account.",
        [
          {
            text: "OK",
            onPress: () => {
              // User can now use email login which will link to their OAuth account
            },
          },
        ]
      );
    } catch (error: any) {
      if (error?.message?.includes("cancelled")) {
        return; // User cancelled, don't show error
      }
      console.error("Error with OAuth login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      try {
        await SecureStore.deleteItemAsync("auth_token");
        console.log("[Auth] Token cleared from SecureStore");
      } catch (storeError) {
        console.error("[Auth] Error clearing token from SecureStore:", storeError);
        // Continue with logout even if SecureStore fails
      }

      // Clear analytics user and track logout
      track("logout", {});
      try {
        await setAnalyticsUser(null);
      } catch (error) {
        console.error("[Auth] Error clearing analytics user (non-blocking):", error);
        // Continue logout flow even if analytics fails
      }

      setUser(null);
      console.log("[Auth] User logged out successfully");
    } catch (error) {
      console.error("[Auth] Error logging out:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  // Create context value - use useMemo to ensure re-renders when user or loading state changes
  // Only depend on user and isLoading, not the functions (they're stable)
  const value: AuthContextType = React.useMemo(() => ({
    user,
    isLoading: Boolean(isLoading),
    isAuthenticated: Boolean(user),
    login,
    loginWithOAuth,
    logout,
    refreshUser,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
