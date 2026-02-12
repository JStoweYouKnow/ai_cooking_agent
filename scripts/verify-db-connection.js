#!/usr/bin/env node
/**
 * Quick script to verify database connection before running migrations
 */

import pg from 'pg';
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  console.error('   Please set it in .env.local or .env file');
  process.exit(1);
}

async function verifyConnection() {
  let sslConfig = false;
  
  if (DATABASE_URL.includes('sslmode=require') || DATABASE_URL.includes('ssl=true')) {
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
    sslConfig = { rejectUnauthorized };
    
    if (process.env.DB_SSL_CA) {
      sslConfig.ca = process.env.DB_SSL_CA.replace(/\\n/g, '\n');
    }
  }

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: sslConfig,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!\n');
    
    // Check if subscriptions table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'subscriptions'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ subscriptions table exists');
      
      // Check if RevenueCat columns already exist
      const columnCheck = await client.query(`
        SELECT COUNT(*) as count
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name LIKE 'revenuecat%'
      `);
      
      const count = parseInt(columnCheck.rows[0].count);
      if (count > 0) {
        console.log(`⚠️  Found ${count} RevenueCat columns - migration may have already run`);
      } else {
        console.log('✅ Ready to run RevenueCat migration');
      }
    } else {
      console.log('⚠️  subscriptions table does not exist');
      console.log('   You may need to run earlier migrations first');
    }
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  }
}

verifyConnection();
