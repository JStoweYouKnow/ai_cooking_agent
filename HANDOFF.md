# AI Cooking Agent - Session Handoff Instructions

## Project Overview

The AI Cooking Agent is a full-stack web application that allows users to:
- Input ingredients (via text, image upload, or search)
- Find recipes using the TheMealDB API
- Import recipes from external sources
- Generate and export shopping lists (PDF, CSV, text)
- Manage favorite recipes and personal ingredient inventory

**Project Path:** `/home/ubuntu/ai_cooking_agent`  
**Tech Stack:** React 19 + Tailwind 4 + Express 4 + tRPC 11 + MySQL + Manus OAuth  
**Dev Server:** Running on port 3000 (https://3000-i75bnj876xw73gfw266q3-e48eebb1.manus-asia.computer)

---

## Current Project Status

### Completed Work
1. ✅ Project initialized with full-stack scaffolding (server, db, user features)
2. ✅ Development server running and ready for development
3. ✅ Basic project structure created with tRPC, authentication, and database setup
4. ✅ Initial todo.md created to track all features

### Current Phase
**Phase 3: Design database schema for recipes, ingredients, and shopping lists**

The database schema update was in progress when the session limit was approached. The schema file (`drizzle/schema.ts`) needs to be updated with the following tables.

---

## Next Steps to Continue Development

### Step 1: Complete Database Schema (CRITICAL - Do This First)

**File to edit:** `/home/ubuntu/ai_cooking_agent/drizzle/schema.ts`

**What to do:**
Replace the comment `// TODO: Add your tables here` with the following complete schema:

```typescript
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
});

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
});

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
});

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
});

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
});

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertShoppingListItem = typeof shoppingListItems.$inferInsert;
```

**After adding the schema:**
```bash
cd /home/ubuntu/ai_cooking_agent
pnpm db:push
```

This command will generate migrations and push the schema to the database.

### Step 2: Create Database Query Helpers

**File to edit:** `/home/ubuntu/ai_cooking_agent/server/db.ts`

**What to add:** Add these helper functions after the existing `getUserByOpenId` function:

```typescript
// Recipe queries
export async function createRecipe(recipe: InsertRecipe) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(recipes).values(recipe);
  return result;
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

// Ingredient queries
export async function getOrCreateIngredient(name: string, category?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(ingredients).where(eq(ingredients.name, name)).limit(1);
  if (existing.length > 0) return existing[0];
  
  const result = await db.insert(ingredients).values({ name, category });
  return { id: result.insertId, name, category, createdAt: new Date() };
}

export async function getAllIngredients() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(ingredients);
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

export async function deleteUserIngredient(userIngredientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(userIngredients).where(eq(userIngredients.id, userIngredientId));
}

// Shopping list queries
export async function createShoppingList(shoppingList: InsertShoppingList) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(shoppingLists).values(shoppingList);
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
  return result[0];
}

export async function addShoppingListItem(item: InsertShoppingListItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(shoppingListItems).values(item);
}

export async function getShoppingListItems(shoppingListId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(shoppingListItems).where(eq(shoppingListItems.shoppingListId, shoppingListId));
}

export async function deleteShoppingList(shoppingListId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(shoppingLists).where(eq(shoppingLists.id, shoppingListId));
}
```

### Step 3: Create tRPC Routers

**File to edit:** `/home/ubuntu/ai_cooking_agent/server/routers.ts`

**What to add:** Create feature routers for recipes, ingredients, and shopping lists. Replace the TODO comment with:

```typescript
import { protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Recipe router
const recipeRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getUserRecipes(ctx.user.id)),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => db.getRecipeById(input.id)),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      instructions: z.string().optional(),
      imageUrl: z.string().optional(),
      cuisine: z.string().optional(),
      category: z.string().optional(),
      cookingTime: z.number().optional(),
      servings: z.number().optional(),
      sourceUrl: z.string().optional(),
      source: z.string().default("user_import"),
    }))
    .mutation(({ ctx, input }) => 
      db.createRecipe({ ...input, userId: ctx.user.id })
    ),
  
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.number(), isFavorite: z.boolean() }))
    .mutation(({ input }) => {
      // TODO: Implement favorite toggle
      return { success: true };
    }),
});

// Ingredient router
const ingredientRouter = router({
  list: protectedProcedure.query(() => db.getAllIngredients()),
  
  getOrCreate: protectedProcedure
    .input(z.object({ name: z.string(), category: z.string().optional() }))
    .mutation(({ input }) => db.getOrCreateIngredient(input.name, input.category)),
  
  addToUserList: protectedProcedure
    .input(z.object({
      ingredientId: z.number(),
      quantity: z.string().optional(),
      unit: z.string().optional(),
    }))
    .mutation(({ ctx, input }) =>
      db.addUserIngredient({
        userId: ctx.user.id,
        ingredientId: input.ingredientId,
        quantity: input.quantity,
        unit: input.unit,
      })
    ),
  
  getUserIngredients: protectedProcedure.query(({ ctx }) =>
    db.getUserIngredients(ctx.user.id)
  ),
  
  removeFromUserList: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteUserIngredient(input.id)),
});

// Shopping list router
const shoppingListRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    db.getUserShoppingLists(ctx.user.id)
  ),
  
  create: protectedProcedure
    .input(z.object({ name: z.string(), description: z.string().optional() }))
    .mutation(({ ctx, input }) =>
      db.createShoppingList({ ...input, userId: ctx.user.id })
    ),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => db.getShoppingListById(input.id)),
  
  getItems: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => db.getShoppingListItems(input.id)),
  
  addItem: protectedProcedure
    .input(z.object({
      shoppingListId: z.number(),
      ingredientId: z.number(),
      quantity: z.string().optional(),
      unit: z.string().optional(),
    }))
    .mutation(({ input }) =>
      db.addShoppingListItem({
        shoppingListId: input.shoppingListId,
        ingredientId: input.ingredientId,
        quantity: input.quantity,
        unit: input.unit,
      })
    ),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => db.deleteShoppingList(input.id)),
});

// Add these routers to the main appRouter
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  recipes: recipeRouter,
  ingredients: ingredientRouter,
  shoppingLists: shoppingListRouter,
});
```

### Step 4: Build Frontend Pages

Create the following pages in `/home/ubuntu/ai_cooking_agent/client/src/pages/`:

1. **IngredientsPage.tsx** - Manage ingredients (add, remove, view)
2. **RecipeSearchPage.tsx** - Search recipes by ingredients using TheMealDB
3. **RecipeImportPage.tsx** - Import recipes from URLs or JSON
4. **RecipeDetailPage.tsx** - View full recipe details
5. **ShoppingListPage.tsx** - Create and manage shopping lists
6. **DashboardPage.tsx** - Main dashboard with navigation

### Step 5: Update App.tsx Routes

Add routes for all new pages in `/home/ubuntu/ai_cooking_agent/client/src/App.tsx`

### Step 6: Implement LLM Integration for Image Recognition

Add ingredient recognition from images using the LLM vision capability in `server/routers.ts`:

```typescript
import { invokeLLM } from "./server/_core/llm";

// In ingredientRouter:
recognizeFromImage: protectedProcedure
  .input(z.object({ imageUrl: z.string() }))
  .mutation(async ({ input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: input.imageUrl },
            },
            {
              type: "text",
              text: "List all the ingredients you can see in this image. Return as a JSON array of ingredient names.",
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ingredients_list",
          strict: true,
          schema: {
            type: "object",
            properties: {
              ingredients: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["ingredients"],
          },
        },
      },
    });
    // Parse and return ingredients
    return JSON.parse(response.choices[0].message.content);
  }),
```

### Step 7: Implement TheMealDB API Integration

Add recipe search in `server/routers.ts`:

```typescript
// In recipeRouter:
searchByIngredients: publicProcedure
  .input(z.object({ ingredients: z.array(z.string()) }))
  .query(async ({ input }) => {
    const results = [];
    for (const ingredient of input.ingredients) {
      const response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
      );
      const data = await response.json();
      if (data.meals) {
        results.push(...data.meals);
      }
    }
    return results;
  }),
```

---

## Important Notes

1. **Database Migrations:** After updating `drizzle/schema.ts`, always run `pnpm db:push` to apply migrations.

2. **Environment Variables:** All necessary environment variables are automatically injected by the Manus platform. No manual `.env` file setup is needed.

3. **Authentication:** The project uses Manus OAuth. All protected procedures automatically have access to `ctx.user` which contains the authenticated user's information.

4. **File Storage:** Use the `storagePut` helper from `server/storage.ts` for storing user-uploaded images. Never store file bytes in the database.

5. **TheMealDB API:** The free tier allows searching by single ingredients. For multi-ingredient filtering, a premium API key is needed (or implement client-side filtering).

6. **Testing:** After each major feature, test in the browser at https://3000-i75bnj876xw73gfw266q3-e48eebb1.manus-asia.computer

---

## Useful Commands

```bash
# Navigate to project
cd /home/ubuntu/ai_cooking_agent

# Push database migrations
pnpm db:push

# Run dev server (should already be running)
pnpm dev

# Build for production
pnpm build

# Type check
pnpm typecheck
```

---

## File Structure Reference

```
ai_cooking_agent/
├── client/
│   ├── src/
│   │   ├── pages/          ← Add new pages here
│   │   ├── components/     ← Reusable UI components
│   │   ├── App.tsx         ← Routes configuration
│   │   └── main.tsx        ← Entry point
│   └── public/             ← Static assets
├── server/
│   ├── routers.ts          ← tRPC procedures (API endpoints)
│   ├── db.ts               ← Database query helpers
│   └── _core/              ← Framework internals (don't edit)
├── drizzle/
│   └── schema.ts           ← Database schema
├── shared/                 ← Shared types and constants
└── todo.md                 ← Feature tracking
```

---

## Checkpoint Information

If a checkpoint was created before the session limit, you can use it to restore the project state:
```bash
# Check available checkpoints in the Management UI
# Or use: webdev_rollback_checkpoint with the checkpoint version ID
```

---

## Questions or Issues?

If you encounter any issues:
1. Check the dev server logs (should be visible in the terminal)
2. Verify database connection with `pnpm db:push`
3. Review the tRPC error messages in the browser console
4. Check that all imports are correct after adding new files

Good luck with the AI Cooking Agent! 🍳
