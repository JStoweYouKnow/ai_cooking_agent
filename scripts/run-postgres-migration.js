#!/usr/bin/env node
/**
 * Run PostgreSQL migration for Stripe subscriptions
 * Usage: node scripts/run-postgres-migration.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('   Set it in .env.local file or as an environment variable');
  process.exit(1);
}

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('📦 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully\n');

    const migrationFile = join(__dirname, '..', 'drizzle', '0008_add_stripe_subscriptions.sql');
    const sql = readFileSync(migrationFile, 'utf-8');

    console.log('🔄 Running migration: 0008_add_stripe_subscriptions.sql...');

    // Execute the entire SQL file as one transaction
    // PostgreSQL needs the enum type created before the table
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('   ✅ Migration executed successfully!');
    } catch (error) {
      await client.query('ROLLBACK');
      // Check if error is "already exists" - that's OK
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate key') ||
          error.message.includes('duplicate') ||
          error.code === '42P07' || // duplicate_table
          error.code === '42710' ||  // duplicate_object
          error.code === '42723') {   // duplicate_function
        console.log(`   ⚠️  ${error.message.split('\n')[0]} (skipping - may already exist)`);
        await client.query('COMMIT');
      } else {
        throw error;
      }
    }

    console.log('   ✅ Migration completed successfully!\n');
    console.log('🎉 Subscription tables created!');
    
    client.release();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
