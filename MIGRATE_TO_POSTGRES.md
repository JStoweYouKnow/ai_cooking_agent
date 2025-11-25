# Migrating to Postgres + pgvector

## Current Status
Your current `DATABASE_URL` points to a MySQL database. To use the new recipe import features with embeddings, you need to migrate to Postgres with pgvector support.

## Step 1: Set up a Postgres Database

### Option A: Railway (Recommended - pgvector included)
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add a Postgres database
4. Copy the connection string (it will look like: `postgresql://postgres:password@host:port/railway`)

### Option B: Supabase (Free tier available)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Enable pgvector extension in SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### Option C: Local Postgres with pgvector
```bash
# Install Postgres and pgvector
brew install postgresql@15
brew install pgvector

# Or using Docker:
docker run -d \
  --name postgres-pgvector \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=ai_cooking_agent \
  -p 5432:5432 \
  pgvector/pgvector:pg15
```

## Step 2: Update Your DATABASE_URL

Update your `.env.local` file:
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

**Important**: Make sure the URL starts with `postgresql://` or `postgres://`

## Step 3: Run the Migration

### Method 1: Using the Node.js script (Recommended)
```bash
node scripts/run-postgres-migration.js
```

### Method 2: Using psql command line
```bash
psql $DATABASE_URL -f drizzle/postgres_pgvector_migration.sql
```

### Method 3: Using a database GUI
1. Connect to your Postgres database using pgAdmin, DBeaver, or TablePlus
2. Open the file `drizzle/postgres_pgvector_migration.sql`
3. Execute all the SQL statements

## Step 4: Verify the Migration

Connect to your database and verify:
```sql
-- Check if pgvector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recipes' 
AND column_name IN ('embedding', 'recipe_id', 'tags', 'categories');
```

## Step 5: Create Vector Index (After importing recipes)

Once you've imported some recipes, create the vector index for faster searches:

```sql
-- Option 1: IVFFlat (good for large datasets)
CREATE INDEX IF NOT EXISTS recipes_embedding_idx 
ON recipes USING ivfflat (embedding) 
WITH (lists = 100);

-- Option 2: HNSW (better for smaller datasets, faster queries)
CREATE INDEX IF NOT EXISTS recipes_embedding_idx 
ON recipes USING hnsw (embedding vector_cosine_ops);
```

## Troubleshooting

### Error: "extension vector does not exist"
- Make sure pgvector is installed on your Postgres instance
- Railway includes it by default
- For other providers, you may need to enable it manually

### Error: "relation recipes does not exist"
- You need to create the recipes table first
- Run your existing migrations or create the table manually

### Error: "column already exists"
- This is normal if you run the migration multiple times
- The migration uses `IF NOT EXISTS` so it's safe to re-run

## Next Steps

After migration:
1. Update your application code to use Postgres (if needed)
2. Test the `/api/import-recipes` endpoint
3. Import some recipes to test the embedding functionality
4. Create the vector index once you have data


