/**
 * Ingredient Substitution Utility
 * Provides smart ingredient substitution suggestions
 */

export interface Substitution {
  name: string;
  ratio: string; // e.g., "1:1", "2:1", "1/2:1"
  reason: string;
  bestFor?: string;
}

/**
 * Common ingredient substitutions database
 */
export const COMMON_SUBSTITUTIONS: Record<string, Substitution[]> = {
  // Dairy
  milk: [
    { name: "almond milk", ratio: "1:1", reason: "Plant-based alternative", bestFor: "Baking, smoothies" },
    { name: "oat milk", ratio: "1:1", reason: "Creamy texture, neutral flavor", bestFor: "Coffee, cereal" },
    { name: "coconut milk", ratio: "1:1", reason: "Rich and creamy", bestFor: "Curries, desserts" },
  ],
  butter: [
    { name: "coconut oil", ratio: "1:1", reason: "Solid at room temperature", bestFor: "Baking" },
    { name: "olive oil", ratio: "3/4:1", reason: "Healthier option", bestFor: "Cooking, sautéing" },
    { name: "avocado", ratio: "1:1", reason: "Healthy fat replacement", bestFor: "Baking, spreads" },
  ],
  eggs: [
    { name: "flax eggs", ratio: "1:1", reason: "1 tbsp ground flaxseed + 3 tbsp water", bestFor: "Baking" },
    { name: "applesauce", ratio: "1/4 cup:1", reason: "Adds moisture", bestFor: "Baking" },
    { name: "banana", ratio: "1/2 mashed:1", reason: "Binds and adds sweetness", bestFor: "Baking" },
  ],
  // Flour
  "all-purpose flour": [
    { name: "almond flour", ratio: "1:1", reason: "Gluten-free, nutty flavor", bestFor: "Baking" },
    { name: "coconut flour", ratio: "1/4:1", reason: "Highly absorbent", bestFor: "Baking" },
    { name: "oat flour", ratio: "1:1", reason: "Gluten-free option", bestFor: "Baking" },
  ],
  // Meat
  "ground beef": [
    { name: "ground turkey", ratio: "1:1", reason: "Leaner protein", bestFor: "Burgers, meatballs" },
    { name: "lentils", ratio: "1:1", reason: "Plant-based protein", bestFor: "Tacos, pasta sauce" },
    { name: "mushrooms", ratio: "1:1", reason: "Meaty texture", bestFor: "Stir-fries, burgers" },
  ],
  // Sweeteners
  sugar: [
    { name: "honey", ratio: "3/4:1", reason: "Natural sweetener", bestFor: "Baking, beverages" },
    { name: "maple syrup", ratio: "3/4:1", reason: "Rich flavor", bestFor: "Baking, pancakes" },
    { name: "stevia", ratio: "1/4 tsp:1 cup", reason: "Zero calories", bestFor: "Beverages" },
  ],
};

/**
 * Get substitutions for an ingredient
 */
export function getSubstitutions(
  ingredientName: string,
  dietaryPreferences: string[] = [],
  allergies: string[] = []
): Substitution[] {
  const normalized = ingredientName.toLowerCase().trim();
  
  // Check common substitutions first
  if (COMMON_SUBSTITUTIONS[normalized]) {
    let subs = COMMON_SUBSTITUTIONS[normalized];
    
    // Filter by dietary preferences
    if (dietaryPreferences.includes("vegan")) {
      subs = subs.filter((sub) => 
        !["milk", "butter", "eggs", "cheese", "yogurt"].some(dairy => 
          sub.name.toLowerCase().includes(dairy)
        )
      );
    }
    
    if (dietaryPreferences.includes("gluten-free")) {
      subs = subs.filter((sub) => 
        !sub.name.toLowerCase().includes("flour") || 
        sub.name.toLowerCase().includes("gluten-free")
      );
    }
    
    // Filter by allergies
    const filtered = subs.filter((sub) => {
      const subLower = sub.name.toLowerCase();
      return !allergies.some((allergy) => 
        subLower.includes(allergy.toLowerCase())
      );
    });
    
    return filtered.length > 0 ? filtered : subs;
  }
  
  // Generic suggestions based on ingredient type
  if (normalized.includes("flour")) {
    return [
      { name: "almond flour", ratio: "1:1", reason: "Gluten-free alternative" },
      { name: "coconut flour", ratio: "1/4:1", reason: "Gluten-free, highly absorbent" },
    ];
  }
  
  if (normalized.includes("milk") || normalized.includes("cream")) {
    return [
      { name: "almond milk", ratio: "1:1", reason: "Plant-based alternative" },
      { name: "oat milk", ratio: "1:1", reason: "Creamy texture" },
    ];
  }
  
  return [];
}

/**
 * Format substitution ratio for display
 */
export function formatRatio(ratio: string): string {
  if (ratio.includes(":")) {
    const [a, b] = ratio.split(":");
    if (a === b) return "Equal amount";
    if (a === "1" && b === "1") return "1:1";
    return `${a} for every ${b}`;
  }
  return ratio;
}

/**
 * Check if substitution is suitable for dietary preference
 */
export function isSuitableForDiet(
  substitution: Substitution,
  dietaryPreferences: string[]
): boolean {
  const subLower = substitution.name.toLowerCase();
  
  if (dietaryPreferences.includes("vegan")) {
    const nonVegan = ["milk", "butter", "cheese", "yogurt", "cream", "egg"];
    return !nonVegan.some((item) => subLower.includes(item));
  }
  
  if (dietaryPreferences.includes("gluten-free")) {
    return !subLower.includes("flour") || subLower.includes("gluten-free");
  }
  
  return true;
}

export default {
  getSubstitutions,
  formatRatio,
  isSuitableForDiet,
  COMMON_SUBSTITUTIONS,
};
