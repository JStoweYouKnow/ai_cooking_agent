/**
 * Demo mode configuration for hackathon judging / feature demos
 * When enabled: auto-login as demo user, unlock all premium features
 * Set EXPO_PUBLIC_DEMO_MODE=true in EAS build profile env
 */

import Constants from "expo-constants";

const DEMO_USER_OPEN_ID = "demo@sous.app";

export function isDemoMode(): boolean {
  const value =
    process.env.EXPO_PUBLIC_DEMO_MODE ??
    Constants.expoConfig?.extra?.EXPO_PUBLIC_DEMO_MODE ??
    "";
  return value === "true" || value === true;
}

export { DEMO_USER_OPEN_ID };
