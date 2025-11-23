/**
 * Grocery store integration utilities
 * Generates URLs and formats shopping lists for popular grocery stores
 */

export type GroceryStore =
  | 'wholefoods'
  | 'sprouts'
  | 'instacart'
  | 'amazonfresh'
  | 'walmart'
  | 'target'
  | 'clipboard';

export interface ShoppingListItem {
  name: string;
  quantity?: string | null;
  unit?: string | null;
}

interface StoreConfig {
  name: string;
  icon: string;
  searchUrl: string;
  searchParam: string;
  supportsMultiItem: boolean;
  additionalParams?: Record<string, string>;
  openStorefrontOnly?: boolean;
  homepageUrl?: string; // URL for the store homepage (used for large lists)
}

/**
 * Store configurations with their search URL patterns
 */
const STORE_CONFIGS: Record<Exclude<GroceryStore, 'clipboard'>, StoreConfig> = {
  wholefoods: {
    name: 'Whole Foods',
    icon: '🛒',
    searchUrl: 'https://www.amazon.com/alm/storefront',
    searchParam: 'k',
    supportsMultiItem: false,
    additionalParams: {
      almBrandId: 'VUZHIFdob2xlIEZvb2Rz',
      ref: 'nav_cs_dsk_grfl_stfr_wf',
    },
    // Whole Foods opens directly to storefront, not search
    openStorefrontOnly: true,
    homepageUrl: 'https://www.amazon.com/alm/storefront?almBrandId=VUZHIFdob2xlIEZvb2Rz&ref=nav_cs_dsk_grfl_stfr_wf',
  },
  sprouts: {
    name: 'Sprouts',
    icon: '🥬',
    searchUrl: 'https://shop.sprouts.com/search',
    searchParam: 'search_term',
    supportsMultiItem: false,
    homepageUrl: 'https://shop.sprouts.com',
  },
  instacart: {
    name: 'Instacart',
    icon: '🛍️',
    searchUrl: 'https://www.instacart.com/store/search',
    searchParam: 'query',
    supportsMultiItem: false,
    homepageUrl: 'https://www.instacart.com',
  },
  amazonfresh: {
    name: 'Amazon Fresh',
    icon: '📦',
    searchUrl: 'https://www.amazon.com/s',
    searchParam: 'k',
    additionalParams: { i: 'amazonfresh' },
    supportsMultiItem: false,
    homepageUrl: 'https://www.amazon.com/alm/storefront?almBrandId=ATVPDKIKX0DER',
  },
  walmart: {
    name: 'Walmart',
    icon: '🏪',
    searchUrl: 'https://www.walmart.com/search',
    searchParam: 'q',
    supportsMultiItem: false,
    homepageUrl: 'https://www.walmart.com',
  },
  target: {
    name: 'Target',
    icon: '🎯',
    searchUrl: 'https://www.target.com/s',
    searchParam: 'searchTerm',
    supportsMultiItem: false,
    homepageUrl: 'https://www.target.com',
  },
};

/**
 * Format item with quantity for search
 */
function formatItemForSearch(item: ShoppingListItem): string {
  const parts = [item.name];
  if (item.quantity) parts.push(item.quantity);
  if (item.unit) parts.push(item.unit);
  return parts.join(' ').trim();
}

/**
 * Format item for simple list (name only or name + quantity)
 */
function formatItemSimple(item: ShoppingListItem, includeQuantity = true): string {
  if (!includeQuantity) return item.name;

  const quantityUnit = [item.quantity, item.unit].filter(Boolean).join(' ');
  return quantityUnit ? `${item.name} (${quantityUnit})` : item.name;
}

/**
 * Generate search URL for a specific store and item
 */
