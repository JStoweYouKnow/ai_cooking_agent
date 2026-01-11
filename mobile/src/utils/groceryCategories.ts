/**
 * Grocery store category mappings
 * Maps ingredient categories to typical grocery store sections
 */

export type GroceryCategory =
  | 'Produce'
  | 'Dairy & Eggs'
  | 'Meat & Seafood'
  | 'Bakery'
  | 'Pantry & Canned Goods'
  | 'Frozen Foods'
  | 'Beverages'
  | 'Condiments & Sauces'
  | 'Spices & Seasonings'
  | 'Snacks'
  | 'Other';

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  'Produce',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Bakery',
  'Pantry & Canned Goods',
  'Frozen Foods',
  'Beverages',
  'Condiments & Sauces',
  'Spices & Seasonings',
  'Snacks',
  'Other',
];

/**
 * Category emoji icons for visual identification
 */
export const CATEGORY_ICONS: Record<GroceryCategory, string> = {
  'Produce': '🥬',
  'Dairy & Eggs': '🥛',
  'Meat & Seafood': '🥩',
  'Bakery': '🍞',
  'Pantry & Canned Goods': '🥫',
  'Frozen Foods': '🧊',
  'Beverages': '🥤',
  'Condiments & Sauces': '🧂',
  'Spices & Seasonings': '🌿',
  'Snacks': '🍿',
  'Other': '🛒',
};

/**
 * Maps database ingredient categories to grocery store categories
 */
const CATEGORY_MAPPING: Record<string, GroceryCategory> = {
  // Produce
  'vegetable': 'Produce',
  'vegetables': 'Produce',
  'fruit': 'Produce',
  'fruits': 'Produce',
  'produce': 'Produce',
  'greens': 'Produce',
  'herbs': 'Produce',
  'fresh herbs': 'Spices & Seasonings',

  // Dairy & Eggs
  'dairy': 'Dairy & Eggs',
  'cheese': 'Dairy & Eggs',
  'milk': 'Dairy & Eggs',
  'eggs': 'Dairy & Eggs',
  'yogurt': 'Dairy & Eggs',
  'butter': 'Dairy & Eggs',
  'cream': 'Dairy & Eggs',

  // Meat & Seafood
  'meat': 'Meat & Seafood',
  'beef': 'Meat & Seafood',
  'pork': 'Meat & Seafood',
  'chicken': 'Meat & Seafood',
  'poultry': 'Meat & Seafood',
  'fish': 'Meat & Seafood',
  'seafood': 'Meat & Seafood',
  'shellfish': 'Meat & Seafood',

  // Bakery
  'bakery': 'Bakery',
  'bread': 'Bakery',
  'baked goods': 'Bakery',
  'pastry': 'Bakery',

  // Pantry
  'pantry': 'Pantry & Canned Goods',
  'grains': 'Pantry & Canned Goods',
  'pasta': 'Pantry & Canned Goods',
  'rice': 'Pantry & Canned Goods',
  'beans': 'Pantry & Canned Goods',
  'legumes': 'Pantry & Canned Goods',
  'canned': 'Pantry & Canned Goods',
  'canned goods': 'Pantry & Canned Goods',
  'dry goods': 'Pantry & Canned Goods',
  'flour': 'Pantry & Canned Goods',
  'baking': 'Pantry & Canned Goods',

  // Frozen
  'frozen': 'Frozen Foods',
  'frozen foods': 'Frozen Foods',
  'ice cream': 'Frozen Foods',

  // Beverages
  'beverages': 'Beverages',
  'drinks': 'Beverages',
  'juice': 'Beverages',
  'soda': 'Beverages',
  'coffee': 'Beverages',
  'tea': 'Beverages',

  // Condiments & Sauces
  'condiments': 'Condiments & Sauces',
  'sauces': 'Condiments & Sauces',
  'oils': 'Condiments & Sauces',
  'vinegar': 'Condiments & Sauces',
  'dressings': 'Condiments & Sauces',

  // Spices
  'spices': 'Spices & Seasonings',
  'seasonings': 'Spices & Seasonings',
  'spice': 'Spices & Seasonings',

  // Snacks
  'snacks': 'Snacks',
  'chips': 'Snacks',
  'crackers': 'Snacks',
  'nuts': 'Snacks',
  'candy': 'Snacks',
  'sweets': 'Snacks',
};

/**
 * Determine the grocery category for an ingredient
 */
