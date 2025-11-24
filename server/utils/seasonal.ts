/**
 * Seasonal recipe recommendation utilities
 */

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

/**
 * Get the current season based on the date
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // 1-12
  
  // Northern Hemisphere seasons
  // Spring: March (3), April (4), May (5)
  // Summer: June (6), July (7), August (8)
  // Fall: September (9), October (10), November (11)
  // Winter: December (12), January (1), February (2)
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/**
 * Seasonal ingredient keywords that indicate a recipe is seasonal
 */
const SEASONAL_KEYWORDS: Record<Season, string[]> = {
  spring: [
    'asparagus', 'peas', 'artichoke', 'radish', 'spinach', 'lettuce', 'strawberry',
    'rhubarb', 'lemon', 'mint', 'basil', 'chive', 'dill', 'fennel', 'carrot',
    'green onion', 'scallion', 'spring onion', 'ramp', 'pea shoots', 'watercress'
  ],
  summer: [
    'tomato', 'corn', 'zucchini', 'cucumber', 'bell pepper', 'eggplant', 'squash',
    'berry', 'peach', 'cherry', 'watermelon', 'melon', 'apricot', 'plum',
    'basil', 'cilantro', 'mint', 'oregano', 'thyme', 'rosemary', 'corn',
    'green bean', 'okra', 'pepper'
  ],
  fall: [
    'pumpkin', 'squash', 'sweet potato', 'apple', 'pear', 'cranberry', 'fig',
    'pomegranate', 'persimmon', 'quince', 'brussels sprout', 'cauliflower',
    'broccoli', 'cabbage', 'kale', 'mushroom', 'root vegetable', 'beet',
    'turnip', 'parsnip', 'sage', 'rosemary', 'thyme', 'nutmeg', 'cinnamon'
  ],
  winter: [
    'citrus', 'orange', 'grapefruit', 'clementine', 'mandarin', 'pomegranate',
    'cabbage', 'kale', 'collard', 'brussels sprout', 'broccoli', 'cauliflower',
    'root vegetable', 'potato', 'carrot', 'beet', 'turnip', 'parsnip',
    'winter squash', 'butternut', 'acorn squash', 'chestnut', 'date',
    'cinnamon', 'nutmeg', 'clove', 'ginger', 'sage', 'rosemary'
  ]
};

/**
 * Seasonal cuisine types that are more popular in certain seasons
 */
const SEASONAL_CUISINES: Record<Season, string[]> = {
  spring: ['Mediterranean', 'French', 'Italian', 'Japanese'],
  summer: ['Mediterranean', 'Mexican', 'Thai', 'Vietnamese', 'Greek'],
  fall: ['American', 'Italian', 'French', 'German', 'Eastern European'],
  winter: ['Comfort Food', 'American', 'Italian', 'French', 'Indian', 'Chinese']
};

/**
 * Check if a recipe name or description contains seasonal keywords
 */
export function isSeasonalRecipe(
  recipe: { name?: string | null; description?: string | null; cuisine?: string | null },
  season: Season = getCurrentSeason()
): boolean {
  const text = `${recipe.name || ''} ${recipe.description || ''}`.toLowerCase();
  const keywords = SEASONAL_KEYWORDS[season];
  
  // Check if any seasonal keyword appears in the recipe text
  const hasSeasonalKeyword = keywords.some(keyword => text.includes(keyword));
  
  // Check if cuisine matches seasonal preferences
  const hasSeasonalCuisine = recipe.cuisine && 
    SEASONAL_CUISINES[season].some(cuisine => 
      recipe.cuisine?.toLowerCase().includes(cuisine.toLowerCase())
    );
  
  return hasSeasonalKeyword || hasSeasonalCuisine || false;
}

/**
 * Get seasonal preference score for a recipe (0-1, higher is more seasonal)
 */
export function getSeasonalScore(
  recipe: { name?: string | null; description?: string | null; cuisine?: string | null },
  season: Season = getCurrentSeason()
): number {
  let score = 0;
  const text = `${recipe.name || ''} ${recipe.description || ''}`.toLowerCase();
  const keywords = SEASONAL_KEYWORDS[season];
  const cuisines = SEASONAL_CUISINES[season];
  
  // Count keyword matches (up to 0.6 points)
  const keywordMatches = keywords.filter(keyword => text.includes(keyword)).length;
  score += Math.min(keywordMatches * 0.1, 0.6);
  
  // Check cuisine match (0.3 points)
  if (recipe.cuisine && cuisines.some(c => recipe.cuisine?.toLowerCase().includes(c.toLowerCase()))) {
    score += 0.3;
  }
  
  // Bonus for multiple matches (0.1 points)
  if (keywordMatches > 2) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

