/**
 * YouTube Video Extractor
 * Extracts video information and transcripts from YouTube videos
 */

import type { VideoInfo } from "../videoParser";
import * as cheerio from "cheerio";

// YouTube transcript fetching without external dependencies
// This implements the same approach as youtube-transcript package

interface TranscriptSegment {
	text: string;
	start: number;
	duration: number;
}

/**
 * Fetch YouTube transcript using the internal API
 */
async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
	try {
		// First, get the video page to extract the caption tracks
		const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				"Accept-Language": "en-US,en;q=0.9",
			},
		});

		if (!videoPageResponse.ok) {
			console.log(`[YOUTUBE] Failed to fetch video page: ${videoPageResponse.status}`);
			return null;
		}

		const html = await videoPageResponse.text();

		// Extract the captions data from the page
		const captionsMatch = html.match(/"captions":\s*(\{[^}]+?"playerCaptionsTracklistRenderer"[^}]+?\})/);
		if (!captionsMatch) {
			// Try alternative pattern for caption tracks
			const altMatch = html.match(/"captionTracks":\s*(\[[^\]]+\])/);
			if (!altMatch) {
				console.log("[YOUTUBE] No captions found for this video");
				return null;
			}

			try {
				const captionTracks = JSON.parse(altMatch[1]);
				if (!captionTracks || captionTracks.length === 0) {
					return null;
				}

				// Prefer English captions, fall back to first available
				const englishTrack = captionTracks.find(
					(track: any) => track.languageCode === "en" || track.languageCode?.startsWith("en")
				);
				const track = englishTrack || captionTracks[0];

				if (!track?.baseUrl) {
					return null;
				}

				return await fetchTranscriptFromUrl(track.baseUrl);
			} catch (e) {
				console.log("[YOUTUBE] Failed to parse caption tracks:", e);
				return null;
			}
		}

		// Try to find caption URL in ytInitialPlayerResponse
		const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
		if (playerResponseMatch) {
			try {
				const playerResponse = JSON.parse(playerResponseMatch[1]);
				const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

				if (captionTracks && captionTracks.length > 0) {
					// Prefer English captions
					const englishTrack = captionTracks.find(
						(track: any) => track.languageCode === "en" || track.languageCode?.startsWith("en")
					);
					const track = englishTrack || captionTracks[0];

					if (track?.baseUrl) {
						return await fetchTranscriptFromUrl(track.baseUrl);
					}
				}
			} catch (e) {
				console.log("[YOUTUBE] Failed to parse player response:", e);
			}
		}

		return null;
	} catch (error) {
		console.error("[YOUTUBE] Transcript fetch error:", error);
		return null;
	}
}

/**
 * Fetch and parse transcript from YouTube's caption URL
 */
async function fetchTranscriptFromUrl(url: string): Promise<string | null> {
	try {
		// Add format parameter to get XML
		const transcriptUrl = url.includes("&fmt=") ? url : `${url}&fmt=srv3`;

		const response = await fetch(transcriptUrl, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			},
		});

		if (!response.ok) {
			console.log(`[YOUTUBE] Failed to fetch transcript: ${response.status}`);
			return null;
		}

		const xml = await response.text();

		// Parse the XML transcript
		const segments: TranscriptSegment[] = [];
		const textMatches = xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);

		for (const match of textMatches) {
			const text = decodeXmlEntities(match[1]);
			if (text.trim()) {
				segments.push({
					text: text.trim(),
					start: 0,
					duration: 0,
				});
			}
		}

		if (segments.length === 0) {
			// Try alternative parsing for JSON format
			try {
				const jsonData = JSON.parse(xml);
				if (jsonData.events) {
					for (const event of jsonData.events) {
						if (event.segs) {
							const text = event.segs.map((s: any) => s.utf8).join("");
							if (text.trim()) {
								segments.push({ text: text.trim(), start: event.tStartMs || 0, duration: event.dDurationMs || 0 });
							}
						}
					}
				}
			} catch {
				// Not JSON format, continue
			}
		}

		if (segments.length === 0) {
			return null;
		}

		// Combine segments into readable transcript
		const transcript = segments.map((s) => s.text).join(" ");
		console.log(`[YOUTUBE] Extracted transcript with ${segments.length} segments, ${transcript.length} characters`);

		return transcript;
	} catch (error) {
		console.error("[YOUTUBE] Failed to parse transcript:", error);
		return null;
	}
}

