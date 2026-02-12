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
 * Extract text content from an instruction object/step
 * Handles various JSON-LD formats including HowToStep schema
 */
function extractInstructionText(step: any): string | null {
	if (!step) return null;

	// If it's already a string, return it
	if (typeof step === "string") {
		return step.trim() || null;
	}

	// If it's an object, try to extract text from various properties
	if (typeof step === "object" && step !== null) {
		// Check for direct text properties (most common)
		if (step.text && typeof step.text === "string") {
			return step.text.trim() || null;
		}
		if (step.name && typeof step.name === "string") {
			return step.name.trim() || null;
		}

		// Handle HowToStep schema with itemListElement
		if (step.itemListElement) {
			if (Array.isArray(step.itemListElement)) {
				// Extract text from each element in the array
				const texts = step.itemListElement
					.map((elem: any) => {
						if (typeof elem === "string") return elem;
						if (typeof elem === "object" && elem !== null) {
							return elem.text || elem.name || elem.itemListElement?.text || null;
						}
						return null;
					})
					.filter((t: any): t is string => typeof t === "string" && t.trim().length > 0);
				if (texts.length > 0) {
					return texts.join(" ");
				}
			} else if (typeof step.itemListElement === "object") {
				const elemText = step.itemListElement.text || step.itemListElement.name;
				if (typeof elemText === "string") {
					return elemText.trim() || null;
				}
			}
		}

		// Handle HowToStep with @type
		if (step["@type"] === "HowToStep" || (Array.isArray(step["@type"]) && step["@type"].includes("HowToStep"))) {
			// Try text property first
			if (step.text && typeof step.text === "string") {
				return step.text.trim() || null;
			}
			// Try name property
			if (step.name && typeof step.name === "string") {
				return step.name.trim() || null;
			}
		}

		// Last resort: try to find any string property
		for (const key of ["text", "name", "description", "instructionText", "stepText"]) {
			if (step[key] && typeof step[key] === "string" && step[key].trim()) {
				return step[key].trim();
			}
		}

		// If all else fails, don't use JSON.stringify as it can truncate
		// Instead, return null to skip this step
		return null;
	}

	// For other types, convert to string but filter out invalid values
	const str = String(step || "");
	return str.trim() && str !== "[object Object]" ? str.trim() : null;
}

/**
 * Extract text content from an ingredient object/item
 * Handles various JSON-LD formats including Ingredient schema
 * Recursively extracts text from nested structures to preserve complete ingredient text
 */
