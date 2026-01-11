/**
 * Converts recipe measurements to purchase quantities
 * Helps users know how much to buy at the store
 */

export interface PurchaseQuantity {
  quantity: string;
  unit: string;
  displayText: string;
}

/**
 * Common package sizes for different ingredient types
 */
const PACKAGE_SIZES: Record<string, { sizes: number[]; unit: string }> = {
  // Dry goods (flour, sugar, etc.) - typically sold in 1lb, 2lb, 5lb bags
  flour: { sizes: [1, 2, 5], unit: 'lb' },
  sugar: { sizes: [1, 2, 4, 5], unit: 'lb' },
  rice: { sizes: [1, 2, 5, 10], unit: 'lb' },
  pasta: { sizes: [1, 2], unit: 'lb' },
  
  // Spices - typically sold in small containers (0.5oz, 1oz, 2oz, 4oz)
  spice: { sizes: [0.5, 1, 2, 4], unit: 'oz' },
  
  // Oils and liquids - typically sold in 8oz, 16oz, 32oz bottles
  oil: { sizes: [8, 16, 32], unit: 'fl oz' },
  vinegar: { sizes: [8, 16, 32], unit: 'fl oz' },
  
  // Canned goods - typically sold in 8oz, 15oz, 28oz cans
  canned: { sizes: [8, 15, 28], unit: 'oz' },
  
  // Stock/broth - typically sold in 32oz (1 quart) containers
  stock: { sizes: [32], unit: 'fl oz' },
  broth: { sizes: [32], unit: 'fl oz' },
  
  // Butter - typically sold in 1lb (4 sticks) packages
  butter: { sizes: [1], unit: 'lb' },
  
  // Produce - typically sold by piece or by lb
  produce: { sizes: [1], unit: 'lb' },
};

/**
 * Conversion factors (to convert to base units for comparison)
 */
const CONVERSION_FACTORS: Record<string, number> = {
  // Volume conversions (to fl oz)
  'cup': 8,
  'cups': 8,
  'tablespoon': 0.5,
  'tablespoons': 0.5,
  'tbsp': 0.5,
  'tsp': 0.1667,
  'teaspoon': 0.1667,
  'teaspoons': 0.1667,
  'fluid ounce': 1,
  'fluid ounces': 1,
  'fl oz': 1,
  'pint': 16,
  'pints': 16,
  'pt': 16,
  'quart': 32,
  'quarts': 32,
  'qt': 32,
  'gallon': 128,
  'gallons': 128,
  'gal': 128,
  
  // Weight conversions (to oz)
  'ounce': 1,
  'ounces': 1,
  'oz': 1,
  'pound': 16,
  'pounds': 16,
  'lb': 16,
  'lbs': 16,
  'gram': 0.0353,
  'grams': 0.0353,
  'g': 0.0353,
  'kilogram': 35.274,
  'kilograms': 35.274,
  'kg': 35.274,
};

/**
 * Parse a quantity string (e.g., "1 1/2", "2", "1/4") to a decimal number
 */
function parseQuantity(qty: string | null | undefined): number {
  if (!qty) return 0;
  
  const trimmed = qty.trim();
  if (!trimmed) return 0;
  
  // Handle fractions
  const fractionMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/); // "1 1/2"
  if (fractionMatch) {
    const whole = parseInt(fractionMatch[1], 10);
    const num = parseInt(fractionMatch[2], 10);
    const den = parseInt(fractionMatch[3], 10);
    return whole + (num / den);
  }
  
  const simpleFractionMatch = trimmed.match(/^(\d+)\/(\d+)$/); // "1/2"
  if (simpleFractionMatch) {
    const num = parseInt(simpleFractionMatch[1], 10);
    const den = parseInt(simpleFractionMatch[2], 10);
    return num / den;
  }
  
  // Handle ranges (take the higher value)
  const rangeMatch = trimmed.match(/^(\d+(?:\s*\/\s*\d+)?)\s*(?:to|-|or)\s*(\d+(?:\s*\/\s*\d+)?)$/i);
  if (rangeMatch) {
    const end = parseQuantity(rangeMatch[2]);
    return end; // Use the higher value
  }
  
  // Handle decimal
  const decimal = parseFloat(trimmed);
  if (!isNaN(decimal)) return decimal;
  
  return 0;
}

/**
 * Determine ingredient category for package size lookup
 */
