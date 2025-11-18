import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, User, users, recipes, InsertRecipe, ingredients, InsertIngredient, Ingredient, recipeIngredients, InsertRecipeIngredient, userIngredients, InsertUserIngredient, shoppingLists, InsertShoppingList, shoppingListItems, InsertShoppingListItem } from "drizzle/schema";
import { ENV } from './_core/env';

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

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

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
