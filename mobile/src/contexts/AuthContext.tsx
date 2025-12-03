import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { AuthUser } from "../types";
import { trpcClient } from "../api/client";

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

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const token = await SecureStore.getItemAsync("auth_token");
      if (token) {
        // Use tRPC client directly instead of query hook to avoid serialization issues
        try {
          // @ts-ignore - tRPC client types are complex, runtime works correctly
          const userData = await (trpcClient as any).auth.me.query();
          if (userData && userData.id) {
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
            // Token is invalid, clear it
            await SecureStore.deleteItemAsync("auth_token");
          }
        } catch (error: any) {
          // API call failed, clear token
          console.error("Error fetching user:", error);
          console.error("Error details:", {
            message: error?.message,
            code: error?.code,
            data: error?.data,
          });
          // Don't clear token on network errors - might be temporary
          if (error?.message?.includes("Network request failed")) {
            console.warn("[Auth] Network error - backend may not be running or unreachable");
          } else {
            await SecureStore.deleteItemAsync("auth_token");
          }
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
      await SecureStore.deleteItemAsync("auth_token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (openId: string) => {
    try {
      setIsLoading(true);
      // Store the openId as auth token (for backward compatibility)
      await SecureStore.setItemAsync("auth_token", openId);
      console.log("[Auth] Stored auth token:", openId.substring(0, 10) + "...");
      
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
          await SecureStore.deleteItemAsync("auth_token");
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
        await SecureStore.deleteItemAsync("auth_token");
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
      await SecureStore.deleteItemAsync("auth_token");
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
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
