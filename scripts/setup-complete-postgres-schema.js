#!/usr/bin/env node
/**
 * Complete Postgres Schema Setup
 * 
 * This script creates all tables, indexes, and enables pgvector
 * Run this on your new Postgres database with pgvector
 * 
 * Usage:
 *   node scripts/setup-complete-postgres-schema.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.error('   Please set it in .env.local or pass it as an environment variable');
  process.exit(1);
}

// Check if it's a Postgres URL
if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  console.error('❌ ERROR: DATABASE_URL does not appear to be a Postgres connection string');
  console.error(`   Current URL starts with: ${DATABASE_URL.substring(0, 20)}...`);
  console.error('   Expected format: postgresql://user:password@host:port/database');
  process.exit(1);
}

console.log('📦 Connecting to Postgres database...');
console.log(`   Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);

const pool = new Pool({ connectionString: DATABASE_URL });

async function setupCompleteSchema() {
  const client = await pool.connect();
  
  try {
    // Read the complete schema file
    const schemaPath = join(__dirname, '..', 'drizzle', 'postgres_complete_schema.sql');
    const schemaSQL = readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Running complete schema migration...');
    console.log('   File: drizzle/postgres_complete_schema.sql\n');
    
    // Execute the entire SQL file - pg library handles multiple statements
    console.log('   Executing complete schema...\n');
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    // Split SQL into individual statements properly
    // Remove comments and empty lines, then split by semicolon
    const cleanSQL = schemaSQL
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--') && !trimmed.match(/^=+$/);
      })
      .join('\n');
    
    // Split by semicolon, but keep CREATE TABLE blocks together
    const statements = [];
    let currentStatement = '';
    let inCreateTable = false;
    
    for (const line of cleanSQL.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      currentStatement += line + '\n';
      
      if (trimmed.toUpperCase().startsWith('CREATE TABLE')) {
        inCreateTable = true;
      }
      
      if (trimmed.endsWith(';')) {
        if (inCreateTable || trimmed.toUpperCase().startsWith('CREATE INDEX') || 
            trimmed.toUpperCase().startsWith('CREATE EXTENSION')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
          inCreateTable = false;
        }
      }
    }
    
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    // Execute each statement
    for (const statement of statements) {
      if (!statement || statement.length < 10) continue;
      
      try {
        // Show preview
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ').replace(/\n/g, ' ');
        console.log(`   Executing: ${preview}...`);
        
        await client.query(statement);
        successCount++;
        console.log('   ✅ Success\n');
      } catch (error) {
        // IF NOT EXISTS should prevent most errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate') ||
            (error.message.includes('does not exist') && error.message.includes('extension'))) {
          skipCount++;
          console.log(`   ⚠️  Skipped: ${error.message.split('\n')[0]}\n`);
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          // This might be a dependency issue - log but continue
          errorCount++;
          console.log(`   ⚠️  Dependency issue: ${error.message.split('\n')[0]}\n`);
        } else {
          errorCount++;
          console.log(`   ❌ Error: ${error.message.split('\n')[0]}\n`);
        }
      }
    }
    
    console.log('✅ Schema setup completed!');
    console.log(`   ✓ Successful: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skipCount}`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`);
    }
    
    // Verify pgvector extension
    console.log('\n🔍 Verifying setup...');
    const extCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_extension WHERE extname = 'vector'
      );
    `);
    
    if (extCheck.rows[0].exists) {
      console.log('   ✅ pgvector extension is enabled');
    } else {
      console.log('   ⚠️  pgvector extension not found (may need manual enable)');
    }
    
    // List all tables
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log(`\n📊 Tables created: ${tablesCheck.rows.length}`);
    tablesCheck.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check recipes table for embedding column
    const recipesCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'recipes' 
      AND column_name = 'embedding';
    `);
    
    if (recipesCols.rows.length > 0) {
      console.log('\n   ✅ Recipes table has embedding column (pgvector ready)');
    } else {
      console.log('\n   ⚠️  Recipes table missing embedding column');
    }
    
    console.log('\n📝 Next steps:');
    console.log('   1. After importing some recipes, create the vector index:');
    console.log('      CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING ivfflat (embedding) WITH (lists = 100);');
    console.log('   2. Or use HNSW for better performance:');
    console.log('      CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING hnsw (embedding vector_cosine_ops);');
    
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

setupCompleteSchema();

