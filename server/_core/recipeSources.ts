/**
 * Recipe source integrations for Epicurious, Delish, and NYT Cooking
 * Uses web scraping and API calls where available
 */

export type RecipeSource = "TheMealDB" | "Epicurious" | "Delish" | "NYTCooking" | "UserImport";

export interface RecipeSearchResult {
  id: string;
  title: string;
  imageUrl?: string;
  source: RecipeSource;
  url?: string;
  description?: string;
}

export interface RecipeDetails {
  name: string;
  description?: string;
  instructions?: string;
  imageUrl?: string;
  cuisine?: string;
  category?: string;
  cookingTime?: number;
  servings?: number;
  sourceUrl?: string;
  source: RecipeSource;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
}

/**
 * Search Epicurious recipes by ingredients
 * Uses web scraping to extract recipe data
 */
export async function searchEpicurious(ingredients: string[]): Promise<RecipeSearchResult[]> {
  try {
    const query = ingredients.join(" ");
    const searchUrl = `https://www.epicurious.com/search?content=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.warn(`[Epicurious] Search failed: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    const results: RecipeSearchResult[] = [];
    
    // Extract recipe links from search results
    // Epicurious uses structured data and specific class names
    const recipeLinkRegex = /<a[^>]*href="(\/recipes\/food\/views\/[^"]+)"[^>]*>/g;
    const titleRegex = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g;
    const imageRegex = /<img[^>]*src="([^"]+)"[^>]*alt="[^"]*"[^>]*>/g;
    
    let match;
    const seenUrls = new Set<string>();
    
    while ((match = recipeLinkRegex.exec(html)) !== null && results.length < 10) {
      const recipePath = match[1];
      if (recipePath.startsWith('/recipes/') && !seenUrls.has(recipePath)) {
        seenUrls.add(recipePath);
        const fullUrl = `https://www.epicurious.com${recipePath}`;
        
        // Try to extract title and image from surrounding HTML
        const contextStart = Math.max(0, match.index - 500);
        const contextEnd = Math.min(html.length, match.index + 500);
        const context = html.substring(contextStart, contextEnd);
        
        const titleMatch = context.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/);
        const imageMatch = context.match(/<img[^>]*src="([^"]+)"[^>]*alt="[^"]*"[^>]*>/);
        
        results.push({
          id: recipePath,
          title: titleMatch ? titleMatch[1].trim() : 'Epicurious Recipe',
          imageUrl: imageMatch ? imageMatch[1] : undefined,
          source: "Epicurious",
          url: fullUrl,
        });
      }
    }
    
    console.log(`[Epicurious] Found ${results.length} recipes for: ${query}`);
    return results;
  } catch (error) {
    console.error("[Epicurious] Search error:", error);
    return [];
  }
}

/**
 * Search Delish recipes by ingredients
 * Uses web scraping to extract recipe data
 */
export async function searchDelish(ingredients: string[]): Promise<RecipeSearchResult[]> {
  try {
    const query = ingredients.join(" ");
    const searchUrl = `https://www.delish.com/search/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.warn(`[Delish] Search failed: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    const results: RecipeSearchResult[] = [];
    
    // Delish uses article tags with data attributes
    const articleRegex = /<article[^>]*data-url="([^"]+)"[^>]*>/g;
    const seenUrls = new Set<string>();
    
    let match;
    while ((match = articleRegex.exec(html)) !== null && results.length < 10) {
      const url = match[1];
      if (url.includes('/cooking/recipes/') && !seenUrls.has(url)) {
        seenUrls.add(url);
        
        // Extract title and image from article context
        const contextStart = Math.max(0, match.index - 1000);
        const contextEnd = Math.min(html.length, match.index + 1000);
        const context = html.substring(contextStart, contextEnd);
        
        const titleMatch = context.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/);
        const imageMatch = context.match(/<img[^>]*src="([^"]+)"[^>]*alt="[^"]*"[^>]*>/);
        
        results.push({
          id: url.split('/').pop() || url,
          title: titleMatch ? titleMatch[1].trim() : 'Delish Recipe',
          imageUrl: imageMatch ? imageMatch[1] : undefined,
          source: "Delish",
          url: url.startsWith('http') ? url : `https://www.delish.com${url}`,
        });
      }
    }
    
    console.log(`[Delish] Found ${results.length} recipes for: ${query}`);
    return results;
  } catch (error) {
    console.error("[Delish] Search error:", error);
    return [];
  }
}