export function getGroceryCategory(ingredientCategory?: string | null, ingredientName?: string): GroceryCategory {
  // Try category first
  if (ingredientCategory) {
    const normalized = ingredientCategory.toLowerCase().trim();
    const mapped = CATEGORY_MAPPING[normalized];
    if (mapped) return mapped;
  }

  // Try ingredient name patterns
  if (ingredientName) {
    const name = ingredientName.toLowerCase();

    // Spices & Seasonings patterns (check first to avoid conflicts)
    if (/(salt|pepper|black pepper|white pepper|ground pepper|paprika|cumin|oregano|basil|thyme|rosemary|cinnamon|nutmeg|ginger|garlic powder|onion powder|cayenne|chili powder|curry|turmeric|cardamom|clove|allspice|bay leaf|sage|dill|parsley|cilantro|tarragon|marjoram|sprig|coriander|ground coriander|coriander seed|coriander seeds|fennel|star anise|saffron|sumac|za'atar|harissa)/i.test(name)) {
      return 'Spices & Seasonings';
    }

    // Condiments & Sauces patterns (check before Pantry)
    if (/(sauce|mayo|mayonnaise|mustard|dijon|ketchup|oil|olive oil|vegetable oil|canola oil|vinegar|balsamic|dressing|soy sauce|worcestershire|hot sauce|sriracha|tahini|honey|syrup|maple syrup|molasses)/i.test(name)) {
      return 'Condiments & Sauces';
    }

    // Produce patterns
    if (/(tomato|lettuce|spinach|kale|carrot|onion|garlic|bell pepper|jalapeño|chili pepper|potato|sweet potato|broccoli|cauliflower|cucumber|celery|mushroom|zucchini|squash|cabbage|brussels sprout|asparagus|green bean|pea|corn|avocado|apple|banana|orange|lemon|lime|berry|berries|strawberry|blueberry|raspberry|grape|melon|watermelon|pineapple|mango|peach|pear|plum|cherry|shallot|scallion|leek)/i.test(name)) {
      return 'Produce';
    }

    // Dairy & Eggs patterns
    if (/(milk|cheese|yogurt|butter|unsalted butter|salted butter|cream|heavy cream|sour cream|whipping cream|cottage cheese|ricotta|parmesan|mozzarella|cheddar|swiss|brie|feta|goat cheese|cream cheese|egg|eggs)/i.test(name)) {
      return 'Dairy & Eggs';
    }

    // Meat & Seafood patterns
    if (/(beef|pork|chicken|turkey|lamb|bacon|sausage|ham|prosciutto|salami|pepperoni|ground beef|ground pork|ground turkey|steak|ribeye|sirloin|tenderloin|chop|breast|thigh|wing|drumstick|ribs|brisket|roast|veal)/i.test(name)) {
      return 'Meat & Seafood';
    }

    // Seafood patterns
    if (/(fish|salmon|tuna|shrimp|prawns|crab|lobster|tilapia|cod|halibut|scallop|clam|mussel|oyster|sardine|anchovy|mackerel|trout|sea bass)/i.test(name)) {
      return 'Meat & Seafood';
    }

    // Frozen Foods patterns (check before Bakery)
    if (/(frozen|ice cream|sorbet|sherbet|frozen vegetable|frozen fruit|frozen pizza|popsicle|puff pastry|phyllo)/i.test(name)) {
      return 'Frozen Foods';
    }

    // Bakery patterns
    if (/(bread|bun|roll|bagel|tortilla|pita|croissant|baguette|naan|focaccia|ciabatta|sourdough|rye bread|wheat bread|white bread|english muffin|dinner roll)/i.test(name)) {
      return 'Bakery';
    }

    // Beverages patterns
    if (/(wine|red wine|white wine|champagne|beer|ale|liquor|vodka|whiskey|rum|gin|tequila|port|sherry|vermouth|brandy|cognac|sake|juice|soda|coffee|tea|water|milk|almond milk|soy milk)/i.test(name)) {
      return 'Beverages';
    }

    // Pantry patterns
    if (/(rice|pasta|spaghetti|penne|macaroni|noodle|flour|all-purpose flour|wheat flour|sugar|brown sugar|powdered sugar|bean|black bean|kidney bean|chickpea|lentil|oat|oatmeal|quinoa|couscous|barley|can|canned|stock|broth|bouillon|cereal|granola)/i.test(name)) {
      return 'Pantry & Canned Goods';
    }

    // Snacks patterns
    if (/(chip|chips|cracker|pretzel|popcorn|nut|peanut|almond|cashew|walnut|pecan|pistachio|candy|chocolate|cookie|brownie|cake|pie)/i.test(name)) {
      return 'Snacks';
    }
  }

  return 'Other';
}

/**
 * Group items by grocery category
 */
export function groupItemsByCategory<T extends { ingredientName?: string; category?: string | null }>(
  items: T[]
): Map<GroceryCategory, T[]> {
  const grouped = new Map<GroceryCategory, T[]>();

  // Initialize all categories
  GROCERY_CATEGORIES.forEach(cat => grouped.set(cat, []));

  // Group items
  items.forEach(item => {
    const category = getGroceryCategory(item.category, item.ingredientName);
    const existing = grouped.get(category) || [];
    grouped.set(category, [...existing, item]);
  });

  // Remove empty categories
  GROCERY_CATEGORIES.forEach(cat => {
    if (grouped.get(cat)?.length === 0) {
      grouped.delete(cat);
    }
  });

  return grouped;
}
