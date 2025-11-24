export type ParsedIngredient = {
	name: string;
	quantity?: string;
	unit?: string;
};

export type ParsedRecipe = {
	name: string;
	description?: string | null;
	instructions?: string | null;
	imageUrl?: string | null;
	cuisine?: string | null;
	category?: string | null;
	cookingTime?: number | null;
	servings?: number | null;
	caloriesPerServing?: number | null;
	sourceUrl?: string | null;
	ingredients?: ParsedIngredient[];
	source?: string;
};

function parseJSON<T>(str: string): T | null {
	try {
		return JSON.parse(str) as T;
	} catch {
		return null;
	}
}

function extractJsonLdBlocks(html: string): unknown[] {
	const results: unknown[] = [];
	const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
	let match: RegExpExecArray | null;
	while ((match = scriptRegex.exec(html)) !== null) {
		const raw = match[1]?.trim();
		if (!raw) continue;
		// Some sites wrap JSON-LD in HTML comments
		const cleaned = raw.replace(/^<!--/, "").replace(/-->$/, "").trim();
		const parsed = parseJSON<unknown>(cleaned);
		if (parsed) results.push(parsed);
	}
	return results;
}

function findRecipeNode(node: any): any | null {
	if (!node || typeof node !== "object") return null;
	// Direct recipe object
	if (
		(typeof node["@type"] === "string" && node["@type"].toLowerCase() === "recipe") ||
		(Array.isArray(node["@type"]) && node["@type"].some((t: string) => t.toLowerCase() === "recipe"))
	) {
		return node;
	}
	// @graph array
	if (Array.isArray(node["@graph"])) {
		for (const child of node["@graph"]) {
			const found = findRecipeNode(child);
			if (found) return found;
		}
	}
	// Array of items
	if (Array.isArray(node)) {
		for (const item of node) {
			const found = findRecipeNode(item);
			if (found) return found;
		}
	}
	return null;
}

