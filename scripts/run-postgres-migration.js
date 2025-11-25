#!/usr/bin/env node
/**
 * Run Postgres + pgvector migration
 * 
 * Usage:
 *   node scripts/run-postgres-migration.js
 * 
 * Or with custom DATABASE_URL:
 *   DATABASE_URL=postgresql://user:pass@host:port/db node scripts/run-postgres-migration.js
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
console.log(`   Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`); // Hide password

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigration() {
  const client = await pool.connect();
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'drizzle', 'postgres_pgvector_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('\n📄 Running migration...');
    console.log('   File: drizzle/postgres_pgvector_migration.sql\n');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    await client.query('BEGIN');
    
    for (const statement of statements) {
      // Skip commented lines
      if (statement.startsWith('--')) continue;
      
      try {
        console.log(`   Executing: ${statement.substring(0, 60)}...`);
        await client.query(statement);
        console.log('   ✓ Success\n');
      } catch (error) {
        // IF NOT EXISTS should prevent errors on re-runs
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ⚠ Skipped (already exists): ${error.message.split('\n')[0]}\n`);
        } else {
          throw error;
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. After importing some recipes, create the vector index:');
    console.log('      CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING ivfflat (embedding) WITH (lists = 100);');
    console.log('   2. Or use HNSW for better performance:');
    console.log('      CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING hnsw (embedding vector_cosine_ops);');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:');
    console.error(`   ${error.message}`);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error.message || error);
  process.exit(1);
});

