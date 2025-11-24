#!/usr/bin/env node
/**
 * Run database migrations manually
 * Usage: node scripts/run-migrations.js
 * 
 * This script reads SQL migration files from drizzle/ directory
 * and executes them in order against the database specified in DATABASE_URL
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
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

// Parse MySQL connection string
// Format: mysql://user:password@host:port/database
function parseDatabaseUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
  };
}

async function runMigrations() {
  const dbConfig = parseDatabaseUrl(DATABASE_URL);
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('📦 Connecting to database...');
    await connection.connect();
    console.log('✅ Connected successfully\n');

    // Get all SQL migration files, sorted by name
    const migrationsDir = join(__dirname, '..', 'drizzle');
    const files = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No migration files found in drizzle/ directory');
      return;
    }

    console.log(`📋 Found ${files.length} migration file(s):\n`);

    for (const file of files) {
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8');

      // Split by statement-breakpoint to get individual statements
      const statements = sql
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      if (statements.length === 0) {
        console.log(`⏭️  Skipping ${file} (no statements found)`);
        continue;
      }

      console.log(`🔄 Running ${file}...`);

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.query(statement);
          } catch (error) {
            // Check if error is "table/column already exists" - that's OK
            if (error.code === 'ER_DUP_FIELDNAME' || 
                error.code === 'ER_TABLE_EXISTS_ERROR' ||
                error.message.includes('already exists')) {
              console.log(`   ⚠️  ${error.message.split('\n')[0]} (skipping)`);
            } else {
              throw error;
            }
          }
        }
      }

      console.log(`   ✅ ${file} completed\n`);
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigrations();

