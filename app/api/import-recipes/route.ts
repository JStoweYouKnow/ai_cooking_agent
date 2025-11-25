// app/api/import-recipes/route.ts
import "server-only";

import { NextResponse, NextRequest } from "next/server";
import { Pool } from "pg";
import * as cheerio from "cheerio";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// CONFIG
const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
const VECTOR_DIM = Number(process.env.VECTOR_DIM || 1536);
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || ""; // optional rewrite

/* ---------------------------
   Helpers: parsing & normalizing
   --------------------------- */

function rewriteImageSrc(html: string) {
  if (!IMAGE_BASE_URL) return html;
  return html.replace(/src=["']?images\/([^"']+)["']?/g, `src="${IMAGE_BASE_URL}/images/$1"`);
}

// parse ISO8601 duration like PT20M PT1H30M -> minutes
function parseIsoDurationToMinutes(iso?: string | null) {
  if (!iso) return null;
  try {
    const matchH = iso.match(/(\d+)H/i);
    const matchM = iso.match(/(\d+)M/i);
    const hours = matchH ? parseInt(matchH[1], 10) : 0;
    const mins = matchM ? parseInt(matchM[1], 10) : 0;
    return hours * 60 + mins;
  } catch {
    return null;
  }
}

// Normalize simple quantity and unit into standardized unit (naive, covers common cases)
const UNIT_MAP: Record<string, { to_ml?: number; to_g?: number; base?: string }> = {
  tsp: { to_ml: 4.92892, base: "tsp" },
  tbsp: { to_ml: 14.7868, base: "tbsp" },
  cup: { to_ml: 240, base: "cup" },
  cups: { to_ml: 240, base: "cup" },
  oz: { to_g: 28.3495, base: "oz" },
  lb: { to_g: 453.592, base: "lb" },
  lbs: { to_g: 453.592, base: "lb" },
  g: { to_g: 1, base: "g" },
  kg: { to_g: 1000, base: "kg" },
  ml: { to_ml: 1, base: "ml" },
  l: { to_ml: 1000, base: "l" },
  liter: { to_ml: 1000, base: "l" },
  pinch: { to_ml: 0.36, base: "pinch" },
  clove: { base: "clove" },
  cupstablespoon: { to_ml: 240, base: "cup" }, // fallback
};

// parse fractions like "1 1/2" or "1½" into float
function parseQuantity(q: string | null) {
  if (!q) return null;
  // replace Unicode fractions
  const unicodeMap: Record<string, string> = {
    "¼": "1/4", "½": "1/2", "¾": "3/4", "⅓": "1/3", "⅔": "2/3", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8"
  };
  Object.keys(unicodeMap).forEach(u => q = q!.replace(new RegExp(u, "g"), unicodeMap[u]));
  q = q.trim();
  // handle "1 1/2" or "1-1/2"
  q = q.replace("-", " ");
  const parts = q.split(/\s+/);
  let total = 0;
  for (const p of parts) {
    if (p.includes("/")) {
      const [a, b] = p.split("/");
      const na = parseFloat(a);
      const nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb) && nb !== 0) total += na / nb;
    } else {
      const n = parseFloat(p);
      if (!isNaN(n)) total += n;
    }
  }
  return total || null;
}

function normalizeIngredient(raw: string) {
  // crude pattern: quantity + unit? + ingredient,notes?
  // Examples:
  // "1 1/2 cups finely chopped onions, divided"
  // "salt to taste"
  const r = raw.trim();
  // try to match quantity & unit at start
  const m = r.match(/^([\d\s\/\u00BC-\u00BE\u2150-\u215E\.,-]+)?\s*(cup|cups|tbsp|tablespoon|tablespoons|tbsps|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|g|kg|ml|l|pinch|clove|can|cans)?\.?\s*(.*)$/i);
  let quantity = null, unit = null, rest = r;
  if (m) {
    quantity = m[1] ? m[1].replace(/\./g, "").trim() : null;
    unit = m[2] ? m[2].toLowerCase() : null;
    rest = m[3] ? m[3].trim() : "";
  }
  // split notes by comma if present
  let ingredient = rest;
  let notes = null;
  if (rest.includes(",")) {
    const parts = rest.split(",");
    ingredient = parts[0].trim();
    notes = parts.slice(1).join(",").trim();
  }

  const qty_num = parseQuantity(quantity || "");
  let normalized: any = { quantity: quantity || null, quantity_float: qty_num, unit, ingredient, notes, raw: r };

  // convert to ml or g when possible (approx)
  if (unit) {
    const u = unit.replace(/tablespoons?/, "tbsp").replace(/teaspoons?/, "tsp");
    const map = UNIT_MAP[u];
    if (map?.to_ml && qty_num) {
      normalized["quantity_ml"] = +(qty_num * map.to_ml).toFixed(2);
    }
    if (map?.to_g && qty_num) {
      normalized["quantity_g"] = +(qty_num * map.to_g).toFixed(2);
    }
  }

  return normalized;
}

