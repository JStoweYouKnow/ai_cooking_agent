/**
 * Integration tests for API endpoints
 * These tests verify the full request/response cycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../routers';
import { createContext } from '../_core/context';

// Mock all database functions
vi.mock('../db', () => ({
  getOrCreateAnonymousUser: vi.fn(),
  getUserRecipes: vi.fn(),
  getRecipeById: vi.fn(),
  createRecipe: vi.fn(),
  getRecipeIngredients: vi.fn(),
  getOrCreateIngredient: vi.fn(),
  addRecipeIngredient: vi.fn(),
  getUserShoppingLists: vi.fn(),
  createShoppingList: vi.fn(),
  getShoppingListById: vi.fn(),
  getShoppingListItems: vi.fn(),
  addShoppingListItem: vi.fn(),
  updateShoppingListItem: vi.fn(),
  deleteShoppingListItem: vi.fn(),
  getShoppingListItemById: vi.fn(),
  getIngredientById: vi.fn(),
  addUserIngredient: vi.fn(),
  getUserIngredients: vi.fn(),
  getUserIngredientById: vi.fn(),
  deleteUserIngredient: vi.fn(),
  getAllIngredients: vi.fn(),
}));

import * as db from '../db';

describe('Integration Tests', () => {
  const mockUser = { id: 1, openId: 'test-user', name: 'Test User' };
  let mockContext: Awaited<ReturnType<typeof createContext>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    (db.getOrCreateAnonymousUser as any).mockResolvedValue(mockUser);
    mockContext = await createContext({
      req: {} as any,
      res: {} as any,
    } as any);
  });

  describe('Recipe Creation Flow', () => {
    it('should create recipe and retrieve it', async () => {
      const mockRecipe = { id: 1, name: 'Integration Test Recipe', userId: 1 };
      (db.createRecipe as any).mockResolvedValue(undefined);
      (db.getUserRecipes as any).mockResolvedValue([mockRecipe]);
      (db.getRecipeById as any).mockResolvedValue(mockRecipe);

      const caller = appRouter.createCaller(mockContext);
      
      // Create recipe
      const createResult = await caller.recipes.create({
        name: 'Integration Test Recipe',
        description: 'Test description',
      });

      expect(createResult).toHaveProperty('id');
      expect(typeof createResult.id === 'number' ? createResult.id : 0).toBeGreaterThan(0);

      // Retrieve recipe
      const recipe = await caller.recipes.getById({ id: createResult.id });
      expect(recipe.name).toBe('Integration Test Recipe');
    });

    it('should create recipe with ingredients and retrieve them', async () => {
      const mockRecipe = { id: 1, name: 'Recipe with Ingredients', userId: 1 };
      const mockIngredient1 = { id: 1, name: 'Tomato' };
      const mockIngredient2 = { id: 2, name: 'Onion' };
      const mockRecipeIngredients = [
        { recipeId: 1, ingredientId: 1, quantity: '2', unit: 'cups' },
        { recipeId: 1, ingredientId: 2, quantity: '1', unit: 'piece' },
      ];

      (db.createRecipe as any).mockResolvedValue(undefined);
      (db.getUserRecipes as any).mockResolvedValue([mockRecipe]);
      (db.getOrCreateIngredient as any)
        .mockResolvedValueOnce(mockIngredient1)
        .mockResolvedValueOnce(mockIngredient2);
      (db.addRecipeIngredient as any).mockResolvedValue(undefined);
      (db.getRecipeIngredients as any).mockResolvedValue(mockRecipeIngredients);

      const caller = appRouter.createCaller(mockContext);
      
      // Create recipe with ingredients
      const createResult = await caller.recipes.create({
        name: 'Recipe with Ingredients',
        ingredients: [
          { name: 'Tomato', quantity: '2', unit: 'cups' },
          { name: 'Onion', quantity: '1', unit: 'piece' },
        ],
      });

      expect(createResult).toHaveProperty('id');

      // Get recipe ingredients
      const ingredients = await caller.recipes.getRecipeIngredients({
        recipeId: createResult.id,
      });

      expect(ingredients.length).toBe(2);
    });
  });

  describe('Shopping List Flow', () => {
    it('should create shopping list, add items, and export', async () => {
      const mockList = { 
        id: 1, 
        name: 'Test Shopping List', 
        description: 'Integration test list', 
        userId: 1,
        createdAt: new Date(),
      };
      const mockIngredient = { id: 1, name: 'Test Ingredient' };
      const mockItem = { id: 1, shoppingListId: 1, ingredientId: 1, quantity: '2', unit: 'cups', isChecked: false };
      const mockItems = [mockItem];

      (db.createShoppingList as any).mockResolvedValue(mockList);
      (db.getShoppingListById as any).mockResolvedValue(mockList);
      (db.getOrCreateIngredient as any).mockResolvedValue(mockIngredient);
      (db.addShoppingListItem as any).mockResolvedValue(mockItem);
      (db.getShoppingListItems as any).mockResolvedValue(mockItems);
      (db.updateShoppingListItem as any).mockResolvedValue(undefined);
      (db.getIngredientById as any).mockResolvedValue(mockIngredient);

      const caller = appRouter.createCaller(mockContext);
      
      // Create shopping list
      const list = await caller.shoppingLists.create({
        name: 'Test Shopping List',
        description: 'Integration test list',
      });

      expect(list).toHaveProperty('id');
      expect(list.name).toBe('Test Shopping List');

      // Get or create ingredient
      const ingredient = await caller.ingredients.getOrCreate({
        name: 'Test Ingredient',
      });

      // Add item to list
      const item = await caller.shoppingLists.addItem({
        shoppingListId: list.id,
        ingredientId: ingredient.id,
        quantity: '2',
        unit: 'cups',
      });

      expect(item).toBeDefined();

      // Get list items
      const items = await caller.shoppingLists.getItems({ id: list.id });
      expect(items.length).toBeGreaterThan(0);

      // Toggle item - need to mock getShoppingListItemById for this
      (db.getShoppingListItemById as any).mockResolvedValue(mockItem);
      await caller.shoppingLists.toggleItem({
        itemId: item.id,
        isChecked: true,
      });

      // Export list
      const exportData = await caller.shoppingLists.export({
        id: list.id,
        format: 'json',
      });

      expect(exportData).toHaveProperty('content');
      expect(exportData).toHaveProperty('mimeType');
      expect(exportData).toHaveProperty('filename');
    });
  });

  describe('Ingredient Management Flow', () => {
    it('should add ingredient to user list and remove it', async () => {
      const mockIngredient = { id: 1, name: 'Test Pantry Ingredient' };
      const mockUserIngredient = { id: 1, userId: 1, ingredientId: 1, quantity: '1', unit: 'cup' };
      const mockUserIngredients = [mockUserIngredient];

      (db.getOrCreateIngredient as any).mockResolvedValue(mockIngredient);
      (db.addUserIngredient as any).mockResolvedValue(mockUserIngredient);
      (db.getUserIngredients as any).mockResolvedValue(mockUserIngredients);
      (db.getUserIngredientById as any).mockResolvedValue(mockUserIngredient);
      (db.deleteUserIngredient as any).mockResolvedValue(undefined);

      const caller = appRouter.createCaller(mockContext);
      
      // Get or create ingredient
      const ingredient = await caller.ingredients.getOrCreate({
        name: 'Test Pantry Ingredient',
      });

      // Add to user list
      const userIngredient = await caller.ingredients.addToUserList({
        ingredientId: ingredient.id,
        quantity: '1',
        unit: 'cup',
      });

      expect(userIngredient).toBeDefined();

      // Get user ingredients
      const userIngredients = await caller.ingredients.getUserIngredients();
      expect(userIngredients.length).toBeGreaterThan(0);

      // Remove from user list
      await caller.ingredients.removeFromUserList({
        id: (userIngredient as any).id,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access gracefully', async () => {
      (db.getRecipeById as any).mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);
      
      // Try to access non-existent recipe
      await expect(
        caller.recipes.getById({ id: 99999 })
      ).rejects.toThrow('Recipe not found');
    });

    it('should validate input and return appropriate errors', async () => {
      const caller = appRouter.createCaller(mockContext);
      
      // Invalid recipe name
      await expect(
        caller.recipes.create({ name: '' } as any)
      ).rejects.toThrow();

      // Invalid URL
      await expect(
        caller.recipes.parseFromUrl({ url: 'not-a-url' } as any)
      ).rejects.toThrow();
    });
  });
});

