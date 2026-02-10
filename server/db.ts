import { eq, desc, asc, and, or, ne, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
// Import all schema exports - using relative path for deployment compatibility
import type {
  InsertUser, User, InsertRecipe, InsertIngredient, Ingredient,
  InsertRecipeIngredient, InsertUserIngredient, InsertShoppingList,
  InsertShoppingListItem, InsertNotification, Notification,
  InsertConversation, Conversation, InsertMessage, Message,
  InsertPushToken, PushToken, InsertSubscription, Subscription,
  InsertPayment, Payment
} from "../drizzle/schema-postgres.ts";
import {
  users, recipes, ingredients, recipeIngredients,
  userIngredients, shoppingLists, shoppingListItems,
  notifications, conversations, messages, pushTokens,
  subscriptions, payments, recipePhotos
} from "../drizzle/schema-postgres.ts";
import { ENV } from './_core/env.ts';
import { getCurrentSeason, getSeasonalScore } from './utils/seasonal.ts';
// Dynamic import to avoid module evaluation during build
import type { InvokeParams, InvokeResult } from './_core/llm';
import { getEffectiveCookingTime } from './_core/recipeParsing.ts';

let _db: ReturnType<typeof drizzle> | null = null;

function isSchemaMismatchError(error: unknown) {
  // Postgres error code 42703 = undefined_column (similar to MySQL ER_BAD_FIELD_ERROR)
  return typeof error === "object" && error !== null && ((error as any).code === "42703" || (error as any).code === "ER_BAD_FIELD_ERROR");
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function createGuestUserStub(): User {
  const now = new Date();
  return {
    id: -1,
    openId: "anonymous_session",
    name: "Guest User",
    email: null,
    loginMethod: "anonymous",
    role: "user",
    dietaryPreferences: null,
    allergies: null,
    goals: null,
    calorieBudget: null,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.error("[Database] Cannot upsert user: database not available");
    throw new Error("Database connection not available. Please check your database configuration.");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "dietaryPreferences", "allergies", "goals"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    // Handle calorieBudget (numeric field)
    if (user.calorieBudget !== undefined) {
      values.calorieBudget = user.calorieBudget;
      updateSet.calorieBudget = user.calorieBudget;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      console.warn("[Database] Skipping user upsert because schema is missing new columns. Run migrations to enable full functionality.", error);
      return;
    }
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      console.warn("[Database] User query failed due to missing columns; returning undefined user.", error);
      return undefined;
    }
    throw error;
  }
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      console.warn("[Database] User query failed due to missing columns; returning undefined user.", error);
      return undefined;
    }
    throw error;
  }
}

/**
 * Update user dietary preferences and allergies
 */
export async function updateUserPreferences(
  userId: number,
  preferences: {
    dietaryPreferences?: string[] | null;
    allergies?: string[] | null;
    goals?: Record<string, unknown> | null;
    calorieBudget?: number | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {};

  if (preferences.dietaryPreferences !== undefined) {
    updateData.dietaryPreferences = preferences.dietaryPreferences
      ? JSON.stringify(preferences.dietaryPreferences)
      : null;
  }

  if (preferences.allergies !== undefined) {
    updateData.allergies = preferences.allergies
      ? JSON.stringify(preferences.allergies)
      : null;
  }

  if (preferences.goals !== undefined) {
    updateData.goals = preferences.goals
      ? JSON.stringify(preferences.goals)
      : null;
  }

  if (preferences.calorieBudget !== undefined) {
    updateData.calorieBudget = preferences.calorieBudget ?? null;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No preferences provided to update");
  }

  await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId));

  // Return updated user
  const updated = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return updated[0] || null;
}

// Get or create an anonymous user for unauthenticated sessions
export async function getOrCreateAnonymousUser(): Promise<User> {
  const db = await getDb();
  if (!db) {
    const errorMsg = process.env.DATABASE_URL
      ? "Database connection failed. Please check your DATABASE_URL and ensure the database is running."
      : "Database not configured. Please add DATABASE_URL to your .env.local file. Example: DATABASE_URL=mysql://appuser:apppassword@localhost:3306/ai_cooking_agent";
    throw new Error(errorMsg);
  }

  const ANONYMOUS_OPENID = "anonymous_session";

  try {
    // Try to get existing anonymous user - call database directly to catch schema-mismatch errors
    let user: User | undefined;
    try {
      const result = await db.select().from(users).where(eq(users.openId, ANONYMOUS_OPENID)).limit(1);
      user = result.length > 0 ? result[0] : undefined;
    } catch (error) {
      if (isSchemaMismatchError(error)) {
        throw error; // Re-throw schema-mismatch errors to outer catch
      }
      throw error;
    }

    if (!user) {
      // Create anonymous user - call database directly to catch schema-mismatch errors
      try {
        const values: InsertUser = {
          openId: ANONYMOUS_OPENID,
          name: "Guest User",
          email: null,
          loginMethod: "anonymous",
          lastSignedIn: new Date(),
        };
        const updateSet: Record<string, unknown> = {
          name: "Guest User",
          email: null,
          loginMethod: "anonymous",
          lastSignedIn: new Date(),
        };
        await db.insert(users).values(values).onConflictDoUpdate({
          target: users.openId,
          set: updateSet,
        });
      } catch (error) {
        if (isSchemaMismatchError(error)) {
          throw error; // Re-throw schema-mismatch errors to outer catch
        }
        throw error;
      }

      // Try to get the user again after creation
      try {
        const result = await db.select().from(users).where(eq(users.openId, ANONYMOUS_OPENID)).limit(1);
        user = result.length > 0 ? result[0] : undefined;
      } catch (error) {
        if (isSchemaMismatchError(error)) {
          throw error; // Re-throw schema-mismatch errors to outer catch
        }
        throw error;
      }
    }

    if (!user) {
      throw new Error("Failed to create anonymous user");
    }

    return user;
  } catch (error) {
    if (isSchemaMismatchError(error)) {
      console.warn("[Database] Falling back to in-memory guest user because the users table schema is outdated. Please run the latest migrations.", error);
      return createGuestUserStub();
    }
    throw error;
  }
}

// Recipe queries
export async function createRecipe(recipe: InsertRecipe) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipes).values(recipe).returning();
  return result[0]; // Return the created recipe with its ID
}

// Helper to enhance recipe with computed cooking time
function enhanceRecipeWithCookingTime<T extends { cookingTime: number | null }>(recipe: T): T {
  if (!recipe) return recipe;

  // If cooking time is already set, return as-is
  if (recipe.cookingTime && recipe.cookingTime > 0) return recipe;

  // Try to compute cooking time from various sources
  const computedTime = getEffectiveCookingTime(recipe as any);
  if (computedTime) {
    return { ...recipe, cookingTime: computedTime };
  }

  return recipe;
}

