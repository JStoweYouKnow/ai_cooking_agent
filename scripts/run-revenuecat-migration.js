#!/usr/bin/env node
/**
 * Run RevenueCat database migration
 * Usage: node scripts/run-revenuecat-migration.js
 * 
 * This script runs the RevenueCat migration (0010_add_revenuecat_fields.sql)
 * to add RevenueCat fields to the subscriptions table.
 * 
 * Environment Variables:
 * - DATABASE_URL (required): PostgreSQL connection string
 * - DB_SSL_REJECT_UNAUTHORIZED (optional): Set to "true" (default) to verify SSL certificates
 * - DB_SSL_CA (optional): CA certificate(s) for SSL verification
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config(); // Also load .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('   Set it in .env.local file or as an environment variable');
  process.exit(1);
}

const { Pool } = pg;

async function runRevenueCatMigration() {
  // Configure SSL settings
  let sslConfig = false;
  
  if (DATABASE_URL.includes('sslmode=require') || DATABASE_URL.includes('ssl=true')) {
    const rejectUnauthorizedEnv = process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true';
    const rejectUnauthorized = rejectUnauthorizedEnv.toLowerCase() === 'true';
    
    if (!rejectUnauthorized) {
      console.warn('⚠️  WARNING: SSL certificate verification is DISABLED');
      console.warn('⚠️  This is a security risk and should only be used in development.\n');
    }
    
    sslConfig = { rejectUnauthorized };
    
    const caCert = process.env.DB_SSL_CA;
    if (caCert) {
      sslConfig.ca = caCert.replace(/\\n/g, '\n');
      console.log('🔒 Using custom CA certificate for SSL connection');
    }
  }
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: sslConfig,
  });

  let client = null;

  try {
    client = await pool.connect();
    console.log('📦 Connecting to database...');
    console.log('✅ Connected successfully\n');

    // Read the RevenueCat migration file
    const migrationFile = join(__dirname, '..', 'drizzle', '0010_add_revenuecat_fields.sql');
    const sql = readFileSync(migrationFile, 'utf-8');

    console.log('🔄 Running RevenueCat migration (0010_add_revenuecat_fields.sql)...\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    await client.query('BEGIN');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        await client.query(statement);
        console.log(`   ✅ Statement ${i + 1} completed`);
      } catch (error) {
        // Check if error is "already exists" - that's OK for PostgreSQL
        if (error.code === '42P07' || // duplicate_table
            error.code === '42710' || // duplicate_object
            error.code === '42P16' || // duplicate_column
            error.message?.includes('already exists') ||
            error.message?.includes('duplicate')) {
          console.warn(`   ⚠️  ${error.message.split('\n')[0]} (skipping - already exists)`);
        } else {
          throw error;
        }
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ RevenueCat migration completed successfully!\n');

    // Verify the migration
    console.log('🔍 Verifying migration...');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      AND column_name LIKE 'revenuecat%'
      ORDER BY column_name;
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ RevenueCat columns found in subscriptions table:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.warn('\n⚠️  No RevenueCat columns found. Migration may have failed.');
    }

    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'subscriptions' 
      AND indexname LIKE '%revenuecat%'
      ORDER BY indexname;
    `);

    if (indexResult.rows.length > 0) {
      console.log('\n✅ RevenueCat indexes found:');
      indexResult.rows.forEach(row => {
        console.log(`   - ${row.indexname}`);
      });
    }

    console.log('\n🎉 Migration verification complete!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runRevenueCatMigration();
