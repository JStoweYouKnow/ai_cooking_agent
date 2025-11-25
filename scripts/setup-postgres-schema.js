#!/usr/bin/env node
/**
 * Setup Postgres schema for recipes with pgvector support
 * This creates the recipes table if it doesn't exist, then adds the new columns
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function setupSchema() {
  const client = await pool.connect();
  
  try {
    // Step 1: Try to enable pgvector (outside transaction)
    console.log('📦 Step 1: Enabling pgvector extension...');
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('   ✅ pgvector extension enabled\n');
    } catch (error) {
      console.log('   ⚠️  pgvector extension not available:', error.message);
      console.log('   💡 You may need to enable it via Railway dashboard or use a different Postgres provider\n');
    }
    
    // Step 2: Check if recipes table exists
    console.log('📋 Step 2: Checking recipes table...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recipes'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.log('   ⚠️  Recipes table does not exist. Creating it...');
      
      // Create a basic recipes table structure
      // Note: This is a minimal schema - you may want to adjust based on your needs
      await client.query(`
        CREATE TABLE IF NOT EXISTS recipes (
          id SERIAL PRIMARY KEY,
          "userId" INTEGER,
          "externalId" VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          instructions TEXT,
          "imageUrl" TEXT,
          cuisine VARCHAR(100),
          category VARCHAR(100),
          "cookingTime" INTEGER,
          servings INTEGER,
          "caloriesPerServing" INTEGER,
          "sourceUrl" TEXT,
          source VARCHAR(100) DEFAULT 'user_import',
          "isFavorite" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('   ✅ Recipes table created\n');
    } else {
      console.log('   ✅ Recipes table already exists\n');
    }
    
    // Step 3: Add new columns for recipe ingestion
    console.log('🔧 Step 3: Adding new columns for recipe ingestion...');
    
    const alterStatements = [
      'ADD COLUMN IF NOT EXISTS recipe_id TEXT',
      'ADD COLUMN IF NOT EXISTS source TEXT',
      'ADD COLUMN IF NOT EXISTS yield_text TEXT',
      'ADD COLUMN IF NOT EXISTS prep_time_minutes INT',
      'ADD COLUMN IF NOT EXISTS cook_time_minutes INT',
      'ADD COLUMN IF NOT EXISTS tags TEXT[]',
      'ADD COLUMN IF NOT EXISTS categories TEXT[]',
      'ADD COLUMN IF NOT EXISTS nutrition JSONB',
      'ADD COLUMN IF NOT EXISTS ingredients JSONB',
      'ADD COLUMN IF NOT EXISTS steps JSONB',
      'ADD COLUMN IF NOT EXISTS html TEXT',
    ];
    
    // Check if pgvector is available before adding embedding column
    const extCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_extension WHERE extname = 'vector'
      );
    `);
    
    if (extCheck.rows[0].exists) {
      alterStatements.push('ADD COLUMN IF NOT EXISTS embedding vector(1536)');
    } else {
      console.log('   ⚠️  Skipping embedding column (pgvector not available)');
    }
    
    // Add columns one by one to handle errors gracefully
    for (const stmt of alterStatements) {
      try {
        await client.query(`ALTER TABLE recipes ${stmt};`);
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          // Column already exists, that's fine
        } else {
          console.log(`   ⚠️  Warning: ${stmt}: ${err.message}`);
        }
      }
    }
    
    console.log('   ✅ Columns processed\n');
    
    console.log('✅ Schema setup completed!\n');
    console.log('📝 Next steps:');
    console.log('   1. If pgvector is not available, enable it via Railway dashboard');
    console.log('   2. After importing recipes, create the vector index:');
    console.log('      CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING ivfflat (embedding) WITH (lists = 100);');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupSchema();

