import { 
  Apple, 
  Fish, 
  Coffee, 
  UtensilsCrossed,
  Circle,
  Square,
  Hexagon,
  Package,
  Box,
  LucideIcon
} from 'lucide-react';

export function getIngredientIcon(ingredient: { name: string; category?: string | null } | null | undefined): LucideIcon {
  if (!ingredient || !ingredient.name) {
    return UtensilsCrossed;
  }
  const name = ingredient.name.toLowerCase();
  const category = ingredient.category?.toLowerCase() || '';

  // Category-based matching (most specific first)
  if (category.includes('fruit') || category.includes('berry')) {
    // Fruit-specific icons - use Apple for all fruits
    return Apple;
  }

  if (category.includes('vegetable') || category.includes('veggie')) {
    // Vegetable-specific icons - use Circle for vegetables
    return Circle;
  }

  if (category.includes('meat') || category.includes('protein')) {
    // Meat-specific icons
    if (name.includes('fish') || name.includes('salmon') || name.includes('tuna') || name.includes('seafood')) {
      return Fish;
    }
    // Use Square for other meats
    return Square;
  }

  if (category.includes('dairy') || category.includes('milk')) {
    // Dairy-specific icons - use Hexagon for dairy
    return Hexagon;
  }

  if (category.includes('grain') || category.includes('bread') || category.includes('flour')) {
    // Grains - use Package
    return Package;
  }

  if (category.includes('nut') || category.includes('seed')) {
    // Nuts - use Box
    return Box;
  }

  // Name-based matching (fallback if category doesn't match)
  if (name.includes('apple') || name.includes('banana') || name.includes('cherry') || name.includes('berry') || name.includes('grape') || name.includes('fruit')) {
    return Apple;
  }
  if (name.includes('fish') || name.includes('salmon') || name.includes('tuna') || name.includes('seafood') || name.includes('shrimp') || name.includes('crab') || name.includes('lobster')) {
    return Fish;
  }
  if (name.includes('chicken') || name.includes('poultry') || name.includes('beef') || name.includes('steak') || name.includes('burger') || name.includes('meat') || name.includes('pork')) {
    return Square;
  }
  if (name.includes('milk') || name.includes('cream') || name.includes('cheese') || name.includes('dairy') || name.includes('yogurt') || name.includes('butter')) {
    return Hexagon;
  }
  if (name.includes('coffee') || name.includes('tea')) {
    return Coffee;
  }
  if (name.includes('bread') || name.includes('flour') || name.includes('wheat') || name.includes('grain') || name.includes('rice') || name.includes('pasta')) {
    return Package;
  }
  if (name.includes('carrot') || name.includes('pepper') || name.includes('chili') || name.includes('lettuce') || name.includes('spinach') || name.includes('kale') || name.includes('vegetable') || name.includes('onion') || name.includes('tomato')) {
    return Circle;
  }
  if (name.includes('nut') || name.includes('almond') || name.includes('walnut') || name.includes('seed')) {
    return Box;
  }
  if (name.includes('egg')) {
    return Circle;
  }

  // Default fallback
  return UtensilsCrossed;
}

