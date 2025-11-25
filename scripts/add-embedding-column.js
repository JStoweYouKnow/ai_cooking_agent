#!/usr/bin/env node
/**
 * Add embedding column to recipes table
 * Run this after pgvector extension is enabled
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function addEmbeddingColumn() {
  const client = await pool.connect();
  
  try {
    console.log('1. Checking pgvector extension...');
    const extCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_extension WHERE extname = 'vector'
      );
    `);
    
    if (!extCheck.rows[0].exists) {
      console.log('   ⚠️  pgvector extension not found');
      console.log('   Attempting to enable...');
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        console.log('   ✅ pgvector enabled');
      } catch (err) {
        console.log('   ❌ Failed to enable pgvector:', err.message);
        console.log('   💡 Enable it manually via Railway SQL editor');
        process.exit(1);
      }
    } else {
      console.log('   ✅ pgvector extension is enabled');
    }
    
    console.log('\n2. Adding embedding column...');
    await client.query(`
      ALTER TABLE recipes 
      ADD COLUMN IF NOT EXISTS embedding vector(1536);
    `);
    console.log('   ✅ Embedding column added');
    
    console.log('\n3. Verifying...');
    const colCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'recipes' 
      AND column_name = 'embedding';
    `);
    
    if (colCheck.rows.length > 0) {
      console.log('   ✅ Embedding column verified');
      console.log(`   Type: ${colCheck.rows[0].data_type}`);
    } else {
      console.log('   ⚠️  Embedding column not found');
    }
    
    console.log('\n✅ Setup complete!');
    console.log('\n📝 Next step: After importing recipes, create the vector index:');
    console.log('   CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING ivfflat (embedding) WITH (lists = 100);');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

addEmbeddingColumn();

