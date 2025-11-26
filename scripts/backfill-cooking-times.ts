/**
 * Backfill cooking times for existing recipes
 * This script extracts cooking times from recipe instructions OR steps for recipes that don't have one
 *
 * Usage:
 *   npm run backfill-cooking-times
 *   # or with dry-run mode:
 *   npm run backfill-cooking-times -- --dry-run
 */

import { config } from 'dotenv';
// Load environment variables from .env.local BEFORE importing db
config({ path: '.env.local' });

import { getDb } from '../server/db';
import { recipes } from '../drizzle/schema-postgres';
import { extractCookingTimeFromInstructions, extractCookingTimeFromSteps } from '../server/_core/recipeParsing';
import { eq } from 'drizzle-orm';

async function backfillCookingTimes(dryRun = false) {
  console.log('🔍 Starting cooking time backfill process...');
  if (dryRun) {
    console.log('🔒 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('');
  }

  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    // Get all recipes from the database (including steps column)
    const allRecipes = await db.select().from(recipes);

    console.log(`📊 Found ${allRecipes.length} total recipes in database\n`);

    // Filter recipes that don't have cooking time
    const recipesNeedingTime = allRecipes.filter(
      recipe => !recipe.cookingTime
    );

    console.log(`🎯 ${recipesNeedingTime.length} recipes without cooking time\n`);

    if (recipesNeedingTime.length === 0) {
      console.log('✅ All recipes already have cooking times!\n');
      return { success: 0, failed: 0, skipped: allRecipes.length };
    }

    let successCount = 0;
    let failureCount = 0;
    const updates: Array<{ id: number; name: string; extractedTime: number; source: string }> = [];

    // Process each recipe
    console.log('⚙️  Processing recipes...\n');
    for (const recipe of recipesNeedingTime) {
      let extractedTime: number | null = null;
      let source = '';
      
      // Try instructions text first
      if (recipe.instructions) {
        extractedTime = extractCookingTimeFromInstructions(recipe.instructions);
        if (extractedTime) source = 'instructions';
      }
      
      // Try steps array if instructions didn't work
      if (!extractedTime && (recipe as any).steps) {
        extractedTime = extractCookingTimeFromSteps((recipe as any).steps);
        if (extractedTime) source = 'steps';
      }

      if (extractedTime) {
        updates.push({
          id: recipe.id,
          name: recipe.name,
          extractedTime,
          source,
        });
        successCount++;
        console.log(`   ✓ "${recipe.name.substring(0, 50)}" → ${extractedTime} min (from ${source})`);
      } else {
        failureCount++;
        if (process.argv.includes('--verbose')) {
          console.log(`   ✗ "${recipe.name.substring(0, 50)}" - no time found`);
        }
      }
    }

    console.log('\n📈 Extraction Results:');
    console.log(`   ✅ Successfully extracted: ${successCount}`);
    console.log(`   ❌ Could not extract: ${failureCount}\n`);

    if (updates.length > 0 && !dryRun) {
      console.log(`💾 Updating ${updates.length} recipes in database...\n`);

      // Update recipes in batches
      for (const update of updates) {
        await db.update(recipes)
          .set({ cookingTime: update.extractedTime })
          .where(eq(recipes.id, update.id));
      }

      console.log(`✅ Successfully updated ${updates.length} recipes!`);
    } else if (updates.length > 0 && dryRun) {
      console.log(`🔒 DRY RUN: Would update ${updates.length} recipes (no changes made)`);
    }

    console.log('\n📊 Summary:');
    console.log(`   Total recipes in database: ${allRecipes.length}`);
    console.log(`   Recipes processed: ${recipesNeedingTime.length}`);
    console.log(`   Cooking times extracted: ${successCount}`);
    console.log(`   Unable to extract: ${failureCount}`);
    if (recipesNeedingTime.length > 0) {
      console.log(`   Success rate: ${((successCount / recipesNeedingTime.length) * 100).toFixed(1)}%`);
    }

    return { success: successCount, failed: failureCount, total: recipesNeedingTime.length };

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  }
}

// Parse command line arguments
const isDryRun = process.argv.includes('--dry-run');

// Run the backfill
backfillCookingTimes(isDryRun)
  .then((stats) => {
    console.log('\n🎉 Backfill complete!');
    if (stats.success > 0 && !isDryRun) {
      console.log(`\n💡 Tip: Your recipes now have cooking times! They'll appear in recipe cards and search filters.`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Backfill failed:', error);
    process.exit(1);
  });
