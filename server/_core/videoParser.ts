/**
 * Video Recipe Parser
 * Extracts recipes from cooking videos on YouTube, TikTok, and Instagram
 */

import { extractYouTubeInfo } from "./platforms/youtube";
import { extractTikTokInfo } from "./platforms/tiktok";
import { extractInstagramInfo } from "./platforms/instagram";
import { invokeLLM } from "./llm";
import type { ParsedRecipe, ParsedIngredient } from "./recipeParsing";

export type VideoPlatform = "youtube" | "tiktok" | "instagram" | "unknown";

export type VideoInfo = {
	platform: VideoPlatform;
	videoId: string;
	url: string;
	title: string;
	description: string;
	transcript: string | null;
	thumbnailUrl: string | null;
	channelName: string;
	duration: number | null; // seconds
};

// Platform detection patterns
const PLATFORM_PATTERNS: Record<VideoPlatform, RegExp[]> = {
	youtube: [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
		/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
	],
	tiktok: [
		/tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
		/vm\.tiktok\.com\/(\w+)/,
		/tiktok\.com\/t\/(\w+)/,
	],
	instagram: [
		/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/,
		/instagram\.com\/p\/([a-zA-Z0-9_-]+)/,
		/instagram\.com\/reels\/([a-zA-Z0-9_-]+)/,
	],
	unknown: [],
};

/**
 * Detect if a URL is a video URL and extract platform info
 */
export function detectVideoPlatform(url: string): { platform: VideoPlatform; videoId: string } | null {
	for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
		if (platform === "unknown") continue;

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match && match[1]) {
				return {
					platform: platform as VideoPlatform,
					videoId: match[1],
				};
			}
		}
	}
	return null;
}

/**
 * Check if a URL is a supported video URL
 */
export function isVideoUrl(url: string): boolean {
	return detectVideoPlatform(url) !== null;
}

/**
 * Extract video information from a URL
 */
export async function extractVideoInfo(url: string): Promise<VideoInfo | null> {
	const detected = detectVideoPlatform(url);
	if (!detected) return null;

	const { platform, videoId } = detected;

	try {
		switch (platform) {
			case "youtube":
				return await extractYouTubeInfo(url, videoId);
			case "tiktok":
				return await extractTikTokInfo(url, videoId);
			case "instagram":
				return await extractInstagramInfo(url, videoId);
			default:
				return null;
		}
	} catch (error) {
		console.error(`[VIDEO PARSER] Failed to extract info from ${platform}:`, error);
		return null;
	}
}

/**
 * Parse a recipe from video information using LLM
 */
export async function parseRecipeFromVideo(videoInfo: VideoInfo): Promise<ParsedRecipe | null> {
	// Build the prompt with all available information
	const contextParts: string[] = [];

	contextParts.push(`VIDEO TITLE: ${videoInfo.title}`);

	if (videoInfo.channelName) {
		contextParts.push(`CHANNEL/CREATOR: ${videoInfo.channelName}`);
	}

	if (videoInfo.description) {
		contextParts.push(`\nVIDEO DESCRIPTION:\n${videoInfo.description}`);
	}

	if (videoInfo.transcript) {
		contextParts.push(`\nVIDEO TRANSCRIPT:\n${videoInfo.transcript}`);
	}

	const prompt = `You are extracting a recipe from a cooking video. Given the video information below, extract a complete, structured recipe.

${contextParts.join("\n")}

INSTRUCTIONS:
1. Extract the recipe name (use video title as basis if not explicitly stated)
2. List ALL ingredients with quantities and units. For informal measurements like "a pinch", "handful", "some", provide reasonable estimates marked with "~" (e.g., "~1/4 tsp")
3. Write clear step-by-step instructions in logical cooking order
4. Estimate total cooking time based on the steps described
5. Estimate number of servings if mentioned or provide a reasonable default

IMPORTANT:
- Video transcripts may have errors or informal language - interpret intelligently
- If the video doesn't appear to be a recipe, return a recipe with name "NOT_A_RECIPE"
- Combine information from both the description AND transcript for completeness
- The description often contains a written recipe that's more accurate than the transcript

Return a complete, well-structured recipe in JSON format.`;

	try {
		const llmResult = await invokeLLM({
			messages: [
				{
					role: "user",
					content: [{ type: "text", text: prompt }],
				},
			],
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "video_recipe",
					strict: true,
					schema: {
						type: "object",
						properties: {
							name: { type: "string" },
							description: { type: "string" },
							instructions: { type: "string" },
							cuisine: { type: "string" },
							category: { type: "string" },
							cookingTime: { type: "number" },
							servings: { type: "number" },
							caloriesPerServing: { type: "number" },
							ingredients: {
								type: "array",
								items: {
									type: "object",
									properties: {
										name: { type: "string" },
										quantity: { type: "string" },
										unit: { type: "string" },
									},
									required: ["name"],
									additionalProperties: false,
								},
							},
						},
						required: ["name"],
						additionalProperties: false,
					},
				},
			},
		});

		const content = llmResult.choices[0]?.message?.content;
		const contentStr = typeof content === "string" ? content : JSON.stringify(content);
		const parsed = JSON.parse(contentStr ?? "{}");

		// Check if this was flagged as not a recipe
		if (parsed.name === "NOT_A_RECIPE" || !parsed.name) {
			console.log("[VIDEO PARSER] LLM determined this is not a recipe video");
			return null;
		}

		// Convert to ParsedRecipe format
		const recipe: ParsedRecipe = {
			name: parsed.name,
			description: parsed.description || null,
			instructions: parsed.instructions || null,
			imageUrl: videoInfo.thumbnailUrl,
			cuisine: parsed.cuisine || null,
			category: parsed.category || null,
			cookingTime: typeof parsed.cookingTime === "number" ? parsed.cookingTime : null,
			servings: typeof parsed.servings === "number" ? parsed.servings : null,
			caloriesPerServing: typeof parsed.caloriesPerServing === "number" ? parsed.caloriesPerServing : null,
			ingredients: Array.isArray(parsed.ingredients)
				? parsed.ingredients.map((ing: any): ParsedIngredient => ({
						name: ing.name || "",
						quantity: ing.quantity || null,
						unit: ing.unit || null,
				  }))
				: undefined,
		};

		console.log(`[VIDEO PARSER] Successfully extracted recipe: "${recipe.name}" with ${recipe.ingredients?.length || 0} ingredients`);
		return recipe;
	} catch (error) {
		console.error("[VIDEO PARSER] LLM extraction failed:", error);
		return null;
	}
}

/**
 * Main entry point: parse a recipe from a video URL
 */
export async function parseRecipeFromVideoUrl(url: string): Promise<ParsedRecipe | null> {
	console.log(`[VIDEO PARSER] Attempting to parse video URL: ${url}`);

	const videoInfo = await extractVideoInfo(url);
	if (!videoInfo) {
		console.log("[VIDEO PARSER] Failed to extract video information");
		return null;
	}

	console.log(`[VIDEO PARSER] Extracted video info:`, {
		platform: videoInfo.platform,
		title: videoInfo.title,
		hasTranscript: !!videoInfo.transcript,
		transcriptLength: videoInfo.transcript?.length || 0,
		descriptionLength: videoInfo.description?.length || 0,
	});

	// Need at least a transcript or description to extract a recipe
	if (!videoInfo.transcript && !videoInfo.description) {
		console.log("[VIDEO PARSER] No transcript or description available");
		return null;
	}

	return await parseRecipeFromVideo(videoInfo);
}
