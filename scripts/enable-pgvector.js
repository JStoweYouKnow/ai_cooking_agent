#!/usr/bin/env node
/**
 * Enable pgvector extension via direct database connection
 * This works even if Railway doesn't have a SQL editor
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not set');
  process.exit(1);
}

if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ ERROR: DATABASE_URL must be a Postgres connection string');
  process.exit(1);
}

console.log('📦 Connecting to Postgres database...');
console.log(`   Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

const pool = new Pool({ connectionString: DATABASE_URL });

async function enablePgvector() {
  const client = await pool.connect();
  
  try {
    console.log('1. Checking current pgvector status...');
    const extCheck = await client.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector';
    `);
    
    if (extCheck.rows.length > 0) {
      console.log(`   ✅ pgvector is already enabled (version: ${extCheck.rows[0].extversion})`);
    } else {
      console.log('   ⚠️  pgvector not found, attempting to enable...');
      
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        console.log('   ✅ pgvector extension enabled successfully!');
      } catch (err) {
        console.log('   ❌ Failed to enable pgvector:', err.message);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Make sure you\'re using Railway\'s pgvector template');
        console.log('   2. The extension might need superuser privileges');
        console.log('   3. Try connecting as the postgres superuser');
        console.log('\n   Error details:', err.message);
        process.exit(1);
      }
    }
    
    console.log('\n2. Verifying vector type is available...');
    const typeCheck = await client.query(`
      SELECT typname FROM pg_type WHERE typname = 'vector';
    `);
    
    if (typeCheck.rows.length > 0) {
      console.log('   ✅ vector type is available');
    } else {
      console.log('   ⚠️  vector type not found (extension may not be fully loaded)');
    }
    
    console.log('\n3. Checking recipes table...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'recipes'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('   ⚠️  Recipes table does not exist');
      console.log('   Run: node scripts/setup-complete-postgres-schema.js');
    } else {
      console.log('   ✅ Recipes table exists');
      
      // Check for embedding column
      const colCheck = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'embedding';
      `);
      
      if (colCheck.rows.length > 0) {
        console.log('   ✅ Embedding column already exists');
      } else {
        console.log('   Adding embedding column...');
        try {
          await client.query(`
            ALTER TABLE recipes 
            ADD COLUMN IF NOT EXISTS embedding vector(1536);
          `);
          console.log('   ✅ Embedding column added');
        } catch (err) {
          console.log('   ❌ Failed to add embedding column:', err.message);
          if (err.message.includes('vector')) {
            console.log('   💡 pgvector extension may not be fully enabled');
          }
        }
      }
    }
    
    console.log('\n✅ Setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test recipe import: POST /api/import-recipes');
    console.log('   2. After importing recipes, create vector index:');
    console.log('      CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING ivfflat (embedding) WITH (lists = 100);');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

enablePgvector();

