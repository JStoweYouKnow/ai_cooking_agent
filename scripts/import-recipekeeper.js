#!/usr/bin/env node
/**
 * Import RecipeKeeper HTML export into Neon database
 */

import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { Pool } from 'pg';
import * as cheerio from 'cheerio';

config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

// Parse ISO8601 duration like PT20M PT1H30M -> minutes
function parseIsoDuration(iso) {
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

// Create embedding via OpenAI
async function createEmbedding(text) {
  if (!OPENAI_KEY) return null;
  try {
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: text })
    });
    if (!resp.ok) return null;
    const payload = await resp.json();
    return payload.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

async function importRecipes(htmlPath) {
  console.log(`📄 Reading: ${htmlPath}\n`);
  
  const htmlContent = readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(htmlContent);
  
  const recipes = [];
  
  $('.recipe-details').each((i, el) => {
    const $el = $(el);
    
    // Basic info
    const title = $el.find('h2[itemprop="name"]').text().trim() || $el.find('h2').first().text().trim();
    const recipeId = $el.find('meta[itemprop="recipeId"]').attr('content') || null;
    
    // Source
    const sourceLink = $el.find('[itemprop="recipeSource"] a').attr('href');
    const sourceText = $el.find('[itemprop="recipeSource"]').text().trim();
    const source = sourceLink || sourceText || null;
    
    // Yield/servings
    const yieldText = $el.find('[itemprop="recipeYield"]').text().trim() || null;
    
    // Times
    const prepTimeIso = $el.find('meta[itemprop="prepTime"]').attr('content') || null;
    const cookTimeIso = $el.find('meta[itemprop="cookTime"]').attr('content') || null;
    const prepMinutes = parseIsoDuration(prepTimeIso);
    const cookMinutes = parseIsoDuration(cookTimeIso);
    
    // Categories
    const categories = [];
    $el.find('meta[itemprop="recipeCategory"]').each((_, cat) => {
      const v = $(cat).attr('content');
      if (v) categories.push(v);
    });
    const course = $el.find('[itemprop="recipeCourse"]').text().trim();
    if (course && !categories.includes(course)) categories.push(course);
    
    // Ingredients
    const ingredientsRaw = [];
    $el.find('.recipe-ingredients p, [itemprop="recipeIngredients"] p').each((_, p) => {
      const text = $(p).text().trim();
      if (text) ingredientsRaw.push(text);
    });
    
    // Directions/steps
    const steps = [];
    $el.find('[itemprop="recipeDirections"] p').each((_, p) => {
      const text = $(p).text().trim();
      if (text) steps.push(text);
    });
    
    // Nutrition
    const nutrition = {};
    $el.find('meta[itemprop^="recipeNut"]').each((_, meta) => {
      const name = $(meta).attr('itemprop').replace('recipeNut', '').toLowerCase();
      const content = $(meta).attr('content');
      if (name && content) {
        nutrition[name] = isNaN(+content) ? content : +content;
      }
    });
    
    // Image
    const imageUrl = $el.find('.recipe-photo').attr('src') || null;
    
    // Full HTML
    const html = $.html($el);
    
    if (title) {
      recipes.push({
        title,
        recipeId,
        source,
        yieldText,
        prepMinutes,
        cookMinutes,
        categories,
        ingredients: ingredientsRaw.map(raw => ({ raw })),
        steps,
        nutrition,
        imageUrl,
        html
      });
    }
  });
  
  console.log(`📊 Found ${recipes.length} recipes\n`);
  
  // Insert into database
  const client = await pool.connect();
  let inserted = 0;
  let skipped = 0;
  
  try {
    // First, ensure we have a user to associate recipes with
    // Check if anonymous user exists, create if not
    let userId;
    const userCheck = await client.query(`
      SELECT id FROM users WHERE "openId" = 'anonymous_import' LIMIT 1
    `);
    
    if (userCheck.rows.length > 0) {
      userId = userCheck.rows[0].id;
    } else {
      const userInsert = await client.query(`
        INSERT INTO users ("openId", name, role)
        VALUES ('anonymous_import', 'Recipe Import', 'user')
        RETURNING id
      `);
      userId = userInsert.rows[0].id;
    }
    
    console.log(`👤 Using user ID: ${userId}\n`);
    
    // Check if embedding column exists
    const colCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recipes' AND column_name = 'embedding'
    `);
    const hasEmbedding = colCheck.rows.length > 0;
    
    await client.query('BEGIN');
    
    for (let i = 0; i < recipes.length; i++) {
      const r = recipes[i];
      
      // Check for duplicate by title
      const dupCheck = await client.query(
        'SELECT id FROM recipes WHERE LOWER(name) = LOWER($1) LIMIT 1',
        [r.title]
      );
      
      if (dupCheck.rows.length > 0) {
        skipped++;
        continue;
      }
      
      // Create embedding if available
      let embedding = null;
      if (hasEmbedding && OPENAI_KEY) {
        const textToEmbed = [r.title, ...r.ingredients.map(i => i.raw), ...r.steps].join('\n');
        embedding = await createEmbedding(textToEmbed);
        if (embedding && (i + 1) % 10 === 0) {
          console.log(`   Generated embeddings for ${i + 1}/${recipes.length} recipes`);
        }
      }
      
      // Insert recipe
      let insertQ, vals;
      
      if (hasEmbedding && embedding) {
        insertQ = `
          INSERT INTO recipes (
            "userId", name, description, "sourceUrl", source, category,
            servings, "cookingTime", "caloriesPerServing",
            recipe_id, yield_text, prep_time_minutes, cook_time_minutes,
            categories, nutrition, ingredients, steps, html, embedding
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
          ) RETURNING id
        `;
        vals = [
          userId,
          r.title,
          r.steps[0] || null, // Use first step as description
          r.source,
          'RecipeKeeper',
          r.categories[0] || null,
          null, // servings (parsed from yieldText if needed)
          r.cookMinutes,
          r.nutrition.calories || null,
          r.recipeId,
          r.yieldText,
          r.prepMinutes,
          r.cookMinutes,
          r.categories.length ? r.categories : null,
          Object.keys(r.nutrition).length ? r.nutrition : null,
          JSON.stringify(r.ingredients),
          JSON.stringify(r.steps),
          r.html,
          embedding
        ];
      } else {
        insertQ = `
          INSERT INTO recipes (
            "userId", name, description, "sourceUrl", source, category,
            servings, "cookingTime", "caloriesPerServing",
            recipe_id, yield_text, prep_time_minutes, cook_time_minutes,
            categories, nutrition, ingredients, steps, html
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
          ) RETURNING id
        `;
        vals = [
          userId,
          r.title,
          r.steps[0] || null,
          r.source,
          'RecipeKeeper',
          r.categories[0] || null,
          null,
          r.cookMinutes,
          r.nutrition.calories ? Math.round(r.nutrition.calories) : null,
          r.recipeId,
          r.yieldText,
          r.prepMinutes,
          r.cookMinutes,
          r.categories.length ? r.categories : null,
          Object.keys(r.nutrition).length ? r.nutrition : null,
          JSON.stringify(r.ingredients),
          JSON.stringify(r.steps),
          r.html
        ];
      }
      
      await client.query(insertQ, vals);
      inserted++;
      
      // Progress update
      if ((i + 1) % 50 === 0) {
        console.log(`   Imported ${inserted}/${recipes.length} recipes...`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log(`\n✅ Import complete!`);
    console.log(`   ✓ Inserted: ${inserted}`);
    console.log(`   ⚠️  Skipped (duplicates): ${skipped}`);
    console.log(`   Total processed: ${recipes.length}`);
    
    if (!OPENAI_KEY) {
      console.log(`\n💡 Note: OPENAI_API_KEY not set, embeddings were not generated`);
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Import failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node scripts/import-recipekeeper.js <path-to-recipes.html>');
  process.exit(1);
}

importRecipes(filePath).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

