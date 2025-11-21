import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../../routers';
import { createContext } from '../../_core/context';

// Mock database functions
vi.mock('../../db', () => ({
  getAllIngredients: vi.fn(),
  getOrCreateIngredient: vi.fn(),
  updateIngredientImage: vi.fn(),
  getIngredientById: vi.fn(),
  getOrCreateAnonymousUser: vi.fn(),
  addUserIngredient: vi.fn(),
  getUserIngredients: vi.fn(),
  getUserIngredientById: vi.fn(),
  deleteUserIngredient: vi.fn(),
}));

import * as db from '../../db';

describe('Ingredients Router', () => {
  const mockUser = { id: 1, openId: 'test-user', name: 'Test User' };
  const ctx = createContext({
    req: {} as any,
    res: {} as any,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (db.getOrCreateAnonymousUser as any).mockResolvedValue(mockUser);
  });

  describe('list', () => {
    it('should return a list of ingredients', async () => {
      const mockIngredients = [
        { id: 1, name: 'Tomato' },
        { id: 2, name: 'Onion' },
      ];
      (db.getAllIngredients as any).mockResolvedValue(mockIngredients);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.ingredients.list();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockIngredients);
      expect(db.getAllIngredients).toHaveBeenCalled();
    });
  });

  describe('getOrCreate', () => {
    it('should create a new ingredient if it does not exist', async () => {
      const mockIngredient = { id: 1, name: 'Test Ingredient' };
      (db.getOrCreateIngredient as any).mockResolvedValue(mockIngredient);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.ingredients.getOrCreate({
        name: 'Test Ingredient',
      });
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Ingredient');
      expect(db.getOrCreateIngredient).toHaveBeenCalledWith('Test Ingredient', undefined);
    });

    it('should return existing ingredient if it exists', async () => {
      const mockIngredient = { id: 1, name: 'Duplicate Test' };
      (db.getOrCreateIngredient as any).mockResolvedValue(mockIngredient);

      const caller = appRouter.createCaller(ctx);
      
      // Get or create - should return same ingredient
      const result = await caller.ingredients.getOrCreate({
        name: 'Duplicate Test',
      });
      
      expect(result.id).toBe(1);
      expect(result.name).toBe('Duplicate Test');
    });

    it('should validate input - name is required', async () => {
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.ingredients.getOrCreate({
          name: '',
        } as any)
      ).rejects.toThrow();
    });

    it('should validate input - name max length', async () => {
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.ingredients.getOrCreate({
          name: 'a'.repeat(256),
        })
      ).rejects.toThrow();
    });
  });
});