function getIngredientCategory(ingredientName: string): string {
  const name = ingredientName.toLowerCase();
  
  if (/(flour|sugar|rice|pasta|quinoa|couscous|barley|oats|oatmeal)/i.test(name)) {
    return 'flour';
  }
  if (/(spice|pepper|salt|cumin|coriander|paprika|turmeric|curry|garlic powder|onion powder)/i.test(name)) {
    return 'spice';
  }
  if (/(oil|olive oil|vegetable oil|canola oil)/i.test(name)) {
    return 'oil';
  }
  if (/(vinegar|balsamic)/i.test(name)) {
    return 'vinegar';
  }
  if (/(stock|broth|bouillon)/i.test(name)) {
    return 'stock';
  }
  if (/(butter|margarine)/i.test(name)) {
    return 'butter';
  }
  if (/(can|canned|tomato|bean|chickpea)/i.test(name)) {
    return 'canned';
  }
  
  return 'produce'; // Default
}

/**
 * Round up to the nearest package size
 */
function roundUpToPackageSize(amount: number, sizes: number[]): number {
  for (const size of sizes.sort((a, b) => a - b)) {
    if (amount <= size) {
      return size;
    }
  }
  // If larger than all sizes, return the largest
  return Math.max(...sizes);
}

/**
 * Convert recipe measurement to purchase quantity
 */
export function convertToPurchaseQuantity(
  recipeQuantity: string | null | undefined,
  recipeUnit: string | null | undefined,
  ingredientName: string
): PurchaseQuantity | null {
  if (!recipeQuantity && !recipeUnit) {
    // No quantity specified - suggest buying 1 unit
    const category = getIngredientCategory(ingredientName);
    const packageInfo = PACKAGE_SIZES[category] || PACKAGE_SIZES.produce;
    return {
      quantity: '1',
      unit: packageInfo.unit,
      displayText: `1 ${packageInfo.unit}`,
    };
  }
  
  const qty = parseQuantity(recipeQuantity);
  if (qty === 0 && !recipeUnit) {
    return null;
  }
  
  const unit = (recipeUnit || '').toLowerCase().trim();
  const category = getIngredientCategory(ingredientName);
  const packageInfo = PACKAGE_SIZES[category] || PACKAGE_SIZES.produce;
  
  // Convert to base unit (fl oz for liquids, oz for weights)
  let baseAmount = 0;
  const conversionFactor = CONVERSION_FACTORS[unit];
  
  if (conversionFactor) {
    if (['cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp', 'tsp', 'teaspoon', 'teaspoons', 'fluid ounce', 'fluid ounces', 'fl oz', 'pint', 'pints', 'pt', 'quart', 'quarts', 'qt', 'gallon', 'gallons', 'gal'].includes(unit)) {
      // Volume - convert to fl oz
      baseAmount = qty * conversionFactor;
      // For stock/broth, convert fl oz to package size
      if (category === 'stock' || category === 'broth') {
        const packagesNeeded = Math.ceil(baseAmount / 32); // 32 fl oz = 1 quart container
        return {
          quantity: String(packagesNeeded),
          unit: 'container',
          displayText: `${packagesNeeded} ${packagesNeeded === 1 ? 'container' : 'containers'} (32 fl oz each)`,
        };
      }
      // For oils/vinegars, round up to package size
      if (category === 'oil' || category === 'vinegar') {
        const rounded = roundUpToPackageSize(baseAmount, packageInfo.sizes);
        return {
          quantity: String(rounded),
          unit: packageInfo.unit,
          displayText: `${rounded} ${packageInfo.unit}`,
        };
      }
    } else if (['ounce', 'ounces', 'oz', 'pound', 'pounds', 'lb', 'lbs', 'gram', 'grams', 'g', 'kilogram', 'kilograms', 'kg'].includes(unit)) {
      // Weight - convert to oz
      baseAmount = qty * conversionFactor;
      // Round up to package size
      const rounded = roundUpToPackageSize(baseAmount, packageInfo.sizes);
      return {
        quantity: String(rounded),
        unit: packageInfo.unit,
        displayText: `${rounded} ${packageInfo.unit}`,
      };
    }
  }
  
  // For items sold by count (e.g., "2 eggs", "1 onion")
  if (!unit || unit === 'piece' || unit === 'pieces' || unit === 'item' || unit === 'items') {
    return {
      quantity: String(Math.ceil(qty || 1)),
      unit: unit || 'piece',
      displayText: `${Math.ceil(qty || 1)} ${unit || 'piece'}`,
    };
  }
  
  // If we can't convert, return the original
  return {
    quantity: recipeQuantity || '1',
    unit: recipeUnit || packageInfo.unit,
    displayText: `${recipeQuantity || '1'} ${recipeUnit || packageInfo.unit}`,
  };
}
