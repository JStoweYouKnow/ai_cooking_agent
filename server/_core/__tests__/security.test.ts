/**
 * Tests for security utilities
 */

import { describe, it, expect } from 'vitest';
import { sanitizeString, detectSQLInjection, isValidExternalUrl } from '../security';

describe('Security Utilities', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should limit length', () => {
      const longString = 'a'.repeat(2000);
      expect(sanitizeString(longString, 100)).toHaveLength(100);
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('hello\0world')).toBe('helloworld');
    });

    it('should remove control characters', () => {
      expect(sanitizeString('hello\x00\x01\x02world')).toBe('helloworld');
    });
  });

  describe('detectSQLInjection', () => {
    it('should detect SELECT statement', () => {
      expect(detectSQLInjection('SELECT * FROM users')).toBe(true);
    });

    it('should detect UNION attack', () => {
      expect(detectSQLInjection("1' UNION SELECT * FROM users--")).toBe(true);
    });

    it('should detect comment attacks', () => {
      expect(detectSQLInjection("admin'--")).toBe(true);
    });

    it('should allow normal strings', () => {
      expect(detectSQLInjection('hello world')).toBe(false);
    });
  });

  describe('isValidExternalUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      expect(isValidExternalUrl('https://example.com')).toBe(true);
    });

    it('should accept valid HTTP URLs', () => {
      expect(isValidExternalUrl('http://example.com')).toBe(true);
    });

    it('should reject localhost', () => {
      expect(isValidExternalUrl('http://localhost:3000')).toBe(false);
    });

    it('should reject private IPs', () => {
      expect(isValidExternalUrl('http://192.168.1.1')).toBe(false);
      expect(isValidExternalUrl('http://10.0.0.1')).toBe(false);
      expect(isValidExternalUrl('http://172.16.0.1')).toBe(false);
    });

    it('should reject non-HTTP protocols', () => {
      expect(isValidExternalUrl('ftp://example.com')).toBe(false);
      expect(isValidExternalUrl('file:///etc/passwd')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(isValidExternalUrl('not a url')).toBe(false);
    });
  });
});
