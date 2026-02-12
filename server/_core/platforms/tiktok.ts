/**
 * TikTok Video Extractor
 * Extracts video information from TikTok videos
 */

import type { VideoInfo } from "../videoParser";
import * as cheerio from "cheerio";

/**
 * Resolve TikTok short URLs to full URLs
 */
async function resolveShortUrl(url: string): Promise<string> {
	if (url.includes("vm.tiktok.com") || url.includes("tiktok.com/t/")) {
		try {
			const response = await fetch(url, {
				method: "HEAD",
				redirect: "follow",
				headers: {
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				},
			});
			return response.url || url;
		} catch {
			return url;
		}
	}
	return url;
}

/**
 * Extract video ID from TikTok URL
 */
function extractVideoId(url: string): string | null {
	const patterns = [
		/tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
		/tiktok\.com\/.*[?&]video_id=(\d+)/,
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			return match[1];
		}
	}

	return null;
}

/**
 * Fetch TikTok page and extract metadata
 */
async function fetchTikTokMetadata(url: string): Promise<{
	title: string;
	description: string;
	thumbnailUrl: string | null;
	channelName: string;
	duration: number | null;
	subtitles: string | null;
} | null> {
	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				"Accept-Language": "en-US,en;q=0.9",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			},
		});

		if (!response.ok) {
			console.log(`[TIKTOK] Failed to fetch page: ${response.status}`);
			return null;
		}

		const html = await response.text();
		const $ = cheerio.load(html);

		let title = "";
		let description = "";
		let thumbnailUrl: string | null = null;
		let channelName = "";
		let duration: number | null = null;
		let subtitles: string | null = null;

		// Try to extract from meta tags first
		title = $('meta[property="og:title"]').attr("content") || $("title").text() || "";
		description = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "";
		thumbnailUrl = $('meta[property="og:image"]').attr("content") || null;

		// Try to extract from SIGI_STATE (TikTok's hydration data)
		const sigiMatch = html.match(/<script id="SIGI_STATE"[^>]*>([^<]+)<\/script>/);
		if (sigiMatch) {
			try {
				const sigiState = JSON.parse(sigiMatch[1]);

				// Extract video details
				const itemModule = sigiState.ItemModule;
				if (itemModule) {
					const videoKey = Object.keys(itemModule)[0];
					const video = itemModule[videoKey];

					if (video) {
						description = video.desc || description;
						channelName = video.author || video.nickname || "";
						duration = video.video?.duration || null;

						// Get thumbnail
						if (video.video?.cover) {
							thumbnailUrl = video.video.cover;
						}
					}
				}

				// Extract author info
				const userModule = sigiState.UserModule?.users;
				if (userModule && !channelName) {
					const userKey = Object.keys(userModule)[0];
					const user = userModule[userKey];
					channelName = user?.nickname || user?.uniqueId || "";
				}
			} catch (e) {
				console.log("[TIKTOK] Failed to parse SIGI_STATE:", e);
			}
		}

		// Try __UNIVERSAL_DATA_FOR_REHYDRATION__ (newer TikTok format)
		const universalMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([^<]+)<\/script>/);
		if (universalMatch) {
			try {
				const universalData = JSON.parse(universalMatch[1]);
				const defaultScope = universalData.__DEFAULT_SCOPE__;

				if (defaultScope) {
					// Look for video detail
					const videoDetail = defaultScope["webapp.video-detail"]?.itemInfo?.itemStruct;
					if (videoDetail) {
						description = videoDetail.desc || description;
						channelName = videoDetail.author?.nickname || videoDetail.author?.uniqueId || channelName;
						duration = videoDetail.video?.duration || duration;

						if (videoDetail.video?.cover) {
							thumbnailUrl = videoDetail.video.cover;
						}

						// Check for subtitles/captions
						if (videoDetail.video?.subtitleInfos && videoDetail.video.subtitleInfos.length > 0) {
							// TikTok may have subtitle info
							const subtitleInfo = videoDetail.video.subtitleInfos.find(
								(s: any) => s.LanguageCodeName === "eng-US" || s.LanguageCodeName?.startsWith("eng")
							) || videoDetail.video.subtitleInfos[0];

							if (subtitleInfo?.Url) {
								subtitles = await fetchTikTokSubtitles(subtitleInfo.Url);
							}
						}
					}
				}
			} catch (e) {
				console.log("[TIKTOK] Failed to parse UNIVERSAL_DATA:", e);
			}
		}

		// Extract username from URL if not found
		if (!channelName) {
			const usernameMatch = url.match(/@([\w.-]+)/);
			if (usernameMatch) {
				channelName = usernameMatch[1];
			}
		}

		// Clean up the description (often includes hashtags)
		if (description) {
			// Keep hashtags as they might indicate recipe type
			description = description.trim();
		}

		return {
			title: title || description.slice(0, 100),
			description,
			thumbnailUrl,
			channelName,
			duration,
			subtitles,
		};
	} catch (error) {
		console.error("[TIKTOK] Metadata fetch error:", error);
		return null;
	}
}

/**
 * Fetch TikTok subtitles if available
 */
async function fetchTikTokSubtitles(url: string): Promise<string | null> {
	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			},
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.text();

		// TikTok subtitles can be in various formats (SRT, WebVTT, JSON)
		// Try to parse as JSON first
		try {
			const jsonData = JSON.parse(data);
			if (Array.isArray(jsonData)) {
				return jsonData
					.map((item: any) => item.text || item.content || "")
					.filter(Boolean)
					.join(" ");
			}
		} catch {
			// Not JSON, try as SRT/WebVTT
		}

		// Parse as SRT/WebVTT
		const textLines: string[] = [];
		const lines = data.split("\n");

		for (const line of lines) {
			// Skip timestamps and metadata
			if (line.match(/^\d{2}:\d{2}/) || line.match(/^WEBVTT/) || line.match(/^\d+$/) || line.trim() === "") {
				continue;
			}
			// Skip lines that look like timestamps
			if (line.includes("-->")) {
				continue;
			}
			textLines.push(line.trim());
		}

		return textLines.join(" ");
	} catch (error) {
		console.error("[TIKTOK] Failed to fetch subtitles:", error);
		return null;
	}
}

/**
 * Extract TikTok video information
 */
export async function extractTikTokInfo(url: string, videoId: string): Promise<VideoInfo | null> {
	console.log(`[TIKTOK] Extracting info for video: ${videoId}`);

	// Resolve short URLs first
	const resolvedUrl = await resolveShortUrl(url);
	console.log(`[TIKTOK] Resolved URL: ${resolvedUrl}`);

	// Update video ID if needed
	const actualVideoId = extractVideoId(resolvedUrl) || videoId;

	const metadata = await fetchTikTokMetadata(resolvedUrl);

	if (!metadata) {
		console.log("[TIKTOK] Failed to extract metadata");
		return null;
	}

	// TikTok videos often don't have transcripts, but the description
	// frequently contains the full recipe for cooking videos
	return {
		platform: "tiktok",
		videoId: actualVideoId,
		url: resolvedUrl,
		title: metadata.title,
		description: metadata.description,
		transcript: metadata.subtitles, // May be null
		thumbnailUrl: metadata.thumbnailUrl,
		channelName: metadata.channelName,
		duration: metadata.duration,
	};
}
