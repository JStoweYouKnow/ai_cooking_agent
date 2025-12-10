/**
 * Run the isShared migration script
 * This adds the isShared column to recipes and marks URL-imported recipes as shared
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    console.log("Connecting to database...");
    const db = await getDb();
    
    if (!db) {
      console.error("Error: Could not connect to database. Make sure DATABASE_URL is set.");
      process.exit(1);
    }

    console.log("Running migration: Adding isShared column to recipes table...");

    // Add the isShared column (PostgreSQL syntax with quoted identifiers)
    try {
      await db.execute(sql.raw(`
        ALTER TABLE recipes 
        ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN DEFAULT false
      `));
      console.log("✅ Added isShared column");
    } catch (error: any) {
      // Column might already exist
      if (error?.code === "42701" || error?.message?.includes("already exists") || error?.message?.includes("duplicate")) {
        console.log("⚠️  Column already exists, skipping...");
      } else {
        throw error;
      }
    }

    // Mark existing URL-imported recipes as shared
    console.log("Marking existing URL-imported recipes as shared...");
    const updateResult = await db.execute(sql.raw(`
      UPDATE recipes 
      SET "isShared" = true 
      WHERE "source" = 'url_import' OR "sourceUrl" IS NOT NULL
    `));
    console.log(`✅ Updated ${(updateResult as any)?.rowCount || 'some'} recipes as shared`);

    // Create index (PostgreSQL syntax with quoted identifiers)
    try {
      await db.execute(sql.raw(`
        CREATE INDEX IF NOT EXISTS "recipes_isShared_idx" ON recipes("isShared")
      `));
      console.log("✅ Created index on isShared column");
    } catch (error: any) {
      // Index might already exist
      if (error?.code === "42P07" || error?.message?.includes("already exists") || error?.message?.includes("duplicate")) {
        console.log("⚠️  Index already exists, skipping...");
      } else {
        throw error;
      }
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\nSummary:");
    console.log("- Added 'isShared' column to recipes table");
    console.log("- Marked existing URL-imported recipes as shared");
    console.log("- Created index on isShared column for better performance");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();

