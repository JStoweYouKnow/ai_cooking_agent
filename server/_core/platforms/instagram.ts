/**
 * Instagram Reel/Post Extractor
 * Extracts video information from Instagram Reels and video posts
 */

import type { VideoInfo } from "../videoParser";
import * as cheerio from "cheerio";

/**
 * Fetch Instagram post/reel metadata
 * Note: Instagram heavily restricts scraping, so we use multiple fallback methods
 */
async function fetchInstagramMetadata(url: string, postId: string): Promise<{
	title: string;
	description: string;
	thumbnailUrl: string | null;
	channelName: string;
	duration: number | null;
} | null> {
	// Try multiple approaches since Instagram blocks many requests

	// Method 1: Try the public page with standard headers
	try {
		const metadata = await fetchFromPublicPage(url);
		if (metadata && (metadata.description || metadata.title)) {
			return metadata;
		}
	} catch (e) {
		console.log("[INSTAGRAM] Public page fetch failed");
	}

	// Method 2: Try oEmbed endpoint (more reliable but less data)
	try {
		const metadata = await fetchFromOEmbed(url);
		if (metadata) {
			return metadata;
		}
	} catch (e) {
		console.log("[INSTAGRAM] oEmbed fetch failed");
	}

	// Method 3: Try embed page
	try {
		const metadata = await fetchFromEmbed(postId);
		if (metadata) {
			return metadata;
		}
	} catch (e) {
		console.log("[INSTAGRAM] Embed fetch failed");
	}

	return null;
}

/**
 * Fetch from public Instagram page
 */
async function fetchFromPublicPage(url: string): Promise<{
	title: string;
	description: string;
	thumbnailUrl: string | null;
	channelName: string;
	duration: number | null;
} | null> {
	const response = await fetch(url, {
		headers: {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.9",
			"Cache-Control": "no-cache",
		},
	});

	if (!response.ok) {
		console.log(`[INSTAGRAM] Page fetch returned ${response.status}`);
		return null;
	}

	const html = await response.text();
	const $ = cheerio.load(html);

	let title = "";
	let description = "";
	let thumbnailUrl: string | null = null;
	let channelName = "";

	// Extract from meta tags
	title = $('meta[property="og:title"]').attr("content") || "";
	description = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "";
	thumbnailUrl = $('meta[property="og:image"]').attr("content") || null;

	// Try to extract username from title or URL
	const usernameMatch = title.match(/^([^:]+)/);
	if (usernameMatch) {
		channelName = usernameMatch[1].replace(" on Instagram", "").trim();
	}

	// Try to find additional data in script tags
	const scripts = $("script[type='application/ld+json']").toArray();
	for (const script of scripts) {
		try {
			const jsonText = $(script).html();
			if (jsonText) {
				const jsonData = JSON.parse(jsonText);

				// Look for video or social media posting schema
				if (jsonData["@type"] === "VideoObject" || jsonData["@type"] === "SocialMediaPosting") {
					description = jsonData.articleBody || jsonData.caption || jsonData.description || description;
					if (jsonData.author?.name) {
						channelName = jsonData.author.name;
					}
					if (jsonData.thumbnailUrl) {
						thumbnailUrl = Array.isArray(jsonData.thumbnailUrl) ? jsonData.thumbnailUrl[0] : jsonData.thumbnailUrl;
					}
				}
			}
		} catch (e) {
			// Ignore JSON parse errors
		}
	}

	// Try to extract from window._sharedData or similar
	const sharedDataMatch = html.match(/window\._sharedData\s*=\s*(\{.+?\});/);
	if (sharedDataMatch) {
		try {
			const sharedData = JSON.parse(sharedDataMatch[1]);
			const postPage = sharedData.entry_data?.PostPage;
			if (postPage && postPage[0]) {
				const media = postPage[0].graphql?.shortcode_media;
				if (media) {
					description = media.edge_media_to_caption?.edges?.[0]?.node?.text || description;
					channelName = media.owner?.username || media.owner?.full_name || channelName;
					thumbnailUrl = media.display_url || thumbnailUrl;
				}
			}
		} catch (e) {
			console.log("[INSTAGRAM] Failed to parse _sharedData");
		}
	}

	// Also try __additionalDataLoaded
	const additionalDataMatch = html.match(/window\.__additionalDataLoaded\s*\([^,]+,\s*(\{.+?\})\)/);
	if (additionalDataMatch) {
		try {
			const additionalData = JSON.parse(additionalDataMatch[1]);
			const items = additionalData.items || [];
			if (items[0]) {
				const item = items[0];
				description = item.caption?.text || description;
				channelName = item.user?.username || item.user?.full_name || channelName;
				thumbnailUrl = item.image_versions2?.candidates?.[0]?.url || thumbnailUrl;
			}
		} catch (e) {
			// Ignore
		}
	}

	if (!description && !title) {
		return null;
	}

	return {
		title: title || `${channelName}'s Recipe`,
		description,
		thumbnailUrl,
		channelName,
		duration: null,
	};
}

