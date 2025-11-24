import { eq, desc, and, or, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users, recipes, InsertRecipe, ingredients, InsertIngredient, Ingredient, recipeIngredients, InsertRecipeIngredient, userIngredients, InsertUserIngredient, shoppingLists, InsertShoppingList, shoppingListItems, InsertShoppingListItem, notifications, InsertNotification, Notification, conversations, InsertConversation, Conversation, messages, InsertMessage, Message } from "../drizzle/schema";
import { ENV } from './_core/env';
import { getCurrentSeason, getSeasonalScore } from './utils/seasonal';

let _db: ReturnType<typeof drizzle> | null = null;

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
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
  
  // Try to get existing anonymous user
  let user = await getUserByOpenId(ANONYMOUS_OPENID);
  
  if (!user) {
    // Create anonymous user
    await upsertUser({
      openId: ANONYMOUS_OPENID,
      name: "Guest User",
      email: null,
      loginMethod: "anonymous",
      lastSignedIn: new Date(),
    });
    user = await getUserByOpenId(ANONYMOUS_OPENID);
  }
  
  if (!user) {
    throw new Error("Failed to create anonymous user");
  }
  
  return user;
}

// Recipe queries
export async function createRecipe(recipe: InsertRecipe) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(recipes).values(recipe);
}

export async function getUserRecipes(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(recipes).where(eq(recipes.userId, userId));
}

export async function getRecipeById(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
  return result[0];
}

export async function updateRecipeFavorite(recipeId: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(recipes).set({ isFavorite }).where(eq(recipes.id, recipeId));
}

export async function deleteRecipe(recipeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(recipes).where(eq(recipes.id, recipeId));
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
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
  
  // Get all user recipes
  let allRecipes = await db.select().from(recipes).where(eq(recipes.userId, userId));
  
  // If user has very few recipes (< 4), try to fetch some from external sources
  if (allRecipes.length < 4) {
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
      allRecipes = await db.select().from(recipes).where(eq(recipes.userId, userId));
    }
  }
  
  if (allRecipes.length === 0) {
    return {
      breakfast: null,
      lunch: null,
      dinner: null,
      dessert: null,
      season,
    };
  }
  
  // Helper function to check if a recipe matches a category (more flexible matching)
  const matchesCategory = (recipe: typeof allRecipes[0], keywords: string[]): boolean => {
    if (!recipe.category) return false;
    const categoryLower = recipe.category.toLowerCase();
    return keywords.some(keyword => categoryLower.includes(keyword));
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
  
  // Get recipes by category (more flexible matching)
  const breakfastAll = allRecipes.filter(r => 
    matchesCategory(r, ['breakfast', 'morning', 'brunch', 'pancake', 'waffle', 'cereal', 'oatmeal'])
  );
  const lunchAll = allRecipes.filter(r => 
    matchesCategory(r, ['lunch', 'midday', 'sandwich', 'salad', 'soup'])
  );
  const dinnerAll = allRecipes.filter(r => 
    matchesCategory(r, ['dinner', 'main', 'entree', 'supper', 'evening']) ||
    (!r.category) // Default uncategorized recipes to dinner
  );
  const dessertAll = allRecipes.filter(r => 
    matchesCategory(r, ['dessert', 'sweet', 'treat', 'cake', 'cookie', 'pie', 'ice cream'])
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
  
  // Select recommendations (prefer seasonal, fallback to any)
  const breakfast = getBestSeasonalRecipe(filteredBreakfast) || getRandomRecipe(filteredBreakfast);
  const lunch = getBestSeasonalRecipe(filteredLunch) || getRandomRecipe(filteredLunch);
  const dinner = getBestSeasonalRecipe(filteredDinner) || getRandomRecipe(filteredDinner);
  const dessert = getBestSeasonalRecipe(filteredDessert) || getRandomRecipe(filteredDessert);
  
  // Smart fallback: if we don't have enough recipes for all categories, intelligently distribute them
  const selectedIds = new Set<number>();
  if (breakfast) selectedIds.add(breakfast.id);
  if (lunch) selectedIds.add(lunch.id);
  if (dinner) selectedIds.add(dinner.id);
  if (dessert) selectedIds.add(dessert.id);
  
  const availableRecipes = allRecipes.filter(r => !selectedIds.has(r.id));
  
  // Fill missing slots with any available recipe (prioritize seasonal)
  const fallbackBreakfast = breakfast || (availableRecipes.length > 0 ? getBestSeasonalRecipe(availableRecipes) || getRandomRecipe(availableRecipes) : null);
  if (fallbackBreakfast) selectedIds.add(fallbackBreakfast.id);
  
  const remainingForLunch = allRecipes.filter(r => !selectedIds.has(r.id));
  const fallbackLunch = lunch || (remainingForLunch.length > 0 ? getBestSeasonalRecipe(remainingForLunch) || getRandomRecipe(remainingForLunch) : null);
  if (fallbackLunch) selectedIds.add(fallbackLunch.id);
  
  const remainingForDinner = allRecipes.filter(r => !selectedIds.has(r.id));
  const fallbackDinner = dinner || (remainingForDinner.length > 0 ? getBestSeasonalRecipe(remainingForDinner) || getRandomRecipe(remainingForDinner) : null);
  if (fallbackDinner) selectedIds.add(fallbackDinner.id);
  
  const remainingForDessert = allRecipes.filter(r => !selectedIds.has(r.id));
  const fallbackDessert = dessert || (remainingForDessert.length > 0 ? getBestSeasonalRecipe(remainingForDessert) || getRandomRecipe(remainingForDessert) : null);
  
  return {
    breakfast: fallbackBreakfast,
    lunch: fallbackLunch,
    dinner: fallbackDinner,
    dessert: fallbackDessert,
    season,
  };
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
  return db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
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