/**
 * Decode XML entities
 */
function decodeXmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
		.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Extract video metadata from YouTube page
 */
async function fetchYouTubeMetadata(videoId: string): Promise<{
	title: string;
	description: string;
	thumbnailUrl: string | null;
	channelName: string;
	duration: number | null;
} | null> {
	try {
		// Use oEmbed API for basic metadata (no API key required)
		const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
		const oembedResponse = await fetch(oembedUrl);

		let title = "";
		let channelName = "";
		let thumbnailUrl: string | null = null;

		if (oembedResponse.ok) {
			const oembed = await oembedResponse.json();
			title = oembed.title || "";
			channelName = oembed.author_name || "";
			thumbnailUrl = oembed.thumbnail_url || null;
		}

		// Fetch the video page for description and more details
		const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				"Accept-Language": "en-US,en;q=0.9",
			},
		});

		let description = "";
		let duration: number | null = null;

		if (pageResponse.ok) {
			const html = await pageResponse.text();
			const $ = cheerio.load(html);

			// Try to extract from meta tags
			description = $('meta[name="description"]').attr("content") || "";

			// Try to get more detailed description from JSON-LD or initial data
			const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
			if (playerResponseMatch) {
				try {
					const playerResponse = JSON.parse(playerResponseMatch[1]);

					// Get video details
					const videoDetails = playerResponse?.videoDetails;
					if (videoDetails) {
						if (!title) title = videoDetails.title || "";
						if (!channelName) channelName = videoDetails.author || "";
						description = videoDetails.shortDescription || description;

						// Duration in seconds
						if (videoDetails.lengthSeconds) {
							duration = parseInt(videoDetails.lengthSeconds, 10);
						}
					}

					// Get high-quality thumbnail
					const thumbnails = videoDetails?.thumbnail?.thumbnails;
					if (thumbnails && thumbnails.length > 0) {
						// Get highest quality thumbnail
						thumbnailUrl = thumbnails[thumbnails.length - 1].url;
					}
				} catch (e) {
					console.log("[YOUTUBE] Failed to parse player response for metadata");
				}
			}

			// Fallback: try to extract description from initialData
			if (!description || description.length < 50) {
				const initialDataMatch = html.match(/ytInitialData\s*=\s*(\{.+?\});/);
				if (initialDataMatch) {
					try {
						const initialData = JSON.parse(initialDataMatch[1]);
						// Navigate to description - this path may vary
						const descriptionObj = findNestedValue(initialData, "attributedDescriptionBodyText");
						if (descriptionObj?.content) {
							description = descriptionObj.content;
						}
					} catch (e) {
						// Ignore parsing errors
					}
				}
			}
		}

		// Use maxresdefault thumbnail if available
		if (!thumbnailUrl) {
			thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
		}

		return {
			title,
			description,
			thumbnailUrl,
			channelName,
			duration,
		};
	} catch (error) {
		console.error("[YOUTUBE] Metadata fetch error:", error);
		return null;
	}
}

/**
 * Helper to find nested value in object
 */
function findNestedValue(obj: any, key: string): any {
	if (!obj || typeof obj !== "object") return null;

	if (key in obj) return obj[key];

	for (const k of Object.keys(obj)) {
		const result = findNestedValue(obj[k], key);
		if (result) return result;
	}

	return null;
}

/**
 * Extract YouTube video information
 */
export async function extractYouTubeInfo(url: string, videoId: string): Promise<VideoInfo | null> {
	console.log(`[YOUTUBE] Extracting info for video: ${videoId}`);

	// Fetch metadata and transcript in parallel
	const [metadata, transcript] = await Promise.all([
		fetchYouTubeMetadata(videoId),
		fetchYouTubeTranscript(videoId),
	]);

	if (!metadata) {
		console.log("[YOUTUBE] Failed to extract metadata");
		return null;
	}

	return {
		platform: "youtube",
		videoId,
		url,
		title: metadata.title,
		description: metadata.description,
		transcript,
		thumbnailUrl: metadata.thumbnailUrl,
		channelName: metadata.channelName,
		duration: metadata.duration,
	};
}
