/**
 * OAuth utility functions for mobile app
 * Generates OAuth login URLs compatible with the web app's OAuth flow
 */

const readEnv = (key: string, fallback?: string): string => {
  // In Expo, use process.env or Constants.expoConfig
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[key];
    if (value) return value;
  }
  return fallback || "";
};

export const getOAuthConfig = () => {
  const oauthPortalUrl =
    process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL || readEnv("EXPO_PUBLIC_OAUTH_PORTAL_URL", "");
  const appId = process.env.EXPO_PUBLIC_APP_ID || readEnv("EXPO_PUBLIC_APP_ID", "");

  if (!oauthPortalUrl || !appId) {
    // OAuth is optional - users can still use email login
    // Only warn in development, don't block functionality
    if (__DEV__) {
      console.warn("[OAuth] OAuth not configured. Users can still log in with email. Set EXPO_PUBLIC_OAUTH_PORTAL_URL and EXPO_PUBLIC_APP_ID to enable OAuth.");
    }
    return null;
  }

  return { oauthPortalUrl, appId };
};

/**
 * Generate OAuth login URL for mobile app
 * Uses a deep link scheme for the callback
 */
export const getMobileOAuthLoginUrl = (): string | null => {
  const config = getOAuthConfig();
  if (!config) return null;

  // Use a deep link scheme for mobile callback
  // Format: sous://oauth/callback
  const redirectUri = "sous://oauth/callback";
  const state = btoa(redirectUri);

  const url = new URL(`${config.oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", config.appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/**
 * Generate OAuth login URL that redirects to server callback
 * This allows the server to handle the OAuth flow and return a token
 */
export const getServerOAuthLoginUrl = (serverBaseUrl: string): string | null => {
  const config = getOAuthConfig();
  if (!config) return null;

  // Redirect to server's OAuth callback endpoint
  // The server will handle the OAuth exchange and return a token
  const redirectUri = `${serverBaseUrl}/api/oauth/mobile-callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${config.oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", config.appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

