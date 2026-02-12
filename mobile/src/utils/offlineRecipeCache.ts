/**
 * Offline Recipe Cache
 * Caches recipes locally for offline access
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const CACHE_KEY_PREFIX = "offline_recipe_";
const CACHE_INDEX_KEY = "offline_recipe_index";
const CACHE_EXPIRY_DAYS = 7;

export interface CachedRecipe {
  id: number;
  name: string;
  description?: string | null;
  instructions?: string | null;
  imageUrl?: string | null;
  cuisine?: string | null;
  category?: string | null;
  cookingTime?: number | null;
  servings?: number | null;
  ingredients?: any[];
  steps?: any[];
  cachedAt: number;
  expiresAt: number;
}

interface CacheIndex {
  recipeIds: number[];
  lastUpdated: number;
}

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return true; // Assume online if check fails
  }
}

/**
 * Get cache key for a recipe
 */
function getCacheKey(recipeId: number): string {
  return `${CACHE_KEY_PREFIX}${recipeId}`;
}

/**
 * Get the cache index
 */
async function getCacheIndex(): Promise<CacheIndex> {
  try {
    const indexData = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (indexData) {
      return JSON.parse(indexData);
    }
  } catch (error) {
    console.error("[OfflineCache] Error reading cache index:", error);
  }
  return { recipeIds: [], lastUpdated: Date.now() };
}

/**
 * Update the cache index
 */
async function updateCacheIndex(recipeIds: number[]): Promise<void> {
  try {
    const index: CacheIndex = {
      recipeIds,
      lastUpdated: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error("[OfflineCache] Error updating cache index:", error);
  }
}

/**
 * Cache a single recipe
 */
export async function cacheRecipe(recipe: any): Promise<void> {
  try {
    const cachedRecipe: CachedRecipe = {
      id: recipe.id,
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      imageUrl: recipe.imageUrl,
      cuisine: recipe.cuisine,
      category: recipe.category,
      cookingTime: recipe.cookingTime,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      cachedAt: Date.now(),
      expiresAt: Date.now() + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };

    await AsyncStorage.setItem(
      getCacheKey(recipe.id),
      JSON.stringify(cachedRecipe)
    );

    // Update index
    const index = await getCacheIndex();
    if (!index.recipeIds.includes(recipe.id)) {
      index.recipeIds.push(recipe.id);
      await updateCacheIndex(index.recipeIds);
    }

    console.log(`[OfflineCache] Cached recipe ${recipe.id}: ${recipe.name}`);
  } catch (error) {
    console.error("[OfflineCache] Error caching recipe:", error);
  }
}

/**
 * Cache multiple recipes
 */
export async function cacheRecipes(recipes: any[]): Promise<void> {
  const promises = recipes.map((recipe) => cacheRecipe(recipe));
  await Promise.all(promises);
  console.log(`[OfflineCache] Cached ${recipes.length} recipes`);
}

/**
 * Get a cached recipe by ID
 */
export async function getCachedRecipe(
  recipeId: number
): Promise<CachedRecipe | null> {
  try {
    const data = await AsyncStorage.getItem(getCacheKey(recipeId));
    if (!data) return null;

    const cached: CachedRecipe = JSON.parse(data);

    // Check if expired
    if (cached.expiresAt < Date.now()) {
      await removeCachedRecipe(recipeId);
      return null;
    }

    return cached;
  } catch (error) {
    console.error("[OfflineCache] Error reading cached recipe:", error);
    return null;
  }
}

/**
 * Get all cached recipes
 */
export async function getAllCachedRecipes(): Promise<CachedRecipe[]> {
  try {
    const index = await getCacheIndex();
    const recipes: CachedRecipe[] = [];

    for (const recipeId of index.recipeIds) {
      const recipe = await getCachedRecipe(recipeId);
      if (recipe) {
        recipes.push(recipe);
      }
    }

    return recipes;
  } catch (error) {
    console.error("[OfflineCache] Error reading all cached recipes:", error);
    return [];
  }
}

/**
 * Remove a cached recipe
 */
export async function removeCachedRecipe(recipeId: number): Promise<void> {
  try {
    await AsyncStorage.removeItem(getCacheKey(recipeId));

    // Update index
    const index = await getCacheIndex();
    const newIds = index.recipeIds.filter((id) => id !== recipeId);
    await updateCacheIndex(newIds);
  } catch (error) {
    console.error("[OfflineCache] Error removing cached recipe:", error);
  }
}

/**
 * Clear all cached recipes
 */
export async function clearRecipeCache(): Promise<void> {
  try {
    const index = await getCacheIndex();
    const keys = index.recipeIds.map((id) => getCacheKey(id));
    keys.push(CACHE_INDEX_KEY);

    await AsyncStorage.multiRemove(keys);
    console.log("[OfflineCache] Cleared all cached recipes");
  } catch (error) {
    console.error("[OfflineCache] Error clearing cache:", error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  recipeCount: number;
  lastUpdated: number;
  totalSizeKB: number;
}> {
  try {
    const index = await getCacheIndex();
    let totalSize = 0;

    for (const recipeId of index.recipeIds) {
      const data = await AsyncStorage.getItem(getCacheKey(recipeId));
      if (data) {
        totalSize += data.length;
      }
    }

    return {
      recipeCount: index.recipeIds.length,
      lastUpdated: index.lastUpdated,
      totalSizeKB: Math.round(totalSize / 1024),
    };
  } catch (error) {
    console.error("[OfflineCache] Error getting cache stats:", error);
    return { recipeCount: 0, lastUpdated: 0, totalSizeKB: 0 };
  }
}

/**
 * Clean expired recipes from cache
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const index = await getCacheIndex();
    let removedCount = 0;

    for (const recipeId of index.recipeIds) {
      const recipe = await getCachedRecipe(recipeId);
      if (!recipe) {
        // Recipe was expired and removed
        removedCount++;
      }
    }

    console.log(`[OfflineCache] Cleaned ${removedCount} expired recipes`);
    return removedCount;
  } catch (error) {
    console.error("[OfflineCache] Error cleaning cache:", error);
    return 0;
  }
}

/**
 * Download recipe for offline use (including image)
 */
export async function downloadForOffline(recipe: any): Promise<boolean> {
  try {
    // Cache the recipe data
    await cacheRecipe(recipe);

    // Note: For full offline image support, you would need to:
    // 1. Download the image using expo-file-system
    // 2. Store it locally
    // 3. Update the cached recipe with local image path
    // This is a simplified version that caches recipe data only

    return true;
  } catch (error) {
    console.error("[OfflineCache] Error downloading for offline:", error);
    return false;
  }
}

/**
 * Check if a recipe is cached
 */
export async function isRecipeCached(recipeId: number): Promise<boolean> {
  const cached = await getCachedRecipe(recipeId);
  return cached !== null;
}

export default {
  cacheRecipe,
  cacheRecipes,
  getCachedRecipe,
  getAllCachedRecipes,
  removeCachedRecipe,
  clearRecipeCache,
  getCacheStats,
  cleanExpiredCache,
  downloadForOffline,
  isRecipeCached,
  isOnline,
};
