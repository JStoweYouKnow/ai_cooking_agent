/**
 * Usage-based paywall thresholds
 * Persist counts in AsyncStorage and show paywall when thresholds are hit.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_AI_CHATS = "usage_ai_chats";
const KEY_URL_IMPORTS = "usage_url_imports";

const THRESHOLD_AI_CHATS = 2;
const THRESHOLD_URL_IMPORTS = 1;

export const USAGE_PAYWALL = {
  AI_CHATS: { key: KEY_AI_CHATS, threshold: THRESHOLD_AI_CHATS },
  URL_IMPORTS: { key: KEY_URL_IMPORTS, threshold: THRESHOLD_URL_IMPORTS },
} as const;

export async function getUsage(key: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? Math.max(0, parseInt(raw, 10)) : 0;
  } catch {
    return 0;
  }
}

export async function incrementUsage(key: string): Promise<number> {
  const next = (await getUsage(key)) + 1;
  try {
    await AsyncStorage.setItem(key, String(next));
  } catch {
    // ignore
  }
  return next;
}

export async function shouldShowPaywallForAiChat(isPremium: boolean): Promise<boolean> {
  if (isPremium) return false;
  const count = await getUsage(KEY_AI_CHATS);
  return count >= THRESHOLD_AI_CHATS;
}

export async function recordAiChatAndCheckPaywall(isPremium: boolean): Promise<{ count: number; showPaywall: boolean }> {
  const count = await incrementUsage(KEY_AI_CHATS);
  return { count, showPaywall: !isPremium && count >= THRESHOLD_AI_CHATS };
}

export async function recordUrlImportAndCheckPaywall(isPremium: boolean): Promise<{ count: number; showPaywall: boolean }> {
  const count = await incrementUsage(KEY_URL_IMPORTS);
  return { count, showPaywall: !isPremium && count >= THRESHOLD_URL_IMPORTS };
}
