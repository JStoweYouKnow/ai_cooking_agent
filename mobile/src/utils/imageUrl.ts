import * as FileSystem from "expo-file-system";
import { getBaseUrl } from "../api/client";

const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory ?? ""}recipe-images`;

/** Simple string hash for cache key (djb2). */
function hashUrl(url: string): string {
  let h = 5381;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) + h) + url.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(36);
}

function getExtension(url: string): string {
  const match = url.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  return match ? match[1].toLowerCase() : "jpg";
}

/** Ensure cache directory exists. */
async function ensureCacheDir(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
    }
  } catch {
    // ignore
  }
}

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

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    const baseUrl = getBaseUrl();
    const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}${url}`;
  }
  const baseUrl = getBaseUrl();
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/${url}`;
}

/**
 * Returns a local file path if the image is in the disk cache, otherwise the resolved URL.
 * Pass the result of resolveImageUrl (absolute URL). Used for offline-first recipe images.
 */
export async function getImageUriForDisplay(resolvedUrl: string | null | undefined): Promise<string | null> {
  if (!resolvedUrl || !resolvedUrl.startsWith("http")) return resolvedUrl ?? null;
  try {
    await ensureCacheDir();
    const key = `${hashUrl(resolvedUrl)}.${getExtension(resolvedUrl)}`;
    const path = `${IMAGE_CACHE_DIR}/${key}`;
    const info = await FileSystem.getInfoAsync(path, { size: false });
    if (info.exists) {
      return path.startsWith("file://") ? path : `file://${path}`;
    }
  } catch {
    // ignore
  }
  return resolvedUrl;
}

/**
 * Download image to disk cache (fire-and-forget). Call after the image has loaded from network.
 */
export function cacheImageAfterLoad(resolvedUrl: string | null | undefined): void {
  if (!resolvedUrl || !resolvedUrl.startsWith("http")) return;
  (async () => {
    try {
      await ensureCacheDir();
      const key = `${hashUrl(resolvedUrl)}.${getExtension(resolvedUrl)}`;
      const path = `${IMAGE_CACHE_DIR}/${key}`;
      await FileSystem.downloadAsync(resolvedUrl, path);
    } catch {
      // ignore
    }
  })();
}



