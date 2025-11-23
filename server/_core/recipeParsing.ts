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

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
	const res = await fetch(url, { redirect: "follow" });
	if (!res.ok) return null;
	const html = await res.text();
	const blocks = extractJsonLdBlocks(html);
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
		const image =
			typeof recipe.image === "string"
				? recipe.image
				: Array.isArray(recipe.image)
				? recipe.image[0]
				: typeof recipe.image?.url === "string"
				? recipe.image.url
				: null;
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
		return {
			name,
			description,
			instructions,
			imageUrl: image,
			cuisine,
			category,
			cookingTime,
			servings,
			sourceUrl: url,
			ingredients,
			source: "url_import",
		};
	}
	return null;
}


