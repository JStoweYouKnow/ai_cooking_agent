/**
 * Offline Cache Utility
 * Caches API responses for offline access using AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "offline_cache_";
const CACHE_METADATA_KEY = "offline_cache_metadata";

interface CacheMetadata {
  key: string;
  timestamp: number;
  expiresAt: number;
  size: number;
}

interface CacheOptions {
  /** Time to live in milliseconds (default: 24 hours) */
  ttl?: number;
  /** Force refresh even if cached data exists */
  forceRefresh?: boolean;
}

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB limit

/**
 * Get the full cache key
 */
const getCacheKey = (key: string): string => `${CACHE_PREFIX}${key}`;

/**
 * Get cache metadata
 */
const getMetadata = async (): Promise<CacheMetadata[]> => {
  try {
    const data = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Save cache metadata
 */
const saveMetadata = async (metadata: CacheMetadata[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn("[OfflineCache] Failed to save metadata:", error);
  }
};

/**
 * Cache data with optional TTL
 */
export const cacheData = async <T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> => {
  const { ttl = DEFAULT_TTL } = options;
  const cacheKey = getCacheKey(key);
  const now = Date.now();

  try {
    const serialized = JSON.stringify(data);
    const size = new Blob([serialized]).size;

    // Check if we need to evict old entries
    await evictIfNeeded(size);

    // Save data
    await AsyncStorage.setItem(cacheKey, serialized);

    // Update metadata
    const metadata = await getMetadata();
    const existingIndex = metadata.findIndex((m) => m.key === key);

    const newEntry: CacheMetadata = {
      key,
      timestamp: now,
      expiresAt: now + ttl,
      size,
    };

    if (existingIndex >= 0) {
      metadata[existingIndex] = newEntry;
    } else {
      metadata.push(newEntry);
    }

    await saveMetadata(metadata);

    if (__DEV__) {
      console.log(`[OfflineCache] Cached: ${key} (${(size / 1024).toFixed(2)}KB)`);
    }
  } catch (error) {
    console.warn("[OfflineCache] Failed to cache data:", error);
  }
};

/**
 * Get cached data
 */
export const getCachedData = async <T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> => {
  const { forceRefresh = false } = options;
  const cacheKey = getCacheKey(key);

  if (forceRefresh) {
    return null;
  }

  try {
    // Check if expired
    const metadata = await getMetadata();
    const entry = metadata.find((m) => m.key === key);

    if (entry && entry.expiresAt < Date.now()) {
      // Expired, remove it
      await removeCachedData(key);
      return null;
    }

    const data = await AsyncStorage.getItem(cacheKey);
    if (data) {
      if (__DEV__) {
        console.log(`[OfflineCache] Hit: ${key}`);
      }
      return JSON.parse(data) as T;
    }

    return null;
  } catch (error) {
    console.warn("[OfflineCache] Failed to get cached data:", error);
    return null;
  }
};

/**
 * Remove cached data
 */
export const removeCachedData = async (key: string): Promise<void> => {
  const cacheKey = getCacheKey(key);

  try {
    await AsyncStorage.removeItem(cacheKey);

    const metadata = await getMetadata();
    const filtered = metadata.filter((m) => m.key !== key);
    await saveMetadata(filtered);
  } catch (error) {
    console.warn("[OfflineCache] Failed to remove cached data:", error);
  }
};

/**
 * Clear all cached data
 */
export const clearCache = async (): Promise<void> => {
  try {
    const metadata = await getMetadata();

    // Remove all cached items
    const keys = metadata.map((m) => getCacheKey(m.key));
    await AsyncStorage.multiRemove(keys);

    // Clear metadata
    await AsyncStorage.removeItem(CACHE_METADATA_KEY);

    if (__DEV__) {
      console.log("[OfflineCache] Cache cleared");
    }
  } catch (error) {
    console.warn("[OfflineCache] Failed to clear cache:", error);
  }
};

/**
 * Evict old entries if cache is too large
 */
const evictIfNeeded = async (newSize: number): Promise<void> => {
  const metadata = await getMetadata();
  let totalSize = metadata.reduce((acc, m) => acc + m.size, 0);

  if (totalSize + newSize <= MAX_CACHE_SIZE) {
    return;
  }

  // Sort by timestamp (oldest first)
  const sorted = [...metadata].sort((a, b) => a.timestamp - b.timestamp);

  // Remove oldest entries until we have room
  for (const entry of sorted) {
    if (totalSize + newSize <= MAX_CACHE_SIZE) {
      break;
    }

    await removeCachedData(entry.key);
    totalSize -= entry.size;

    if (__DEV__) {
      console.log(`[OfflineCache] Evicted: ${entry.key}`);
    }
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
  totalSize: number;
  itemCount: number;
  oldestItem: number | null;
  newestItem: number | null;
}> => {
  const metadata = await getMetadata();

  if (metadata.length === 0) {
    return {
      totalSize: 0,
      itemCount: 0,
      oldestItem: null,
      newestItem: null,
    };
  }

  return {
    totalSize: metadata.reduce((acc, m) => acc + m.size, 0),
    itemCount: metadata.length,
    oldestItem: Math.min(...metadata.map((m) => m.timestamp)),
    newestItem: Math.max(...metadata.map((m) => m.timestamp)),
  };
};

/**
 * Cache keys for common data types
 */
export const CacheKeys = {
  RECIPES: "recipes_list",
  RECIPE_DETAIL: (id: number) => `recipe_${id}`,
  SHOPPING_LISTS: "shopping_lists",
  SHOPPING_LIST_ITEMS: (id: number) => `shopping_list_items_${id}`,
  INGREDIENTS: "ingredients_list",
  USER_INGREDIENTS: "user_ingredients",
  USER_PREFERENCES: "user_preferences",
};

/**
 * Wrapper to fetch with cache fallback
 */
export const fetchWithCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> => {
  // Try to get cached data first
  const cached = await getCachedData<T>(key, options);

  try {
    // Fetch fresh data
    const fresh = await fetcher();

    // Cache the result
    await cacheData(key, fresh, options);

    return fresh;
  } catch (error) {
    // If fetch fails and we have cached data, return it
    if (cached !== null) {
      if (__DEV__) {
        console.log(`[OfflineCache] Using cached data for: ${key} (fetch failed)`);
      }
      return cached;
    }

    // No cache, rethrow error
    throw error;
  }
};

export default {
  cache: cacheData,
  get: getCachedData,
  remove: removeCachedData,
  clear: clearCache,
  stats: getCacheStats,
  fetchWithCache,
  keys: CacheKeys,
};