/**
 * Search NYT Cooking recipes by ingredients
 * Uses NYT API if key is available, otherwise falls back to web scraping
 */
export async function searchNYTCooking(ingredients: string[]): Promise<RecipeSearchResult[]> {
  try {
    const query = ingredients.join(" ");
    const { ENV } = await import("./env");
    
    // Try NYT API first if key is available
    if (ENV.nytApiKey) {
      try {
        const apiUrl = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${encodeURIComponent(query)}&fq=section_name:("Cooking")&api-key=${ENV.nytApiKey}`;
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          const results: RecipeSearchResult[] = (data.response?.docs || []).slice(0, 10).map((doc: any) => ({
            id: doc._id,
            title: doc.headline?.main || doc.headline?.print_headline || 'NYT Recipe',
            description: doc.snippet,
            imageUrl: doc.multimedia?.[0] ? `https://www.nytimes.com/${doc.multimedia[0].url}` : undefined,
            source: "NYTCooking",
            url: doc.web_url,
          }));
          
          console.log(`[NYT Cooking API] Found ${results.length} recipes for: ${query}`);
          return results;
        }
      } catch (apiError) {
        console.warn("[NYT Cooking] API failed, falling back to scraping:", apiError);
      }
    }
    
    // Fallback to web scraping
    const searchUrl = `https://cooking.nytimes.com/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.warn(`[NYT Cooking] Search failed: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    const results: RecipeSearchResult[] = [];
    
    // NYT Cooking uses specific data attributes
    const recipeRegex = /<a[^>]*href="(\/recipes\/[^"]+)"[^>]*>/g;
    const seenUrls = new Set<string>();
    
    let match;
    while ((match = recipeRegex.exec(html)) !== null && results.length < 10) {
      const path = match[1];
      if (!seenUrls.has(path)) {
        seenUrls.add(path);
        const fullUrl = `https://cooking.nytimes.com${path}`;
        
        const contextStart = Math.max(0, match.index - 500);
        const contextEnd = Math.min(html.length, match.index + 500);
        const context = html.substring(contextStart, contextEnd);
        
        const titleMatch = context.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/);
        
        results.push({
          id: path.split('/').pop() || path,
          title: titleMatch ? titleMatch[1].trim() : 'NYT Cooking Recipe',
          source: "NYTCooking",
          url: fullUrl,
        });
      }
    }
    
    console.log(`[NYT Cooking] Found ${results.length} recipes for: ${query}`);
    return results;
  } catch (error) {
    console.error("[NYT Cooking] Search error:", error);
    return [];
  }
}

/**
 * Fetch recipe details from a source URL
 */
export async function fetchRecipeFromUrl(url: string): Promise<RecipeDetails | null> {
  try {
    // Detect source from URL
    if (url.includes("epicurious.com")) {
      return await fetchEpicuriousRecipe(url);
    } else if (url.includes("delish.com")) {
      return await fetchDelishRecipe(url);
    } else if (url.includes("nytimes.com") || url.includes("cooking.nytimes.com")) {
      return await fetchNYTCookingRecipe(url);
    }
    
    // Fallback to generic parsing (already implemented in recipeParsing.ts)
    return null;
  } catch (error) {
    console.error("[Recipe Sources] Fetch error:", error);
    return null;
  }
}

async function fetchEpicuriousRecipe(url: string): Promise<RecipeDetails | null> {
  // Would implement actual scraping here
  return null;
}

async function fetchDelishRecipe(url: string): Promise<RecipeDetails | null> {
  // Would implement actual scraping here
  return null;
}

async function fetchNYTCookingRecipe(url: string): Promise<RecipeDetails | null> {
  // Would implement actual scraping here
  return null;
}

