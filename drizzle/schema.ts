import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Recipes table - stores recipes from TheMealDB or user imports
 */
export const recipes = mysqlTable("recipes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  /** External API ID (e.g., from TheMealDB) */
  externalId: varchar("externalId", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  imageUrl: text("imageUrl"),
  /** Cuisine type (e.g., Italian, Mexican, etc.) */
  cuisine: varchar("cuisine", { length: 100 }),
  /** Meal category (e.g., Breakfast, Lunch, Dinner, Dessert) */
  category: varchar("category", { length: 100 }),
  /** Cooking time in minutes */
  cookingTime: int("cookingTime"),
  /** Number of servings */
  servings: int("servings"),
  /** Source URL if imported */
  sourceUrl: text("sourceUrl"),
  /** Source name (e.g., 'TheMealDB', 'User Import') */
  source: varchar("source", { length: 100 }).default("user_import"),
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  externalIdIdx: index("externalId_idx").on(table.externalId),
  cuisineIdx: index("cuisine_idx").on(table.cuisine),
  categoryIdx: index("category_idx").on(table.category),
  isFavoriteIdx: index("isFavorite_idx").on(table.isFavorite),
}));

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = typeof recipes.$inferInsert;

/**
 * Ingredients table - stores individual ingredients
 */
export const ingredients = mysqlTable("ingredients", {
  id: int("id").autoincrement().primaryKey(),
  /** Standardized ingredient name */
  name: varchar("name", { length: 255 }).notNull().unique(),
  /** Category (e.g., Vegetable, Fruit, Meat, Dairy) */
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = typeof ingredients.$inferInsert;

/**
 * Recipe ingredients junction table - links recipes to ingredients with quantities
 */
export const recipeIngredients = mysqlTable("recipe_ingredients", {
  id: int("id").autoincrement().primaryKey(),
  recipeId: int("recipeId").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: int("ingredientId").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  /** Quantity as a string (e.g., "2", "1.5", "to taste") */
  quantity: varchar("quantity", { length: 100 }),
  /** Unit of measurement (e.g., "cups", "tbsp", "g") */
  unit: varchar("unit", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  recipeIdIdx: index("recipeId_idx").on(table.recipeId),
  ingredientIdIdx: index("ingredientId_idx").on(table.ingredientId),
}));

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = typeof recipeIngredients.$inferInsert;

/**
 * User ingredients - tracks ingredients the user has on hand
 */
export const userIngredients = mysqlTable("user_ingredients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  ingredientId: int("ingredientId").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  /** Optional quantity the user has */
  quantity: varchar("quantity", { length: 100 }),
  /** Optional unit */
  unit: varchar("unit", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userIngredients_userId_idx").on(table.userId),
  ingredientIdIdx: index("userIngredients_ingredientId_idx").on(table.ingredientId),
}));

export type UserIngredient = typeof userIngredients.$inferSelect;
export type InsertUserIngredient = typeof userIngredients.$inferInsert;

/**
 * Shopping lists - stores shopping lists created by users
 */
export const shoppingLists = mysqlTable("shopping_lists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("shoppingLists_userId_idx").on(table.userId),
}));

export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = typeof shoppingLists.$inferInsert;

/**
 * Shopping list items - ingredients in a shopping list
 */
export const shoppingListItems = mysqlTable("shopping_list_items", {
  id: int("id").autoincrement().primaryKey(),
  shoppingListId: int("shoppingListId").notNull().references(() => shoppingLists.id, { onDelete: "cascade" }),
  ingredientId: int("ingredientId").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: varchar("quantity", { length: 100 }),
  unit: varchar("unit", { length: 50 }),
  isChecked: boolean("isChecked").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  shoppingListIdIdx: index("shoppingListItems_shoppingListId_idx").on(table.shoppingListId),
  ingredientIdIdx: index("shoppingListItems_ingredientId_idx").on(table.ingredientId),
}));

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertShoppingListItem = typeof shoppingListItems.$inferInsert;