function normalizeDurationToMinutes(value: unknown): number | null {
	if (typeof value !== "string") return null;
	// Handle ISO8601 durations like PT45M, PT1H20M
	const iso = /^P(T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i;
	const m = iso.exec(value);
	if (m) {
		const hours = m[2] ? parseInt(m[2], 10) : 0;
		const minutes = m[3] ? parseInt(m[3], 10) : 0;
		const seconds = m[4] ? parseInt(m[4], 10) : 0;
		return hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
	}
	// Fallback: extract digits ending with 'min' or similar
	const num = /(\d+)\s*(min|minutes?)/i.exec(value);
	if (num) return parseInt(num[1], 10);
	return null;
}

function toText(value: unknown): string | null {
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value.map(v => (typeof v === "string" ? v : "")).filter(Boolean).join("\n");
	return null;
}

/**
 * Extract image URL from HTML meta tags (og:image, twitter:image, etc.)
 */
function extractImageFromMetaTags(html: string, baseUrl: string): string | null {
	// Try Open Graph image first (most common)
	const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
		html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
	if (ogImageMatch && ogImageMatch[1]) {
		return resolveUrl(ogImageMatch[1], baseUrl);
	}

	// Try Twitter Card image
	const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
		html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
	if (twitterImageMatch && twitterImageMatch[1]) {
		return resolveUrl(twitterImageMatch[1], baseUrl);
	}

	// Try standard meta image
	const metaImageMatch = html.match(/<meta[^>]+name=["']image["'][^>]+content=["']([^"']+)["']/i) ||
		html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']image["']/i);
	if (metaImageMatch && metaImageMatch[1]) {
		return resolveUrl(metaImageMatch[1], baseUrl);
	}

	return null;
}

/**
 * Extract the largest image from HTML (hero image fallback)
 */
function extractLargestImageFromHtml(html: string, baseUrl: string): string | null {
	const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
	const images: Array<{ url: string; size: number }> = [];
	let match: RegExpExecArray | null;

	while ((match = imgRegex.exec(html)) !== null) {
		const src = match[1];
		if (!src || src.startsWith('data:') || src.startsWith('#')) continue;

		// Try to extract width/height attributes to estimate size
		const imgTag = match[0];
		const widthMatch = imgTag.match(/width=["']?(\d+)["']?/i);
		const heightMatch = imgTag.match(/height=["']?(\d+)["']?/i);
		
		let size = 0;
		if (widthMatch && heightMatch) {
			size = parseInt(widthMatch[1], 10) * parseInt(heightMatch[1], 10);
		} else {
			// If no dimensions, prioritize images with common hero image class names
			const hasHeroClass = /class=["'][^"']*(hero|feature|main|primary|banner|cover)[^"']*["']/i.test(imgTag);
			size = hasHeroClass ? 1000000 : 1000; // Give hero images priority
		}

		images.push({
			url: resolveUrl(src, baseUrl),
			size,
		});
	}

	if (images.length === 0) return null;

	// Sort by size (largest first) and return the first one
	images.sort((a, b) => b.size - a.size);
	return images[0].url;
}

/**
 * Resolve relative URLs to absolute URLs
 */
function resolveUrl(url: string, baseUrl: string): string {
	try {
		return new URL(url, baseUrl).toString();
	} catch {
		return url;
	}
}

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
	const res = await fetch(url, { redirect: "follow" });
	if (!res.ok) return null;
	const html = await res.text();
	const baseUrl = res.url || url;
	
	// Extract image from meta tags first (most reliable)
	let extractedImage: string | null = extractImageFromMetaTags(html, baseUrl);
	
	const blocks = extractJsonLdBlocks(html);
	let parsedRecipe: ParsedRecipe | null = null;
	
	for (const block of blocks) {
		const recipe = findRecipeNode(block);
		if (!recipe) continue;
		const name = toText(recipe.name) || "";
		if (!name) continue;
		const description = toText(recipe.description) ?? null;
		let instructions: string | null = null;
		if (recipe.recipeInstructions) {
			if (typeof recipe.recipeInstructions === "string") {
				instructions = recipe.recipeInstructions;
			} else if (Array.isArray(recipe.recipeInstructions)) {
				instructions = recipe.recipeInstructions
					.map((s: any) => {
						if (typeof s === "string") return s;
						if (typeof s === "object" && s !== null) {
							return s.text || s.name || s.itemListElement || JSON.stringify(s);
						}
						return String(s || "");
					})
					.filter(Boolean)
					.join("\n");
			} else if (typeof recipe.recipeInstructions === "object") {
				// Handle single object with text property
				instructions = (recipe.recipeInstructions as any).text || JSON.stringify(recipe.recipeInstructions);
			} else {
				instructions = String(recipe.recipeInstructions);
			}
		}
		
		// Extract image from JSON-LD (preferred if available)
		const jsonLdImage =
			typeof recipe.image === "string"
				? recipe.image
				: Array.isArray(recipe.image) && recipe.image.length > 0
				? (typeof recipe.image[0] === "string" ? recipe.image[0] : recipe.image[0]?.url || null)
				: typeof recipe.image?.url === "string"
				? recipe.image.url
				: null;
		
		// Use JSON-LD image if available, otherwise use extracted meta tag image
		const imageUrl = jsonLdImage ? resolveUrl(jsonLdImage, baseUrl) : extractedImage;
		
		const category = toText(recipe.recipeCategory) ?? null;
		const cuisine = toText(recipe.recipeCuisine) ?? null;
		const cookingTime =
			normalizeDurationToMinutes(recipe.totalTime) ||
			normalizeDurationToMinutes(recipe.cookTime) ||
			normalizeDurationToMinutes(recipe.prepTime) ||
			null;
		const servings =
			typeof recipe.recipeYield === "number"
				? recipe.recipeYield
				: typeof recipe.recipeYield === "string"
				? parseInt(recipe.recipeYield, 10) || null
				: null;
		const ingredients: ParsedIngredient[] | undefined = Array.isArray(recipe.recipeIngredient)
			? recipe.recipeIngredient.map((line: string) => {
					// naive split "quantity unit name"
					const parts = String(line).trim().split(/\s+/);
					if (parts.length <= 1) return { name: line };
					const quantity = parts.shift();
					const unit = parts.shift();
					return { name: parts.join(" "), quantity, unit };
			  })
			: undefined;
		
		parsedRecipe = {
			name,
			description,
			instructions,
			imageUrl: imageUrl || null,
			cuisine,
			category,
			cookingTime,
			servings,
			sourceUrl: url,
			ingredients,
			source: "url_import",
		};
		break; // Use first valid recipe found
	}
	
	// If no JSON-LD recipe found but we have an image, try to extract basic info from HTML
	if (!parsedRecipe && extractedImage) {
		// Try to find title from HTML
		const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
			html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
			html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
		const title = titleMatch ? titleMatch[1].trim() : null;
		
		if (title) {
			parsedRecipe = {
				name: title,
				description: null,
				instructions: null,
				imageUrl: extractedImage,
				cuisine: null,
				category: null,
				cookingTime: null,
				servings: null,
				sourceUrl: url,
				ingredients: undefined,
				source: "url_import",
			};
		}
	}
	
	// Final fallback: if we still don't have an image, try to find the largest image on the page
	if (parsedRecipe && !parsedRecipe.imageUrl) {
		const largestImage = extractLargestImageFromHtml(html, baseUrl);
		if (largestImage) {
			parsedRecipe.imageUrl = largestImage;
		}
	}
	
	return parsedRecipe;
}