function normalizeIsFavorite(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function normalizeRecipe<T extends { isFavorite: unknown; cookingTime: number | null }>(
  recipe: T
): T & { isFavorite: boolean } {
  if (!recipe) return recipe as T & { isFavorite: boolean };
  const withCookingTime = enhanceRecipeWithCookingTime(recipe);
  return { ...withCookingTime, isFavorite: normalizeIsFavorite(recipe.isFavorite) };
}

type RecipeListOptions = {
  sortBy?: "recent" | "alphabetical" | "meal";
  mealFilter?: "breakfast" | "lunch" | "dinner" | "dessert";
  orderBy?: "createdAt" | "name" | "category";
  direction?: "asc" | "desc";
  limit?: number;
};

export async function getUserRecipes(
  userId: number,
  options?: RecipeListOptions
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const hasOrderBy = options?.orderBy !== undefined;
  const hasDirection = options?.direction !== undefined;

  if ((hasOrderBy && !hasDirection) || (!hasOrderBy && hasDirection)) {
    throw new Error("orderBy and direction must be provided together");
  }

  if (options?.sortBy && (hasOrderBy || hasDirection)) {
    throw new Error("sortBy cannot be combined with orderBy/direction");
  }

  // Build where condition
  const baseCondition = or(eq(recipes.userId, userId), eq(recipes.isShared, true));
  const whereCondition = options?.mealFilter
    ? and(baseCondition, eq(recipes.category, options.mealFilter))
    : baseCondition;

  // Build query with where condition
  let query = db
    .select()
    .from(recipes)
    .where(whereCondition);

  // Apply sorting
  const effectiveSort =
    options?.orderBy && options?.direction
      ? { orderBy: options.orderBy, direction: options.direction }
      : options?.sortBy === "recent"
        ? { orderBy: "createdAt" as const, direction: "desc" as const }
        : options?.sortBy === "alphabetical"
          ? { orderBy: "name" as const, direction: "asc" as const }
          : options?.sortBy === "meal"
            ? { orderBy: "category" as const, direction: "asc" as const, secondary: true }
            : { orderBy: "createdAt" as const, direction: "desc" as const };

  if (effectiveSort.orderBy === "createdAt") {
    query = query.orderBy(
      effectiveSort.direction === "desc" ? desc(recipes.createdAt) : asc(recipes.createdAt)
    ) as any;
  } else if (effectiveSort.orderBy === "name") {
    query = query.orderBy(
      effectiveSort.direction === "desc" ? desc(recipes.name) : asc(recipes.name)
    ) as any;
  } else if (effectiveSort.orderBy === "category") {
    const categorySorter =
      effectiveSort.direction === "desc" ? desc(recipes.category) : asc(recipes.category);
    const nameSorter =
      effectiveSort.direction === "desc" ? desc(recipes.name) : asc(recipes.name);
    // Keep secondary alphabetical ordering when sorting meals by category
    query = effectiveSort.secondary
      ? (query.orderBy(categorySorter, nameSorter) as any)
      : (query.orderBy(categorySorter) as any);
  }

  if (options?.limit) {
    query = query.limit(options.limit) as any;
  }

  const results = await query;
  // Normalize favorites and enhance cooking time for consistent client shape
  return results.map(r => normalizeRecipe(r));
}

/**
 * Get only recipes that the user has actually added (not preloaded/shared recipes)
 * This is used for "recent recipes" to show only user-added content
 */
export async function getUserAddedRecipes(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Only get recipes created by this specific user (exclude shared/preloaded recipes)
  let query = db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .orderBy(desc(recipes.createdAt));

  if (limit) {
    query = query.limit(limit) as any;
  }

  const results = await query;
  // Normalize favorites and enhance cooking time for consistent client shape
  return results.map(r => normalizeRecipe(r));
}

export async function getRecipeById(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  // Enhance recipe with computed cooking time
  return result[0] ? normalizeRecipe(result[0]) : undefined;
}

export async function updateRecipeFavorite(recipeId: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(recipes).set({ isFavorite: !!isFavorite }).where(eq(recipes.id, recipeId));
}

export async function updateRecipeTags(recipeId: number, tags: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(recipes).set({ tags }).where(eq(recipes.id, recipeId));
}

export async function deleteRecipe(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(recipes).where(eq(recipes.id, recipeId));
}

/**
 * Mark a recipe as cooked and increment the cooked count
 */
export async function markRecipeAsCooked(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Use atomic SQL increment to avoid race conditions
  // Use COALESCE to handle NULL values, defaulting to 0
  return db.update(recipes).set({
    cookedAt: new Date(),
    cookedCount: sql`COALESCE(${recipes.cookedCount}, 0) + 1`,
    updatedAt: new Date(),
  }).where(eq(recipes.id, recipeId));
}

/**
 * Get recently cooked recipes for a user
 */
export async function getRecentlyCookedRecipes(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select()
    .from(recipes)
    .where(and(eq(recipes.userId, userId), ne(recipes.cookedAt, null)))
    .orderBy(desc(recipes.cookedAt))
    .limit(limit);
}

// ============================================
// Recipe Photo Journal - "I Made This!" feature
// ============================================

/**
 * Get all photos for a recipe by a specific user
 */
export async function getRecipePhotos(recipeId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select()
    .from(recipePhotos)
    .where(and(
      eq(recipePhotos.recipeId, recipeId),
      eq(recipePhotos.userId, userId)
    ))
    .orderBy(desc(recipePhotos.cookedAt));
}

/**
 * Get a single recipe photo by ID
 */
export async function getRecipePhotoById(photoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db.select()
    .from(recipePhotos)
    .where(eq(recipePhotos.id, photoId))
    .limit(1);
  
  return results[0] ?? null;
}

/**
 * Add a new recipe photo
 */
export async function addRecipePhoto(data: {
  recipeId: number;
  userId: number;
  imageUrl: string;
  caption?: string;
  rating?: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db.insert(recipePhotos)
    .values({
      recipeId: data.recipeId,
      userId: data.userId,
      imageUrl: data.imageUrl,
      caption: data.caption ?? null,
      rating: data.rating ?? null,
      notes: data.notes ?? null,
      cookedAt: new Date(),
    })
    .returning();
  
  return results[0];
}

/**
 * Delete a recipe photo
 */
export async function deleteRecipePhoto(photoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.delete(recipePhotos)
    .where(eq(recipePhotos.id, photoId));
}

/**
 * Generate recipe recommendations using LLM when user has no ingredients/preferences
 */
async function generateLLMRecommendations(
  mealCategory: 'breakfast' | 'lunch' | 'dinner' | 'dessert',
  season: string,
  calorieBudget: number | null,
  dietaryPreferences: string[] | null,
  allergies: string[] | null,
  goals: { targetCalories?: number; type?: string } | null
): Promise<{
  name: string;
  description: string;
  instructions: string;
  category: string;
  caloriesPerServing: number | null;
  ingredients: Array<{ name: string; quantity?: string; unit?: string }>;
} | null> {
  try {
    const categoryBudget = calorieBudget
      ? mealCategory === 'breakfast' ? Math.floor(calorieBudget * 0.25)
        : mealCategory === 'lunch' ? Math.floor(calorieBudget * 0.35)
          : mealCategory === 'dinner' ? Math.floor(calorieBudget * 0.35)
            : Math.floor(calorieBudget * 0.05)
      : null;

    const seasonLabels: Record<string, string> = {
      spring: 'Spring',
      summer: 'Summer',
      fall: 'Fall',
      winter: 'Winter'
    };

    const mealLabels: Record<string, string> = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      dessert: 'Dessert'
    };

    const prompt = `Generate a ${mealLabels[mealCategory]} recipe recommendation for ${seasonLabels[season] || season} season.
${categoryBudget ? `Target calories per serving: approximately ${categoryBudget} calories.` : ''}
${dietaryPreferences && dietaryPreferences.length > 0 ? `Dietary preferences: ${dietaryPreferences.join(', ')}.` : ''}
${allergies && allergies.length > 0 ? `Allergies to avoid: ${allergies.join(', ')}.` : ''}
${goals?.type ? `User goal: ${goals.type}.` : ''}

Generate a seasonal recipe that fits these parameters. Return a JSON object with:
- name: Recipe name
- description: Brief description (2-3 sentences)
- instructions: Step-by-step cooking instructions
- category: Meal category (${mealLabels[mealCategory]})
- caloriesPerServing: Estimated calories per serving (number or null)
- ingredients: Array of objects with name, quantity (optional), and unit (optional)

Make it seasonal, appropriate for ${season}, and suitable for ${mealCategory}.`;

    // Dynamic import to avoid module evaluation during build
    const { invokeLLM } = await import('./_core/llm');
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recipe_recommendation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              instructions: { type: "string" },
              category: { type: "string" },
              caloriesPerServing: { type: ["number", "null"] },
              ingredients: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    quantity: { type: ["string", "null"] },
                    unit: { type: ["string", "null"] },
                  },
                  required: ["name"],
                },
              },
            },
            required: ["name", "description", "instructions", "category", "ingredients"],
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);

    return {
      name: parsed.name,
      description: parsed.description,
      instructions: parsed.instructions,
      category: parsed.category,
      caloriesPerServing: parsed.caloriesPerServing || null,
      ingredients: parsed.ingredients || [],
    };
  } catch (error) {
    console.error(`[LLM Recommendations] Error generating ${mealCategory} recommendation:`, error);
    return null;
  }
}

