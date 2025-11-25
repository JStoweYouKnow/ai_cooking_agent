#!/usr/bin/env node
/**
 * Check Postgres version and available extensions
 */

import { config } from 'dotenv';
import { Pool } from 'pg';

config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  console.log('📊 Database Information:\n');
  
  // Postgres version
  const version = await client.query('SELECT version()');
  console.log('Postgres Version:');
  console.log(`   ${version.rows[0].version}\n`);
  
  // Current user
  const user = await client.query('SELECT current_user, current_database()');
  console.log('Connection Info:');
  console.log(`   User: ${user.rows[0].current_user}`);
  console.log(`   Database: ${user.rows[0].current_database}\n`);
  
  // Available extensions
  console.log('Available Extensions (vector-related):');
  const available = await client.query(`
    SELECT name, default_version, comment
    FROM pg_available_extensions 
    WHERE name LIKE '%vector%' OR name LIKE '%pg%'
    ORDER BY name;
  `);
  
  if (available.rows.length === 0) {
    console.log('   (none found)');
  } else {
    available.rows.forEach(row => {
      console.log(`   - ${row.name} (${row.default_version})`);
      if (row.comment) {
        console.log(`     ${row.comment}`);
      }
    });
  }
  
  // Installed extensions
  console.log('\nInstalled Extensions:');
  const installed = await client.query(`
    SELECT extname, extversion 
    FROM pg_extension 
    ORDER BY extname;
  `);
  
  if (installed.rows.length === 0) {
    console.log('   (none)');
  } else {
    installed.rows.forEach(row => {
      console.log(`   - ${row.extname} (${row.extversion})`);
    });
  }
  
  // Check if vector type exists
  console.log('\nVector Type Check:');
  const vectorType = await client.query(`
    SELECT typname FROM pg_type WHERE typname = 'vector';
  `);
  
  if (vectorType.rows.length > 0) {
    console.log('   ✅ vector type exists');
  } else {
    console.log('   ❌ vector type does not exist');
    console.log('   💡 pgvector extension needs to be enabled');
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  client.release();
  await pool.end();
}

