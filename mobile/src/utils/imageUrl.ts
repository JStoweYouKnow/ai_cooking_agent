import { getBaseUrl } from "../api/client";

/**
 * Resolves a relative or absolute image URL to a full URL.
 * If the URL is already absolute (starts with http:// or https://), returns it as-is.
 * If the URL is relative (starts with /), resolves it against the API base URL.
 * 
 * @param imageUrl - The image URL (can be relative or absolute)
 * @returns The resolved absolute URL, or null if invalid
 */
export function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  const url = imageUrl.trim();
  if (!url) return null;
  
  // If already absolute, return as-is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // If relative (starts with /), resolve against API base URL
  if (url.startsWith("/")) {
    const baseUrl = getBaseUrl();
    // Remove trailing slash from baseUrl if present
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}${url}`;
  }
  
  // If it's a relative path without leading slash, try to resolve it
  // This handles edge cases where URLs might be like "images/..."
  const baseUrl = getBaseUrl();
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/${url}`;
}