/* ---------------------------
   OpenAI embedding helper
   --------------------------- */
async function createEmbedding(text: string) {
  if (!OPENAI_KEY) {
    console.warn("[Import] OPENAI_API_KEY not set, skipping embedding generation");
    return null;
  }
  try {
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text
      })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.warn(`[Import] Embedding failed: ${resp.status} ${txt}`);
      return null;
    }
    const payload = await resp.json();
    const vec = payload.data?.[0]?.embedding;
    return vec;
  } catch (error) {
    console.warn("[Import] Error creating embedding:", error);
    return null;
  }
}

/* ---------------------------
   Duplicate detection
   ---------------------------
   We compute the embedding for the candidate recipe and check the nearest existing recipe
   via pgvector (<-> operator). If distance < threshold, treat as duplicate.
   Thresholds depend on embedding model and metric; we use a conservative threshold.
   --------------------------- */

const DUPLICATE_DISTANCE_THRESHOLD = 0.12; // Euclidean distance threshold (tune as needed)

async function findClosestRecipe(client: any, embedding: number[]) {
  // If table empty, return null
  const resCount = await client.query("SELECT 1 FROM recipes LIMIT 1");
  if (resCount.rowCount === 0) return null;

  const q = `
    SELECT id, title, embedding, (embedding <-> $1::vector) AS dist
    FROM recipes
    WHERE embedding IS NOT NULL
    ORDER BY embedding <-> $1::vector
    LIMIT 1;
  `;
  const result = await client.query(q, [embedding]);
  if (!result.rows || result.rows.length === 0) return null;
  const row = result.rows[0];
  return { id: row.id, title: row.title, dist: row.dist };
}

