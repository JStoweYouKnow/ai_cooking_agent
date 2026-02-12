/**
 * Recipe Scaling Utility
 * Scale recipe ingredients up or down
 */

import Fraction from "fraction.js";

export interface ScaledIngredient {
  original: string;
  scaled: string;
  quantity: number | null;
  originalQuantity: number | null;
  unit: string | null;
  name: string;
}

// Common fraction patterns
const FRACTION_MAP: Record<string, number> = {
  "½": 0.5,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 0.25,
  "¾": 0.75,
  "⅕": 0.2,
  "⅖": 0.4,
  "⅗": 0.6,
  "⅘": 0.8,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};

// Decimal to fraction display
function decimalToFraction(decimal: number): string {
  // Handle whole numbers
  if (Number.isInteger(decimal)) {
    return decimal.toString();
  }

  // Handle common fractions
  const tolerance = 0.01;
  
  // Check for common fractions
  if (Math.abs(decimal - 0.25) < tolerance) return "¼";
  if (Math.abs(decimal - 0.33) < tolerance) return "⅓";
  if (Math.abs(decimal - 0.5) < tolerance) return "½";
  if (Math.abs(decimal - 0.67) < tolerance) return "⅔";
  if (Math.abs(decimal - 0.75) < tolerance) return "¾";
  
  // For mixed numbers
  const whole = Math.floor(decimal);
  const frac = decimal - whole;
  
  if (whole > 0) {
    if (Math.abs(frac - 0.25) < tolerance) return `${whole} ¼`;
    if (Math.abs(frac - 0.33) < tolerance) return `${whole} ⅓`;
    if (Math.abs(frac - 0.5) < tolerance) return `${whole} ½`;
    if (Math.abs(frac - 0.67) < tolerance) return `${whole} ⅔`;
    if (Math.abs(frac - 0.75) < tolerance) return `${whole} ¾`;
  }
  
  // Use fraction.js for complex fractions
  try {
    const fraction = new Fraction(decimal).simplify(0.015);
    return fraction.toFraction(true);
  } catch {
    // Fallback to rounded decimal
    return decimal.toFixed(2).replace(/\.?0+$/, "");
  }
}

/**
 * Parse a quantity string (e.g., "1 1/2", "2", "½")
 */
function parseQuantity(quantityStr: string): number | null {
  if (!quantityStr || quantityStr.trim() === "") return null;

  let total = 0;
  const parts = quantityStr.trim().split(/\s+/);

  for (const part of parts) {
    // Check for unicode fractions
    if (FRACTION_MAP[part] !== undefined) {
      total += FRACTION_MAP[part];
      continue;
    }

    // Check for slash fractions (1/2, 3/4)
    if (part.includes("/")) {
      const [num, denom] = part.split("/").map(Number);
      if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
        total += num / denom;
        continue;
      }
    }

    // Check for plain number
    const num = parseFloat(part);
    if (!isNaN(num)) {
      total += num;
      continue;
    }

    // Check for unicode fractions within the string
    for (const [frac, value] of Object.entries(FRACTION_MAP)) {
      if (part.includes(frac)) {
        const remaining = part.replace(frac, "");
        const wholeNum = parseFloat(remaining);
        if (!isNaN(wholeNum)) {
          total += wholeNum + value;
        } else {
          total += value;
        }
        break;
      }
    }
  }

  return total > 0 ? total : null;
}

/**
 * Parse an ingredient string into components
 */
