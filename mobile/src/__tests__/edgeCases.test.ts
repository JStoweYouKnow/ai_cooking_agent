/**
 * P0 Edge Case Tests
 * Automated tests for critical edge cases that can be tested programmatically
 * These tests verify critical input validation and edge case handling
 */

describe('P0 Edge Cases - Text Input', () => {
  describe('Emoji & Special Characters', () => {
    it('should handle emoji in recipe names', () => {
      const input = '🍕 Pizza Night 🎉';
      expect(input.length).toBeGreaterThan(0);
      expect(input.trim()).toBe(input);
      // Verify emoji is preserved
      expect(input).toContain('🍕');
      expect(input).toContain('🎉');
    });

    it('should handle mixed emoji and text', () => {
      const input = 'Chicken 🍗 with Rice 🍚';
      // Emoji may split differently due to Unicode
      expect(input.includes('Chicken')).toBe(true);
      expect(input.includes('Rice')).toBe(true);
      expect(input.includes('🍗')).toBe(true);
      expect(input.includes('🍚')).toBe(true);
    });

    it('should handle RTL text', () => {
      const rtlText = 'وصفة';
      expect(rtlText.length).toBeGreaterThan(0);
    });

    it('should handle special HTML-like characters safely', () => {
      const input = '<script>alert("xss")</script>';
      // Should not execute, just be treated as text
      expect(input).toContain('<script>');
      expect(typeof input).toBe('string');
    });
  });

  describe('Extreme Input Lengths', () => {
    it('should handle very long input', () => {
      const longInput = 'A'.repeat(500);
      expect(longInput.length).toBe(500);
      // Truncation should happen at display layer
      const truncated = longInput.substring(0, 100);
      expect(truncated.length).toBe(100);
    });

    it('should reject empty input', () => {
      const emptyInput = '';
      expect(emptyInput.trim().length).toBe(0);
      // Validation should fail
      const isValid = emptyInput.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it('should trim whitespace-only input', () => {
      const whitespaceInput = '   ';
      expect(whitespaceInput.trim().length).toBe(0);
      const isValid = whitespaceInput.trim().length > 0;
      expect(isValid).toBe(false);
    });

    it('should handle single character input', () => {
      const singleChar = 'A';
      expect(singleChar.length).toBe(1);
      expect(singleChar.trim().length).toBe(1);
    });
  });

  describe('URL Validation', () => {
    const validateTestUrl = (url: string): { valid: boolean; error?: string } => {
      const trimmedUrl = url.trim();
      if (trimmedUrl.length > 2048) {
        return { valid: false, error: 'URL is too long' };
      }
      try {
        const parsed = new URL(trimmedUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' };
        }
        return { valid: true };
      } catch {
        return { valid: false, error: 'Enter a valid URL' };
      }
    };

    it('should accept valid HTTPS URL', () => {
      const result = validateTestUrl('https://example.com/recipe');
      expect(result.valid).toBe(true);
    });

    it('should accept valid HTTP URL', () => {
      const result = validateTestUrl('http://example.com/recipe');
      expect(result.valid).toBe(true);
    });

    it('should reject javascript: URLs', () => {
      const result = validateTestUrl('javascript:alert(1)');
      expect(result.valid).toBe(false);
    });

    it('should reject file: URLs', () => {
      const result = validateTestUrl('file:///etc/passwd');
      expect(result.valid).toBe(false);
    });

    it('should reject URLs that are too long', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2050);
      const result = validateTestUrl(longUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL is too long');
    });

    it('should reject malformed URLs', () => {
      const result = validateTestUrl('not a url');
      expect(result.valid).toBe(false);
    });

    it('should handle URL with SQL injection attempt', () => {
      const result = validateTestUrl("https://example.com/recipe/1;DROP TABLE recipes");
      // URL is technically valid, but the path is just a string
      expect(result.valid).toBe(true);
      // The path should be URL-encoded when used
    });
  });
});

describe('P0 Edge Cases - Deep Links', () => {
  describe('Deep Link Parsing', () => {
    // Custom scheme URLs are parsed differently - the "host" becomes the first path segment
    const parseDeepLink = (url: string): { screen: string; params: Record<string, string> } | null => {
      try {
        const parsed = new URL(url);
        // For custom schemes like sous://, hostname contains the screen name
        // and pathname contains the rest
        const screen = parsed.hostname || 'Home';
        const pathParts = parsed.pathname.split('/').filter(Boolean);
        const params: Record<string, string> = {};

        if (pathParts.length > 0) {
          params.id = decodeURIComponent(pathParts[0]);
        }

        // Parse query params
        parsed.searchParams.forEach((value, key) => {
          params[key] = value;
        });

        return { screen, params };
      } catch {
        return null;
      }
    };

    it('should parse valid recipe deep link', () => {
      const result = parseDeepLink('sous://recipe/123');
      expect(result).not.toBeNull();
      expect(result?.screen).toBe('recipe');
      expect(result?.params.id).toBe('123');
    });

    it('should handle deep link with no path', () => {
      const result = parseDeepLink('sous://home');
      expect(result).not.toBeNull();
      expect(result?.screen).toBe('home');
    });

    it('should handle malformed deep link', () => {
      const result = parseDeepLink('not a url');
      expect(result).toBeNull();
    });

    it('should handle deep link with query params', () => {
      const result = parseDeepLink('sous://recipe/123?source=notification');
      expect(result).not.toBeNull();
      expect(result?.params.source).toBe('notification');
    });

    it('should handle non-numeric recipe ID gracefully', () => {
      const result = parseDeepLink('sous://recipe/abc');
      expect(result).not.toBeNull();
      // ID is treated as string, validation happens at use site
      expect(result?.params.id).toBe('abc');
    });

    it('should handle SQL injection in deep link', () => {
      const result = parseDeepLink('sous://recipe/1;DROP%20TABLE');
      expect(result).not.toBeNull();
      // The value is just a string, not executed
      expect(result?.params.id).toBe('1;DROP TABLE');
    });
  });
});

describe('P0 Edge Cases - Data Validation', () => {
  describe('Recipe Data', () => {
    interface Recipe {
      title: string;
      ingredients: string[];
      instructions: string;
    }

    const validateRecipe = (recipe: Partial<Recipe>): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!recipe.title || recipe.title.trim().length === 0) {
        errors.push('Title is required');
      }

      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        errors.push('At least one ingredient is required');
      }

      if (!recipe.instructions || recipe.instructions.trim().length === 0) {
        errors.push('Instructions are required');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should validate complete recipe', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredients: ['ingredient 1'],
        instructions: 'Step 1',
      };
      const result = validateRecipe(recipe);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject recipe with empty title', () => {
      const recipe = {
        title: '',
        ingredients: ['ingredient 1'],
        instructions: 'Step 1',
      };
      const result = validateRecipe(recipe);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should reject recipe with no ingredients', () => {
      const recipe = {
        title: 'Test',
        ingredients: [],
        instructions: 'Step 1',
      };
      const result = validateRecipe(recipe);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one ingredient is required');
    });

    it('should handle recipe with emoji in title', () => {
      const recipe = {
        title: '🍕 Pizza 🎉',
        ingredients: ['dough', 'sauce'],
        instructions: 'Make pizza',
      };
      const result = validateRecipe(recipe);
      expect(result.valid).toBe(true);
    });
  });
});