/* ---------------------------
   Main handler
   --------------------------- */

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Missing file field 'file'" }, { status: 400 });

  const ab = await file.arrayBuffer();
  const htmlString = Buffer.from(ab).toString("utf8");
  const $ = cheerio.load(htmlString);

  const parsed: Array<{
    title: string;
    recipeId: string | null;
    source: string | null;
    yieldText: string | null;
    prepMinutes: number | null;
    cookMinutes: number | null;
    tags: string[];
    categories: string[];
    nutrition: Record<string, any>;
    ingredients: any[];
    steps: string[];
    html: string;
  }> = [];
  $(".recipe-details").each((i, el) => {
    const $el = $(el);
    const title = ($el.find('h2[itemprop="name"]').text() || $el.find("h2").first().text()).trim();

    // tags (if any)
    const tags: string[] = [];
    $el.find(".tags-ul li").each((_, li) => {
      const t = $(li).text().trim();
      if (t) tags.push(t);
    });

    // categories
    const categories: string[] = [];
    $el.find('[itemprop="recipeCategory"]').each((_, c) => {
      const v = $(c).attr("content") || $(c).text().trim();
      if (v) categories.push(v);
    });

    // nutrition - try meta fields or structured rows
    const nutrition: Record<string, any> = {};
    // many recipes use "Calories: 627" style blocks — parse top-level lines
    $el.find("div, p").each((_, d) => {
      const text = $(d).text().trim();
      const m = text.match(/^(Calories|Calories:)\s*:?\s*(\d+)/i);
      if (m) nutrition["calories"] = parseInt(m[2], 10);
    });
    // also parse any meta items
    $el.find('meta[itemprop^="recipeNut"]').each((_, meta) => {
      const name = $(meta).attr("itemprop") || "";
      const content = $(meta).attr("content") || $(meta).text().trim();
      nutrition[name.replace(/^recipeNut/, "").toLowerCase()] = isNaN(+content) ? content : +content;
    });

    // ingredients (normalize)
    const ingredientsNormalized: any[] = [];
    // file has <div class="recipe-ingredients"> with <p> elements in many cases
    $el.find(".recipe-ingredients p, .recipe-ingredients li").each((_, li) => {
      const raw = $(li).text().trim();
      if (!raw) return;
      ingredientsNormalized.push(normalizeIngredient(raw));
    });

    // steps
    const steps: string[] = [];
    $el.find('[itemprop="recipeDirections"] p, [itemprop="recipeDirections"] li').each((_, p) => {
      const t = $(p).text().trim();
      if (t) steps.push(t);
    });

    // times & yield
    const prepTimeIso = $el.find('meta[itemprop="prepTime"]').attr("content") || $el.find('[itemprop="prepTime"]').text().trim() || null;
    const cookTimeIso = $el.find('meta[itemprop="cookTime"]').attr("content") || $el.find('[itemprop="cookTime"]').text().trim() || null;
    const prepMinutes = parseIsoDurationToMinutes(prepTimeIso);
    const cookMinutes = parseIsoDurationToMinutes(cookTimeIso);
    const yieldText = $el.find('[itemprop="recipeYield"]').text().trim() || null;

    // source & recipeId
    const recipeId = $el.find('meta[itemprop="recipeId"]').attr("content") || null;
    const source = ($el.find('[itemprop="recipeSource"] a').attr("href") || $el.find('[itemprop="recipeSource"]').text().trim()).replace?.(/\s+/g, " ") || null;

    // full html with optional image rewrite
    let html = $.html($el);
    html = rewriteImageSrc(html);

    parsed.push({
      title,
      recipeId,
      source,
      yieldText,
      prepMinutes,
      cookMinutes,
      tags,
      categories,
      nutrition,
      ingredients: ingredientsNormalized,
      steps,
      html,
    });
  });

  // Insert with duplicate detection + embeddings
  const client = await pool.connect();
  let inserted = 0;
  const insertedRecords: any[] = [];
  try {
    await client.query("BEGIN");
    for (const r of parsed) {
      // build a candidate text to embed (title + ingredients + steps)
      const textToEmbed = [r.title, ...r.ingredients.map((i: any) => i.raw), ...r.steps].join("\n");

      // create embedding
      const embedding = await createEmbedding(textToEmbed);
      if (!embedding) {
        // proceed but null embedding (shouldn't happen if OPENAI key available)
      }

      // duplicate detection
      let isDuplicate = false;
      if (embedding) {
        const closest = await findClosestRecipe(client, embedding);
        if (closest && closest.dist !== undefined && closest.dist < DUPLICATE_DISTANCE_THRESHOLD) {
          // treat as duplicate
          isDuplicate = true;
          console.log(`Duplicate detected for "${r.title}" (existing id=${closest.id}, dist=${closest.dist})`);
        }
      }

      // also fallback to same-title duplicate check
      if (!isDuplicate) {
        const sameTitle = await client.query("SELECT id FROM recipes WHERE LOWER(title)=LOWER($1) LIMIT 1", [r.title]);
        if (sameTitle.rowCount && sameTitle.rowCount > 0) {
          isDuplicate = true;
        }
      }

      if (isDuplicate) continue;

      // insert (handle embedding column gracefully if pgvector not available)
      let insertQ, vals;
      
      // Check if embedding column exists
      const colCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'embedding';
      `);
      
      const hasEmbeddingColumn = colCheck.rows.length > 0;
      
      if (hasEmbeddingColumn && embedding) {
        insertQ = `
          INSERT INTO recipes
            (title, recipe_id, source, yield_text, prep_time_minutes, cook_time_minutes,
             tags, categories, nutrition, ingredients, steps, html, embedding)
          VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          RETURNING id
        `;
        vals = [
          r.title,
          r.recipeId,
          r.source,
          r.yieldText,
          r.prepMinutes,
          r.cookMinutes,
          r.tags.length ? r.tags : null,
          r.categories.length ? r.categories : null,
          Object.keys(r.nutrition).length ? r.nutrition : null,
          JSON.stringify(r.ingredients),
          JSON.stringify(r.steps),
          r.html,
          embedding,
        ];
      } else {
        // Insert without embedding column
        insertQ = `
          INSERT INTO recipes
            (title, recipe_id, source, yield_text, prep_time_minutes, cook_time_minutes,
             tags, categories, nutrition, ingredients, steps, html)
          VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          RETURNING id
        `;
        vals = [
          r.title,
          r.recipeId,
          r.source,
          r.yieldText,
          r.prepMinutes,
          r.cookMinutes,
          r.tags.length ? r.tags : null,
          r.categories.length ? r.categories : null,
          Object.keys(r.nutrition).length ? r.nutrition : null,
          JSON.stringify(r.ingredients),
          JSON.stringify(r.steps),
          r.html,
        ];
        if (!hasEmbeddingColumn) {
          console.log(`[Import] Note: embedding column not available, skipping vector embeddings`);
        }
      }
      const res = await client.query(insertQ, vals);
      inserted++;
      insertedRecords.push({ id: res.rows[0].id, title: r.title });
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DB error", err);
    client.release();
    return NextResponse.json({ error: "DB error", detail: String(err) }, { status: 500 });
  } finally {
    client.release();
  }

  return NextResponse.json({
    success: true,
    total_found: parsed.length,
    inserted,
    inserted_records: insertedRecords,
  });
}

