/**
 * Recipe parsing service
 * Supports schema.org Recipe markup and AI fallback
 */

// Dynamic import to avoid module evaluation during build
import type { InvokeParams, InvokeResult } from '../_core/llm';

interface ParsedRecipe {
  name: string;
  description?: string;
  instructions: string;
  imageUrl?: string;
  cuisine?: string;
  category?: string;
  cookingTime?: number;
  servings?: number;
  sourceUrl: string;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
}

/**
 * Parse recipe from URL using schema.org Recipe markup
 */
export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Try to extract schema.org JSON-LD recipe data
    const schemaRecipe = extractSchemaOrgRecipe(html);
    if (schemaRecipe) {
      return schemaRecipe;
    }

    // Fallback to AI parsing
    return await parseRecipeWithAI(html, url);
  } catch (error) {
    console.error('Error parsing recipe from URL:', error);
    return null;
  }
}

/**
 * Extract schema.org Recipe from HTML
 */
function extractSchemaOrgRecipe(html: string): ParsedRecipe | null {
  try {
    // Find JSON-LD script tags
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    for (const match of jsonLdMatches) {
      try {
        const json = JSON.parse(match[1]);

        // Handle single recipe or array of objects
        const recipes = Array.isArray(json) ? json : [json];

        for (const item of recipes) {
          // Check if it's a Recipe type (including nested @graph)
          const recipe = findRecipeInObject(item);
          if (recipe) {
            return normalizeSchemaRecipe(recipe);
          }
        }
      } catch (e) {
        // Skip invalid JSON
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting schema.org recipe:', error);
    return null;
  }
}

/**
 * Recursively find Recipe object in schema.org data
 */
function findRecipeInObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return null;

  // Check if current object is a Recipe
  const type = obj['@type'];
  if (type && (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe')))) {
    return obj;
  }

  // Check @graph array
  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph']) {
      const recipe = findRecipeInObject(item);
      if (recipe) return recipe;
    }
  }

  return null;
}

/**
 * Normalize schema.org Recipe to our format
 */
function normalizeSchemaRecipe(recipe: any): ParsedRecipe {
  const ingredients = normalizeIngredients(recipe.recipeIngredient || []);
  const instructions = normalizeInstructions(recipe.recipeInstructions);

  return {
    name: recipe.name || 'Untitled Recipe',
    description: recipe.description || undefined,
    instructions,
    imageUrl: normalizeImage(recipe.image),
    cuisine: recipe.recipeCuisine || undefined,
    category: recipe.recipeCategory || undefined,
    cookingTime: normalizeDuration(recipe.totalTime || recipe.cookTime),
    servings: normalizeServings(recipe.recipeYield),
    sourceUrl: recipe.url || '',
    ingredients,
  };
}

/**
 * Normalize ingredients from various formats
 */
function normalizeIngredients(ingredientData: any): Array<{ name: string; quantity?: string; unit?: string }> {
  if (!Array.isArray(ingredientData)) return [];

  return ingredientData.map(item => {
    if (typeof item === 'string') {
      // Parse "2 cups flour" format
      return parseIngredientString(item);
    }
    return { name: item.name || item, quantity: item.quantity, unit: item.unit };
  });
}

/**
 * Parse ingredient string like "2 cups flour"
 */
function parseIngredientString(str: string): { name: string; quantity?: string; unit?: string } {
  const match = str.match(/^([\d\s/.]+)?\s*([a-z]+)?\s*(.+)$/i);
  if (match) {
    return {
      quantity: match[1]?.trim() || undefined,
      unit: match[2]?.trim() || undefined,
      name: match[3]?.trim() || str,
    };
  }
  return { name: str };
}

/**
 * Normalize instructions from various formats
 */
function normalizeInstructions(instructionsData: any): string {
  if (!instructionsData) return '';

  if (typeof instructionsData === 'string') {
    return instructionsData;
  }

  if (Array.isArray(instructionsData)) {
    return instructionsData
      .map((item, index) => {
        if (typeof item === 'string') return `${index + 1}. ${item}`;
        if (item.text) return `${index + 1}. ${item.text}`;
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }

  if (instructionsData.text) {
    return instructionsData.text;
  }

  return JSON.stringify(instructionsData);
}

/**
 * Normalize image URL
 */
function normalizeImage(imageData: any): string | undefined {
  if (!imageData) return undefined;

  if (typeof imageData === 'string') return imageData;
  if (imageData.url) return imageData.url;
  if (Array.isArray(imageData) && imageData.length > 0) {
    return normalizeImage(imageData[0]);
  }

  return undefined;
}

/**
 * Parse ISO 8601 duration to minutes
 */
function normalizeDuration(duration: any): number | undefined {
  if (!duration) return undefined;
  if (typeof duration === 'number') return duration;

  // Parse ISO 8601 duration (e.g., "PT30M" = 30 minutes)
  const match = String(duration).match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (match) {
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    return hours * 60 + minutes;
  }

  return undefined;
}

/**
 * Normalize servings/yield
 */
function normalizeServings(yieldData: any): number | undefined {
  if (!yieldData) return undefined;
  if (typeof yieldData === 'number') return yieldData;

  // Extract number from strings like "4 servings" or "Serves 6"
  const match = String(yieldData).match(/(\d+)/);
  return match ? parseInt(match[1]) : undefined;
}

/**
 * Parse recipe using AI (fallback when schema.org not available)
 */
async function parseRecipeWithAI(html: string, url: string): Promise<ParsedRecipe | null> {
  try {
    // Remove script tags and clean HTML
    const cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Limit to 8000 chars

    const { invokeLLM } = await import('../_core/llm');
    const response = await invokeLLM({
      messages: [
        {
          role: 'user',
          content: `Extract recipe information from this HTML content. Return JSON with: name, description, instructions (step by step), ingredients (array of {name, quantity, unit}), cookingTime (minutes), servings.

HTML:
${cleanHtml}

Return valid JSON only.`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'recipe_extraction',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              instructions: { type: 'string' },
              ingredients: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    quantity: { type: 'string' },
                    unit: { type: 'string' },
                  },
                  required: ['name'],
                  additionalProperties: false,
                },
              },
              cookingTime: { type: 'number' },
              servings: { type: 'number' },
            },
            required: ['name', 'instructions', 'ingredients'],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse(response.choices[0].message.content as string);

    return {
      ...parsed,
      sourceUrl: url,
      source: 'AI Parsed',
    };
  } catch (error) {
    console.error('Error parsing recipe with AI:', error);
    return null;
  }
}