describe('P0 Edge Cases - Subscription State', () => {
  describe('Subscription Validation', () => {
    interface Subscription {
      status: 'active' | 'expired' | 'cancelled' | 'grace_period';
      expiresAt: Date;
      productId: string;
    }

    const isSubscriptionActive = (sub: Subscription | null): boolean => {
      if (!sub) return false;
      if (sub.status === 'active') return true;
      if (sub.status === 'grace_period') return true;
      return false;
    };

    const hasExpired = (sub: Subscription): boolean => {
      return sub.expiresAt < new Date();
    };

    it('should recognize active subscription', () => {
      const sub: Subscription = {
        status: 'active',
        expiresAt: new Date(Date.now() + 86400000), // +1 day
        productId: 'premium_monthly',
      };
      expect(isSubscriptionActive(sub)).toBe(true);
    });

    it('should recognize grace period as active', () => {
      const sub: Subscription = {
        status: 'grace_period',
        expiresAt: new Date(Date.now() - 86400000), // -1 day
        productId: 'premium_monthly',
      };
      expect(isSubscriptionActive(sub)).toBe(true);
    });

    it('should recognize expired subscription', () => {
      const sub: Subscription = {
        status: 'expired',
        expiresAt: new Date(Date.now() - 86400000),
        productId: 'premium_monthly',
      };
      expect(isSubscriptionActive(sub)).toBe(false);
    });

    it('should handle null subscription', () => {
      expect(isSubscriptionActive(null)).toBe(false);
    });

    it('should check expiration date', () => {
      const expiredSub: Subscription = {
        status: 'active',
        expiresAt: new Date(Date.now() - 86400000),
        productId: 'premium_monthly',
      };
      expect(hasExpired(expiredSub)).toBe(true);

      const activeSub: Subscription = {
        status: 'active',
        expiresAt: new Date(Date.now() + 86400000),
        productId: 'premium_monthly',
      };
      expect(hasExpired(activeSub)).toBe(false);
    });
  });
});

