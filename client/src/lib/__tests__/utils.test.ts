import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUUID } from '../utils';

describe('getUUID', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  afterEach(() => {
    // Restore original crypto after each test
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('when crypto.randomUUID is available', () => {
    it('should use crypto.randomUUID() when available', () => {
      const mockUUID = '550e8400-e29b-41d4-a716-446655440000';
      const mockRandomUUID = vi.fn(() => mockUUID);
      vi.stubGlobal('crypto', {
        randomUUID: mockRandomUUID,
      });

      const result = getUUID();

      expect(result).toBe(mockUUID);
      expect(mockRandomUUID).toHaveBeenCalledTimes(1);
    });

    it('should return a valid UUID v4 format', () => {
      const mockUUID = '550e8400-e29b-41d4-a716-446655440000';
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => mockUUID),
      });

      const result = getUUID();

      expect(result).toMatch(uuidRegex);
    });
  });

  describe('when crypto.randomUUID throws an error', () => {
    it('should fall back to uuid package when crypto.randomUUID throws', () => {
      const mockRandomUUID = vi.fn(() => {
        throw new Error('crypto.randomUUID is not available');
      });
      vi.stubGlobal('crypto', {
        randomUUID: mockRandomUUID,
      });

      const result = getUUID();

      // Should still return a valid UUID from the fallback
      expect(result).toMatch(uuidRegex);
      expect(mockRandomUUID).toHaveBeenCalledTimes(1);
    });
  });

  describe('when crypto.randomUUID is not available', () => {
    it('should fall back to uuid package when crypto is undefined', () => {
      vi.stubGlobal('crypto', undefined);

      const result = getUUID();

      expect(result).toMatch(uuidRegex);
    });

    it('should fall back to uuid package when crypto.randomUUID is undefined', () => {
      vi.stubGlobal('crypto', {});

      const result = getUUID();

      expect(result).toMatch(uuidRegex);
    });
  });

  describe('cross-environment compatibility', () => {
    it('should generate unique UUIDs on each call', () => {
      const uuids = new Set<string>();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const uuid = getUUID();
        expect(uuid).toMatch(uuidRegex);
        uuids.add(uuid);
      }

      // All UUIDs should be unique
      expect(uuids.size).toBe(iterations);
    });

    it('should work in non-secure context (HTTP pages)', () => {
      // Simulate non-secure context where crypto.randomUUID might throw
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn(() => {
          throw new DOMException('The operation is insecure', 'SecurityError');
        }),
      });

      const result = getUUID();

      // Should still return a valid UUID from fallback
      expect(result).toMatch(uuidRegex);
    });

    it('should work in server-side rendering environments', () => {
      // Simulate Node.js environment where crypto might not have randomUUID
      vi.stubGlobal('crypto', undefined);

      const result = getUUID();

      // Should use uuid package fallback
      expect(result).toMatch(uuidRegex);
    });

    it('should work in legacy browser environments', () => {
      // Simulate legacy browser without crypto.randomUUID
      vi.stubGlobal('crypto', {
        getRandomValues: vi.fn(),
      });

      const result = getUUID();

      // Should use uuid package fallback
      expect(result).toMatch(uuidRegex);
    });
  });

  describe('deterministic behavior', () => {
    it('should always return a string', () => {
      const result = getUUID();
      expect(typeof result).toBe('string');
    });

    it('should return UUIDs of consistent length', () => {
      const results = Array.from({ length: 10 }, () => getUUID());
      const lengths = results.map((uuid) => uuid.length);

      // UUID v4 format is always 36 characters (32 hex + 4 hyphens)
      expect(lengths.every((len) => len === 36)).toBe(true);
    });

    it('should return UUIDs with correct v4 format structure', () => {
      const result = getUUID();
      const parts = result.split('-');

      expect(parts.length).toBe(5);
      expect(parts[0].length).toBe(8);
      expect(parts[1].length).toBe(4);
      expect(parts[2].length).toBe(4);
      expect(parts[3].length).toBe(4);
      expect(parts[4].length).toBe(12);

      // Version 4 indicator: third group starts with 4
      expect(parts[2][0]).toBe('4');

      // Variant indicator: fourth group starts with 8, 9, a, or b
      expect(['8', '9', 'a', 'b', 'A', 'B']).toContain(parts[3][0]);
    });
  });
});

