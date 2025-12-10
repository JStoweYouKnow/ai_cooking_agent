import type { FavoriteValue } from "../utils/favorites";

// Mobile app type definitions
// These mirror the server types but are defined locally to avoid import issues

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  dietaryPreferences: string | null;
  allergies: string | null;
  goals: string | null;
  calorieBudget: number | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface Recipe {
  id: number;
  userId: number;
  externalId: string | null;
  name: string;
  description: string | null;
  instructions: string | null;
  imageUrl: string | null;
  cuisine: string | null;
  category: string | null;
  cookingTime: number | null;
  servings: number | null;
  caloriesPerServing: number | null;
  sourceUrl: string | null;
  source: string | null;
  isFavorite: FavoriteValue;
  tags: string[] | null;
  isShared: boolean | null;
  // JSONB columns for imported recipes (HTML, TheMealDB, etc.)
  ingredients: Array<{
    raw?: string;
    ingredient?: string;
    name?: string;
    quantity?: string | number | null;
    quantity_float?: number | null;
    unit?: string | null;
  }> | null;
  steps: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id: number;
  name: string;
  category: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

export interface RecipeIngredient {
  id: number;
  recipeId: number;
  ingredientId: number;
  quantity: string | null;
  unit: string | null;
  createdAt: Date;
}

export interface UserIngredient {
  id: number;
  userId: number;
  ingredientId: number;
  quantity: string | null;
  unit: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingList {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingListItem {
  id: number;
  shoppingListId: number;
  ingredientId: number;
  quantity: string | null;
  unit: string | null;
  isChecked: boolean | null;
  createdAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string | null;
  isRead: boolean | null;
  actionUrl: string | null;
  metadata: string | null;
  createdAt: Date;
}

export interface Conversation {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isRead: boolean | null;
  createdAt: Date;
}

// Additional mobile-specific types
export interface NavigationRoute {
  name: string;
  params?: Record<string, any>;
}

export interface AuthUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
}

export interface RecipeFilters {
  search?: string;
  cuisine?: string;
  category?: string;
  cookingTime?: number;
  isFavorite?: boolean;
}

export interface ShoppingListWithItems extends ShoppingList {
  items: (ShoppingListItem & { ingredient: Ingredient })[];
}

// API Response types
export interface DashboardStats {
  recipeCount: number;
  shoppingListCount: number;
  ingredientCount: number;
  favoriteCount: number;
}
