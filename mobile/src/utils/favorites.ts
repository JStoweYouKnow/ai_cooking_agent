export type FavoriteValue =
  | boolean
  | "true"
  | "false"
  | "1"
  | "0"
  | 0
  | 1
  | null
  | undefined;

/**
 * Normalize loosely typed favorite flags to a strict boolean.
 */
export function normalizeIsFavorite(value: FavoriteValue): boolean {
  if (__DEV__) {
    const stringAllowed =
      typeof value !== "string" ||
      ["true", "false", "1", "0"].includes(value.toLowerCase());
    const numberAllowed = typeof value !== "number" || value === 0 || value === 1;
    if (!stringAllowed || !numberAllowed) {
      console.warn("[favorites] Unexpected isFavorite value", value);
    }
  }

  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return lower === "true" || lower === "1";
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return false;
}
