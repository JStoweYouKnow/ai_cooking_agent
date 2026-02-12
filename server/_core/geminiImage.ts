import { ENV } from "./env";

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

  const model = "gemini-2.5-flash-image";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

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
    });

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
    console.warn("[geminiImage] Gemini failed:", (err as Error)?.message);
    return null;
  }
}

async function tryDalleImage(prompt: string): Promise<Buffer | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
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
    });

    if (!res.ok) {
      console.warn("[geminiImage] DALL-E error:", res.status, (await res.text().catch(() => "")).substring(0, 200));
      return null;
    }

    const json = (await res.json()) as { data?: Array<{ url?: string }> };
    const url = json.data?.[0]?.url;
    if (!url) return null;

    const imgRes = await fetch(url);
    if (!imgRes.ok) return null;
    return Buffer.from(await imgRes.arrayBuffer());
  } catch (err: unknown) {
    console.warn("[geminiImage] DALL-E failed:", (err as Error)?.message);
    return null;
  }
}
