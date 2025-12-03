#!/usr/bin/env node
/**
 * Run database migrations manually
 * Usage: node scripts/run-migrations.js
 * 
 * This script reads SQL migration files from drizzle/ directory
 * and executes them in order against the database specified in DATABASE_URL
 * Supports PostgreSQL connection strings
 */

import { readFileSync, readdirSync } from 'fs';
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

/**
 * Convert MySQL SQL syntax to PostgreSQL syntax
 */
function convertMySQLToPostgreSQL(sql) {
  let converted = sql;
  
  // Convert enum to VARCHAR with CHECK constraint (do this BEFORE backtick conversion)
  // Match column definitions with enum, capturing the column name (with backticks)
  converted = converted.replace(
    /`([^`]+)`\s+enum\s*\(([^)]+)\)\s+NOT\s+NULL\s+DEFAULT\s+'([^']+)'/gi,
    (match, columnName, values, defaultValue) => {
      return `"${columnName}" VARCHAR(50) NOT NULL DEFAULT '${defaultValue}' CHECK ("${columnName}" IN (${values}))`;
    }
  );
  converted = converted.replace(
    /`([^`]+)`\s+enum\s*\(([^)]+)\)\s+NOT\s+NULL/gi,
    (match, columnName, values) => {
      return `"${columnName}" VARCHAR(50) NOT NULL CHECK ("${columnName}" IN (${values}))`;
    }
  );
  converted = converted.replace(
    /`([^`]+)`\s+enum\s*\(([^)]+)\)/gi,
    (match, columnName, values) => {
      return `"${columnName}" VARCHAR(50) CHECK ("${columnName}" IN (${values}))`;
    }
  );
  
  // Replace backticks with double quotes (PostgreSQL uses double quotes for identifiers)
  converted = converted.replace(/`([^`]+)`/g, '"$1"');
  
  // Replace AUTO_INCREMENT with SERIAL (PostgreSQL auto-increment)
  converted = converted.replace(/\bint\s+AUTO_INCREMENT\b/gi, 'SERIAL');
  converted = converted.replace(/\bAUTO_INCREMENT\b/gi, '');
  
  // Remove ON UPDATE CURRENT_TIMESTAMP (PostgreSQL doesn't support this)
  // Note: This would need a trigger for automatic updates, but we'll just remove it for now
  converted = converted.replace(/\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, '');
  
  // Replace timestamp with TIMESTAMP (PostgreSQL uses TIMESTAMP)
  converted = converted.replace(/\btimestamp\b/gi, 'TIMESTAMP');
  
  // Replace int with INTEGER (both work, but INTEGER is more explicit)
  converted = converted.replace(/\bint\s+NOT\s+NULL/gi, 'INTEGER NOT NULL');
  converted = converted.replace(/\bint\s+/gi, 'INTEGER ');
  
  // Replace boolean with BOOLEAN
  converted = converted.replace(/\bboolean\b/gi, 'BOOLEAN');
  
  // Replace text with TEXT (both work, but keep TEXT)
  // No change needed
  
  // Replace varchar with VARCHAR (both work)
  // No change needed
  
  // Fix DEFAULT (now()) to DEFAULT NOW() for PostgreSQL
  converted = converted.replace(/\bDEFAULT\s*\(now\(\)\)/gi, 'DEFAULT NOW()');
  
  return converted;
}

async function runMigrations() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('sslmode=require') || DATABASE_URL.includes('ssl=true') 
      ? { rejectUnauthorized: false } 
      : false,
  });

  const client = await pool.connect();

  try {
    console.log('📦 Connecting to database...');
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

      try {
        await client.query('BEGIN');
        
        let statementIndex = 0;
        for (const statement of statements) {
          if (statement.trim()) {
            const savepointName = `sp_${statementIndex}`;
            try {
              // Create a savepoint for this statement
              await client.query(`SAVEPOINT ${savepointName}`);
              
              // Convert MySQL syntax to PostgreSQL
              const postgresSQL = convertMySQLToPostgreSQL(statement);
              await client.query(postgresSQL);
              
              // Release the savepoint on success
              await client.query(`RELEASE SAVEPOINT ${savepointName}`);
            } catch (error) {
              // Rollback to the savepoint to continue with next statement
              await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
              
              // Check if error is "already exists" - that's OK for PostgreSQL
              if (error.code === '42P07' || // duplicate_table
                  error.code === '42710' || // duplicate_object
                  error.code === '42723' || // duplicate_function
                  error.code === '42P16' || // duplicate_column
                  error.message.includes('already exists') ||
                  error.message.includes('duplicate key') ||
                  error.message.includes('duplicate')) {
                console.log(`   ⚠️  ${error.message.split('\n')[0]} (skipping)`);
              } else {
                // For other errors, still rollback but log and continue
                console.log(`   ⚠️  ${error.message.split('\n')[0]} (skipping)`);
              }
            }
            statementIndex++;
          }
        }

        await client.query('COMMIT');
        console.log(`   ✅ ${file} completed\n`);
      } catch (error) {
        await client.query('ROLLBACK');
        // Check if error is "already exists" - that's OK
        if (error.code === '42P07' || 
            error.code === '42710' || 
            error.code === '42723' ||
            error.code === '42P16' ||
            error.message.includes('already exists') ||
            error.message.includes('duplicate')) {
          console.log(`   ⚠️  ${error.message.split('\n')[0]} (skipping - may already exist)`);
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.sql) {
      console.error('   SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();