function extractIngredientText(item: any): string | null {
	if (!item) return null;

	// If it's already a string, decode HTML entities and return it
	if (typeof item === "string") {
		const decoded = item.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
		// Also handle numeric entities
		const fullyDecoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
			.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
		return fullyDecoded.trim() || null;
	}

	// If it's an object, try to extract text from various properties
	if (typeof item === "object" && item !== null) {
		// PRIORITY 1: Check itemListElement first (often contains complete text in structured formats)
		// This must come before text/name checks to avoid truncation when itemListElement has full text
		if (item.itemListElement) {
			if (Array.isArray(item.itemListElement)) {
				// Recursively extract text from each element in the array
				// This handles cases where ingredient text is split across multiple array elements
				const texts = item.itemListElement
					.map((elem: any) => {
						// Recursively call extractIngredientText to handle nested structures
						// This will extract from nested itemListElement, text, name, etc.
						return extractIngredientText(elem);
					})
					.filter((t: string | null): t is string => t !== null && t.trim().length > 0);
				if (texts.length > 0) {
					// Join with space to preserve complete ingredient text
					// This reconstructs "Salt and pepper" from ["Salt", "and", "pepper"]
					const joined = texts.join(" ");
					// If we got text from itemListElement, prefer it over direct text/name
					// But also check if direct text/name is longer (might be more complete)
					const directText = (item.text && typeof item.text === "string") ? item.text.trim() : null;
					const directName = (item.name && typeof item.name === "string") ? item.name.trim() : null;

					// Use the longest text to ensure we get the complete ingredient
					const candidates = [joined, directText, directName].filter((t): t is string => t !== null && t.length > 0);
					if (candidates.length > 0) {
						// Return the longest candidate (most likely to be complete)
						return candidates.reduce((longest, current) => current.length > longest.length ? current : longest);
					}
					return joined;
				}
			} else if (typeof item.itemListElement === "object") {
				// Recursively extract from nested object
				const elemText = extractIngredientText(item.itemListElement);
				if (elemText) {
					// Also check if direct text/name exists and might be more complete
					const directText = (item.text && typeof item.text === "string") ? item.text.trim() : null;
					const directName = (item.name && typeof item.name === "string") ? item.name.trim() : null;

					// Use the longest text
					const candidates = [elemText, directText, directName].filter((t): t is string => t !== null && t.length > 0);
					if (candidates.length > 0) {
						return candidates.reduce((longest, current) => current.length > longest.length ? current : longest);
					}
					return elemText;
				}
			} else if (typeof item.itemListElement === "string") {
				// Direct string value - also check if text/name is longer
				const itemListText = item.itemListElement.trim();
				const directText = (item.text && typeof item.text === "string") ? item.text.trim() : null;
				const directName = (item.name && typeof item.name === "string") ? item.name.trim() : null;

				const candidates = [itemListText, directText, directName].filter((t): t is string => t !== null && t.length > 0);
				if (candidates.length > 0) {
					return candidates.reduce((longest, current) => current.length > longest.length ? current : longest);
				}
				return itemListText || null;
			}
		}

		// PRIORITY 2: Fall back to direct text properties (only if itemListElement didn't yield results)
		if (item.text && typeof item.text === "string") {
			return item.text.trim() || null;
		}
		if (item.name && typeof item.name === "string") {
			return item.name.trim() || null;
		}

		// Handle Ingredient schema with @type (also prioritize itemListElement if present)
		if (item["@type"] === "Ingredient" || (Array.isArray(item["@type"]) && item["@type"].includes("Ingredient"))) {
			// itemListElement already checked above, so just try text/name as fallback
			if (item.text && typeof item.text === "string") {
				return item.text.trim() || null;
			}
			if (item.name && typeof item.name === "string") {
				return item.name.trim() || null;
			}
		}

		// Try other common ingredient properties
		for (const key of ["text", "name", "description", "ingredientName", "itemName"]) {
			if (item[key] && typeof item[key] === "string" && item[key].trim()) {
				return item[key].trim();
			}
		}

		// If all else fails, don't use String(item) or JSON.stringify as they can truncate
		// Instead, return null to skip this ingredient
		return null;
	}

	// For other types, convert to string but filter out invalid values
	const str = String(item || "");
	return str.trim() && str !== "[object Object]" ? str.trim() : null;
}

/**
 * Comprehensive unit dictionary for cooking measurements
 * Includes volume, weight, and count units
 */
const COOKING_UNITS = new Set([
	// Volume units
	"cup", "cups", "c",
	"tablespoon", "tablespoons", "tbsp", "tbs", "T",
	"teaspoon", "teaspoons", "tsp", "t",
	"fluid ounce", "fluid ounces", "fl oz", "fl. oz.",
	"milliliter", "milliliters", "ml",
	"liter", "liters", "l",
	"gallon", "gallons", "gal",
	"pint", "pints", "pt",
	"quart", "quarts", "qt",
	// Weight units
	"pound", "pounds", "lb", "lbs", "#",
	"ounce", "ounces", "oz",
	"gram", "grams", "g",
	"kilogram", "kilograms", "kg",
	// Count units
	"piece", "pieces", "pc", "pcs",
	"slice", "slices",
	"clove", "cloves",
	"head", "heads",
	"bunch", "bunches",
	"can", "cans",
	"package", "packages", "pkg", "pkgs",
	"container", "containers",
	"bottle", "bottles",
	"jar", "jars",
	"box", "boxes",
]);

