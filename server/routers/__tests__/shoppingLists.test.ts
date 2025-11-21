import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../../routers';
import { createContext } from '../../_core/context';

// Mock database functions
vi.mock('../../db', () => ({
  getOrCreateAnonymousUser: vi.fn(),
  getUserShoppingLists: vi.fn(),
  createShoppingList: vi.fn(),
  getShoppingListById: vi.fn(),
  getShoppingListItems: vi.fn(),
  addShoppingListItem: vi.fn(),
  updateShoppingListItem: vi.fn(),
  deleteShoppingList: vi.fn(),
  deleteShoppingListItem: vi.fn(),
  getShoppingListItemById: vi.fn(),
  getRecipeById: vi.fn(),
  getRecipeIngredients: vi.fn(),
  getIngredientById: vi.fn(),
  getAllIngredients: vi.fn(),
}));

import * as db from '../../db';

describe('Shopping Lists Router', () => {
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
    it('should return a list of shopping lists', async () => {
      const mockLists = [
        { id: 1, name: 'List 1', userId: 1 },
        { id: 2, name: 'List 2', userId: 1 },
      ];
      (db.getUserShoppingLists as any).mockResolvedValue(mockLists);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.shoppingLists.list();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockLists);
      expect(db.getUserShoppingLists).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new shopping list', async () => {
      const mockList = {
        id: 1,
        name: 'Test Shopping List',
        description: 'Test description',
        userId: 1,
      };
      (db.createShoppingList as any).mockResolvedValue(mockList);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.shoppingLists.create({
        name: 'Test Shopping List',
        description: 'Test description',
      });
      
      expect(result).toBeDefined();
      expect(result.name).toBe('Test Shopping List');
      expect(result.description).toBe('Test description');
      expect(db.createShoppingList).toHaveBeenCalled();
    });

    it('should validate input - name is required', async () => {
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.shoppingLists.create({
          name: '',
        } as any)
      ).rejects.toThrow();
    });

    it('should validate input - name max length', async () => {
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.shoppingLists.create({
          name: 'a'.repeat(256),
        })
      ).rejects.toThrow();
    });
  });
});