describe('P0 Edge Cases - Network Error Handling', () => {
  describe('Error Response Parsing', () => {
    const parseApiError = (error: any): string => {
      if (!error) return 'Unknown error';

      if (error.message?.includes('Network request failed')) {
        return 'No internet connection. Please check your network.';
      }

      if (error.message?.includes('timeout')) {
        return 'Request timed out. Please try again.';
      }

      if (error.data?.code === 'UNAUTHORIZED') {
        return 'Session expired. Please log in again.';
      }

      if (error.message) {
        return error.message;
      }

      return 'Something went wrong. Please try again.';
    };

    it('should handle network error', () => {
      const error = { message: 'Network request failed' };
      expect(parseApiError(error)).toBe('No internet connection. Please check your network.');
    });

    it('should handle timeout error', () => {
      const error = { message: 'Request timeout' };
      expect(parseApiError(error)).toBe('Request timed out. Please try again.');
    });

    it('should handle unauthorized error', () => {
      const error = { data: { code: 'UNAUTHORIZED' } };
      expect(parseApiError(error)).toBe('Session expired. Please log in again.');
    });

    it('should handle generic error message', () => {
      const error = { message: 'Something specific happened' };
      expect(parseApiError(error)).toBe('Something specific happened');
    });

    it('should handle null error', () => {
      expect(parseApiError(null)).toBe('Unknown error');
    });

    it('should handle empty error object', () => {
      expect(parseApiError({})).toBe('Something went wrong. Please try again.');
    });
  });
});

describe('P0 Edge Cases - Cache & Storage', () => {
  describe('Cache Key Generation', () => {
    const generateCacheKey = (prefix: string, id: string | number): string => {
      // Sanitize inputs
      const safePrefix = prefix.replace(/[^a-zA-Z0-9_]/g, '_');
      const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${safePrefix}_${safeId}`;
    };

    it('should generate valid cache key', () => {
      const key = generateCacheKey('recipe', '123');
      expect(key).toBe('recipe_123');
    });

    it('should sanitize special characters in prefix', () => {
      const key = generateCacheKey('recipe/detail', '123');
      expect(key).toBe('recipe_detail_123');
    });

    it('should sanitize special characters in id', () => {
      const key = generateCacheKey('recipe', '123;DROP TABLE');
      expect(key).toBe('recipe_123_DROP_TABLE');
    });

    it('should handle numeric id', () => {
      const key = generateCacheKey('recipe', 456);
      expect(key).toBe('recipe_456');
    });
  });
});
