/**
 * Input sanitization utilities for security
 * Prevents XSS and other injection attacks
 */

/**
 * HTML entities to escape
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escape HTML special characters to prevent XSS
 */
export const escapeHtml = (str: string): string => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
};

/**
 * Remove HTML tags from a string
 */
export const stripHtml = (str: string): string => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "");
};

/**
 * Sanitize a string for safe display
 * Removes HTML tags and trims whitespace
 */
export const sanitizeText = (str: string): string => {
  if (!str || typeof str !== "string") return "";
  return stripHtml(str).trim();
};

/**
 * Sanitize a URL - validate and clean
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();

  // Check for javascript: or data: URLs (potential XSS)
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.startsWith("javascript:") ||
    lowerUrl.startsWith("data:") ||
    lowerUrl.startsWith("vbscript:")
  ) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    // Only allow http and https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

/**
 * Sanitize an ingredient name
 */
export const sanitizeIngredientName = (name: string): string => {
  if (!name || typeof name !== "string") return "";

  // Remove HTML tags
  let sanitized = stripHtml(name);

  // Trim and normalize whitespace
  sanitized = sanitized.trim().replace(/\s+/g, " ");

  // Remove any control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.slice(0, 255);
  }

  return sanitized;
};

/**
 * Sanitize a recipe name
 */
export const sanitizeRecipeName = (name: string): string => {
  if (!name || typeof name !== "string") return "";

  // Remove HTML tags
  let sanitized = stripHtml(name);

  // Trim and normalize whitespace
  sanitized = sanitized.trim().replace(/\s+/g, " ");

  // Remove any control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.slice(0, 500);
  }

  return sanitized;
};

/**
 * Sanitize a search query
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== "string") return "";

  // Remove HTML tags
  let sanitized = stripHtml(query);

  // Trim and normalize whitespace
  sanitized = sanitized.trim().replace(/\s+/g, " ");

  // Remove any control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  // Limit length for search queries
  if (sanitized.length > 100) {
    sanitized = sanitized.slice(0, 100);
  }

  return sanitized;
};

/**
 * Sanitize a quantity string (for recipes)
 */
export const sanitizeQuantity = (quantity: string): string => {
  if (!quantity || typeof quantity !== "string") return "";

  // Allow numbers, fractions, decimals, and common fraction characters
  const sanitized = quantity
    .trim()
    .replace(/[^\d\s\/\.\-\u00BC-\u00BE\u2150-\u215E]/g, "")
    .slice(0, 20);

  return sanitized;
};

/**
 * Sanitize user-provided JSON (for API payloads)
 */
export const sanitizeObject = <T extends Record<string, unknown>>(
  obj: T,
  allowedKeys: (keyof T)[]
): Partial<T> => {
  if (!obj || typeof obj !== "object") return {};

  const sanitized: Partial<T> = {};

  for (const key of allowedKeys) {
    if (key in obj) {
      const value = obj[key];

      if (typeof value === "string") {
        sanitized[key] = sanitizeText(value) as T[typeof key];
      } else if (typeof value === "number" || typeof value === "boolean") {
        sanitized[key] = value;
      }
      // Skip functions, symbols, and other potentially dangerous types
    }
  }

  return sanitized;
};

export default {
  escapeHtml,
  stripHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeIngredientName,
  sanitizeRecipeName,
  sanitizeSearchQuery,
  sanitizeQuantity,
  sanitizeObject,
};