/**
 * Fetch and import recipes from external sources when user doesn't have enough recipes
 */
async function fetchAndImportRecipes(userId: number, season: string, neededCategories: string[]): Promise<void> {
  const db = await getDb();
  if (!db) return; // Can't fetch if no database

  try {
    // Get user ingredients for search queries
    const userIngredients = await getUserIngredients(userId);
    const ingredientNames: string[] = [];
    for (const ui of userIngredients.slice(0, 3)) {
      const ingredient = await getIngredientById(ui.ingredientId);
      if (ingredient?.name) {
        ingredientNames.push(ingredient.name);
      }
    }

    // Get seasonal ingredients as fallback
    const { SEASONAL_KEYWORDS } = await import('./utils/seasonal');
    const seasonalIngredients = SEASONAL_KEYWORDS[season as keyof typeof SEASONAL_KEYWORDS] || [];
    let searchIngredients = ingredientNames.length > 0
      ? ingredientNames
      : seasonalIngredients.slice(0, 3);

    if (searchIngredients.length === 0) {
      // Use generic popular ingredients if no user/seasonal ingredients
      searchIngredients = ['chicken', 'tomato', 'pasta'];
    }

    // Search for recipes from TheMealDB (most reliable)
    // Prioritize category-based searches, then ingredient-based
    const categoryMap: Record<string, string> = {
      'breakfast': 'Breakfast',
      'lunch': 'Lunch',
      'dinner': 'Dinner',
      'dessert': 'Dessert',
    };

    // First, try to fetch by category for missing categories
    for (const category of neededCategories.slice(0, 2)) {
      try {
        const categoryName = categoryMap[category.toLowerCase()];
        if (!categoryName) continue;

        const searchUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(categoryName)}`;
        const response = await fetch(searchUrl);
        if (!response.ok) continue;

        const data = (await response.json()) as {
          meals: Array<{ idMeal: string; strMeal: string; strMealThumb: string }> | null;
        };

        if (!data.meals || data.meals.length === 0) continue;

        // Import up to 2 recipes per category
        const mealsToImport = data.meals.slice(0, 2);

        for (const meal of mealsToImport) {
          try {
            // Check if recipe already exists
            const existing = await db.select()
              .from(recipes as any)
              .where(and(
                eq(recipes.userId, userId),
                eq(recipes.externalId, meal.idMeal)
              ))
              .limit(1);

            if (existing.length > 0) continue; // Already imported

            // Fetch full recipe details
            const detailResponse = await fetch(
              `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(meal.idMeal)}`
            );
            if (!detailResponse.ok) continue;

            const detailData = (await detailResponse.json()) as {
              meals: Array<{
                idMeal: string;
                strMeal: string;
                strInstructions: string;
                strMealThumb: string;
                strCategory: string;
                strArea: string;
                [key: string]: unknown;
              }> | null;
            };

            if (!detailData.meals || detailData.meals.length === 0) continue;

            const mealDetail = detailData.meals[0];

            // Extract ingredients
            const ingredients = [];
            for (let i = 1; i <= 20; i++) {
              const ingredientKey = `strIngredient${i}`;
              const measureKey = `strMeasure${i}`;
              const ingredientName = mealDetail[ingredientKey] as string | undefined;
              const measure = mealDetail[measureKey] as string | undefined;

              if (ingredientName && ingredientName.trim()) {
                ingredients.push({
                  name: ingredientName.trim(),
                  quantity: measure?.split(" ")[0] || "",
                  unit: measure?.split(" ").slice(1).join(" ") || "",
                });
              }
            }

            // Create recipe
            await createRecipe({
              name: mealDetail.strMeal,
              instructions: mealDetail.strInstructions,
              imageUrl: mealDetail.strMealThumb,
              category: mealDetail.strCategory,
              cuisine: mealDetail.strArea,
              userId: userId,
              externalId: mealDetail.idMeal,
              source: "TheMealDB",
            });

            // Get the created recipe and add ingredients
            const userRecipes = await getUserRecipes(userId);
            const created = userRecipes[userRecipes.length - 1];

            if (created && ingredients.length > 0) {
              for (const ing of ingredients) {
                const ingredient = await getOrCreateIngredient(ing.name);
                await addRecipeIngredient({
                  recipeId: created.id,
                  ingredientId: ingredient.id,
                  quantity: ing.quantity,
                  unit: ing.unit,
                });
              }
            }
          } catch (error) {
            console.error(`[Recommendations] Error importing recipe ${meal.idMeal}:`, error);
            // Continue with next recipe
          }
        }
      } catch (error) {
        console.error(`[Recommendations] Error fetching recipes for category ${category}:`, error);
        // Continue with next category
      }
    }

    // If still need more recipes, search by ingredient
    if (neededCategories.length > 0) {
      for (const ingredient of searchIngredients.slice(0, 2)) {
        try {
          const searchUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`;
          const response = await fetch(searchUrl);
          if (!response.ok) continue;

          const data = (await response.json()) as {
            meals: Array<{ idMeal: string; strMeal: string; strMealThumb: string }> | null;
          };

          if (!data.meals || data.meals.length === 0) continue;

          // Import up to 1 recipe per ingredient (to avoid too many)
          const meal = data.meals[0];

          // Check if recipe already exists
          const existing = await db.select()
            .from(recipes as any)
            .where(and(
              eq(recipes.userId, userId),
              eq(recipes.externalId, meal.idMeal)
            ))
            .limit(1);

          if (existing.length > 0) continue; // Already imported

          // Fetch full recipe details
          const detailResponse = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(meal.idMeal)}`
          );
          if (!detailResponse.ok) continue;

          const detailData = (await detailResponse.json()) as {
            meals: Array<{
              idMeal: string;
              strMeal: string;
              strInstructions: string;
              strMealThumb: string;
              strCategory: string;
              strArea: string;
              [key: string]: unknown;
            }> | null;
          };

          if (!detailData.meals || detailData.meals.length === 0) continue;

          const mealDetail = detailData.meals[0];

          // Extract ingredients
          const ingredients = [];
          for (let i = 1; i <= 20; i++) {
            const ingredientKey = `strIngredient${i}`;
            const measureKey = `strMeasure${i}`;
            const ingredientName = mealDetail[ingredientKey] as string | undefined;
            const measure = mealDetail[measureKey] as string | undefined;

            if (ingredientName && ingredientName.trim()) {
              ingredients.push({
                name: ingredientName.trim(),
                quantity: measure?.split(" ")[0] || "",
                unit: measure?.split(" ").slice(1).join(" ") || "",
              });
            }
          }

          // Create recipe
          await createRecipe({
            name: mealDetail.strMeal,
            instructions: mealDetail.strInstructions,
            imageUrl: mealDetail.strMealThumb,
            category: mealDetail.strCategory,
            cuisine: mealDetail.strArea,
            userId: userId,
            externalId: mealDetail.idMeal,
            source: "TheMealDB",
          });

          // Get the created recipe and add ingredients
          const userRecipes = await getUserRecipes(userId);
          const created = userRecipes[userRecipes.length - 1];

          if (created && ingredients.length > 0) {
            for (const ing of ingredients) {
              const ingredient = await getOrCreateIngredient(ing.name);
              await addRecipeIngredient({
                recipeId: created.id,
                ingredientId: ingredient.id,
                quantity: ing.quantity,
                unit: ing.unit,
              });
            }
          }
        } catch (error) {
          console.error(`[Recommendations] Error fetching recipes for ingredient ${ingredient}:`, error);
          // Continue with next ingredient
        }
      }
    }
  } catch (error) {
    console.error("[Recommendations] Error in fetchAndImportRecipes:", error);
    // Don't throw - allow recommendations to continue with existing recipes
  }
}

/**
 * Get daily recipe recommendations with seasonal filtering and calorie budget
 * Returns one recipe per category (Breakfast, Lunch, Dinner, Dessert)
 * Automatically fetches recipes from external sources if user doesn't have enough
 */
export async function getDailyRecommendations(userId: number) {
  const safeEmpty = () => ({
    breakfast: null,
    lunch: null,
    dinner: null,
    dessert: null,
    season: getCurrentSeason(),
  });

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Recommendations] Database not available, returning empty payload");
      return safeEmpty();
    }

    // Get current season for recommendations
    const season = getCurrentSeason();

    // Get user's calorie budget and goals
    const user = await getUserById(userId);
    const calorieBudget = user?.calorieBudget || null;
    let goals: { targetCalories?: number } | null = null;
    if (user?.goals) {
      try {
        goals = JSON.parse(user.goals) as { targetCalories?: number };
      } catch {
        goals = null;
      }
    }

    // Use calorie budget from goals if not set directly, or use goal's targetCalories
    const effectiveCalorieBudget = calorieBudget || goals?.targetCalories || null;

    // Get user preferences
    const dietaryPreferences = user?.dietaryPreferences
      ? (user.dietaryPreferences.includes(',')
        ? user.dietaryPreferences.split(',').map(p => p.trim())
        : [user.dietaryPreferences])
      : null;
    const allergies = user?.allergies
      ? (user.allergies.includes(',')
        ? user.allergies.split(',').map(a => a.trim())
        : [user.allergies])
      : null;

    // Get user ingredients (gracefully handle cases where table/migration isn't available yet)
    let hasUserIngredients = false;
    try {
      const userIngredients = await getUserIngredients(userId);
      hasUserIngredients = userIngredients.length > 0;
    } catch (error) {
      console.warn("[Recommendations] Unable to load user ingredients, falling back to LLM-only flow:", error);
      hasUserIngredients = false;
    }

    // Get all user recipes
    const recipeAccessFilter = or(eq(recipes.userId, userId), eq(recipes.isShared, true));
    let allRecipes = await db.select().from(recipes).where(recipeAccessFilter);

    // If user has no ingredients/preferences and no recipes, use LLM to generate recommendations
    if (!hasUserIngredients && allRecipes.length === 0) {
      try {
        const [breakfastLLM, lunchLLM, dinnerLLM, dessertLLM] = await Promise.all([
          generateLLMRecommendations('breakfast', season, effectiveCalorieBudget, dietaryPreferences, allergies, goals),
          generateLLMRecommendations('lunch', season, effectiveCalorieBudget, dietaryPreferences, allergies, goals),
          generateLLMRecommendations('dinner', season, effectiveCalorieBudget, dietaryPreferences, allergies, goals),
          generateLLMRecommendations('dessert', season, effectiveCalorieBudget, dietaryPreferences, allergies, goals),
        ]);

        // Convert LLM recommendations to recipe-like objects that can be displayed
        const llmToRecipe = (llm: typeof breakfastLLM): typeof allRecipes[0] | null => {
          if (!llm) return null;
          // Return a recipe-like object that can be displayed (without saving to DB)
          return {
            id: -1, // Temporary ID to indicate it's an LLM-generated recipe
            userId,
            name: llm.name,
            description: llm.description,
            instructions: llm.instructions,
            category: llm.category,
            caloriesPerServing: llm.caloriesPerServing,
            imageUrl: null,
            cuisine: null,
            cookingTime: null,
            servings: null,
            isFavorite: false,
            source: 'LLM',
            sourceUrl: null,
            externalId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as typeof allRecipes[0];
        };

        return {
          breakfast: llmToRecipe(breakfastLLM),
          lunch: llmToRecipe(lunchLLM),
          dinner: llmToRecipe(dinnerLLM),
          dessert: llmToRecipe(dessertLLM),
          season,
        };
      } catch (error) {
        console.error("[Recommendations] Error generating LLM recommendations:", error);
        // Fall through to return empty recommendations
        return {
          breakfast: null,
          lunch: null,
          dinner: null,
          dessert: null,
          season,
        };
      }
    }

    // If user has very few recipes (< 4) but has ingredients, try to fetch some from external sources
    if (allRecipes.length < 4 && hasUserIngredients) {
      // Determine which categories are missing
      const hasBreakfast = allRecipes.some(r =>
        r.category?.toLowerCase().includes('breakfast') ||
        r.category?.toLowerCase().includes('morning')
      );
      const hasLunch = allRecipes.some(r =>
        r.category?.toLowerCase().includes('lunch') ||
        r.category?.toLowerCase().includes('midday')
      );
      const hasDinner = allRecipes.some(r =>
        r.category?.toLowerCase().includes('dinner') ||
        r.category?.toLowerCase().includes('main')
      );
      const hasDessert = allRecipes.some(r =>
        r.category?.toLowerCase().includes('dessert') ||
        r.category?.toLowerCase().includes('sweet')
      );

      const neededCategories: string[] = [];
      if (!hasBreakfast) neededCategories.push('breakfast');
      if (!hasLunch) neededCategories.push('lunch');
      if (!hasDinner) neededCategories.push('dinner');
      if (!hasDessert && allRecipes.length < 3) neededCategories.push('dessert');

      // Fetch and import recipes (don't await - run in background)
      if (neededCategories.length > 0 || allRecipes.length === 0) {
        fetchAndImportRecipes(userId, season, neededCategories).catch(err => {
          console.error("[Recommendations] Background recipe import failed:", err);
        });

        // Wait a bit for imports, then refresh recipes
        // In production, you might want to make this async or use a queue
        await new Promise(resolve => setTimeout(resolve, 1000));
        allRecipes = await db.select().from(recipes).where(recipeAccessFilter);
      }
    }

    // If still no recipes after trying to fetch, use LLM as fallback
    if (allRecipes.length === 0) {
      try {
        const [breakfastLLM, lunchLLM, dinnerLLM, dessertLLM] = await Promise.all([
          generateLLMRecommendations('breakfast', season, effectiveCalorieBudget, dietaryPreferences, allergies, goals),
          generateLLMRecommendations('lunch', season, effectiveCalorieBudget, dietaryPreferences, allergies, goals),
          generateLLMRecommendations('dinner', season, effectiveCalorieBudget, dietaryPreferences, allergies, goals),
          generateLLMRecommendations('dessert', season, effectiveCalorieBudget, dietaryPreferences, allergies, goals),
        ]);

        const llmToRecipe = (llm: typeof breakfastLLM): typeof allRecipes[0] | null => {
          if (!llm) return null;
          return {
            id: -1,
            userId,
            name: llm.name,
            description: llm.description,
            instructions: llm.instructions,
            category: llm.category,
            caloriesPerServing: llm.caloriesPerServing,
            imageUrl: null,
            cuisine: null,
            cookingTime: null,
            servings: null,
            isFavorite: false,
            source: 'LLM',
            sourceUrl: null,
            externalId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as typeof allRecipes[0];
        };

        return {
          breakfast: llmToRecipe(breakfastLLM),
          lunch: llmToRecipe(lunchLLM),
          dinner: llmToRecipe(dinnerLLM),
          dessert: llmToRecipe(dessertLLM),
          season,
        };
      } catch (error) {
        console.error("[Recommendations] Error generating LLM recommendations:", error);
        return {
          breakfast: null,
          lunch: null,
          dinner: null,
          dessert: null,
          season,
        };
      }
    }

    // Helper function to check if a recipe matches a category (check category, name, and tags)
    const matchesCategory = (recipe: typeof allRecipes[0], keywords: string[], strict = false): boolean => {
      const categoryLower = (recipe.category || '').toLowerCase();
      const nameLower = (recipe.name || '').toLowerCase();
      const tagsLower = ((recipe as any).tags || []).map((t: string) => t.toLowerCase());
      const categoriesLower = ((recipe as any).categories || []).map((c: string) => c.toLowerCase());

      // Check all text fields for keyword matches
      const allText = [categoryLower, nameLower, ...tagsLower, ...categoriesLower].join(' ');

      if (strict) {
        // For strict matching, require the keyword in category, tags, or categories (not just name)
        return keywords.some(keyword =>
          categoryLower.includes(keyword) ||
          tagsLower.some((t: string) => t.includes(keyword)) ||
          categoriesLower.some((c: string) => c.includes(keyword))
        );
      }

      return keywords.some(keyword => allText.includes(keyword));
    };

    // Helper function to check if two recipes are too similar
    const areSimilar = (a: typeof allRecipes[0] | null, b: typeof allRecipes[0] | null): boolean => {
      if (!a || !b) return false;

      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();

      // Check for similar main ingredients in name
      const mainIngredients = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'tofu', 'pasta', 'rice', 'potato', 'egg'];
      const aIngredients = mainIngredients.filter(ing => nameA.includes(ing));
      const bIngredients = mainIngredients.filter(ing => nameB.includes(ing));

      // If both recipes share a main ingredient, they're similar
      if (aIngredients.some(ing => bIngredients.includes(ing))) return true;

      // Check for similar cuisine styles
      const cuisines = ['mexican', 'italian', 'asian', 'indian', 'thai', 'chinese', 'japanese', 'mediterranean'];
      const aCuisine = (a.cuisine || '').toLowerCase();
      const bCuisine = (b.cuisine || '').toLowerCase();
      if (aCuisine && aCuisine === bCuisine) return true;

      // Check for similar dish types in name
      const dishTypes = ['soup', 'stew', 'salad', 'sandwich', 'curry', 'stir fry', 'casserole', 'bowl'];
      const aDishType = dishTypes.find(type => nameA.includes(type));
      const bDishType = dishTypes.find(type => nameB.includes(type));
      if (aDishType && aDishType === bDishType) return true;

      return false;
    };

    // Helper to filter recipes by calorie range (with flexibility)
    const filterByCalories = (recipes: typeof allRecipes, maxCalories: number) => {
      const minCalories = Math.floor(maxCalories * 0.5); // Allow recipes up to 50% less
      const maxCal = Math.floor(maxCalories * 1.2); // Allow up to 20% more
      return recipes.filter(r => {
        if (!r.caloriesPerServing) return true; // Include recipes without calorie data
        return r.caloriesPerServing >= minCalories && r.caloriesPerServing <= maxCal;
      });
    };

    // Get recipes by category - breakfast is strict, others are more flexible
    // Breakfast keywords - expanded list with common breakfast foods
    const breakfastKeywords = [
      'breakfast', 'morning', 'brunch', 'pancake', 'waffle', 'cereal', 'oatmeal',
      'egg', 'omelet', 'omelette', 'scramble', 'french toast', 'bagel', 'muffin',
      'bacon', 'sausage', 'hash', 'smoothie', 'granola', 'yogurt', 'toast'
    ];

    // First pass: strict breakfast matching (must have breakfast-related category/tag)
    let breakfastAll = allRecipes.filter(r =>
      matchesCategory(r, ['breakfast', 'morning', 'brunch'], true)
    );

    // If no strict matches, use flexible matching but exclude dinner-like dishes
    if (breakfastAll.length === 0) {
      breakfastAll = allRecipes.filter(r => {
        const name = (r.name || '').toLowerCase();
        // Must match a breakfast keyword
        const hasBreakfastWord = breakfastKeywords.some(kw => name.includes(kw));
        // Must NOT be obviously a dinner dish
        const dinnerWords = ['dinner', 'supper', 'steak', 'roast', 'curry', 'stew'];
        const isDinner = dinnerWords.some(kw => name.includes(kw));
        return hasBreakfastWord && !isDinner;
      });
    }

    // Side dishes and light items that should NOT be dinner mains
    const sideDishKeywords = ['slaw', 'salad', 'coleslaw', 'side', 'dip', 'appetizer', 'snack', 'dressing', 'sauce', 'garnish'];

    // Check if recipe is likely a side dish (not a main course)
    const isSideDish = (recipe: typeof allRecipes[0]): boolean => {
      const name = (recipe.name || '').toLowerCase();
      return sideDishKeywords.some(kw => name.includes(kw));
    };

    const lunchAll = allRecipes.filter(r =>
      matchesCategory(r, ['lunch', 'midday', 'sandwich', 'salad', 'soup', 'wrap', 'bowl', 'light']) ||
      // Also include uncategorized salads/slaws in lunch
      (!r.category && isSideDish(r))
    );

    const dinnerAll = allRecipes.filter(r => {
      const name = (r.name || '').toLowerCase();
      // Explicit dinner category match
      if (matchesCategory(r, ['dinner', 'main', 'entree', 'supper', 'evening', 'roast', 'steak', 'curry', 'stew'])) {
        return true;
      }
      // For uncategorized recipes: only include if NOT breakfast AND NOT a side dish
      if (!r.category) {
        const isBreakfast = breakfastKeywords.some(kw => name.includes(kw));
        const isSide = isSideDish(r);
        return !isBreakfast && !isSide;
      }
      return false;
    });

    const dessertAll = allRecipes.filter(r =>
      matchesCategory(r, ['dessert', 'sweet', 'treat', 'cake', 'cookie', 'pie', 'ice cream', 'chocolate', 'pudding', 'brownie'])
    );

    // Remove duplicates (a recipe can only be in one category)
    const usedIds = new Set<number>();
    const breakfastRecipes = breakfastAll.filter(r => {
      if (usedIds.has(r.id)) return false;
      usedIds.add(r.id);
      return true;
    });
    const lunchRecipes = lunchAll.filter(r => {
      if (usedIds.has(r.id)) return false;
      usedIds.add(r.id);
      return true;
    });
    const dinnerRecipes = dinnerAll.filter(r => {
      if (usedIds.has(r.id)) return false;
      usedIds.add(r.id);
      return true;
    });
    const dessertRecipes = dessertAll.filter(r => {
      if (usedIds.has(r.id)) return false;
      usedIds.add(r.id);
      return true;
    });

    // Apply calorie filtering if budget is set
    let filteredBreakfast = breakfastRecipes;
    let filteredLunch = lunchRecipes;
    let filteredDinner = dinnerRecipes;
    let filteredDessert = dessertRecipes;

    if (effectiveCalorieBudget) {
      const breakfastBudget = Math.floor(effectiveCalorieBudget * 0.25);
      const lunchBudget = Math.floor(effectiveCalorieBudget * 0.35);
      const dinnerBudget = Math.floor(effectiveCalorieBudget * 0.35);
      const dessertBudget = Math.floor(effectiveCalorieBudget * 0.05);

      filteredBreakfast = filterByCalories(breakfastRecipes, breakfastBudget);
      if (filteredBreakfast.length === 0) filteredBreakfast = breakfastRecipes;

      filteredLunch = filterByCalories(lunchRecipes, lunchBudget);
      if (filteredLunch.length === 0) filteredLunch = lunchRecipes;

      filteredDinner = filterByCalories(dinnerRecipes, dinnerBudget);
      if (filteredDinner.length === 0) filteredDinner = dinnerRecipes;

      filteredDessert = filterByCalories(dessertRecipes, dessertBudget);
      if (filteredDessert.length === 0) filteredDessert = dessertRecipes;
    }

    // Helper function to get a random recipe from a filtered list
    const getRandomRecipe = (filtered: typeof allRecipes): typeof allRecipes[0] | null => {
      if (filtered.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * filtered.length);
      return filtered[randomIndex];
    };

    // Helper function to get best seasonal recipe from a filtered list
    const getBestSeasonalRecipe = (filtered: typeof allRecipes): typeof allRecipes[0] | null => {
      if (filtered.length === 0) return null;

      // Score all recipes by seasonality
      const scored = filtered.map(recipe => ({
        recipe,
        score: getSeasonalScore(recipe, season),
      }));

      // Sort by score (highest first)
      scored.sort((a, b) => b.score - a.score);

      // Return the top seasonal recipe, or random if scores are similar
      const topScore = scored[0]?.score || 0;
      const topRecipes = scored.filter(s => s.score >= topScore * 0.7); // Within 30% of top score

      const randomIndex = Math.floor(Math.random() * topRecipes.length);
      return topRecipes[randomIndex]?.recipe || null;
    };

    // Helper to get a recipe that's not similar to already selected ones
    const getNonSimilarRecipe = (
      pool: typeof allRecipes,
      selectedRecipes: (typeof allRecipes[0] | null)[]
    ): typeof allRecipes[0] | null => {
      // First try to find a non-similar recipe
      const nonSimilar = pool.filter(r =>
        !selectedRecipes.some(selected => areSimilar(r, selected))
      );

      if (nonSimilar.length > 0) {
        return getBestSeasonalRecipe(nonSimilar) || getRandomRecipe(nonSimilar);
      }

      // Fall back to any recipe from the pool
      return getBestSeasonalRecipe(pool) || getRandomRecipe(pool);
    };

    // Select recommendations sequentially to avoid similar recipes
    const selectedRecipes: (typeof allRecipes[0] | null)[] = [];
    const selectedIds = new Set<number>();

    // 1. Select breakfast (only from breakfast pool - no fallback to other categories)
    const breakfast = getNonSimilarRecipe(filteredBreakfast, selectedRecipes);
    if (breakfast) {
      selectedRecipes.push(breakfast);
      selectedIds.add(breakfast.id);
    }

    // 2. Select lunch (avoid similar to breakfast)
    const lunchPool = filteredLunch.filter(r => !selectedIds.has(r.id));
    const lunch = getNonSimilarRecipe(lunchPool, selectedRecipes);
    if (lunch) {
      selectedRecipes.push(lunch);
      selectedIds.add(lunch.id);
    }

    // 3. Select dinner (avoid similar to breakfast and lunch)
    const dinnerPool = filteredDinner.filter(r => !selectedIds.has(r.id));
    const dinner = getNonSimilarRecipe(dinnerPool, selectedRecipes);
    if (dinner) {
      selectedRecipes.push(dinner);
      selectedIds.add(dinner.id);
    }

    // 4. Select dessert (usually different enough, but still check)
    const dessertPool = filteredDessert.filter(r => !selectedIds.has(r.id));
    const dessert = getNonSimilarRecipe(dessertPool, selectedRecipes);
    if (dessert) {
      selectedRecipes.push(dessert);
      selectedIds.add(dessert.id);
    }

    // Smart fallback for lunch/dinner only (breakfast should stay breakfast-appropriate)
    // If we're missing lunch, try to find something from dinner pool
    let fallbackLunch = lunch;
    if (!lunch && dinnerPool.length > 0) {
      const remaining = dinnerPool.filter(r => !selectedIds.has(r.id));
      fallbackLunch = getNonSimilarRecipe(remaining, selectedRecipes);
      if (fallbackLunch) {
        selectedIds.add(fallbackLunch.id);
        selectedRecipes.push(fallbackLunch);
      }
    }

    // If we're missing dinner, try remaining recipes
    let fallbackDinner = dinner;
    if (!dinner) {
      const remaining = allRecipes.filter(r =>
        !selectedIds.has(r.id) &&
        !breakfastKeywords.some(kw => (r.name || '').toLowerCase().includes(kw))
      );
      fallbackDinner = getNonSimilarRecipe(remaining, selectedRecipes);
      if (fallbackDinner) {
        selectedIds.add(fallbackDinner.id);
        selectedRecipes.push(fallbackDinner);
      }
    }

    // Keep breakfast as-is (null if no breakfast recipes found - don't fill with non-breakfast)
    const fallbackBreakfast = breakfast;
    const fallbackDessert = dessert;

    return {
      breakfast: fallbackBreakfast,
      lunch: fallbackLunch,
      dinner: fallbackDinner,
      dessert: fallbackDessert,
      season,
    };
  } catch (error) {
    console.error("[Recommendations] Unexpected error:", error);
    return safeEmpty();
  }
}

// Ingredient queries
export async function getOrCreateIngredient(name: string, category?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(ingredients).where(eq(ingredients.name, name)).limit(1);
  if (existing.length > 0) return existing[0];

  await db.insert(ingredients).values({ name, category });
  const created = await db.select().from(ingredients).where(eq(ingredients.name, name)).limit(1);
  return created[0];
}

export async function getAllIngredients() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(ingredients);
}

export async function getIngredientById(ingredientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(ingredients).where(eq(ingredients.id, ingredientId)).limit(1);
  return result[0];
}

export async function updateIngredientImage(ingredientId: number, imageUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(ingredients).set({ imageUrl }).where(eq(ingredients.id, ingredientId));
}

// Recipe ingredients queries
export async function addRecipeIngredient(recipeIngredient: InsertRecipeIngredient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(recipeIngredients).values(recipeIngredient);
}

export async function getRecipeIngredients(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select({
    id: recipeIngredients.id,
    recipeId: recipeIngredients.recipeId,
    ingredientId: recipeIngredients.ingredientId,
    quantity: recipeIngredients.quantity,
    unit: recipeIngredients.unit,
    name: ingredients.name,
    category: ingredients.category,
    imageUrl: ingredients.imageUrl,
    createdAt: recipeIngredients.createdAt,
  })
    .from(recipeIngredients)
    .leftJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(eq(recipeIngredients.recipeId, recipeId));
}

/**
 * Get all ingredients for a recipe from both:
 * 1. The recipe_ingredients junction table (for manually added recipes)
 * 2. The ingredients JSONB column (for imported recipes)
 * 
 * Returns a unified format suitable for adding to shopping lists.
 */
export async function getAllRecipeIngredients(recipeId: number): Promise<Array<{
  ingredientId: number;
  ingredientName: string;
  quantity: string | null;
  unit: string | null;
}>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result: Array<{
    ingredientId: number;
    ingredientName: string;
    quantity: string | null;
    unit: string | null;
  }> = [];

  // 1. Get ingredients from junction table
  const junctionIngredients = await db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
  const junctionIngredientIds = new Set<number>();

  for (const ri of junctionIngredients) {
    const ingredient = await getIngredientById(ri.ingredientId);
    if (ingredient) {
      junctionIngredientIds.add(ri.ingredientId);
      result.push({
        ingredientId: ri.ingredientId,
        ingredientName: ingredient.name,
        quantity: ri.quantity,
        unit: ri.unit,
      });
    }
  }

  // 2. Also check the JSONB column for any ingredients not in junction table
  // This handles cases where ingredients were saved to JSONB but not junction table
  const recipe = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  if (recipe[0] && recipe[0].ingredients) {
    const jsonbIngredients = recipe[0].ingredients as Array<{
      name?: string;
      ingredient?: string;
      raw?: string;
      quantity?: string | number | null;
      unit?: string | null;
    }>;

    for (const ing of jsonbIngredients) {
      // Check for 'name' first (new format from parseFromUrl), then fall back to 'ingredient' or 'raw' (old format)
      const ingredientName = ing.name || ing.ingredient || ing.raw || 'Unknown';
      if (ingredientName && ingredientName !== 'Unknown') {
        // Get or create the ingredient in the ingredients table
        const ingredient = await getOrCreateIngredient(ingredientName);
        
        // Only add if not already in junction table (avoid duplicates)
        if (!junctionIngredientIds.has(ingredient.id)) {
          result.push({
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: ing.quantity != null ? String(ing.quantity) : null,
            unit: ing.unit || null,
          });
        }
      }
    }
  }

  return result;
}

// User ingredients queries
export async function addUserIngredient(userIngredient: InsertUserIngredient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(userIngredients).values(userIngredient);
}

export async function getUserIngredients(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(userIngredients).where(eq(userIngredients.userId, userId));
}

export async function getUserIngredientById(userIngredientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(userIngredients).where(eq(userIngredients.id, userIngredientId)).limit(1);
  return result[0];
}

export async function deleteUserIngredient(userIngredientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(userIngredients).where(eq(userIngredients.id, userIngredientId));
}

// Shopping list queries
export async function createShoppingList(shoppingList: InsertShoppingList) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Insert the shopping list
    const result = await db.insert(shoppingLists).values(shoppingList);

    // For MySQL2 with Drizzle, the result is a ResultSetHeader
    // Access insertId from the result
    const insertId = (result as any)?.insertId || (result as any)?.[0]?.insertId;

    if (insertId) {
      // Fetch the created list using the insertId
      const created = await db.select().from(shoppingLists).where(eq(shoppingLists.id, Number(insertId))).limit(1);
      if (created[0]) {
        return created[0];
      }
    }

    // Fallback: get the most recently created list for this user
    // This is more reliable than trying to parse the insert result
    const recentLists = await db.select().from(shoppingLists)
      .where(eq(shoppingLists.userId, shoppingList.userId))
      .orderBy(desc(shoppingLists.createdAt))
      .limit(1);

    if (recentLists[0]) {
      return recentLists[0];
    }

    // If we still don't have a result, something went wrong
    throw new Error("Failed to retrieve created shopping list after insert");
  } catch (error: any) {
    console.error("Error creating shopping list:", error);
    throw new Error(error.message || "Failed to create shopping list");
  }
}

export async function getUserShoppingLists(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(shoppingLists).where(eq(shoppingLists.userId, userId));
}

export async function getShoppingListById(shoppingListId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(shoppingLists).where(eq(shoppingLists.id, shoppingListId)).limit(1);
  return result[0] || null;
}

export async function addShoppingListItem(item: InsertShoppingListItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Insert the item
    const result = await db.insert(shoppingListItems).values(item);

    // Access insertId from the result (MySQL2 ResultSetHeader format)
    const insertId = (result as any)?.insertId || (result as any)?.[0]?.insertId;

    if (insertId) {
      // Fetch the created item using the insertId
      const created = await db.select().from(shoppingListItems).where(eq(shoppingListItems.id, Number(insertId))).limit(1);
      if (created[0]) {
        return created[0];
      }
    }

    // Fallback: get the most recently created item for this list
    const recentItems = await db.select().from(shoppingListItems)
      .where(eq(shoppingListItems.shoppingListId, item.shoppingListId))
      .orderBy(desc(shoppingListItems.createdAt))
      .limit(1);

    if (recentItems[0]) {
      return recentItems[0];
    }

    throw new Error("Failed to retrieve created shopping list item");
  } catch (error: any) {
    console.error("Error adding shopping list item:", error);
    throw new Error(error.message || "Failed to add item to shopping list");
  }
}

export async function getShoppingListItems(shoppingListId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(shoppingListItems).where(eq(shoppingListItems.shoppingListId, shoppingListId));
}

export async function updateShoppingListItem(itemId: number, isChecked: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(shoppingListItems).set({ isChecked }).where(eq(shoppingListItems.id, itemId));
}

export async function updateShoppingList(shoppingListId: number, updates: { name?: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (updates.name !== undefined) {
    updateData.name = updates.name;
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No updates provided");
  }

  await db.update(shoppingLists)
    .set(updateData)
    .where(eq(shoppingLists.id, shoppingListId));

  // Return the updated list
  const updated = await db.select().from(shoppingLists).where(eq(shoppingLists.id, shoppingListId)).limit(1);
  return updated[0] || null;
}

export async function deleteShoppingList(shoppingListId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(shoppingLists).where(eq(shoppingLists.id, shoppingListId));
}

export async function getShoppingListItemById(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(shoppingListItems).where(eq(shoppingListItems.id, itemId)).limit(1);
  return result[0];
}

export async function deleteShoppingListItem(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(shoppingListItems).where(eq(shoppingListItems.id, itemId));
}

// Notification queries
export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notifications).values(notification);
}

export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select()
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
  return result.length;
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function deleteNotification(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(notifications)
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));
}

export async function upsertPushToken(userId: number, token: string, platform: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(pushTokens)
    .where(eq(pushTokens.token, token))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pushTokens)
      .set({ userId, platform, updatedAt: new Date() })
      .where(eq(pushTokens.id, existing[0].id));
    return existing[0];
  }

  await db.insert(pushTokens).values({ userId, token, platform });
}

export async function getPushTokensForUser(userId: number): Promise<PushToken[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    return await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
  } catch (error) {
    console.error(`[DB] Error fetching push tokens for user ${userId}:`, error);
    // If table doesn't exist or query fails, return empty array instead of throwing
    // This allows the app to continue functioning even if push notifications aren't set up
    return [];
  }
}

export async function deletePushToken(userId: number, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(pushTokens).where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
}

// Conversation queries
export async function getOrCreateConversation(user1Id: number, user2Id: number): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Ensure consistent ordering (smaller ID first)
  const [id1, id2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  // Try to find existing conversation
  const existing = await db.select()
    .from(conversations)
    .where(and(
      eq(conversations.user1Id, id1),
      eq(conversations.user2Id, id2)
    ))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  // Create new conversation
  await db.insert(conversations).values({
    user1Id: id1,
    user2Id: id2,
    lastMessageAt: new Date(),
  });

  const created = await db.select()
    .from(conversations)
    .where(and(
      eq(conversations.user1Id, id1),
      eq(conversations.user2Id, id2)
    ))
    .limit(1);

  if (!created[0]) {
    throw new Error("Failed to create conversation");
  }

  return created[0];
}

export async function getUserConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get conversations where user is either user1 or user2
  const allConversations = await db.select()
    .from(conversations)
    .where(or(
      eq(conversations.user1Id, userId),
      eq(conversations.user2Id, userId)
    ))
    .orderBy(desc(conversations.lastMessageAt));

  return allConversations;
}

export async function getConversationById(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select()
    .from(conversations)
    .where(and(
      eq(conversations.id, conversationId),
      or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      )
    ))
    .limit(1);

  return result[0] || null;
}

export async function updateConversationLastMessage(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

// Message queries
export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Insert message
  await db.insert(messages).values(message);

  // Update conversation's lastMessageAt
  await updateConversationLastMessage(message.conversationId);

  // Fetch the created message
  const recentMessages = await db.select()
    .from(messages)
    .where(eq(messages.conversationId, message.conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(1);

  return recentMessages[0];
}

export async function getConversationMessages(conversationId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function markMessagesAsRead(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Mark all messages in conversation as read, except those sent by the user
  return db.update(messages)
    .set({ isRead: true })
    .where(and(
      eq(messages.conversationId, conversationId),
      ne(messages.senderId, userId), // Only mark messages NOT sent by user
      eq(messages.isRead, false) // Only mark unread messages
    ));
}

export async function getUnreadMessageCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all conversations for the user
  const userConvs = await getUserConversations(userId);
  const convIds = userConvs.map(c => c.id);

  if (convIds.length === 0) return 0;

  // Count unread messages in user's conversations where user is not the sender
  // This is a simplified version - in production you'd want a more efficient query
  let totalUnread = 0;
  for (const convId of convIds) {
    const conv = await getConversationById(convId, userId);
    if (!conv) continue;

    const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
    const unread = await db.select()
      .from(messages)
      .where(and(
        eq(messages.conversationId, convId),
        eq(messages.senderId, otherUserId),
        eq(messages.isRead, false)
      ));
    totalUnread += unread.length;
  }

  return totalUnread;
}

// Subscription queries
export async function getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0];
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeCustomerId, stripeCustomerId)).limit(1);
  return result[0];
}

export async function getSubscriptionByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId)).limit(1);
  return result[0];
}

export async function upsertSubscription(data: InsertSubscription): Promise<Subscription> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Try to find existing subscription by Stripe customer ID (if provided) or user ID
  let existing: Subscription | undefined;
  if (data.stripeCustomerId) {
    existing = await getSubscriptionByStripeCustomerId(data.stripeCustomerId);
  }
  if (!existing && data.userId) {
    existing = await getSubscriptionByUserId(data.userId);
  }

  if (existing) {
    const [updated] = await db
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existing.id))
      .returning();
    return updated;
  }

  const [inserted] = await db.insert(subscriptions).values(data).returning();
  return inserted;
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: Subscription["status"],
  data?: Partial<InsertSubscription>
): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db
    .update(subscriptions)
    .set({
      status,
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .returning();

  return updated;
}

export async function cancelSubscription(stripeSubscriptionId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db
    .update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .returning();

  return updated;
}

// Payment queries
export async function createPayment(data: InsertPayment): Promise<Payment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(payments).values(data).returning();
  return inserted;
}

export async function getPaymentsByUserId(userId: number, limit?: number): Promise<Payment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let query = db
    .select()
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));

  if (limit) {
    query = query.limit(limit) as any;
  }

  return query;
}

export async function updatePaymentStatus(
  stripePaymentIntentId: string,
  status: string,
  stripeChargeId?: string
): Promise<Payment | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db
    .update(payments)
    .set({
      status,
      stripeChargeId,
      updatedAt: new Date(),
    })
    .where(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
    .returning();

  return updated;
}

// Check if user has active subscription (supports both Stripe and RevenueCat)
export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const subscription = await getSubscriptionByUserId(userId);
  if (!subscription) return false;

  const activeStatuses: Subscription["status"][] = ["active", "trialing"];

  // Check if subscription status is active
  if (!activeStatuses.includes(subscription.status)) return false;

  // For RevenueCat subscriptions, also check expiration date
  if (subscription.subscriptionPlatform === 'revenuecat_ios' && subscription.revenuecatExpirationDate) {
    const now = new Date();
    if (subscription.revenuecatExpirationDate < now) {
      return false;
    }
  }

  return true;
}

// RevenueCat-specific queries
export async function getSubscriptionByRevenueCatUserId(revenuecatAppUserId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(subscriptions).where(eq(subscriptions.revenuecatAppUserId, revenuecatAppUserId)).limit(1);
  return result[0];
}

export async function getSubscriptionByRevenueCatTransactionId(transactionId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(subscriptions).where(eq(subscriptions.revenuecatOriginalTransactionId, transactionId)).limit(1);
  return result[0];
}

export async function upsertRevenueCatSubscription(data: {
  userId: number;
  revenuecatAppUserId: string;
  revenuecatProductId: string;
  revenuecatOriginalTransactionId: string;
  revenuecatExpirationDate?: Date | null;
  status: Subscription["status"];
  priceId?: string;
}): Promise<Subscription> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Try to find existing subscription by RevenueCat user ID or user ID
  let existing = await getSubscriptionByRevenueCatUserId(data.revenuecatAppUserId);
  if (!existing) {
    existing = await getSubscriptionByUserId(data.userId);
  }

  const subscriptionData = {
    userId: data.userId,
    revenuecatAppUserId: data.revenuecatAppUserId,
    revenuecatProductId: data.revenuecatProductId,
    revenuecatOriginalTransactionId: data.revenuecatOriginalTransactionId,
    revenuecatExpirationDate: data.revenuecatExpirationDate || null,
    status: data.status,
    subscriptionPlatform: 'revenuecat_ios' as const,
    priceId: data.priceId || null,
    updatedAt: new Date(),
  };

  if (existing) {
    const [updated] = await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, existing.id))
      .returning();
    return updated;
  }

  const [inserted] = await db.insert(subscriptions).values({
    ...subscriptionData,
    stripeCustomerId: null, // RevenueCat subscriptions don't have Stripe customer IDs
  }).returning();
  return inserted;
}

export async function updateRevenueCatSubscriptionStatus(
  revenuecatAppUserId: string,
  status: Subscription["status"],
  expirationDate?: Date | null
): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };

  if (expirationDate !== undefined) {
    updateData.revenuecatExpirationDate = expirationDate;
  }

  const [updated] = await db
    .update(subscriptions)
    .set(updateData)
    .where(eq(subscriptions.revenuecatAppUserId, revenuecatAppUserId))
    .returning();

  return updated;
}
