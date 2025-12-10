import AsyncStorage from "@react-native-async-storage/async-storage";

const SEARCH_HISTORY_KEY = "@search_history";
const MAX_HISTORY = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  type?: "recipe" | "ingredient" | "shoppingList";
}

export async function getSearchHistory(): Promise<SearchHistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    if (!data) return [];
    const history = JSON.parse(data) as SearchHistoryItem[];
    return history.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export async function addToSearchHistory(
  query: string,
  type?: "recipe" | "ingredient" | "shoppingList"
): Promise<void> {
  try {
    const history = await getSearchHistory();
    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      type,
    };
    // Remove duplicates
    const filtered = history.filter((item) => item.query.toLowerCase() !== query.trim().toLowerCase());
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail
  }
}

export async function clearSearchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // Silently fail
  }
}



