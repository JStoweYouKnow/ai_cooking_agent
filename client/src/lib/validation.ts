import { z } from 'zod';

// Ingredient form validation
export const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').max(100, 'Name must be less than 100 characters'),
  quantity: z.string().optional(),
  unit: z.string().optional(),
});

export type IngredientFormData = z.infer<typeof ingredientSchema>;

// Shopping list form validation
export const shoppingListSchema = z.object({
  name: z.string().min(1, 'List name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export type ShoppingListFormData = z.infer<typeof shoppingListSchema>;

// Shopping list item validation
export const shoppingListItemSchema = z.object({
  ingredientId: z.number().min(1, 'Please select an ingredient'),
  quantity: z.string().optional(),
  unit: z.string().max(50, 'Unit must be less than 50 characters').optional(),
});

export type ShoppingListItemFormData = z.infer<typeof shoppingListItemSchema>;

// Recipe URL import validation
export const recipeUrlSchema = z.object({
  url: z.string().url('Please enter a valid URL').min(1, 'URL is required'),
});

export type RecipeUrlFormData = z.infer<typeof recipeUrlSchema>;

// Recipe search validation
export const recipeSearchSchema = z.object({
  ingredients: z.array(z.string().min(1)).min(1, 'Add at least one ingredient to search').max(5, 'Maximum 5 ingredients allowed'),
  sources: z.array(z.enum(['TheMealDB', 'Epicurious', 'Delish', 'NYTCooking'])).min(1, 'Select at least one source'),
});

export type RecipeSearchFormData = z.infer<typeof recipeSearchSchema>;

