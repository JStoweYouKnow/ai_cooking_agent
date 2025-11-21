import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../../routers';
import { createContext } from '../../_core/context';

// Mock database
vi.mock('../../db', () => ({
  getDb: vi.fn(),
}));

import { getDb } from '../../db';

describe('System Router', () => {
  const mockContext = createContext({
    req: {} as any,
    res: {} as any,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('health', () => {
    it('should return health status with all checks', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([{ '1': 1 }]),
      };
      (getDb as any).mockResolvedValue(mockDb);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.system.health();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('environment');
      expect(result.checks).toHaveProperty('memory');
      expect(result.checks).toHaveProperty('uptime');
    });

    it('should return error status if database is unavailable', async () => {
      (getDb as any).mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.system.health();

      expect(result.status).toBe('error');
      expect(result.checks.database.status).toBe('error');
    });

    it('should return degraded status if database query fails', async () => {
      const mockDb = {
        execute: vi.fn().mockRejectedValue(new Error('Query failed')),
      };
      (getDb as any).mockResolvedValue(mockDb);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.system.health();

      expect(['degraded', 'error']).toContain(result.status);
      expect(result.checks.database.status).toBe('error');
    });

    it('should include memory usage information', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([{ '1': 1 }]),
      };
      (getDb as any).mockResolvedValue(mockDb);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.system.health();

      expect(result.checks.memory).toBeDefined();
      expect(result.checks.memory.status).toBe('ok');
      expect(result.checks.memory.message).toContain('MB');
    });

    it('should include uptime information', async () => {
      const mockDb = {
        execute: vi.fn().mockResolvedValue([{ '1': 1 }]),
      };
      (getDb as any).mockResolvedValue(mockDb);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.system.health();

      expect(result.checks.uptime).toBeDefined();
      expect(result.checks.uptime.status).toBe('ok');
      expect(result.checks.uptime.message).toContain('seconds');
    });
  });
});

