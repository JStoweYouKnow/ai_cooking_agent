#!/usr/bin/env node
/**
 * Run database migrations manually
 * Usage: node scripts/run-migrations.js
 * 
 * This script reads SQL migration files from drizzle/ directory
 * and executes them in order against the database specified in DATABASE_URL
 * Supports PostgreSQL connection strings
 * 
 * Environment Variables:
 * - DATABASE_URL (required): PostgreSQL connection string
 * - DB_SSL_REJECT_UNAUTHORIZED (optional): Set to "true" (default) to verify SSL certificates,
 *   or "false" to disable verification (NOT recommended for production)
 * - DB_SSL_CA (optional): CA certificate(s) for SSL verification. Can be:
 *   - Inline certificate with \n for newlines (e.g., "-----BEGIN CERTIFICATE-----\n...")
 *   - Will be automatically converted to proper multiline format
 *   - Required for proper SSL verification in production environments
 * 
 * Security Best Practices:
 * - Always use DB_SSL_REJECT_UNAUTHORIZED=true in production
 * - Provide proper CA certificates via DB_SSL_CA for production databases
 * - Only disable certificate verification in local development if absolutely necessary
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
      // Compute max length from enum values
      const enumValues = values.match(/'([^']+)'/g) || [];
      const lengths = enumValues.map(v => v.replace(/'/g, '').length);
      const maxLen = lengths.length > 0 ? Math.max(...lengths) : 0;
      const varcharLen = Math.max(maxLen, 1);
      return `"${columnName}" VARCHAR(${varcharLen}) NOT NULL DEFAULT '${defaultValue}' CHECK ("${columnName}" IN (${values}))`;
    }
  );
  converted = converted.replace(
    /`([^`]+)`\s+enum\s*\(([^)]+)\)\s+NOT\s+NULL/gi,
    (match, columnName, values) => {
      // Compute max length from enum values
      const enumValues = values.match(/'([^']+)'/g) || [];
      const lengths = enumValues.map(v => v.replace(/'/g, '').length);
      const maxLen = lengths.length > 0 ? Math.max(...lengths) : 0;
      const varcharLen = Math.max(maxLen, 1);
      return `"${columnName}" VARCHAR(${varcharLen}) NOT NULL CHECK ("${columnName}" IN (${values}))`;
    }
  );
  converted = converted.replace(
    /`([^`]+)`\s+enum\s*\(([^)]+)\)/gi,
    (match, columnName, values) => {
      // Compute max length from enum values
      const enumValues = values.match(/'([^']+)'/g) || [];
      const lengths = enumValues.map(v => v.replace(/'/g, '').length);
      const maxLen = lengths.length > 0 ? Math.max(...lengths) : 0;
      const varcharLen = Math.max(maxLen, 1);
      return `"${columnName}" VARCHAR(${varcharLen}) CHECK ("${columnName}" IN (${values}))`;
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
  // Configure SSL settings
  let sslConfig = false;
  
  if (DATABASE_URL.includes('sslmode=require') || DATABASE_URL.includes('ssl=true')) {
    // Parse DB_SSL_REJECT_UNAUTHORIZED (defaults to "true" for security)
    const rejectUnauthorizedEnv = process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true';
    const rejectUnauthorized = rejectUnauthorizedEnv.toLowerCase() === 'true';
    
    // Warn if certificate verification is disabled
    if (!rejectUnauthorized) {
      console.warn('⚠️  WARNING: SSL certificate verification is DISABLED (rejectUnauthorized=false)');
      console.warn('⚠️  This is a security risk and should only be used in development.');
      console.warn('⚠️  For production, set DB_SSL_REJECT_UNAUTHORIZED=true and provide proper CA certificates.\n');
    }
    
    sslConfig = { rejectUnauthorized };
    
    // Add CA certificate(s) if provided
    const caCert = process.env.DB_SSL_CA;
    if (caCert) {
      // Support both inline certificates and file paths
      // Inline certs should have literal \n, which we convert to actual newlines
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
              // Rollback to the savepoint
              await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
              
              // Check if error is "already exists" - that's OK for PostgreSQL
              if (error.code === '42P07' || // duplicate_table
                  error.code === '42710' || // duplicate_object
                  error.code === '42723' || // duplicate_function
                  error.code === '42P16' || // duplicate_column
                  error.message.includes('already exists') ||
                  error.message.includes('duplicate key') ||
                  error.message.includes('duplicate')) {
                console.warn(`   ⚠️  ${error.message.split('\n')[0]} (skipping)`);
              } else {
                // For non-duplicate errors, log full error and fail fast
                console.error(`\n❌ Migration failed in ${file} at statement ${statementIndex}:`);
                console.error(`Error message: ${error.message}`);
                if (error.stack) {
                  console.error(`Stack trace:\n${error.stack}`);
                } else {
                  console.error(`Full error: ${JSON.stringify(error, null, 2)}`);
                }
                
                // Rollback the entire transaction
                await client.query('ROLLBACK');
                
                // Exit with non-zero code to fail fast
                process.exit(1);
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
    if (client) client.release();
    await pool.end();
  }
}

runMigrations();

