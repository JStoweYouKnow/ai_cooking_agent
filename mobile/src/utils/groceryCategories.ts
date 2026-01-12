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
    // Check for "ground [spice]" pattern first to catch ground coriander, ground cumin, etc.
    if (/^ground\s+(coriander|cumin|ginger|turmeric|cardamom|clove|allspice|nutmeg|cinnamon|pepper|black pepper|white pepper|red pepper|chili|paprika|fennel|star anise|saffron|anise|aniseed|caraway|celery seed|fenugreek|mace|mustard|poppy|sesame)/i.test(name)) {
      return 'Spices & Seasonings';
    }
    // Check for common spice blends and seasonings
    if (/(garam masala|five spice|seven spice|pumpkin spice|apple pie spice|chinese five spice|ras el hanout|berbere|jerk seasoning|old bay|taco seasoning|chili seasoning|italian seasoning|herbes de provence|bouquet garni|adobo|jerk|za'atar|harissa|baharat|dukkah)/i.test(name)) {
      return 'Spices & Seasonings';
    }
    // Herbs and fresh herbs (check before other patterns to avoid conflicts)
    if (/(\bsage\b|\bsage leaves\b|\bparsley\b|\bflat-leaf parsley\b|\bcurly parsley\b|\bitalian parsley\b|\bthyme\b|\bfresh thyme\b|\bdried thyme\b|\bbay leaf\b|\bbay leaves\b|\brosemary\b|\bfresh rosemary\b|\bdried rosemary\b|\bbasil\b|\bfresh basil\b|\bdried basil\b|\boregano\b|\bfresh oregano\b|\bdried oregano\b|\bdill\b|\bdill weed\b|\bfresh dill\b|\bcilantro\b|\bfresh cilantro\b|\bchives\b|\bchive\b|\btarragon\b|\bfresh tarragon\b|\bmarjoram\b|\bfresh marjoram\b|\bmint\b|\bspearmint\b|\bpeppermint\b|\bfresh mint\b|\bchervil\b|\bfresh chervil\b|\blemon verbena\b|\bherb\b|\bherbs\b|\bfresh herbs\b|\bdried herbs\b|\bherb mix\b|\bherb mixture\b|\bsprig\b|\bsprigs\b)/i.test(name)) {
      return 'Spices & Seasonings';
    }
    // Comprehensive spice and herb patterns
    if (/(salt|sea salt|kosher salt|table salt|pepper|black pepper|white pepper|red pepper|pink pepper|green pepper|ground pepper|whole pepper|peppercorn|paprika|smoked paprika|hungarian paprika|sweet paprika|cumin|cumin seed|ground cumin|oregano|basil|thyme|rosemary|cinnamon|ground cinnamon|cinnamon stick|nutmeg|ground nutmeg|mace|ginger|ground ginger|fresh ginger|garlic powder|garlic salt|onion powder|onion salt|cayenne|cayenne pepper|chili powder|chili flakes|red pepper flakes|curry|curry powder|turmeric|ground turmeric|cardamom|cardamom pod|cardamom seed|clove|whole clove|ground clove|allspice|ground allspice|bay leaf|bay leaves|sage|dill|dill weed|dill seed|parsley|cilantro|coriander|ground coriander|coriander seed|coriander seeds|fennel|fennel seed|star anise|saffron|sumac|anise|aniseed|caraway|caraway seed|celery seed|celery salt|fenugreek|fenugreek seed|juniper|juniper berry|mustard seed|mustard powder|dry mustard|nigella|nigella seed|black seed|poppy seed|sesame seed|sesame|toasted sesame|chives|chive|tarragon|marjoram|sprig|spearmint|mint|peppermint|lemongrass|kaffir lime|kaffir lime leaf|galangal|lemongrass|korean chili|gochugaru|aleppo pepper|urfa biber|chipotle|chipotle powder|smoked paprika|pimenton|annatto|achiote|asafoetida|hing|ajwain|carom|epazote|hoja santa|lavender|rose petals|dried rose|vanilla bean|vanilla extract|vanilla|extract|essence)/i.test(name)) {
      return 'Spices & Seasonings';
    }

    // Pantry patterns (check BEFORE meat to catch "chicken stock", "beef broth", etc.)
    if (/(stock|broth|bouillon|chicken stock|beef stock|vegetable stock|chicken broth|beef broth|vegetable broth)/i.test(name)) {
      return 'Pantry & Canned Goods';
    }
    if (/(rice|pasta|spaghetti|penne|macaroni|noodle|flour|all-purpose flour|wheat flour|sugar|brown sugar|powdered sugar|bean|black bean|kidney bean|chickpea|lentil|oat|oatmeal|quinoa|couscous|barley|can|canned|cereal|granola)/i.test(name)) {
      return 'Pantry & Canned Goods';
    }

    // Condiments & Sauces patterns (check before Meat)
    if (/(sauce|mayo|mayonnaise|mustard|dijon|ketchup|oil|olive oil|vegetable oil|canola oil|vinegar|balsamic|dressing|soy sauce|worcestershire|hot sauce|sriracha|tahini|honey|syrup|maple syrup|molasses)/i.test(name)) {
      return 'Condiments & Sauces';
    }

    // Produce patterns
    if (/(tomato|lettuce|spinach|kale|carrot|onion|garlic|bell pepper|jalapeño|chili pepper|chile|chiles|green chile|green chiles|thai chile|thai chiles|red chile|red chiles|serrano|habanero|poblano|anaheim|potato|sweet potato|broccoli|cauliflower|cucumber|celery|mushroom|zucchini|squash|cabbage|brussels sprout|asparagus|green bean|pea|corn|avocado|apple|banana|orange|lemon|lime|berry|berries|strawberry|blueberry|raspberry|grape|melon|watermelon|pineapple|mango|peach|pear|plum|cherry|shallot|scallion|leek)/i.test(name)) {
      return 'Produce';
    }

    // Dairy & Eggs patterns
    if (/(milk|cheese|yogurt|butter|unsalted butter|salted butter|cream|heavy cream|sour cream|whipping cream|cottage cheese|ricotta|parmesan|mozzarella|cheddar|swiss|brie|feta|goat cheese|cream cheese|egg|eggs)/i.test(name)) {
      return 'Dairy & Eggs';
    }

    // Meat & Seafood patterns (check AFTER stock/broth and herbs to avoid false matches)
    // Exclude words that might match herbs (e.g., "chop" in "chopped parsley", "thigh" in "thyme")
    if (!/(chopped|diced|minced|sliced|fresh|dried)\s+(parsley|sage|thyme|rosemary|basil|oregano|dill|cilantro|herb|herbs|chives|tarragon|marjoram|mint)/i.test(name)) {
      if (/\b(beef|pork|chicken|turkey|lamb|bacon|sausage|ham|prosciutto|salami|pepperoni|ground beef|ground pork|ground turkey|steak|ribeye|sirloin|tenderloin|chop|breast|thigh|wing|drumstick|ribs|brisket|roast|veal)\b/i.test(name)) {
        return 'Meat & Seafood';
      }
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
