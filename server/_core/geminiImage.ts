import { ENV } from "./env";

const GEMINI_IMAGE_MODEL_DEFAULT = "gemini-2.5-flash-image";
const REQUEST_TIMEOUT_MS_DEFAULT = 20000;

function getTimeoutMs(): number {
  const value = Number(process.env.IMAGE_FETCH_TIMEOUT_MS ?? REQUEST_TIMEOUT_MS_DEFAULT);
  return Number.isFinite(value) && value >= 1000 ? value : REQUEST_TIMEOUT_MS_DEFAULT;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException
    ? err.name === "AbortError"
    : typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError";
}

function getGeminiImageModel(): string {
  const configured = process.env.GEMINI_IMAGE_MODEL?.trim();
  if (!configured) return GEMINI_IMAGE_MODEL_DEFAULT;
  const modelPattern = /^[a-z0-9][a-z0-9.-]*$/i;
  if (!modelPattern.test(configured)) {
    console.warn(
      `[geminiImage] Invalid GEMINI_IMAGE_MODEL "${configured}", falling back to ${GEMINI_IMAGE_MODEL_DEFAULT}`
    );
    return GEMINI_IMAGE_MODEL_DEFAULT;
  }
  return configured;
}

/** Generate a recipe image. Tries Gemini first, falls back to DALL-E if available. Returns PNG buffer or null. */
export async function generateRecipeImage(prompt: string): Promise<Buffer | null> {
  const gemini = await tryGeminiImage(prompt);
  if (gemini) return gemini;

  const dalle = await tryDalleImage(prompt);
  if (dalle) return dalle;

  return null;
}

async function tryGeminiImage(prompt: string): Promise<Buffer | null> {
  const apiKey = ENV.geminiApiKey;
  if (!apiKey) return null;

  const model = getGeminiImageModel();
  const timeoutMs = getTimeoutMs();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[geminiImage] Gemini API error:", res.status, errText.substring(0, 300));
      return null;
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            inlineData?: { mimeType?: string; data?: string };
            inline_data?: { mime_type?: string; data?: string };
          }>;
        };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const imageData =
        (part as { inlineData?: { data?: string } }).inlineData?.data ??
        (part as { inline_data?: { data?: string } }).inline_data?.data;
      if (imageData) {
        return Buffer.from(imageData, "base64");
      }
    }
    return null;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (isAbortError(err)) {
      console.warn(`[geminiImage] Gemini image request timed out after ${timeoutMs}ms`);
      return null;
    }
    console.warn("[geminiImage] Gemini failed:", (err as Error)?.message);
    return null;
  }
}

async function tryDalleImage(prompt: string): Promise<Buffer | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const timeoutMs = getTimeoutMs();

  try {
    const generationController = new AbortController();
    const generationTimeoutId = setTimeout(() => generationController.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
        signal: generationController.signal,
      });
    } finally {
      clearTimeout(generationTimeoutId);
    }

    if (!res.ok) {
      console.warn("[geminiImage] DALL-E error:", res.status, (await res.text().catch(() => "")).substring(0, 200));
      return null;
    }

    const json = (await res.json()) as { data?: Array<{ url?: string }> };
    const url = json.data?.[0]?.url;
    if (!url) return null;

    const imageController = new AbortController();
    const imageTimeoutId = setTimeout(() => imageController.abort(), timeoutMs);
    let imgRes: Response;
    try {
      imgRes = await fetch(url, { signal: imageController.signal });
    } finally {
      clearTimeout(imageTimeoutId);
    }
    if (!imgRes.ok) return null;
    return Buffer.from(await imgRes.arrayBuffer());
  } catch (err: unknown) {
    if (isAbortError(err)) {
      console.warn(`[geminiImage] DALL-E request timed out after ${timeoutMs}ms`);
      return null;
    }
    console.warn("[geminiImage] DALL-E failed:", (err as Error)?.message);
    return null;
  }
}
