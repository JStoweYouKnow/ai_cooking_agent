
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, optionalAuthProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { parseRecipeFromUrl } from "./_core/recipeParsing";
import { exportShoppingList, getMimeType, getFileExtension } from "./services/export";
import fs from "fs";
import unzipper from "unzipper";
import path from "path";

// Recipe router
const recipeRouter = router({
  list: optionalAuthProcedure.query(async ({ ctx }) => {
    const user = ctx.user || await db.getOrCreateAnonymousUser();
    return db.getUserRecipes(user.id);
  }),

  getById: optionalAuthProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const recipe = await db.getRecipeById(input.id);
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      // Verify ownership
      if (recipe.userId !== user.id) {
        throw new Error("Unauthorized: You can only view your own recipes");
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
      const user = ctx.user || await db.getOrCreateAnonymousUser();
      const parsed = await parseRecipeFromUrl(input.url);
      if (!parsed) {
        try {
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
          
          await db.createRecipe({
            name: fallback.name,
            description: descriptionStr,
            instructions: instructionsStr,
            imageUrl: typeof fallback.imageUrl === "string" ? fallback.imageUrl : undefined,
            cuisine: typeof fallback.cuisine === "string" ? fallback.cuisine : undefined,
            category: typeof fallback.category === "string" ? fallback.category : undefined,
            cookingTime: typeof fallback.cookingTime === "number" ? fallback.cookingTime : undefined,
            servings: typeof fallback.servings === "number" ? fallback.servings : undefined,
            caloriesPerServing: typeof fallback.caloriesPerServing === "number" ? fallback.caloriesPerServing : undefined,
            sourceUrl: input.url,
            userId: user.id,
            source: "url_import",
          });
          const recipes = await db.getUserRecipes(user.id);
          const created = recipes[recipes.length - 1];
          if (created && Array.isArray(fallback.ingredients)) {
            for (const ing of fallback.ingredients) {
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
        } catch (e) {
          console.error("Error parsing recipe via LLM:", e);
          throw new Error("Failed to parse recipe from URL");
        }
      }

      if (!input.autoSave) {
        return { parsed };
      }

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
      
      await db.createRecipe({
        name: parsed.name,
        description: descriptionStr,
        instructions: instructionsStr,
        imageUrl: typeof parsed.imageUrl === "string" ? parsed.imageUrl : undefined,
        cuisine: typeof parsed.cuisine === "string" ? parsed.cuisine : undefined,
        category: typeof parsed.category === "string" ? parsed.category : undefined,
        cookingTime: typeof parsed.cookingTime === "number" ? parsed.cookingTime : undefined,
        servings: typeof parsed.servings === "number" ? parsed.servings : undefined,
        caloriesPerServing: (parsed as any).caloriesPerServing && typeof (parsed as any).caloriesPerServing === "number" ? (parsed as any).caloriesPerServing : undefined,
        sourceUrl: typeof parsed.sourceUrl === "string" ? parsed.sourceUrl : undefined,
        userId: user.id,
        source: typeof parsed.source === "string" ? parsed.source : "url_import",
      });
      const recipes = await db.getUserRecipes(user.id);
      const created = recipes[recipes.length - 1];
      if (created && parsed.ingredients?.length) {
        for (const ing of parsed.ingredients) {
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
    }),
  toggleFavorite: optionalAuthProcedure
    .input(z.object({ id: z.number().int().positive(), isFavorite: z.boolean() }))
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
      return db.updateRecipeFavorite(input.id, input.isFavorite);
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
      // Verify ownership
      if (recipe.userId !== user.id) {
        throw new Error("Unauthorized: You can only view ingredients from your own recipes");
      }
      return db.getRecipeIngredients(input.recipeId);
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
    .input(z.object({ name: z.string().min(1).max(255), category: z.string().max(100).optional(), imageUrl: z.string().url().max(1000).optional() }))
    .mutation(async ({ input }) => {
      const ingredient = await db.getOrCreateIngredient(input.name, input.category);
      // If imageUrl is provided and ingredient doesn't have one, update it
      if (input.imageUrl && !ingredient.imageUrl) {
        await db.updateIngredientImage(ingredient.id, input.imageUrl);
        return { ...ingredient, imageUrl: input.imageUrl };
      }
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
                  text: "List all the ingredients you can see in this image. Return as a JSON array of ingredient names only, nothing else.",
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
                      type: "string",
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
        return parsed.ingredients || [];
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
      } catch (error) {
        console.error("Error uploading image:", error);
        throw new Error("Failed to upload image. Check S3 configuration.");
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

      // Verify recipe ownership
      const recipe = await db.getRecipeById(input.recipeId);
      if (!recipe) {
        throw new Error("Recipe not found");
      }
      if (recipe.userId !== user.id) {
        throw new Error("Unauthorized: You can only add ingredients from your own recipes");
      }

      const recipeIngredients = await db.getRecipeIngredients(input.recipeId);

      for (const ri of recipeIngredients) {
        await db.addShoppingListItem({
          shoppingListId: input.shoppingListId,
          ingredientId: ri.ingredientId,
          quantity: ri.quantity,
          unit: ri.unit,
        });
      }

      return { success: true };
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
      
      const message = await db.createMessage({
        conversationId,
        senderId: ctx.user.id,
        content: input.content,
        isRead: false,
      });
      
      return message;
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return db.getUnreadMessageCount(ctx.user.id);
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
    me: publicProcedure.query((opts) => opts.ctx.user),
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
  user: userRouter,
});

export type AppRouter = typeof appRouter;
