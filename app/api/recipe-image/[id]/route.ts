/**
 * Proxies recipe images so the mobile app can load them reliably.
 * Fetches from the stored URL (S3 presigned or external) and streams the response.
 * Avoids CORS, SSL, and URL expiry issues when loading directly from S3.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@server/db";
import { recipes } from "@drizzle/schema-postgres";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);
  if (isNaN(recipeId) || recipeId < 1) {
    return NextResponse.json({ error: "Invalid recipe ID" }, { status: 400 });
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
  const [recipe] = await db
    .select({ imageUrl: recipes.imageUrl })
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);

  if (!recipe?.imageUrl) {
    return NextResponse.json({ error: "No image" }, { status: 404 });
  }

  try {
    const imgRes = await fetch(recipe.imageUrl, {
      headers: { Accept: "image/*" },
      next: { revalidate: 0 },
    });

    if (!imgRes.ok) {
      console.warn("[recipe-image] Upstream fetch failed:", imgRes.status, recipeId);
      return NextResponse.json({ error: "Image unavailable" }, { status: 502 });
    }

    const contentType = imgRes.headers.get("content-type") || "image/png";
    const buffer = await imgRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // 24h
      },
    });
  } catch (err: unknown) {
    console.error("[recipe-image] Proxy error:", (err as Error)?.message, recipeId);
    return NextResponse.json({ error: "Proxy failed" }, { status: 502 });
  }
}
