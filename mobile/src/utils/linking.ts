/**
 * Deep Linking Configuration
 * Handles app links for recipe sharing and navigation
 */

import * as Linking from "expo-linking";
import { LinkingOptions } from "@react-navigation/native";

// URL scheme for the app
export const APP_SCHEME = "sous";
export const WEB_URL = "https://sous.projcomfort.com";

// Define the linking configuration for React Navigation
export const linkingConfig: LinkingOptions<any> = {
  prefixes: [
    Linking.createURL("/"), // sous://
    `${APP_SCHEME}://`,
    WEB_URL,
    "https://sous.projcomfort.com",
  ],
  config: {
    screens: {
      // Main tab navigator
      Main: {
        screens: {
          // Recipes tab
          RecipesTab: {
            screens: {
              RecipeList: "recipes",
              RecipeDetail: "recipe/:id",
              CreateRecipe: "recipes/create",
            },
          },
          // Shopping lists tab
          ShoppingTab: {
            screens: {
              ShoppingListsList: "shopping",
              ShoppingListDetail: "shopping/:id",
            },
          },
          // Home/Dashboard tab
          HomeTab: {
            screens: {
              Dashboard: "home",
            },
          },
          // Ingredients tab
          IngredientsTab: {
            screens: {
              Ingredients: "ingredients",
            },
          },
          // Settings tab
          SettingsTab: {
            screens: {
              Settings: "settings",
              Profile: "settings/profile",
            },
          },
        },
      },
      // Auth screens (outside main navigator)
      Login: "login",
      Register: "register",
    },
  },
};

/**
 * Generate a shareable link for a recipe
 */
export const generateRecipeLink = (recipeId: number, recipeName?: string): string => {
  const encodedName = recipeName ? encodeURIComponent(recipeName) : "";
  return `${WEB_URL}/recipe/${recipeId}${encodedName ? `?name=${encodedName}` : ""}`;
};

/**
 * Generate an in-app deep link for a recipe
 */
export const generateRecipeDeepLink = (recipeId: number): string => {
  return Linking.createURL(`recipe/${recipeId}`);
};

/**
 * Generate a shareable link for a shopping list
 */
export const generateShoppingListLink = (listId: number, listName?: string): string => {
  const encodedName = listName ? encodeURIComponent(listName) : "";
  return `${WEB_URL}/shopping/${listId}${encodedName ? `?name=${encodedName}` : ""}`;
};

/**
 * Parse a deep link URL to extract route and params
 */
export const parseDeepLink = (
  url: string
): { route: string; params: Record<string, string> } | null => {
  try {
    const { path, queryParams } = Linking.parse(url);

    if (!path) return null;

    return {
      route: path,
      params: queryParams as Record<string, string>,
    };
  } catch (error) {
    console.error("[DeepLink] Failed to parse URL:", url, error);
    return null;
  }
};

/**
 * Open an external URL safely
 */
export const openExternalUrl = async (url: string): Promise<boolean> => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    } else {
      console.warn("[DeepLink] Cannot open URL:", url);
      return false;
    }
  } catch (error) {
    console.error("[DeepLink] Failed to open URL:", url, error);
    return false;
  }
};

/**
 * Get the initial URL that opened the app (if any)
 */
export const getInitialURL = async (): Promise<string | null> => {
  try {
    return await Linking.getInitialURL();
  } catch (error) {
    console.error("[DeepLink] Failed to get initial URL:", error);
    return null;
  }
};

/**
 * Subscribe to incoming links while the app is open
 */
export const subscribeToLinks = (callback: (url: string) => void): (() => void) => {
  const subscription = Linking.addEventListener("url", (event) => {
    callback(event.url);
  });

  return () => subscription.remove();
};

export default {
  config: linkingConfig,
  generateRecipeLink,
  generateRecipeDeepLink,
  generateShoppingListLink,
  parseDeepLink,
  openExternalUrl,
  getInitialURL,
  subscribeToLinks,
};
