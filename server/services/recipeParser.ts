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
    const response = await fetch(url, {
      headers: {
        // Helps sites like Epicurious/NYT return full HTML instead of lightweight/blocked responses
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    const html = await response.text();

    // Try to extract schema.org JSON-LD recipe data
    const schemaRecipe = extractSchemaOrgRecipe(html);
    if (schemaRecipe) {
      return schemaRecipe;
    }

    // Heuristic extraction for sites without clean JSON-LD (e.g., NYT Cooking, Epicurious)
    const heuristic = extractHeuristicRecipe(html, url);
    if (heuristic) {
      return heuristic;
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
    // Preserve structure better for the LLM by keeping line breaks around blocks
    const cleanHtml = cleanAndChunkHtml(html).slice(0, 15000);

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

/**
 * Preserve some structure while stripping tags for heuristics/LLM
 */
function cleanAndChunkHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Replace common block tags with newlines to keep section boundaries
  const withBreaks = withoutScripts
    .replace(/<\/(p|div|li|ul|ol|section|article|br|h[1-6])>/gi, '\n')
    .replace(/<(br|hr)\s*\/?>/gi, '\n');

  const textOnly = withBreaks
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r?\n\s*\r?\n/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\n\s*/g, '\n')
    .trim();

  return textOnly;
}

/**
 * Heuristic extraction for sites that hide JSON-LD (e.g., NYT Cooking)
 */
function extractHeuristicRecipe(html: string, url: string): ParsedRecipe | null {
  try {
    const cleanText = cleanAndChunkHtml(html);

    const metaTitle =
      extractMetaContent(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      extractMetaContent(html, /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i) ||
      extractMetaContent(html, /<title>([^<]+)<\/title>/i);

    const ingredients = extractSectionList(cleanText, /(ingredients?)/i, /(preparation|directions?|steps?|method|instructions)/i);
    const steps = extractSectionList(cleanText, /(preparation|directions?|steps?|method|instructions)/i, /(notes?|tips?)/i);

    if (!metaTitle && ingredients.length === 0 && steps.length === 0) {
      return null;
    }

    return {
      name: metaTitle || 'Untitled Recipe',
      description: undefined,
      instructions: steps.length ? steps.map((s, i) => `${i + 1}. ${s}`).join('\n\n') : '',
      imageUrl: extractMetaContent(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
      cuisine: undefined,
      category: undefined,
      cookingTime: extractCookingTimeFromText(cleanText),
      servings: extractServingsFromText(cleanText),
      sourceUrl: url,
      ingredients: ingredients.map(parseIngredientString),
    };
  } catch (error) {
    console.warn('Heuristic extraction failed:', error);
    return null;
  }
}

function extractMetaContent(html: string, regex: RegExp): string | undefined {
  const match = html.match(regex);
  return match?.[1]?.trim() || undefined;
}

function extractSectionList(text: string, startRegex: RegExp, stopRegex: RegExp): string[] {
  const lower = text.toLowerCase();
  const startMatch = lower.search(startRegex);
  if (startMatch === -1) return [];

  const stopMatch = lower.slice(startMatch + 1).search(stopRegex);
  const sliceEnd = stopMatch === -1 ? text.length : startMatch + 1 + stopMatch;

  const section = text.slice(startMatch, sliceEnd);
  // Split on newlines and common bullet separators
  const rawLines = section
    .replace(/•/g, '\n')
    .replace(/·/g, '\n')
    .split('\n');

  return rawLines
    .map((line) => line.trim())
    .flatMap((line) => line.split(/^\s*-\s*/)) // split leading dashes
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !startRegex.test(line) && !stopRegex.test(line));
}

function extractCookingTimeFromText(text: string): number | undefined {
  const timeMatch = text.match(/(\d+)\s*(minutes|min|hours|hrs|hr)/i);
  if (!timeMatch) return undefined;
  const value = parseInt(timeMatch[1], 10);
  if (isNaN(value)) return undefined;
  const unit = timeMatch[2]?.toLowerCase();
  return unit.startsWith('hour') || unit.startsWith('hr') ? value * 60 : value;
}

function extractServingsFromText(text: string): number | undefined {
  const servingsMatch = text.match(/serves?\s*(\d+)/i) || text.match(/yield[:\s]+(\d+)/i);
  return servingsMatch ? parseInt(servingsMatch[1], 10) : undefined;
}