/**
 * Parse an ingredient line into quantity, unit, and name
 * Handles fractional quantities, ranges, and complex ingredient names
 * 
 * Examples:
 * - "1 1/2 cups flour" → { quantity: "1 1/2", unit: "cups", name: "flour" }
 * - "3 to 4 tablespoons olive oil" → { quantity: "3 to 4", unit: "tablespoons", name: "olive oil" }
 * - "1/4 cup butter" → { quantity: "1/4", unit: "cup", name: "butter" }
 * - "salt" → { name: "salt" }
 * - "2 eggs" → { quantity: "2", name: "eggs" }
 */
// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
	// Common HTML entities
	const entities: Record<string, string> = {
		'&nbsp;': ' ',
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#39;': "'",
		'&apos;': "'",
	};
	
	let decoded = text;
	// Replace named entities
	for (const [entity, char] of Object.entries(entities)) {
		decoded = decoded.replace(new RegExp(entity, 'gi'), char);
	}
	
	// Replace numeric entities (&#160; for &nbsp;, etc.)
	decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
	decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
	
	return decoded;
}

function parseIngredientLine(line: string): ParsedIngredient {
	// Decode HTML entities first
	const decoded = decodeHtmlEntities(line);
	const trimmed = decoded.trim();
	if (!trimmed) {
		return { name: trimmed };
	}

	// Pattern to match fractional quantities: "1/2", "1 1/2", "2 3/4", etc.
	// This pattern matches fractions with optional whole number prefix
	// The (\d+\s*)? allows for optional whole number with optional space
	const fractionalPattern = /^(\d+\s*)?\d+\/\d+/;
	// Pattern to match ranges: "3 to 4", "2-3", "1 or 2", etc.
	// Capture the separator to preserve original format
	const rangePattern = /^(\d+(?:\s*\/\s*\d+)?)\s*(to|-|or)\s*(\d+(?:\s*\/\s*\d+)?)/i;
	// Pattern to match simple numbers: "2", "1.5", etc.
	const numberPattern = /^(\d+(?:\.\d+)?)/;

	// Try to match a range first (e.g., "3 to 4 cups" or "2-3 cloves")
	const rangeMatch = trimmed.match(rangePattern);
	if (rangeMatch) {
		const rangeStart = rangeMatch[1].trim();
		const rangeEnd = rangeMatch[3].trim();
		const separator = rangeMatch[2].toLowerCase() === "to" ? "to" : rangeMatch[2].toLowerCase() === "or" ? "or" : "-";
		const quantity = `${rangeStart} ${separator} ${rangeEnd}`;
		const afterRange = trimmed.substring(rangeMatch[0].length).trim();

		// Check if next word(s) are a unit
		const words = afterRange.split(/\s+/);
		if (words.length > 0) {
			const firstWord = words[0].toLowerCase();
			const secondWord = words.length > 1 ? `${firstWord} ${words[1].toLowerCase()}` : null;

			// Check for two-word units (e.g., "fluid ounce")
			if (secondWord && COOKING_UNITS.has(secondWord)) {
				const unit = words.slice(0, 2).join(" ");
				const name = words.slice(2).join(" ");
				// Ensure name is never empty - if no name found, use the full original line
				return {
					quantity,
					unit,
					name: name.trim() || trimmed,
				};
			}

			// Check for single-word unit
			if (COOKING_UNITS.has(firstWord)) {
				const unit = words[0];
				const name = words.slice(1).join(" ");
				// Ensure name is never empty - if no name found, use the full original line
				return {
					quantity,
					unit,
					name: name.trim() || trimmed,
				};
			}
		}

		// If no unit found after range, treat the range as quantity and rest as name
		// Ensure we always have a name - use full line if afterRange is empty
		return {
			quantity,
			name: afterRange || trimmed,
		};
	}

	// Try to match fractional quantity (e.g., "1 1/2 cups")
	const fractionalMatch = trimmed.match(fractionalPattern);
	if (fractionalMatch) {
		const fractionalPart = fractionalMatch[0];
		const afterFraction = trimmed.substring(fractionalPart.length).trim();
		const words = afterFraction.split(/\s+/);

		if (words.length > 0) {
			const firstWord = words[0].toLowerCase();
			const secondWord = words.length > 1 ? `${firstWord} ${words[1].toLowerCase()}` : null;

			// Check for two-word units
			if (secondWord && COOKING_UNITS.has(secondWord)) {
				const unit = words.slice(0, 2).join(" ");
				const name = words.slice(2).join(" ");
				// Ensure name is never empty
				return {
					quantity: fractionalPart.trim(),
					unit,
					name: name.trim() || trimmed,
				};
			}

			// Check for single-word unit
			if (COOKING_UNITS.has(firstWord)) {
				const unit = words[0];
				const name = words.slice(1).join(" ");
				// Ensure name is never empty
				return {
					quantity: fractionalPart.trim(),
					unit,
					name: name.trim() || trimmed,
				};
			}
		}

		// If no unit found, treat fractional as quantity and rest as name
		// Ensure we always have a name
		return {
			quantity: fractionalPart.trim(),
			name: afterFraction.trim() || trimmed,
		};
	}

	// Try to match simple number (e.g., "2 cups flour")
	const numberMatch = trimmed.match(numberPattern);
	if (numberMatch) {
		const quantity = numberMatch[1];
		const afterNumber = trimmed.substring(numberMatch[0].length).trim();
		const words = afterNumber.split(/\s+/);

		if (words.length > 0) {
			const firstWord = words[0].toLowerCase();
			const secondWord = words.length > 1 ? `${firstWord} ${words[1].toLowerCase()}` : null;

			// Check for two-word units
			if (secondWord && COOKING_UNITS.has(secondWord)) {
				const unit = words.slice(0, 2).join(" ");
				const name = words.slice(2).join(" ");
				// Ensure name is never empty
				return {
					quantity,
					unit,
					name: name.trim() || trimmed,
				};
			}

			// Check for single-word unit
			if (COOKING_UNITS.has(firstWord)) {
				const unit = words[0];
				const name = words.slice(1).join(" ");
				// Ensure name is never empty
				return {
					quantity,
					unit,
					name: name.trim() || trimmed,
				};
			}
		}

		// If no unit found, treat number as quantity and rest as name
		// Ensure we always have a name
		return {
			quantity,
			name: afterNumber.trim() || trimmed,
		};
	}

	// No quantity/unit found - return as name only
	return { name: trimmed };
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
	// Check if this is a video URL first
	const { isVideoUrl, parseRecipeFromVideoUrl } = await import("./videoParser");
	if (isVideoUrl(url)) {
		console.log(`[RECIPE PARSE] Detected video URL, using video parser: ${url}`);
		try {
			const videoRecipe = await parseRecipeFromVideoUrl(url);
			if (videoRecipe) {
				videoRecipe.sourceUrl = url;
				videoRecipe.source = "video_import";
				return videoRecipe;
			}
			console.log("[RECIPE PARSE] Video parsing failed, falling back to standard parsing");
		} catch (videoError) {
			console.error("[RECIPE PARSE] Error parsing video URL:", videoError);
			console.error("[RECIPE PARSE] Error type:", videoError?.constructor?.name);
			console.error("[RECIPE PARSE] Error message:", videoError instanceof Error ? videoError.message : String(videoError));
			// Re-throw with more context
			const errorMsg = videoError instanceof Error ? videoError.message : String(videoError);
			throw new Error(`Failed to parse video recipe from ${url}: ${errorMsg}`);
		}
	}

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
				instructions = recipe.recipeInstructions.trim() || null;
				console.log(`[RECIPE PARSE] Instructions (string): length=${instructions?.length || 0}`);
			} else if (Array.isArray(recipe.recipeInstructions)) {
				// Extract text from each instruction step, preserving all content
				console.log(`[RECIPE PARSE] Instructions (array): count=${recipe.recipeInstructions.length}`);
				const instructionTexts = recipe.recipeInstructions
					.map((s: any, idx: number) => {
						const text = extractInstructionText(s);
						if (!text) {
							console.warn(`[RECIPE PARSE] Instruction ${idx} could not be extracted:`, typeof s === "object" ? Object.keys(s) : s);
						}
						return text;
					})
					.filter((text: string | null): text is string => text !== null && text.length > 0);

				if (instructionTexts.length > 0) {
					instructions = instructionTexts.join("\n");
					console.log(`[RECIPE PARSE] Instructions extracted: ${instructionTexts.length} steps, total length=${instructions?.length || 0}`);
				} else {
					console.warn(`[RECIPE PARSE] No instruction text could be extracted from ${recipe.recipeInstructions.length} items`);
					instructions = null;
				}
			} else if (typeof recipe.recipeInstructions === "object") {
				// Handle single object (could be HowToStep or similar)
				instructions = extractInstructionText(recipe.recipeInstructions);
				console.log(`[RECIPE PARSE] Instructions (object): length=${instructions?.length || 0}`);
			} else {
				const str = String(recipe.recipeInstructions);
				instructions = str.trim() || null;
				console.log(`[RECIPE PARSE] Instructions (other): length=${instructions?.length || 0}`);
			}
		} else {
			console.log(`[RECIPE PARSE] No recipeInstructions found`);
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
				.map((item: any, idx: number): ParsedIngredient | null => {
					// Log original item structure for debugging
					const originalItemType = typeof item;
					const originalItemKeys = typeof item === "object" && item !== null ? Object.keys(item) : [];
					console.log(`[RECIPE PARSE] Ingredient ${idx}: type=${originalItemType}, keys=[${originalItemKeys.join(", ")}]`);

					// Log itemListElement structure if present
					if (item && typeof item === "object" && item.itemListElement) {
						if (Array.isArray(item.itemListElement)) {
							console.log(`[RECIPE PARSE] Ingredient ${idx} itemListElement: array with ${item.itemListElement.length} elements`);
							item.itemListElement.slice(0, 3).forEach((elem: any, i: number) => {
								console.log(`[RECIPE PARSE] Ingredient ${idx} itemListElement[${i}]:`,
									typeof elem === "string" ? `"${elem}"` :
										typeof elem === "object" ? JSON.stringify(elem).substring(0, 100) : elem);
							});
						} else {
							console.log(`[RECIPE PARSE] Ingredient ${idx} itemListElement:`,
								typeof item.itemListElement === "string" ? `"${item.itemListElement}"` :
									JSON.stringify(item.itemListElement).substring(0, 100));
						}
					}

					// Log direct text/name if present
					if (item && typeof item === "object") {
						if (item.text) console.log(`[RECIPE PARSE] Ingredient ${idx} item.text: "${item.text}"`);
						if (item.name) console.log(`[RECIPE PARSE] Ingredient ${idx} item.name: "${item.name}"`);
					}

					// Extract complete ingredient text using robust extraction function
					const extractedText = extractIngredientText(item);

					// Log extraction result
					if (extractedText) {
						console.log(`[RECIPE PARSE] Ingredient ${idx} extracted: length=${extractedText.length}, text="${extractedText}"`);
					} else {
						console.warn(`[RECIPE PARSE] Ingredient ${idx} extraction failed. Original item:`,
							typeof item === "object" ? JSON.stringify(item).substring(0, 300) : item);
						return null;
					}

					// Skip empty or invalid ingredient lines
					const trimmed = extractedText.trim();
					if (!trimmed) {
						console.warn(`[RECIPE PARSE] Ingredient ${idx} is empty after trimming`);
						return null;
					}

					// Use enhanced parser to handle fractions, ranges, and units correctly
					const parsed = parseIngredientLine(trimmed);
					if (!parsed.name || parsed.name.trim().length === 0) {
						console.warn(`[RECIPE PARSE] Parsed ingredient ${idx} has empty name. Original: "${trimmed}", Parsed:`, parsed);
						// Fallback: use original line as name
						return { name: trimmed };
					}
					console.log(`[RECIPE PARSE] Parsed ingredient ${idx}: "${trimmed}" -> quantity="${parsed.quantity || ''}", unit="${parsed.unit || ''}", name="${parsed.name}"`);
					return parsed;
				})
				.filter((ing: ParsedIngredient | null): ing is ParsedIngredient => ing !== null && ing.name.trim().length > 0)
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