function parseIngredient(ingredient: string): {
  quantity: number | null;
  unit: string | null;
  name: string;
  quantityStr: string;
} {
  const trimmed = ingredient.trim();
  
  // Common units
  const units = [
    "cups?",
    "tbsps?",
    "tablespoons?",
    "tsps?",
    "teaspoons?",
    "oz",
    "ounces?",
    "lbs?",
    "pounds?",
    "g",
    "grams?",
    "kg",
    "kilograms?",
    "ml",
    "milliliters?",
    "l",
    "liters?",
    "pints?",
    "quarts?",
    "gallons?",
    "cloves?",
    "slices?",
    "pieces?",
    "cans?",
    "packages?",
    "bunches?",
    "stalks?",
    "heads?",
    "sprigs?",
    "pinch(?:es)?",
    "dash(?:es)?",
    "large",
    "medium",
    "small",
  ];
  
  const unitPattern = units.join("|");
  
  // Match: quantity (with fractions), unit, rest
  // e.g., "1 1/2 cups flour" or "2 large eggs" or "½ teaspoon salt"
  const regex = new RegExp(
    `^([\\d\\s\\/½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]+)?\\s*(${unitPattern})?\\s*(.*)$`,
    "i"
  );
  
  const match = trimmed.match(regex);
  
  if (match) {
    const quantityStr = (match[1] || "").trim();
    const unit = (match[2] || "").trim() || null;
    const name = (match[3] || trimmed).trim();
    const quantity = parseQuantity(quantityStr);
    
    return { quantity, unit, name, quantityStr };
  }
  
  return { quantity: null, unit: null, name: trimmed, quantityStr: "" };
}

/**
 * Scale an ingredient by a multiplier
 */
export function scaleIngredient(
  ingredient: string,
  multiplier: number
): ScaledIngredient {
  const { quantity, unit, name, quantityStr } = parseIngredient(ingredient);
  
  if (quantity === null) {
    // No quantity to scale
    return {
      original: ingredient,
      scaled: ingredient,
      quantity: null,
      originalQuantity: null,
      unit,
      name,
    };
  }
  
  const scaledQuantity = quantity * multiplier;
  const scaledQuantityStr = decimalToFraction(scaledQuantity);
  
  // Reconstruct the ingredient string
  let scaled = scaledQuantityStr;
  if (unit) {
    // Pluralize unit if needed
    let displayUnit = unit;
    if (scaledQuantity > 1 && !unit.endsWith("s") && unit.length > 2) {
      // Simple pluralization for common units
      const pluralMap: Record<string, string> = {
        cup: "cups",
        tablespoon: "tablespoons",
        teaspoon: "teaspoons",
        ounce: "ounces",
        pound: "pounds",
        gram: "grams",
        slice: "slices",
        piece: "pieces",
        clove: "cloves",
        can: "cans",
        bunch: "bunches",
        stalk: "stalks",
        sprig: "sprigs",
        pinch: "pinches",
        dash: "dashes",
      };
      displayUnit = pluralMap[unit.toLowerCase()] || unit;
    } else if (scaledQuantity <= 1 && unit.endsWith("s")) {
      // De-pluralize
      displayUnit = unit.slice(0, -1);
    }
    scaled += ` ${displayUnit}`;
  }
  scaled += ` ${name}`;
  
  return {
    original: ingredient,
    scaled: scaled.trim(),
    quantity: scaledQuantity,
    originalQuantity: quantity,
    unit,
    name,
  };
}

/**
 * Scale a list of ingredients
 */
export function scaleIngredients(
  ingredients: string[],
  originalServings: number,
  targetServings: number
): ScaledIngredient[] {
  const multiplier = targetServings / originalServings;
  return ingredients.map((ing) => scaleIngredient(ing, multiplier));
}

/**
 * Get common serving size options
 */
export function getServingSizeOptions(originalServings: number): number[] {
  const options = new Set<number>();
  
  // Half
  if (originalServings >= 2) {
    options.add(Math.ceil(originalServings / 2));
  }
  
  // Original
  options.add(originalServings);
  
  // Double
  options.add(originalServings * 2);
  
  // Triple
  options.add(originalServings * 3);
  
  // Common serving sizes
  [1, 2, 4, 6, 8, 10, 12].forEach((s) => options.add(s));
  
  return Array.from(options).sort((a, b) => a - b);
}

/**
 * Calculate multiplier from servings
 */
export function getMultiplier(
  originalServings: number,
  targetServings: number
): number {
  if (originalServings <= 0) return 1;
  return targetServings / originalServings;
}

/**
 * Format serving size display
 */
export function formatServings(count: number): string {
  if (count === 1) return "1 serving";
  return `${count} servings`;
}

export default {
  scaleIngredient,
  scaleIngredients,
  getServingSizeOptions,
  getMultiplier,
  formatServings,
  parseQuantity,
};