/**
 * Fetch from Instagram oEmbed endpoint
 */
async function fetchFromOEmbed(url: string): Promise<{
	title: string;
	description: string;
	thumbnailUrl: string | null;
	channelName: string;
	duration: number | null;
} | null> {
	const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`;

	const response = await fetch(oembedUrl, {
		headers: {
			"User-Agent": "Mozilla/5.0 (compatible; RecipeBot/1.0)",
		},
	});

	if (!response.ok) {
		return null;
	}

	const data = await response.json();

	// oEmbed gives us limited data but it's reliable
	return {
		title: data.title || `${data.author_name}'s Recipe`,
		description: data.title || "", // oEmbed doesn't provide full caption
		thumbnailUrl: data.thumbnail_url || null,
		channelName: data.author_name || "",
		duration: null,
	};
}

/**
 * Fetch from Instagram embed page
 */
async function fetchFromEmbed(postId: string): Promise<{
	title: string;
	description: string;
	thumbnailUrl: string | null;
	channelName: string;
	duration: number | null;
} | null> {
	const embedUrl = `https://www.instagram.com/p/${postId}/embed/`;

	const response = await fetch(embedUrl, {
		headers: {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		},
	});

	if (!response.ok) {
		return null;
	}

	const html = await response.text();
	const $ = cheerio.load(html);

	let description = "";
	let channelName = "";
	let thumbnailUrl: string | null = null;

	// Extract caption from embed
	const captionElement = $(".Caption");
	if (captionElement.length > 0) {
		description = captionElement.text().trim();
	}

	// Extract username
	const usernameElement = $(".UsernameText");
	if (usernameElement.length > 0) {
		channelName = usernameElement.text().trim();
	}

	// Get background image as thumbnail
	const mediaElement = $(".EmbeddedMediaImage");
	if (mediaElement.length > 0) {
		const style = mediaElement.attr("style");
		const bgMatch = style?.match(/background-image:\s*url\(['"](.*?)['"]\)/);
		if (bgMatch) {
			thumbnailUrl = bgMatch[1];
		}
	}

	// Also try img tags
	if (!thumbnailUrl) {
		const img = $("img.EmbeddedMediaImage, img[src*='instagram']").first();
		thumbnailUrl = img.attr("src") || null;
	}

	if (!description) {
		return null;
	}

	return {
		title: `${channelName}'s Recipe`,
		description,
		thumbnailUrl,
		channelName,
		duration: null,
	};
}

/**
 * Extract Instagram video information
 */
export async function extractInstagramInfo(url: string, postId: string): Promise<VideoInfo | null> {
	console.log(`[INSTAGRAM] Extracting info for post: ${postId}`);

	const metadata = await fetchInstagramMetadata(url, postId);

	if (!metadata) {
		console.log("[INSTAGRAM] Failed to extract metadata");
		return null;
	}

	// Instagram Reels don't typically have transcripts/captions accessible publicly
	// The recipe is usually in the caption (description)
	return {
		platform: "instagram",
		videoId: postId,
		url,
		title: metadata.title,
		description: metadata.description,
		transcript: null, // Instagram doesn't provide public transcript access
		thumbnailUrl: metadata.thumbnailUrl,
		channelName: metadata.channelName,
		duration: metadata.duration,
	};
}
