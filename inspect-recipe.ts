
import { db } from "./server/db.ts";
import { recipes, recipeIngredients, ingredients } from "./drizzle/schema-postgres.ts";
import { eq } from "drizzle-orm";

async function inspectRecipe(id: number) {
    console.log(`Inspecting recipe ID: ${id}`);

    const recipe = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
    if (!recipe[0]) {
        console.log("Recipe not found");
        return;
    }

    console.log("Recipe Name:", recipe[0].name);
    console.log("JSONB Ingredients:", JSON.stringify(recipe[0].ingredients, null, 2));

    const junctionIngredients = await db.select({
        ri_id: recipeIngredients.id,
        quantity: recipeIngredients.quantity,
        unit: recipeIngredients.unit,
        i_name: ingredients.name,
    })
        .from(recipeIngredients)
        .leftJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
        .where(eq(recipeIngredients.recipeId, id));

    console.log("Junction Table Ingredients (with Join):");
    junctionIngredients.forEach((ing, i) => {
        console.log(`${i + 1}. Q: "${ing.quantity}", U: "${ing.unit}", N: "${ing.i_name}"`);
    });
}

const recipeId = parseInt(process.argv[2]) || 1;
inspectRecipe(recipeId).catch(console.error);