function generateSearchUrl(store: GroceryStore, searchTerm: string): string {
  if (store === 'clipboard') return '';

  const config = STORE_CONFIGS[store];
  const url = new URL(config.searchUrl);
  
  // For Whole Foods, just open the storefront (no search)
  if (store === 'wholefoods') {
    // Add the required params for the storefront
    if (config.additionalParams) {
      Object.entries(config.additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }
  
  // For other stores, add search term
  url.searchParams.set(config.searchParam, searchTerm);

  // Add any additional required params
  if (config.additionalParams) {
    Object.entries(config.additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * Get the homepage URL for a store
 */
function getStoreHomepage(store: GroceryStore): string {
  if (store === 'clipboard') return '';
  
  const config = STORE_CONFIGS[store];
  
  // Use explicit homepage URL if provided
  if (config.homepageUrl) {
    return config.homepageUrl;
  }
  
  // Otherwise, derive from search URL by removing search path
  try {
    const url = new URL(config.searchUrl);
    // Remove the search path (e.g., /search, /s) and keep just the base domain
    url.pathname = '/';
    // Remove search params
    url.search = '';
    return url.toString();
  } catch {
    // Fallback to search URL without path
    return config.searchUrl.split('/search')[0] || config.searchUrl.split('/s')[0] || config.searchUrl;
  }
}

/**
 * Send shopping list to a grocery store
 * Opens search pages in new tabs (one per item or combined)
 * For lists over 10 items, opens homepage and copies list to clipboard
 */
export async function sendToGroceryStore(
  items: ShoppingListItem[],
  store: GroceryStore,
  options: {
    openInNewTabs?: boolean;
    maxTabs?: number;
    combinedSearchThreshold?: number;
  } = {}
): Promise<void> {
  const { openInNewTabs = true, maxTabs = 10, combinedSearchThreshold = 10 } = options;

  if (store === 'clipboard') {
    await copyToClipboard(items);
    return;
  }

  const config = STORE_CONFIGS[store];

  // Filter out checked items (assuming you might add this later)
  const uncheckedItems = items;

  // For stores that only open storefront (like Whole Foods), just open the storefront URL
  if (config.openStorefrontOnly) {
    const url = generateSearchUrl(store, '');
    window.open(url, openInNewTabs ? '_blank' : '_self');
    return;
  }

  // For lists over the threshold, open homepage and copy list to clipboard
  if (uncheckedItems.length > combinedSearchThreshold) {
    const homepageUrl = getStoreHomepage(store);
    window.open(homepageUrl, openInNewTabs ? '_blank' : '_self');
    await copyToClipboard(uncheckedItems, 'withQuantity');
    return;
  }

  // For smaller lists, check if store supports multi-item or use individual tabs
  if (config.supportsMultiItem) {
    // Some stores might support adding multiple items in one URL
    const allItems = uncheckedItems.map(formatItemForSearch).join(', ');
    const url = generateSearchUrl(store, allItems);
    window.open(url, openInNewTabs ? '_blank' : '_self');
  } else {
    // Open each item in a separate tab/window (limited to maxTabs)
    const itemsToOpen = uncheckedItems.slice(0, maxTabs);

    itemsToOpen.forEach((item, index) => {
      const searchTerm = formatItemForSearch(item);
      const url = generateSearchUrl(store, searchTerm);

      // Small delay between opening tabs to avoid popup blockers
      setTimeout(() => {
        window.open(url, '_blank');
      }, index * 100);
    });

    if (uncheckedItems.length > maxTabs) {
      console.warn(`Only opened ${maxTabs} items. ${uncheckedItems.length - maxTabs} items remaining.`);
    }
  }
}

/**
 * Copy shopping list to clipboard in various formats
 */
export async function copyToClipboard(
  items: ShoppingListItem[],
  format: 'simple' | 'withQuantity' | 'commaSeparated' = 'withQuantity'
): Promise<void> {
  let text = '';

  switch (format) {
    case 'simple':
      text = items.map(item => item.name).join('\n');
      break;
    case 'withQuantity':
      text = items.map(item => formatItemSimple(item, true)).join('\n');
      break;
    case 'commaSeparated':
      text = items.map(item => formatItemSimple(item, true)).join(', ');
      break;
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Get store configuration
 */
export function getStoreConfig(store: GroceryStore) {
  if (store === 'clipboard') {
    return {
      name: 'Copy to Clipboard',
      icon: '📋',
      searchUrl: '',
      searchParam: '',
      supportsMultiItem: false,
    };
  }
  return STORE_CONFIGS[store];
}

/**
 * Get all available stores
 */
export function getAllStores(): Array<{ id: GroceryStore; name: string; icon: string }> {
  return [
    ...Object.entries(STORE_CONFIGS).map(([id, config]) => ({
      id: id as GroceryStore,
      name: config.name,
      icon: config.icon,
    })),
    {
      id: 'clipboard' as GroceryStore,
      name: 'Copy to Clipboard',
      icon: '📋',
    },
  ];
}
