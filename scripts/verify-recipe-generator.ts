/**
 * Verify the AI recipe generator (Gemini) is working
 * Usage: pnpm tsx scripts/verify-recipe-generator.ts
 */

import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local" });

async function verifyRecipeGenerator() {
  console.log("🔍 Verifying AI recipe generator (Gemini)...\n");

  const { invokeLLM } = await import("../server/_core/llm");
  const { ENV } = await import("../server/_core/env");

  if (!ENV.geminiApiKey) {
    console.error("❌ GEMINI_API_KEY is not set in .env or .env.local");
    process.exit(1);
  }
  console.log("✓ GEMINI_API_KEY is set");
  console.log(`  Model: ${ENV.geminiModel}\n`);

  const ingredients = ["chicken breast", "rice", "onion"];
  const prompt = `Generate a recipe that uses ONLY these ingredients: ${ingredients.join(", ")}.

Return a JSON object with:
- name: Recipe name
- description: Brief description
- ingredients: Array of {name, quantity, unit} using ONLY the provided ingredients
- instructions: Step-by-step cooking instructions
- cookingTime: Estimated time in minutes
- servings: Number of servings
- difficulty: "easy", "medium", or "hard"`;

  console.log("📤 Sending recipe generation request...");
  const start = Date.now();

  try {
    const response = await invokeLLM({
      model: ENV.geminiModel,
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pantry_recipe",
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
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
                },
              },
              instructions: { type: "string" },
              cookingTime: { type: "number" },
              servings: { type: "number" },
              difficulty: {
                type: "string",
                enum: ["easy", "medium", "hard"],
              },
            },
            required: ["name", "ingredients", "instructions"],
          },
        },
      },
    });

    const elapsed = Date.now() - start;
    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      console.error("❌ No content in LLM response");
      process.exit(1);
    }

    const text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.find((c: { type?: string; text?: string }) => c.type === "text")?.text ?? ""
          : "";
    const recipe = JSON.parse(text);

    if (!recipe.name || !recipe.ingredients?.length || !recipe.instructions) {
      console.error("❌ Invalid recipe structure:", recipe);
      process.exit(1);
    }

    console.log(`✓ Response received in ${elapsed}ms\n`);
    console.log("📋 Generated recipe:");
    console.log(`   Name: ${recipe.name}`);
    console.log(`   Difficulty: ${recipe.difficulty ?? "N/A"}`);
    console.log(`   Cooking time: ${recipe.cookingTime ?? "N/A"} min`);
    console.log(`   Servings: ${recipe.servings ?? "N/A"}`);
    console.log(`   Ingredients: ${recipe.ingredients.length}`);
    console.log(`   Instructions: ${(recipe.instructions || "").slice(0, 80)}...`);
    console.log("\n✅ AI recipe generator is working correctly!");
  } catch (err) {
    console.error("\n❌ Recipe generation failed:", err);
    process.exit(1);
  }
}

verifyRecipeGenerator();
