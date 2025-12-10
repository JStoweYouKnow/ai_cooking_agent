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

/**
 * Extract cooking time from recipe instructions text
 * Looks for patterns like "bake for 30 minutes", "cook 1 hour", etc.
 */
export function extractCookingTimeFromInstructions(instructions: string | null | undefined): number | null {
	if (!instructions) return null;

	const text = instructions.toLowerCase();
	const timePatterns = [
		// "bake for 30 minutes", "cook for 1 hour", "simmer for 45 min"
		/(?:bake|cook|roast|grill|simmer|boil|fry|sauté|steam|microwave|heat|warm)(?:\s+(?:for|about|approximately))?\s+(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?)\s*)?(hour|hr|minute|min)s?/gi,
		// "30 minutes at 350", "1 hour or until"
		/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?)\s*)?(hour|hr|minute|min)s?\s+(?:at|or|until)/gi,
		// "for 30-45 minutes"
		/for\s+(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?)\s*)?(hour|hr|minute|min)s?/gi,
	];

	let totalMinutes = 0;
	const foundTimes: number[] = [];

	for (const pattern of timePatterns) {
		let match: RegExpExecArray | null;
		while ((match = pattern.exec(text)) !== null) {
			const value1 = parseFloat(match[1]);
			const value2 = match[2] ? parseFloat(match[2]) : null;
			const unit = match[3].toLowerCase();

			// Use the higher value if a range is given (e.g., "30-45 minutes" -> 45)
			const value = value2 || value1;

			let minutes = 0;
			if (unit.startsWith('hour') || unit === 'hr') {
				minutes = value * 60;
			} else {
				minutes = value;
			}

			if (minutes > 0 && minutes <= 1440) { // Max 24 hours
				foundTimes.push(minutes);
			}
		}
	}

	if (foundTimes.length === 0) return null;

	// Return the longest time found (likely the total cooking time)
	return Math.max(...foundTimes);
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

		// Try to get cooking time from structured data first
		let cookingTime =
			normalizeDurationToMinutes(recipe.totalTime) ||
			normalizeDurationToMinutes(recipe.cookTime) ||
			normalizeDurationToMinutes(recipe.prepTime) ||
			null;

		// If no cooking time found in structured data, try to extract from instructions
		if (!cookingTime && instructions) {
			cookingTime = extractCookingTimeFromInstructions(instructions);
		}
		const servings =
			typeof recipe.recipeYield === "number"
				? recipe.recipeYield
				: typeof recipe.recipeYield === "string"
				? parseInt(recipe.recipeYield, 10) || null
				: null;
		const ingredients: ParsedIngredient[] | undefined = Array.isArray(recipe.recipeIngredient)
			? recipe.recipeIngredient
					.map((item: any): ParsedIngredient | null => {
						// Extract string from item (handle both string and object cases)
						let line: string;
						if (typeof item === "string") {
							line = item;
						} else if (typeof item === "object" && item !== null) {
							// Try to extract text from common object properties
							line = item.text || item.name || item.itemListElement || String(item);
						} else {
							line = String(item);
						}

						// Skip empty or invalid ingredient lines
						const trimmed = line.trim();
						if (!trimmed || trimmed === "[object Object]") {
							return null;
						}

						// naive split "quantity unit name"
						const parts = trimmed.split(/\s+/);
						if (parts.length <= 1) return { name: trimmed };
						const quantity = parts.shift();
						const unit = parts.shift();
						return { name: parts.join(" "), quantity, unit };
					})
					.filter((ing): ing is ParsedIngredient => ing !== null && ing.name.trim().length > 0)
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



/**
 * Extract cooking time from steps array (JSONB format from imported recipes)
 * Combines all steps into text and extracts the cooking time
 */
export function extractCookingTimeFromSteps(steps: unknown): number | null {
	if (!steps) return null;
	
	let stepsText = '';
	
	if (Array.isArray(steps)) {
		// Handle array of strings or objects
		stepsText = steps.map(step => {
			if (typeof step === 'string') return step;
			if (typeof step === 'object' && step !== null) {
				return (step as any).text || (step as any).raw || JSON.stringify(step);
			}
			return String(step || '');
		}).join('\n');
	} else if (typeof steps === 'string') {
		stepsText = steps;
	}
	
	return extractCookingTimeFromInstructions(stepsText);
}

/**
 * Get cooking time from any available source:
 * 1. cookingTime field (if set)
 * 2. cook_time_minutes field (from imports)
 * 3. Extract from instructions text
 * 4. Extract from steps array
 */
export function getEffectiveCookingTime(recipe: {
	cookingTime?: number | null;
	cook_time_minutes?: number | null;
	instructions?: string | null;
	steps?: unknown;
}): number | null {
	// 1. Use explicit cooking time if set
	if (recipe.cookingTime && recipe.cookingTime > 0) {
		return recipe.cookingTime;
	}
	
	// 2. Use cook_time_minutes from import
	if ((recipe as any).cook_time_minutes && (recipe as any).cook_time_minutes > 0) {
		return (recipe as any).cook_time_minutes;
	}
	
	// 3. Try to extract from instructions text
	if (recipe.instructions) {
		const extracted = extractCookingTimeFromInstructions(recipe.instructions);
		if (extracted) return extracted;
	}
	
	// 4. Try to extract from steps array
	if ((recipe as any).steps) {
		const extracted = extractCookingTimeFromSteps((recipe as any).steps);
		if (extracted) return extracted;
	}
	
	return null;
}
