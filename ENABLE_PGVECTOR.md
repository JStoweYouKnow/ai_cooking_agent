# Enabling pgvector on Railway

## Current Status
✅ All tables created successfully (10 tables)
❌ pgvector extension needs to be enabled
❌ Embedding column needs to be added (requires pgvector)

## Step 1: Enable pgvector Extension

### Option A: Via Railway SQL Editor (Recommended)

1. Go to your Railway dashboard
2. Click on your Postgres database
3. Look for "Query" or "SQL Editor" tab
4. Run this SQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Option B: Via psql Command Line

If you have `psql` installed locally:

```bash
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Option C: Via Node.js Script

Once pgvector is available, run:

```bash
node -e "
import { Pool } from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
await client.query('CREATE EXTENSION IF NOT EXISTS vector');
console.log('✅ pgvector enabled');
client.release();
await pool.end();
"
```

## Step 2: Add Embedding Column

After pgvector is enabled, add the embedding column:

```sql
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS embedding vector(1536);
```

Or run this script:

```bash
node scripts/add-embedding-column.js
```

## Step 3: Verify Everything Works

Run this to verify:

```bash
node scripts/verify-postgres-setup.js
```

## Troubleshooting

### Error: "extension vector is not available"

**If you're using Railway's pgvector template:**
- The extension should be available, but you need to enable it manually
- Try the SQL editor method above
- If still not working, check Railway's documentation for your specific template

**If you're using regular Railway Postgres:**
- Railway's standard Postgres doesn't include pgvector
- You need to use the pgvector template from Railway's template gallery
- Or switch to a provider that supports pgvector (Supabase, Neon, etc.)

### Alternative: Use Supabase or Neon

Both Supabase and Neon have pgvector built-in and easier to enable:
- **Supabase**: Go to SQL Editor → Run `CREATE EXTENSION vector;`
- **Neon**: pgvector is pre-installed, just enable it

## Current Database Status

✅ **Tables Created:**
- users
- ingredients  
- recipes (without embedding column yet)
- recipe_ingredients
- user_ingredients
- shopping_lists
- shopping_list_items
- notifications
- conversations
- messages

✅ **Indexes Created:** All indexes are in place

❌ **Missing:**
- pgvector extension (needs manual enable)
- embedding column on recipes table (needs pgvector first)

## Next Steps After Enabling pgvector

1. Enable the extension (see Step 1 above)
2. Add the embedding column (see Step 2 above)
3. Test recipe import: `/api/import-recipes`
4. After importing recipes, create the vector index:
   ```sql
   CREATE INDEX IF NOT EXISTS recipes_embedding_idx 
   ON recipes USING ivfflat (embedding) WITH (lists = 100);
   ```


