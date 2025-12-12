import "server-only";

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, optionalAuthProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { users } from "../drizzle/schema-postgres";
import { and, or, ne, like } from "drizzle-orm";
// Dynamic import to avoid module evaluation during build
import type { InvokeParams, InvokeResult } from "./_core/llm";
import { parseRecipeFromUrl, extractCookingTimeFromInstructions } from "./_core/recipeParsing";
import { exportShoppingList, getMimeType, getFileExtension } from "./services/export";
import fs from "fs";
import unzipper from "unzipper";
import path from "path";

async function sendExpoPushNotification(
  token: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
) {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn("[Push] Failed to deliver notification:", text);
    }
  } catch (error) {
    console.error("[Push] Error sending notification:", error);
  }
}

// Recipe router
const recipeRouter = router({
  list: optionalAuthProcedure
    .input(
      z
        .object({
          limit: z.number().int().positive().max(100).optional(),
          sortBy: z.enum(["recent", "alphabetical", "meal"]).optional(),
          mealFilter: z.enum(["breakfast", "lunch", "dinner", "dessert"]).optional(),
          orderBy: z.enum(["createdAt", "name", "category"]).optional(),
          direction: z.enum(["asc", "desc"]).optional(),
        })
        .refine(
          (val) =>
            (!val.orderBy && !val.direction) ||
            (Boolean(val.orderBy) && Boolean(val.direction)),
          {
            message: "orderBy and direction must be provided together",
            path: ["orderBy"],
          }
        )
        .refine(
          (val) =>
            !(val.sortBy && (val.orderBy || val.direction)),
          {
            message: "sortBy cannot be combined with orderBy/direction",
            path: ["sortBy"],
          }
        )
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.user || (await db.getOrCreateAnonymousUser());

      const normalizedSort =
        input?.orderBy && input?.direction
          ? { orderBy: input.orderBy, direction: input.direction }
          : input?.sortBy === "recent"
            ? { orderBy: "createdAt" as const, direction: "desc" as const }
            : input?.sortBy === "alphabetical"
              ? { orderBy: "name" as const, direction: "asc" as const }
              : input?.sortBy === "meal"
                ? { orderBy: "category" as const, direction: "asc" as const }
                : undefined;

      const recipeQueryOptions = {
        ...(input?.mealFilter ? { mealFilter: input.mealFilter } : {}),
        ...(input?.limit ? { limit: input.limit } : {}),
        ...(normalizedSort ?? {}),
      };

      const hasOptions = Object.keys(recipeQueryOptions).length > 0;

      return db.getUserRecipes(
        user.id,
        hasOptions ? recipeQueryOptions : undefined
      );
    }),
  
  getRecent: optionalAuthProcedure
    .input(z.object({ limit: z.number().int().positive().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      // Only return recipes the user has actually added (not preloaded/shared)
      return db.getUserAddedRecipes(user.id, input?.limit);
    }),

  getStats: optionalAuthProcedure.query(async ({ ctx }) => {
    const user = ctx.user || await db.getOrCreateAnonymousUser();
    const recipes = await db.getUserRecipes(user.id);
    const ingredients = await db.getUserIngredients(user.id);
    const shoppingLists = await db.getUserShoppingLists(user.id);
    
    const recipeCount = recipes.length;
    const ingredientCount = ingredients.length;
    const shoppingListCount = shoppingLists.length;
    const favoriteCount = recipes.filter((r: any) => Boolean(r.isFavorite)).length;

    return {
      recipeCount,
      ingredientCount,
      shoppingListCount,
      favoriteCount,
    };
  }),

  getById: optionalAuthProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const recipe = await db.getRecipeById(input.id);
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      // Allow access if user owns it OR if it's shared
      if (recipe.userId !== user.id && !recipe.isShared) {
        throw new Error("Unauthorized: You can only view your own recipes or shared recipes");
      }
      return recipe;
    }),

  create: optionalAuthProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(5000).optional(),
        instructions: z.string().max(10000).optional(),
        imageUrl: z.string().url().max(500).optional(),
        cuisine: z.string().max(100).optional(),
        category: z.string().max(100).optional(),
        cookingTime: z.number().int().positive().max(1440).optional(), // Max 24 hours
        servings: z.number().int().positive().max(100).optional(),
        caloriesPerServing: z.number().int().positive().max(5000).optional(), // Max 5000 calories per serving
        sourceUrl: z.string().url().max(500).optional(),
        source: z.string().max(100).default("user_import"),
        ingredients: z
          .array(
            z.object({
              name: z.string().min(1).max(255),
              quantity: z.string().max(100).optional(),
              unit: z.string().max(50).optional(),
              category: z.string().max(100).optional(),
            })
          )
          .max(100) // Max 100 ingredients per recipe
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const { ingredients: ingredientsList, ...recipeData } = input;

      // Create recipe
      await db.createRecipe({
        ...recipeData,
        userId: user.id,
      });

      // Get the created recipe
      const recipes = await db.getUserRecipes(user.id);
      const created = recipes[recipes.length - 1];

      // Add ingredients if provided
      if (ingredientsList && ingredientsList.length > 0 && created) {
        for (const ing of ingredientsList) {
          const ingredient = await db.getOrCreateIngredient(ing.name, ing.category);
          await db.addRecipeIngredient({
            recipeId: created.id,
            ingredientId: ingredient.id,
            quantity: ing.quantity,
            unit: ing.unit,
          });
        }
      }

      return { id: created?.id || 0 };
    }),

  importFromZip: optionalAuthProcedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const zipFilePath = input.path;

      const unzippedFiles: any[] = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(zipFilePath)
          .pipe(unzipper.Parse())
          .on("entry", async function (entry) {
            if (entry.path.endsWith(".json")) {
              const content = await entry.buffer();
              unzippedFiles.push(JSON.parse(content.toString()));
            } else {
              entry.autodrain();
            }
          })
          .on("finish", resolve)
          .on("error", reject);
      });

      for (const recipe of unzippedFiles) {
        const { ingredients: ingredientsList, ...recipeData } = recipe;

        // Create recipe
        await db.createRecipe({
          ...recipeData,
          userId: user.id,
        });

        // Get the created recipe
        const recipes = await db.getUserRecipes(user.id);
        const created = recipes[recipes.length - 1];

        // Add ingredients if provided
        if (ingredientsList && ingredientsList.length > 0 && created) {
          for (const ing of ingredientsList) {
            const ingredient = await db.getOrCreateIngredient(ing.name, ing.category);
            await db.addRecipeIngredient({
              recipeId: created.id,
              ingredientId: ingredient.id,
              quantity: ing.quantity,
              unit: ing.unit,
            });
          }
        }
      }

      return { success: true, imported: unzippedFiles.length };
    }),

  parseFromUrl: optionalAuthProcedure
    .input(
      z.object({
        url: z.string().url(),
        autoSave: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // DEBUG: Log what we actually received
      console.log('=== INPUT RECEIVED ===');
      console.log('input object:', JSON.stringify(input));
      console.log('input.autoSave type:', typeof input.autoSave);
      console.log('input.autoSave value:', input.autoSave);
      console.log('!input.autoSave:', !input.autoSave);
      console.log('=====================');

      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const parsed = await parseRecipeFromUrl(input.url);

      // DEBUG: Log parsed ingredients AND autoSave setting
      console.log('=== PARSE FROM URL DEBUG ===');
      console.log('URL:', input.url);
      console.log('autoSave:', input.autoSave);
      console.log('Parsed object:', parsed ? 'exists' : 'null');
      console.log('Ingredients:', parsed?.ingredients ? `${parsed.ingredients.length} ingredients` : 'NO INGREDIENTS');
      if (parsed?.ingredients) {
        console.log('First 3 ingredients:', parsed.ingredients.slice(0, 3));
      }
      console.log('Will return:', input.autoSave ? '{ id }' : '{ parsed }');
      console.log('===========================');

      if (!parsed) {
        try {
          const { invokeLLM } = await import("./_core/llm");
          const llm = await invokeLLM({
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: `Extract a structured recipe from this URL: ${input.url}. Return JSON only.` },
                ],
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "recipe",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    instructions: { type: "string" },
                    imageUrl: { type: "string" },
                    cuisine: { type: "string" },
                    category: { type: "string" },
                    cookingTime: { type: "number" },
                    servings: { type: "number" },
                    caloriesPerServing: { type: "number" },
                    ingredients: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          quantity: { type: "string" },
                          unit: { type: "string" },
                        },
                        required: ["name"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["name"],
                  additionalProperties: false,
                },
              },
            },
          });
          const content = llm.choices[0].message.content;
          const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
          const fallback = JSON.parse(contentStr ?? "{}");
          if (!fallback?.name) {
            throw new Error("LLM parsing failed");
          }
          if (!input.autoSave) {
            return { parsed: fallback as unknown };
          }
          
          // Ensure instructions is a string
          let instructionsStr: string | undefined = undefined;
          if (fallback.instructions !== undefined && fallback.instructions !== null) {
            if (typeof fallback.instructions === "string") {
              instructionsStr = fallback.instructions;
            } else if (Array.isArray(fallback.instructions)) {
              instructionsStr = fallback.instructions
                .map((item: any) => typeof item === "string" ? item : JSON.stringify(item))
                .join("\n");
            } else {
              instructionsStr = String(fallback.instructions);
            }
          }
          
          // Ensure description is a string
          const descriptionStr = typeof fallback.description === "string"
            ? fallback.description
            : fallback.description !== undefined && fallback.description !== null
            ? String(fallback.description)
            : undefined;

          // Try to extract cooking time from instructions if not provided
          let cookingTime = typeof fallback.cookingTime === "number" ? fallback.cookingTime : undefined;
          if (!cookingTime && instructionsStr) {
            const extracted = extractCookingTimeFromInstructions(instructionsStr);
            cookingTime = extracted ?? undefined;
          }

          // Resolve imageUrl to absolute URL if it's a relative URL
          let imageUrl: string | undefined = undefined;
          if (typeof fallback.imageUrl === "string" && fallback.imageUrl.trim()) {
            try {
              // If it's already an absolute URL, use it as-is
              new URL(fallback.imageUrl);
              imageUrl = fallback.imageUrl;
            } catch {
              // If it's a relative URL, resolve it against the source URL
              try {
                imageUrl = new URL(fallback.imageUrl, input.url).toString();
              } catch {
                // If resolution fails, skip the image
                console.warn(`[Recipe Import] Failed to resolve image URL: ${fallback.imageUrl}`);
              }
            }
          }

          const created = await db.createRecipe({
            name: fallback.name,
            description: descriptionStr,
            instructions: instructionsStr,
            imageUrl,
            cuisine: typeof fallback.cuisine === "string" ? fallback.cuisine : undefined,
            category: typeof fallback.category === "string" ? fallback.category : undefined,
            cookingTime,
            servings: typeof fallback.servings === "number" ? fallback.servings : undefined,
            caloriesPerServing: typeof fallback.caloriesPerServing === "number" ? fallback.caloriesPerServing : undefined,
            sourceUrl: input.url,
            userId: user.id,
            source: "url_import",
            isShared: true, // HTML-uploaded recipes are shared with all users
          });

          console.log('[LLM FALLBACK] Recipe created:', created ? `id=${created.id}` : 'NO RECIPE');

          if (created && Array.isArray(fallback.ingredients)) {
            console.log('[LLM FALLBACK] Saving', fallback.ingredients.length, 'ingredients to recipe', created.id);
            for (const ing of fallback.ingredients) {
              const ingredient = await db.getOrCreateIngredient(ing.name);
              await db.addRecipeIngredient({
                recipeId: created.id,
                ingredientId: ingredient.id,
                quantity: ing.quantity,
                unit: ing.unit,
              });
            }
            console.log('[LLM FALLBACK] ✓ Saved ingredients to recipe', created.id);
          }
          return { id: created?.id || 0 };
        } catch (e) {
          console.error("Error parsing recipe via LLM:", e);
          throw new Error("Failed to parse recipe from URL");
        }
      }

      if (!input.autoSave) {
        console.log('[PREVIEW MODE] Returning parsed data with', parsed?.ingredients?.length || 0, 'ingredients');
        return { parsed };
      }

      console.log('[AUTO SAVE MODE] Saving recipe to database with', parsed?.ingredients?.length || 0, 'ingredients');

      // Ensure instructions is a string (handle case where it might be an object)
      let instructionsStr: string | undefined = undefined;
      const instructionsValue: unknown = parsed.instructions;
      if (instructionsValue !== undefined && instructionsValue !== null) {
        if (typeof instructionsValue === "string") {
          instructionsStr = instructionsValue;
        } else if (Array.isArray(instructionsValue)) {
          instructionsStr = instructionsValue
            .map((item: any) => typeof item === "string" ? item : JSON.stringify(item))
            .join("\n");
        } else {
          instructionsStr = String(instructionsValue);
        }
      }
      
      // Ensure description is a string
      const descriptionStr = typeof parsed.description === "string"
        ? parsed.description
        : parsed.description !== undefined && parsed.description !== null
        ? String(parsed.description)
        : undefined;

      // Try to extract cooking time from instructions if not provided by parser
      let cookingTime = typeof parsed.cookingTime === "number" ? parsed.cookingTime : undefined;
      if (!cookingTime && instructionsStr) {
        const extracted = extractCookingTimeFromInstructions(instructionsStr);
        cookingTime = extracted ?? undefined;
      }

      // Resolve imageUrl to absolute URL if it's a relative URL
      let imageUrl: string | undefined = undefined;
      if (typeof parsed.imageUrl === "string" && parsed.imageUrl.trim()) {
        try {
          // If it's already an absolute URL, use it as-is
          new URL(parsed.imageUrl);
          imageUrl = parsed.imageUrl;
        } catch {
          // If it's a relative URL, resolve it against the source URL
          const sourceUrl = typeof parsed.sourceUrl === "string" ? parsed.sourceUrl : input.url;
          try {
            imageUrl = new URL(parsed.imageUrl, sourceUrl).toString();
          } catch {
            // If resolution fails, skip the image
            console.warn(`[Recipe Import] Failed to resolve image URL: ${parsed.imageUrl}`);
          }
        }
      }

      const created = await db.createRecipe({
        name: parsed.name,
        description: descriptionStr,
        instructions: instructionsStr,
        imageUrl,
        cuisine: typeof parsed.cuisine === "string" ? parsed.cuisine : undefined,
        category: typeof parsed.category === "string" ? parsed.category : undefined,
        cookingTime,
        servings: typeof parsed.servings === "number" ? parsed.servings : undefined,
        caloriesPerServing: (parsed as any).caloriesPerServing && typeof (parsed as any).caloriesPerServing === "number" ? (parsed as any).caloriesPerServing : undefined,
        sourceUrl: typeof parsed.sourceUrl === "string" ? parsed.sourceUrl : undefined,
        userId: user.id,
        source: typeof parsed.source === "string" ? parsed.source : "url_import",
        isShared: true, // HTML-uploaded recipes are shared with all users
      });

      console.log('[INGREDIENT SAVE] Recipe created:', created ? `id=${created.id}` : 'NO RECIPE');
      console.log('[INGREDIENT SAVE] parsed.ingredients:', parsed.ingredients ? `${parsed.ingredients.length} items` : 'NONE');
      console.log('[INGREDIENT SAVE] Condition check:', {
        hasCreated: !!created,
        hasIngredients: !!parsed.ingredients?.length,
        willSave: !!(created && parsed.ingredients?.length)
      });

      if (created && parsed.ingredients?.length) {
        console.log('[INGREDIENT SAVE] Starting to save', parsed.ingredients.length, 'ingredients to recipe', created.id);
        let savedCount = 0;
        for (const ing of parsed.ingredients) {
          try {
            const ingredient = await db.getOrCreateIngredient(ing.name);
            await db.addRecipeIngredient({
              recipeId: created.id,
              ingredientId: ingredient.id,
              quantity: ing.quantity,
              unit: ing.unit,
            });
            savedCount++;
            console.log('[INGREDIENT SAVE] Saved ingredient', savedCount, 'to recipe', created.id, ':', ing.name);
          } catch (error) {
            console.error('[INGREDIENT SAVE] ERROR saving ingredient:', ing.name, error);
          }
        }
        console.log('[INGREDIENT SAVE] ✓ Successfully saved', savedCount, 'of', parsed.ingredients.length, 'ingredients to recipe', created.id);
      } else {
        console.log('[INGREDIENT SAVE] ✗ SKIPPED saving ingredients');
      }

      return { id: created?.id || 0 };
    }),
  toggleFavorite: optionalAuthProcedure
    .input(z.object({ id: z.number().int().positive(), isFavorite: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const recipe = await db.getRecipeById(input.id);
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      // Users can favorite shared recipes, but favorites are per-user
      // For now, allow favoriting any accessible recipe (owned or shared)
      if (recipe.userId !== user.id && !recipe.isShared) {
        throw new Error("Unauthorized: You can only favorite your own recipes or shared recipes");
      }
      return db.updateRecipeFavorite(input.id, Boolean(input.isFavorite));
    }),

  updateTags: optionalAuthProcedure
    .input(z.object({ 
      id: z.number().int().positive(), 
      tags: z.array(z.string().min(1).max(50)).max(20) 
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const recipe = await db.getRecipeById(input.id);
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      // Verify ownership
      if (recipe.userId !== user.id) {
        throw new Error("Unauthorized: You can only modify your own recipes");
      }
      return db.updateRecipeTags(input.id, input.tags);
    }),

  delete: optionalAuthProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const recipe = await db.getRecipeById(input.id);
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      // Verify ownership
      if (recipe.userId !== user.id) {
        throw new Error("Unauthorized: You can only delete your own recipes");
      }
      return db.deleteRecipe(input.id);
    }),

  searchByIngredients: publicProcedure
    .input(
      z.object({
        ingredients: z.array(z.string().min(1).max(100)).min(1).max(5),
        sources: z.array(z.enum(["TheMealDB", "Epicurious", "Delish", "NYTCooking"])).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const results: Array<Record<string, unknown> & { source?: string }> = [];
        const seenIds = new Set<string>();
        const sources = input.sources || ["TheMealDB"];

        // Search TheMealDB
        if (sources.includes("TheMealDB")) {
          for (const ingredient of input.ingredients.slice(0, 5)) {
            const response = await fetch(
              `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
            );
            const data = (await response.json()) as {
              meals: Array<{ idMeal: string; [key: string]: unknown }> | null;
            };

            if (data.meals) {
              for (const meal of data.meals) {
                if (!seenIds.has(`themealdb-${meal.idMeal}`)) {
                  seenIds.add(`themealdb-${meal.idMeal}`);
                  results.push({ ...meal, source: "TheMealDB" });
                }
              }
            }
          }
        }

        // Search Epicurious
        if (sources.includes("Epicurious")) {
          const { searchEpicurious } = await import("./_core/recipeSources");
          const epicuriousResults = await searchEpicurious(input.ingredients);
          for (const result of epicuriousResults) {
            if (!seenIds.has(`epicurious-${result.id}`)) {
              seenIds.add(`epicurious-${result.id}`);
              results.push({
                idMeal: result.id,
                strMeal: result.title,
                strMealThumb: result.imageUrl,
                source: result.source,
                url: result.url,
              });
            }
          }
        }

        // Search Delish
        if (sources.includes("Delish")) {
          const { searchDelish } = await import("./_core/recipeSources");
          const delishResults = await searchDelish(input.ingredients);
          for (const result of delishResults) {
            if (!seenIds.has(`delish-${result.id}`)) {
              seenIds.add(`delish-${result.id}`);
              results.push({
                idMeal: result.id,
                strMeal: result.title,
                strMealThumb: result.imageUrl,
                source: result.source,
                url: result.url,
              });
            }
          }
        }

        // Search NYT Cooking
        if (sources.includes("NYTCooking")) {
          const { searchNYTCooking } = await import("./_core/recipeSources");
          const nytResults = await searchNYTCooking(input.ingredients);
          for (const result of nytResults) {
            if (!seenIds.has(`nyt-${result.id}`)) {
              seenIds.add(`nyt-${result.id}`);
              results.push({
                idMeal: result.id,
                strMeal: result.title,
                strMealThumb: result.imageUrl,
                source: result.source,
                url: result.url,
              });
            }
          }
        }

        return results;
      } catch (error) {
        console.error("Error searching recipes:", error);
        return [];
      }
    }),

  getTheMealDBDetails: publicProcedure
    .input(z.object({ mealId: z.string().min(1).max(20) }))
    .query(async ({ input }) => {
      try {
        const response = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(input.mealId)}`
        );
        const data = (await response.json()) as { meals: Array<{ [key: string]: unknown }> | null };
        return data.meals?.[0] || null;
      } catch (error) {
        console.error("Error fetching meal details:", error);
        return null;
      }
    }),

  importFromTheMealDB: optionalAuthProcedure
    .input(z.object({ mealId: z.string().min(1).max(20) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = ctx.user || await db.getOrCreateAnonymousUser();
        const response = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(input.mealId)}`
        );
        const data = (await response.json()) as {
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

        if (!data.meals || data.meals.length === 0) {
          throw new Error("Meal not found");
        }

        const meal = data.meals[0];

        // Extract ingredients from TheMealDB format (strIngredient1, strMeasure1, etc.)
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
          const ingredientKey = `strIngredient${i}`;
          const measureKey = `strMeasure${i}`;
          const ingredientName = meal[ingredientKey] as string | undefined;
          const measure = meal[measureKey] as string | undefined;

          if (ingredientName && ingredientName.trim()) {
            ingredients.push({
              name: ingredientName.trim(),
              quantity: measure?.split(" ")[0] || "",
              unit: measure?.split(" ").slice(1).join(" ") || "",
            });
          }
        }

        // Create recipe
        await db.createRecipe({
          name: meal.strMeal,
          instructions: meal.strInstructions,
          imageUrl: meal.strMealThumb,
          category: meal.strCategory,
          cuisine: meal.strArea,
          userId: user.id,
          externalId: meal.idMeal,
          source: "TheMealDB",
        });

        // Get the created recipe
        const recipes = await db.getUserRecipes(user.id);
        const created = recipes[recipes.length - 1];

        // Add ingredients
        if (created) {
          for (const ing of ingredients) {
            const ingredient = await db.getOrCreateIngredient(ing.name);
            await db.addRecipeIngredient({
              recipeId: created.id,
              ingredientId: ingredient.id,
              quantity: ing.quantity,
              unit: ing.unit,
            });
          }
        }

        return { id: created?.id || 0 };
      } catch (error) {
        console.error("Error importing from TheMealDB:", error);
        throw new Error("Failed to import recipe from TheMealDB");
      }
    }),

  getRecipeIngredients: optionalAuthProcedure
    .input(z.object({ recipeId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const recipe = await db.getRecipeById(input.recipeId);
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      // Allow access if user owns it OR if it's shared
      if (recipe.userId !== user.id && !recipe.isShared) {
        throw new Error("Unauthorized: You can only view ingredients from your own recipes or shared recipes");
      }

      const ingredients = await db.getRecipeIngredients(input.recipeId);
      console.log(`[GET INGREDIENTS] Recipe ${input.recipeId}: Found ${ingredients.length} ingredients in database`);
      if (ingredients.length === 0) {
        console.log(`[GET INGREDIENTS] WARNING: No ingredients found for recipe ${input.recipeId}`);
      }

      return ingredients;
    }),

  getDailyRecommendations: optionalAuthProcedure.query(async ({ ctx }) => {
    const user = ctx.user || await db.getOrCreateAnonymousUser();
    return db.getDailyRecommendations(user.id);
  }),
});


// Ingredient router
const ingredientRouter = router({
  list: publicProcedure.query(() => db.getAllIngredients()),

  getOrCreate: publicProcedure
    .input(
      z.object({ 
        name: z.preprocess(
          (val) => {
            // Handle case where name might be an object (from mobile app bug)
            if (typeof val === 'object' && val !== null && 'name' in val) {
              console.warn('[getOrCreate] Received object for name, extracting name property:', val);
              return val.name;
            }
            return val;
          },
          z.string().min(1).max(255)
        ), 
        category: z.string().max(100).optional(), 
        imageUrl: z.string().url().max(1000).optional() 
      })
    )
    .mutation(async ({ input }) => {
      // Log for debugging
      console.log('[getOrCreate] Input received:', { 
        name: input.name, 
        nameType: typeof input.name,
        nameLength: input.name?.length,
        category: input.category,
        imageUrl: input.imageUrl?.substring(0, 50) 
      });
      
      // Validate and trim name
      const trimmedName = input.name?.trim();
      if (!trimmedName || trimmedName.length === 0) {
        throw new Error('Ingredient name cannot be empty');
      }
      if (trimmedName.length > 255) {
        throw new Error('Ingredient name cannot exceed 255 characters');
      }
      
      const ingredient = await db.getOrCreateIngredient(trimmedName, input.category);
      
      console.log('[getOrCreate] Ingredient created/retrieved:', {
        id: ingredient.id,
        name: ingredient.name,
        category: ingredient.category
      });
      
      // If imageUrl is provided and ingredient doesn't have one, update it
      if (input.imageUrl && !ingredient.imageUrl) {
        await db.updateIngredientImage(ingredient.id, input.imageUrl);
        const updated = { ...ingredient, imageUrl: input.imageUrl };
        console.log('[getOrCreate] Updated ingredient with imageUrl:', updated);
        return updated;
      }
      
      console.log('[getOrCreate] Returning ingredient:', ingredient);
      return ingredient;
    }),

  updateImage: optionalAuthProcedure
    .input(z.object({ ingredientId: z.number().int().positive(), imageUrl: z.string().url().max(1000) }))
    .mutation(async ({ input }) => {
      await db.updateIngredientImage(input.ingredientId, input.imageUrl);
      const updated = await db.getIngredientById(input.ingredientId);
      if (!updated) throw new Error("Ingredient not found");
      return updated;
    }),

  recognizeFromImage: optionalAuthProcedure
    .input(z.object({ imageUrl: z.string().url().max(500) }))
    .mutation(async ({ input }) => {
      try {
        const { invokeLLM } = await import("./_core/llm");
        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: input.imageUrl,
                    detail: "auto",
                  },
                },
                {
                  type: "text",
                  text: `Analyze this image and identify all ingredients you can see. For each ingredient, provide:
- The ingredient name (e.g., "tomatoes", "flour", "olive oil")
- The quantity if visible (e.g., "2", "1.5", "500") - use empty string "" if not visible
- The unit if visible (e.g., "cups", "tbsp", "g", "ml", "pieces") - use empty string "" if not visible

Return a JSON object with an "ingredients" array. Each ingredient must have name, quantity, and unit fields. Use empty strings for quantity and unit if they are not visible in the image.`,
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
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                          description: "The ingredient name",
                        },
                        quantity: {
                          type: "string",
                          description: "The quantity if visible, or empty string if not visible",
                        },
                        unit: {
                          type: "string",
                          description: "The unit of measurement if visible, or empty string if not visible",
                        },
                      },
                      required: ["name", "quantity", "unit"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["ingredients"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const parsed = JSON.parse(contentStr);
        const ingredients = parsed.ingredients || [];
        
        // Filter and normalize ingredients
        const validIngredients = ingredients
          .map((ing: any) => {
            try {
              // Handle both string format (old) and object format (new)
              if (typeof ing === 'string') {
                const trimmed = String(ing).trim();
                if (trimmed.length === 0 || trimmed.length > 255) return null;
                return { name: trimmed, quantity: '', unit: '' };
              }
              
              // Normalize object format - ensure name is a string
              let name = ing?.name;
              
              // Convert name to string if it's not already
              if (name && typeof name !== 'string') {
                name = String(name);
              }
              
              // Validate name
              if (!name || typeof name !== 'string' || !name.trim()) {
                console.warn('[recognizeFromImage] Invalid ingredient name:', ing);
                return null; // Invalid, will be filtered out
              }
              
              const trimmedName = name.trim();
              if (trimmedName.length === 0 || trimmedName.length > 255) {
                console.warn('[recognizeFromImage] Ingredient name out of range:', trimmedName);
                return null;
              }
              
              // Ensure quantity and unit are strings
              const quantity = (ing.quantity && typeof ing.quantity === 'string' && ing.quantity.trim()) 
                ? ing.quantity.trim() 
                : '';
              const unit = (ing.unit && typeof ing.unit === 'string' && ing.unit.trim()) 
                ? ing.unit.trim() 
                : '';
              
              return {
                name: trimmedName,
                quantity,
                unit,
              };
            } catch (error) {
              console.warn('[recognizeFromImage] Error processing ingredient:', ing, error);
              return null;
            }
          })
          .filter((ing: any) => ing !== null && ing.name && typeof ing.name === 'string' && ing.name.length > 0 && ing.name.length <= 255);
        
        console.log(`[recognizeFromImage] Recognized ${validIngredients.length} valid ingredients from ${ingredients.length} total`);
        if (validIngredients.length > 0) {
          console.log('[recognizeFromImage] Sample ingredient:', validIngredients[0]);
          // Final validation - ensure all returned ingredients have string names
          const finalCheck = validIngredients.every((ing: any) => 
            ing && 
            typeof ing === 'object' && 
            ing.name && 
            typeof ing.name === 'string'
          );
          if (!finalCheck) {
            console.error('[recognizeFromImage] WARNING: Some ingredients have invalid name types:', validIngredients);
            // Filter out any that still have invalid names
            return validIngredients.filter((ing: any) => 
              ing && 
              typeof ing === 'object' && 
              ing.name && 
              typeof ing.name === 'string'
            );
          }
        }
        
        return validIngredients;
      } catch (error) {
        console.error("Error recognizing ingredients from image:", error);
        throw new Error("Failed to recognize ingredients from image");
      }
    }),

  getUploadUrl: optionalAuthProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        contentType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { getPresignedUploadUrl } = await import("./_core/storage");
        return await getPresignedUploadUrl(input.fileName, input.contentType);
      } catch (error) {
        console.error("Error generating upload URL:", error);
        throw new Error("Failed to generate upload URL. Check S3 configuration.");
      }
    }),

  uploadImage: optionalAuthProcedure
    .input(
      z.object({
        imageData: z.string(), // base64 encoded image
        fileName: z.string().min(1).max(255),
        contentType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { uploadImageToS3 } = await import("./_core/storage");
        const url = await uploadImageToS3(input.imageData, input.fileName, input.contentType);
        return { url };
      } catch (error: any) {
        console.error("Error uploading image:", error);
        // Preserve the original error message if it's more specific
        const errorMessage = error?.message || "Failed to upload image. Check S3 configuration.";
        throw new Error(errorMessage);
      }
    }),

  addToUserList: optionalAuthProcedure
    .input(
      z.object({
        ingredientId: z.number().int().positive(),
        quantity: z.string().max(100).optional(),
        unit: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      return db.addUserIngredient({
        userId: user.id,
        ingredientId: input.ingredientId,
        quantity: input.quantity,
        unit: input.unit,
      });
    }),

  getUserIngredients: optionalAuthProcedure.query(async ({ ctx }) => {
    try {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      return await db.getUserIngredients(user.id);
    } catch (error: any) {
      console.error("Error in getUserIngredients:", error);
      throw new Error(error.message || "Failed to fetch user ingredients");
    }
  }),

  removeFromUserList: optionalAuthProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const userIngredient = await db.getUserIngredientById(input.id);
      if (!userIngredient) {
        throw new Error("User ingredient not found");
      }
      // Verify ownership
      if (userIngredient.userId !== user.id) {
        throw new Error("Unauthorized: You can only remove your own ingredients");
      }
      return db.deleteUserIngredient(input.id);
    }),
});

// Shopping list router
const shoppingListRouter = router({
  list: optionalAuthProcedure.query(async ({ ctx }) => {
    const user = ctx.user || await db.getOrCreateAnonymousUser();
    return db.getUserShoppingLists(user.id);
  }),

  create: optionalAuthProcedure
    .input(z.object({ name: z.string().min(1).max(255), description: z.string().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = ctx.user || await db.getOrCreateAnonymousUser();
        const createdList = await db.createShoppingList({ ...input, userId: user.id });
        
        // createShoppingList should always return the created list object
        if (!createdList || !('id' in createdList)) {
          throw new Error("Failed to create shopping list: invalid response from database");
        }
        
        return createdList;
      } catch (error: any) {
        console.error("Error creating shopping list:", error);
        throw new Error(error.message || "Failed to create shopping list");
      }
    }),

  getById: optionalAuthProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const shoppingList = await db.getShoppingListById(input.id);
      if (!shoppingList) {
        throw new Error("Shopping list not found");
      }
      // Verify ownership
      if (shoppingList.userId !== user.id) {
        throw new Error("Unauthorized: You can only view your own shopping lists");
      }
      return shoppingList;
    }),

  getItems: optionalAuthProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const shoppingList = await db.getShoppingListById(input.id);
      if (!shoppingList) {
        throw new Error("Shopping list not found");
      }
      // Verify ownership
      if (shoppingList.userId !== user.id) {
        throw new Error("Unauthorized: You can only view items from your own shopping lists");
      }
      return db.getShoppingListItems(input.id);
    }),

  addItem: optionalAuthProcedure
    .input(
      z.object({
        shoppingListId: z.number().int().positive(),
        ingredientId: z.number().int().positive(),
        quantity: z.string().max(100).optional(),
        unit: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("addItem mutation called with:", input);
        const user = ctx.user || await db.getOrCreateAnonymousUser();
        console.log("User:", { id: user.id, openId: user.openId });
        
        const shoppingList = await db.getShoppingListById(input.shoppingListId);
        if (!shoppingList) {
          console.error("Shopping list not found:", input.shoppingListId);
          throw new Error("Shopping list not found");
        }
        console.log("Shopping list found:", { id: shoppingList.id, userId: shoppingList.userId });
        
        // Verify ownership
        if (shoppingList.userId !== user.id) {
          console.error(`Ownership mismatch: list userId=${shoppingList.userId}, user id=${user.id}`);
          throw new Error("Unauthorized: You can only add items to your own shopping lists");
        }
        
        console.log("Adding item:", {
          shoppingListId: input.shoppingListId,
          ingredientId: input.ingredientId,
          quantity: input.quantity,
          unit: input.unit,
        });
        
        // Verify ingredient exists
        const ingredient = await db.getIngredientById(input.ingredientId);
        if (!ingredient) {
          console.error("Ingredient not found:", input.ingredientId);
          throw new Error(`Ingredient with ID ${input.ingredientId} not found`);
        }
        console.log("Ingredient verified:", ingredient.name);
        
        const result = await db.addShoppingListItem({
          shoppingListId: input.shoppingListId,
          ingredientId: input.ingredientId,
          quantity: input.quantity,
          unit: input.unit,
        });
        
        console.log("Item added successfully:", result);
        return result;
      } catch (error: any) {
        console.error("Error in addItem mutation:", error);
        console.error("Error stack:", error.stack);
        throw new Error(error.message || "Failed to add item to shopping list");
      }
    }),

  toggleItem: optionalAuthProcedure
    .input(z.object({ itemId: z.number().int().positive(), isChecked: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const item = await db.getShoppingListItemById(input.itemId);
      if (!item) {
        throw new Error("Shopping list item not found");
      }
      const shoppingList = await db.getShoppingListById(item.shoppingListId);
      if (!shoppingList || shoppingList.userId !== user.id) {
        throw new Error("Unauthorized: You can only modify items in your own shopping lists");
      }
      return db.updateShoppingListItem(input.itemId, input.isChecked);
    }),

  removeItem: optionalAuthProcedure
    .input(z.object({ itemId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const item = await db.getShoppingListItemById(input.itemId);
      if (!item) {
        throw new Error("Shopping list item not found");
      }
      const shoppingList = await db.getShoppingListById(item.shoppingListId);
      if (!shoppingList || shoppingList.userId !== user.id) {
        throw new Error("Unauthorized: You can only remove items from your own shopping lists");
      }
      return db.deleteShoppingListItem(input.itemId);
    }),

  update: optionalAuthProcedure
    .input(z.object({ 
      id: z.number().int().positive(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const shoppingList = await db.getShoppingListById(input.id);
      if (!shoppingList) {
        throw new Error("Shopping list not found");
      }
      // Verify ownership
      if (shoppingList.userId !== user.id) {
        throw new Error("Unauthorized: You can only update your own shopping lists");
      }
      
      const updates: { name?: string; description?: string } = {};
      if (input.name !== undefined) {
        updates.name = input.name;
      }
      if (input.description !== undefined) {
        updates.description = input.description;
      }
      
      if (Object.keys(updates).length === 0) {
        throw new Error("No updates provided");
      }
      
      return db.updateShoppingList(input.id, updates);
    }),

  delete: optionalAuthProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const shoppingList = await db.getShoppingListById(input.id);
      if (!shoppingList) {
        throw new Error("Shopping list not found");
      }
      // Verify ownership
      if (shoppingList.userId !== user.id) {
        throw new Error("Unauthorized: You can only delete your own shopping lists");
      }
      return db.deleteShoppingList(input.id);
    }),

  addFromRecipe: optionalAuthProcedure
    .input(z.object({ shoppingListId: z.number().int().positive(), recipeId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      // Verify shopping list ownership
      const shoppingList = await db.getShoppingListById(input.shoppingListId);
      if (!shoppingList) {
        throw new Error("Shopping list not found");
      }
      if (shoppingList.userId !== user.id) {
        throw new Error("Unauthorized: You can only add items to your own shopping lists");
      }

      // Verify recipe exists and is accessible (owned or shared)
      const recipe = await db.getRecipeById(input.recipeId);
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      // Allow adding ingredients from owned recipes or shared recipes
      if (recipe.userId !== user.id && !recipe.isShared) {
        throw new Error("Unauthorized: Recipe not found or not accessible");
      }

      // Get ingredients from both junction table AND JSONB column
      const allIngredients = await db.getAllRecipeIngredients(input.recipeId);

      if (allIngredients.length === 0) {
        throw new Error("No ingredients found for this recipe");
      }

      for (const ing of allIngredients) {
        await db.addShoppingListItem({
          shoppingListId: input.shoppingListId,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit,
        });
      }

      return { success: true, ingredientsAdded: allIngredients.length };
    }),

  export: optionalAuthProcedure
    .input(z.object({
      id: z.number().int().positive(),
      format: z.enum(['csv', 'txt', 'md', 'json', 'pdf'])
    }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      // Verify shopping list ownership
      const shoppingList = await db.getShoppingListById(input.id);
      if (!shoppingList) {
        throw new Error("Shopping list not found");
      }
      if (shoppingList.userId !== user.id) {
        throw new Error("Unauthorized: You can only export your own shopping lists");
      }

      // Get shopping list items with ingredient details
      const items = await db.getShoppingListItems(input.id);
      const itemsWithIngredients = await Promise.all(
        items.map(async (item) => {
          const ingredient = await db.getIngredientById(item.ingredientId);
          return {
            ingredient: ingredient!,
            quantity: item.quantity,
            unit: item.unit,
            isChecked: item.isChecked || false,
          };
        })
      );

      // Export in requested format
      const exportData = {
        listName: shoppingList.name,
        listDescription: shoppingList.description || undefined,
        items: itemsWithIngredients,
        createdAt: shoppingList.createdAt,
      };

      const contentOrPromise = exportShoppingList(exportData, input.format);
      // Handle async PDF generation
      const content = contentOrPromise instanceof Promise ? await contentOrPromise : contentOrPromise;
      const mimeType = getMimeType(input.format);
      const extension = getFileExtension(input.format);

      return {
        content: input.format === 'pdf' ? content.toString('base64') : content,
        mimeType,
        filename: `${shoppingList.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`,
      };
    }),
});

// Notification router
const notificationRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().positive().max(100).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit || 50;
      return db.getUserNotifications(ctx.user.id, limit);
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return db.getUnreadNotificationCount(ctx.user.id);
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.markNotificationAsRead(input.id, ctx.user.id);
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteNotification(input.id, ctx.user.id);
      return { success: true };
    }),

  listDevices: protectedProcedure.query(async ({ ctx }) => {
    return db.getPushTokensForUser(ctx.user.id);
  }),

  registerDevice: protectedProcedure
    .input(
      z.object({
        token: z.string().min(10),
        platform: z.enum(["ios", "android", "web"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.upsertPushToken(ctx.user.id, input.token, input.platform);
      return { success: true };
    }),

  unregisterDevice: protectedProcedure
    .input(z.object({ token: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      await db.deletePushToken(ctx.user.id, input.token);
      return { success: true };
    }),

  sendTestPush: protectedProcedure.mutation(async ({ ctx }) => {
    const tokens = await db.getPushTokensForUser(ctx.user.id);
    if (!tokens.length) {
      throw new Error("No devices registered. Enable push notifications first.");
    }

    await Promise.all(
      tokens.map((entry) =>
        sendExpoPushNotification(entry.token, {
          title: "Sous",
          body: "Push notifications are enabled! We'll keep your kitchen in sync.",
          data: { type: "test" },
        })
      )
    );

    return { success: true };
  }),
});

// Message router
const messageRouter = router({
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await db.getUserConversations(ctx.user.id);
    // Enrich with other user info and last message preview
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.user1Id === ctx.user.id ? conv.user2Id : conv.user1Id;
        const otherUser = await db.getUserById(otherUserId);
        // Get last message
        const messages = await db.getConversationMessages(conv.id, 1);
        const lastMessage = messages[0] || null;
        
        return {
          ...conv,
          otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, email: otherUser.email } : null,
          lastMessage,
        };
      })
    );
    return enriched;
  }),

  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const conversation = await db.getConversationById(input.conversationId, ctx.user.id);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      
      const otherUserId = conversation.user1Id === ctx.user.id ? conversation.user2Id : conversation.user1Id;
      const otherUser = await db.getUserById(otherUserId);
      
      return {
        ...conversation,
        otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, email: otherUser.email } : null,
      };
    }),

  getMessages: protectedProcedure
    .input(z.object({ 
      conversationId: z.number().int().positive(),
      limit: z.number().int().positive().max(100).optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to conversation
      const conversation = await db.getConversationById(input.conversationId, ctx.user.id);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      
      const limit = input.limit || 100;
      const messages = await db.getConversationMessages(input.conversationId, limit);
      
      // Mark messages as read when user views them
      await db.markMessagesAsRead(input.conversationId, ctx.user.id);
      
      return messages.reverse(); // Return in chronological order (oldest first)
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.number().int().positive().optional(),
      recipientId: z.number().int().positive().optional(),
      content: z.string().min(1).max(5000),
      recipeId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.conversationId && !input.recipientId) {
        throw new Error("Either conversationId or recipientId must be provided");
      }
      
      let conversationId = input.conversationId;
      
      // If recipientId provided, get or create conversation
      if (input.recipientId) {
        if (input.recipientId === ctx.user.id) {
          throw new Error("Cannot send message to yourself");
        }
        const conversation = await db.getOrCreateConversation(ctx.user.id, input.recipientId);
        conversationId = conversation.id;
      }
      
      if (!conversationId) {
        throw new Error("Conversation not found");
      }
      
      // Verify user has access to conversation
      const conversation = await db.getConversationById(conversationId, ctx.user.id);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      
      // If recipeId is provided, verify recipe exists and user has access
      if (input.recipeId) {
        const recipe = await db.getRecipeById(input.recipeId);
        if (!recipe) {
          throw new Error("Recipe not found");
        }
        // User can share their own recipes or shared recipes
        if (recipe.userId !== ctx.user.id && !recipe.isShared) {
          throw new Error("You can only share your own recipes or shared recipes");
        }
        // Enhance content with recipe info if not already included
        if (!input.content.includes(recipe.name)) {
          input.content = `🍳 Shared recipe: ${recipe.name}\n\n${input.content}`;
        }
      }
      
      const message = await db.createMessage({
        conversationId,
        senderId: ctx.user.id,
        content: input.content,
        isRead: false,
      });
      
      return message;
    }),

  shareRecipe: protectedProcedure
    .input(z.object({
      recipeId: z.number().int().positive(),
      recipientId: z.number().int().positive(),
      message: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.recipientId === ctx.user.id) {
        throw new Error("Cannot share recipe with yourself");
      }
      
      // Verify recipe exists and user has access
      const recipe = await db.getRecipeById(input.recipeId);
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      if (recipe.userId !== ctx.user.id && !recipe.isShared) {
        throw new Error("You can only share your own recipes or shared recipes");
      }
      
      // Get or create conversation
      const conversation = await db.getOrCreateConversation(ctx.user.id, input.recipientId);
      
      // Create message with recipe share
      const shareMessage = input.message 
        ? `🍳 Shared recipe: ${recipe.name}\n\n${input.message}`
        : `🍳 Shared recipe: ${recipe.name}\n\nCheck out this recipe!`;
      
      const message = await db.createMessage({
        conversationId: conversation.id,
        senderId: ctx.user.id,
        content: shareMessage,
        isRead: false,
      });
      
      return { message, conversationId: conversation.id };
    }),

  searchUsers: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(100),
    }))
    .query(async ({ ctx, input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");
      
      // Search users by name or email (excluding current user)
      const results = await dbInstance
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(
          and(
            ne(users.id, ctx.user.id),
            or(
              like(users.name, `%${input.query}%`),
              like(users.email, `%${input.query}%`)
            )
          )
        )
        .limit(20);
      
      return results;
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return db.getUnreadMessageCount(ctx.user.id);
  }),
});

const aiRouter = router({
  chat: optionalAuthProcedure
    .input(
      z.object({
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().min(1).max(2000),
            })
          )
          .min(1)
          .max(40),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || (await db.getOrCreateAnonymousUser());
      const systemPrompt = `
You are Sous, a friendly AI cooking assistant for the Sous app.
Provide concise, practical cooking advice rooted in user pantry items, dietary preferences, and goals.
User context:
- Name: ${user.name ?? "Chef"}
- Dietary preferences: ${user.dietaryPreferences ?? "not specified"}
- Allergies: ${user.allergies ?? "not specified"}
- Goals: ${user.goals ?? "not specified"}
Respond with actionable guidance and, when appropriate, bullet lists or short numbered steps.
`;

      const llmMessages: Parameters<typeof invokeLLM>[0]["messages"] = [
        { role: "system", content: systemPrompt },
        ...input.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ];

      const { invokeLLM } = await import("./_core/llm");
      const response = await invokeLLM({
        messages: llmMessages,
        maxTokens: 700,
      });

      const rawContent = response.choices[0]?.message?.content ?? "";
      const reply =
        typeof rawContent === "string"
          ? rawContent
          : Array.isArray(rawContent)
          ? rawContent
              .map((part) => {
                if (typeof part === "string") return part;
                if ("text" in part) return part.text;
                return "";
              })
              .join("\n")
          : "";

      return { reply: reply.trim() };
    }),

  generateRecipe: optionalAuthProcedure
    .input(
      z.object({
        prompt: z.string().min(10).max(2000),
        ingredients: z.array(z.string().min(1).max(100)).max(20).optional(),
        cuisine: z.string().min(2).max(60).optional(),
        servings: z.number().int().positive().max(16).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || (await db.getOrCreateAnonymousUser());
      const schema = {
        name: "generated_recipe",
        strict: true,
        schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            servings: { type: "integer" },
            cookingTime: { type: "integer" },
            tags: {
              type: "array",
              items: { type: "string" },
            },
            ingredients: {
              type: "array",
              minItems: 4,
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  unit: { type: "string" },
                },
                required: ["name"],
                additionalProperties: false,
              },
            },
            steps: {
              type: "array",
              minItems: 3,
              items: { type: "string" },
            },
          },
          required: ["name", "description", "ingredients", "steps"],
          additionalProperties: false,
        },
      } as const;

      const preferenceSummary = [
        input.cuisine ? `Preferred cuisine: ${input.cuisine}` : null,
        input.servings ? `Target servings: ${input.servings}` : null,
        input.ingredients && input.ingredients.length > 0
          ? `Focus on these ingredients: ${input.ingredients.join(", ")}`
          : null,
        user.dietaryPreferences ? `User dietary preferences: ${user.dietaryPreferences}` : null,
        user.allergies ? `Allergies to avoid: ${user.allergies}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const { invokeLLM } = await import("./_core/llm");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are Sous, an expert chef that crafts structured recipes for the Sous AI mobile app. Return flavorful, approachable dishes.",
          },
          {
            role: "user",
            content: `${input.prompt}\n${preferenceSummary}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: schema,
        },
        maxTokens: 900,
      });

      const rawContent = response.choices[0]?.message?.content;
      const jsonString =
        typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent ?? { name: "", description: "", ingredients: [], steps: [] });

      const parsed = JSON.parse(jsonString);

      return {
        recipe: {
          name: parsed.name,
          description: parsed.description,
          servings: parsed.servings ?? input.servings ?? null,
          cookingTime: parsed.cookingTime ?? null,
          tags: parsed.tags ?? [],
          ingredients: parsed.ingredients ?? [],
          steps: parsed.steps ?? [],
        },
      };
    }),
});

// Subscription router
const subscriptionRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await db.getSubscriptionByUserId(ctx.user.id);
    if (!subscription) {
      return null;
    }
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt,
      trialStart: subscription.trialStart,
      trialEnd: subscription.trialEnd,
    };
  }),

  hasActive: protectedProcedure.query(async ({ ctx }) => {
    return db.hasActiveSubscription(ctx.user.id);
  }),

  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        priceId: z.string().optional(),
        successUrl: z.string().url().optional(),
        cancelUrl: z.string().url().optional(),
      }).optional()
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': ctx.req.headers.cookie || '',
          'Authorization': ctx.req.headers.authorization || '',
        },
        body: JSON.stringify({
          priceId: input?.priceId,
          successUrl: input?.successUrl,
          cancelUrl: input?.cancelUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      return response.json();
    }),

  createCustomerPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stripe/customer-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': ctx.req.headers.cookie || '',
        'Authorization': ctx.req.headers.authorization || '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create customer portal session');
    }

    return response.json();
  }),

  getPayments: protectedProcedure
    .input(z.object({ limit: z.number().int().positive().max(100).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit || 50;
      return db.getPaymentsByUserId(ctx.user.id, limit);
    }),
});

// User router
const userRouter = router({
  getPreferences: optionalAuthProcedure.query(async ({ ctx }) => {
    const user = ctx.user || await db.getOrCreateAnonymousUser();
    const userData = await db.getUserById(user.id);
    if (!userData) {
      throw new Error("User not found");
    }
    
    return {
      dietaryPreferences: userData.dietaryPreferences 
        ? JSON.parse(userData.dietaryPreferences) as string[]
        : [],
      allergies: userData.allergies 
        ? JSON.parse(userData.allergies) as string[]
        : [],
      goals: userData.goals 
        ? JSON.parse(userData.goals) as Record<string, unknown>
        : null,
      calorieBudget: userData.calorieBudget ?? null,
    };
  }),

  updatePreferences: optionalAuthProcedure
    .input(
      z.object({
        dietaryPreferences: z.array(z.string()).optional(),
        allergies: z.array(z.string()).optional(),
        goals: z.record(z.unknown()).nullable().optional(),
        calorieBudget: z.number().int().positive().max(10000).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const updated = await db.updateUserPreferences(user.id, {
        dietaryPreferences: input.dietaryPreferences,
        allergies: input.allergies,
        goals: input.goals,
        calorieBudget: input.calorieBudget,
      });
      
      if (!updated) {
        throw new Error("Failed to update preferences");
      }
      
      return {
        dietaryPreferences: updated.dietaryPreferences 
          ? JSON.parse(updated.dietaryPreferences) as string[]
          : [],
        allergies: updated.allergies 
          ? JSON.parse(updated.allergies) as string[]
          : [],
        goals: updated.goals 
          ? JSON.parse(updated.goals) as Record<string, unknown>
          : null,
        calorieBudget: updated.calorieBudget ?? null,
      };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => {
      const user = opts.ctx.user;
      const authHeader = opts.ctx.req.headers.authorization || (opts.ctx.req.headers as Record<string, unknown>)["Authorization"];
      
      if (!user) {
        console.log("[Auth.me] No user in context - authentication may have failed");
        console.log("[Auth.me] Auth header present:", !!authHeader);
        if (authHeader && typeof authHeader === 'string') {
          const isBearer = authHeader.toLowerCase().startsWith('bearer ');
          console.log("[Auth.me] Is Bearer token:", isBearer);
          if (isBearer) {
            const token = authHeader.substring(7).trim();
            console.log("[Auth.me] Token length:", token.length, "Token preview:", token.substring(0, 20) + "...");
          }
        }
        // Return null explicitly so client knows auth failed
        return null;
      }
      if (!user.id) {
        console.error("[Auth.me] User object missing id field:", user);
        throw new Error("Invalid user object: missing id field");
      }
      console.log("[Auth.me] Returning user:", { id: user.id, openId: user.openId, name: user.name });
      return user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  recipes: recipeRouter,
  ingredients: ingredientRouter,
  shoppingLists: shoppingListRouter,
  notifications: notificationRouter,
  messages: messageRouter,
  ai: aiRouter,
  user: userRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
