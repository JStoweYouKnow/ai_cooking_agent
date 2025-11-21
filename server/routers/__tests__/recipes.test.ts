import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../../routers';
import { createContext } from '../../_core/context';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

// Mock database functions
vi.mock('../../db', () => ({
  getOrCreateAnonymousUser: vi.fn(),
  getUserRecipes: vi.fn(),
  getRecipeById: vi.fn(),
  createRecipe: vi.fn(),
  updateRecipeFavorite: vi.fn(),
  getRecipeIngredients: vi.fn(),
  getOrCreateIngredient: vi.fn(),
  addRecipeIngredient: vi.fn(),
}));

// Mock recipe parsing
vi.mock('../../_core/recipeParsing', () => ({
  parseRecipeFromUrl: vi.fn(),
}));

// Mock LLM
vi.mock('../../_core/llm', () => ({
  invokeLLM: vi.fn(),
}));

import * as db from '../../db';
import { parseRecipeFromUrl } from '../../_core/recipeParsing';
import { invokeLLM } from '../../_core/llm';

describe('Recipes Router', () => {
  const mockUser = { id: 1, openId: 'test-user', name: 'Test User' };
  const mockContext = createContext({
    req: {} as any,
    res: {} as any,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (db.getOrCreateAnonymousUser as any).mockResolvedValue(mockUser);
  });

  describe('list', () => {
    it('should return user recipes', async () => {
      const mockRecipes = [
        { id: 1, name: 'Test Recipe 1', userId: 1 },
        { id: 2, name: 'Test Recipe 2', userId: 1 },
      ];
      (db.getUserRecipes as any).mockResolvedValue(mockRecipes);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.recipes.list();

      expect(result).toEqual(mockRecipes);
      expect(db.getOrCreateAnonymousUser).toHaveBeenCalled();
      expect(db.getUserRecipes).toHaveBeenCalledWith(1);
    });

    it('should handle empty recipe list', async () => {
      (db.getUserRecipes as any).mockResolvedValue([]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.recipes.list();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return recipe when found and user owns it', async () => {
      const mockRecipe = { id: 1, name: 'Test Recipe', userId: 1 };
      (db.getRecipeById as any).mockResolvedValue(mockRecipe);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.recipes.getById({ id: 1 });

      expect(result).toEqual(mockRecipe);
      expect(db.getRecipeById).toHaveBeenCalledWith(1);
    });

    it('should throw error if recipe not found', async () => {
      (db.getRecipeById as any).mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);
      await expect(caller.recipes.getById({ id: 999 })).rejects.toThrow('Recipe not found');
    });

    it('should throw error if user does not own recipe', async () => {
      const mockRecipe = { id: 1, name: 'Test Recipe', userId: 2 }; // Different user
      (db.getRecipeById as any).mockResolvedValue(mockRecipe);

      const caller = appRouter.createCaller(mockContext);
      await expect(caller.recipes.getById({ id: 1 })).rejects.toThrow('Unauthorized');
    });

    it('should validate input - id must be positive', async () => {
      const caller = appRouter.createCaller(mockContext);
      await expect(caller.recipes.getById({ id: 0 })).rejects.toThrow();
      await expect(caller.recipes.getById({ id: -1 })).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create recipe with valid data', async () => {
      (db.createRecipe as any).mockResolvedValue(undefined);
      (db.getUserRecipes as any).mockResolvedValue([
        { id: 1, name: 'New Recipe', userId: 1 },
      ]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.recipes.create({
        name: 'New Recipe',
        description: 'Test description',
      });

      expect(result).toHaveProperty('id');
      expect(db.createRecipe).toHaveBeenCalled();
    });

    it('should create recipe with ingredients', async () => {
      (db.createRecipe as any).mockResolvedValue(undefined);
      (db.getUserRecipes as any).mockResolvedValue([
        { id: 1, name: 'New Recipe', userId: 1 },
      ]);
      (db.getOrCreateIngredient as any).mockResolvedValue({ id: 1, name: 'Tomato' });
      (db.addRecipeIngredient as any).mockResolvedValue(undefined);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.recipes.create({
        name: 'New Recipe',
        ingredients: [
          { name: 'Tomato', quantity: '2', unit: 'cups' },
        ],
      });

      expect(result).toHaveProperty('id');
      expect(db.getOrCreateIngredient).toHaveBeenCalled();
      expect(db.addRecipeIngredient).toHaveBeenCalled();
    });

    it('should validate input - name is required', async () => {
      const caller = appRouter.createCaller(mockContext);
      await expect(
        caller.recipes.create({ name: '' } as any)
      ).rejects.toThrow();
    });

    it('should validate input - name max length', async () => {
      const caller = appRouter.createCaller(mockContext);
      await expect(
        caller.recipes.create({ name: 'a'.repeat(256) })
      ).rejects.toThrow();
    });

    it('should validate input - description max length', async () => {
      const caller = appRouter.createCaller(mockContext);
      await expect(
        caller.recipes.create({
          name: 'Test',
          description: 'a'.repeat(5001),
        })
      ).rejects.toThrow();
    });

    it('should validate input - cookingTime max value', async () => {
      const caller = appRouter.createCaller(mockContext);
      await expect(
        caller.recipes.create({
          name: 'Test',
          cookingTime: 1441, // Max is 1440
        })
      ).rejects.toThrow();
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      const mockRecipe = { id: 1, name: 'Test Recipe', userId: 1 };
      (db.getRecipeById as any).mockResolvedValue(mockRecipe);
      (db.updateRecipeFavorite as any).mockResolvedValue(undefined);

      const caller = appRouter.createCaller(mockContext);
      await caller.recipes.toggleFavorite({ id: 1, isFavorite: true });

      expect(db.updateRecipeFavorite).toHaveBeenCalledWith(1, true);
    });

    it('should throw error if recipe not found', async () => {
      (db.getRecipeById as any).mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);
      await expect(
        caller.recipes.toggleFavorite({ id: 999, isFavorite: true })
      ).rejects.toThrow('Recipe not found');
    });

    it('should throw error if user does not own recipe', async () => {
      const mockRecipe = { id: 1, name: 'Test Recipe', userId: 2 };
      (db.getRecipeById as any).mockResolvedValue(mockRecipe);

      const caller = appRouter.createCaller(mockContext);
      await expect(
        caller.recipes.toggleFavorite({ id: 1, isFavorite: true })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('searchByIngredients', () => {
    it('should search recipes by ingredients', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          meals: [
            { idMeal: '1', strMeal: 'Test Meal', strMealThumb: 'thumb.jpg' },
          ],
        }),
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.recipes.searchByIngredients({
        ingredients: ['chicken'],
        sources: ['TheMealDB'],
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should validate input - ingredients array required', async () => {
      const caller = appRouter.createCaller(mockContext);
      await expect(
        caller.recipes.searchByIngredients({ ingredients: [] } as any)
      ).rejects.toThrow();
    });

    it('should validate input - max 5 ingredients', async () => {
      const caller = appRouter.createCaller(mockContext);
      await expect(
        caller.recipes.searchByIngredients({
          ingredients: ['1', '2', '3', '4', '5', '6'],
        })
      ).rejects.toThrow();
    });
  });

  describe('parseFromUrl', () => {
    it('should parse recipe from URL', async () => {
      const mockParsed = {
        name: 'Parsed Recipe',
        ingredients: [{ name: 'Tomato' }],
      };
      (parseRecipeFromUrl as any).mockResolvedValue(mockParsed);
      (db.createRecipe as any).mockResolvedValue(undefined);
      (db.getUserRecipes as any).mockResolvedValue([
        { id: 1, name: 'Parsed Recipe', userId: 1 },
      ]);
      (db.getOrCreateIngredient as any).mockResolvedValue({ id: 1, name: 'Tomato' });
      (db.addRecipeIngredient as any).mockResolvedValue(undefined);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.recipes.parseFromUrl({
        url: 'https://example.com/recipe',
        autoSave: true,
      });

      expect(result).toHaveProperty('id');
    });

    it('should validate input - URL format', async () => {
      const caller = appRouter.createCaller(mockContext);
      await expect(
        caller.recipes.parseFromUrl({ url: 'not-a-url' } as any)
      ).rejects.toThrow();
    });
  });
});
