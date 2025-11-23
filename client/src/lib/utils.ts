import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a UUID v4 string with cross-environment compatibility.
 * 
 * Attempts to use the native crypto.randomUUID() when available (secure contexts),
 * then falls back to the uuid package's v4 implementation for compatibility
 * with non-secure contexts, older browsers, and server environments.
 * 
 * @returns A UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * 
 * @example
 * ```ts
 * const id = getUUID();
 * // Returns: "550e8400-e29b-41d4-a716-446655440000"
 * ```
 */
export function getUUID(): string {
  // Try native crypto.randomUUID() first (available in secure contexts and modern runtimes)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (error) {
      // crypto.randomUUID() may throw in non-secure contexts (e.g., HTTP pages)
      // Fall through to uuid package fallback
    }
  }

  // Fallback to uuid package v4 implementation
  // This works in all environments: Node.js, browsers (including legacy), and SSR
  return uuidv4();
}
