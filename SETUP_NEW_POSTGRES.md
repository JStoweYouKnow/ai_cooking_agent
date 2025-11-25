# Setting Up Your New Postgres Database with pgvector

## Step 1: Get Your New Database Connection String

1. Go to your Railway dashboard
2. Find your new Postgres database (the one with pgvector template)
3. Click on it and go to the "Variables" or "Connect" tab
4. Copy the `DATABASE_URL` or `POSTGRES_URL`
   - It should look like: `postgresql://postgres:password@host:port/railway`

## Step 2: Update Your .env.local

Update your `.env.local` file with the new DATABASE_URL:

```env
DATABASE_URL=postgresql://postgres:yourpassword@yourhost:port/railway
```

**Important**: Make sure it starts with `postgresql://` or `postgres://`

## Step 3: Run the Complete Schema Setup

Run the setup script to create all tables:

```bash
node scripts/setup-complete-postgres-schema.js
```

This will:
- ✅ Enable pgvector extension
- ✅ Create all tables (users, recipes, ingredients, etc.)
- ✅ Create all indexes
- ✅ Add embedding column to recipes table
- ✅ Verify everything is set up correctly

## Step 4: Verify the Setup

After running the script, you should see:
- ✅ pgvector extension enabled
- ✅ All 9 tables created:
  - users
  - ingredients
  - recipes (with embedding column)
  - recipe_ingredients
  - user_ingredients
  - shopping_lists
  - shopping_list_items
  - notifications
  - conversations
  - messages

## Step 5: Test Your Application

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Test database connectivity by logging in or creating a user

3. Test recipe import at `/api/import-recipes`

## Troubleshooting

### Error: "extension vector is not available"
- Make sure you're using the pgvector template from Railway
- If still not available, try enabling it manually:
  ```sql
  CREATE EXTENSION vector;
  ```

### Error: "relation already exists"
- This is OK - the script uses `IF NOT EXISTS` so it's safe to re-run
- If you want a fresh start, drop tables first (be careful!)

### Error: Connection refused
- Check your DATABASE_URL is correct
- Make sure the database is running in Railway
- Check if your IP needs to be whitelisted (Railway usually doesn't require this)

## Next Steps After Setup

1. **Create vector index** (after importing some recipes):
   ```sql
   CREATE INDEX IF NOT EXISTS recipes_embedding_idx 
   ON recipes USING ivfflat (embedding) WITH (lists = 100);
   ```

2. **Import existing data** (if you have data from MySQL):
   - You may need to export from MySQL and import to Postgres
   - Or use a migration tool

3. **Test recipe import**:
   - Use the `/api/import-recipes` endpoint
   - Upload HTML files with recipe data

## Schema Differences from MySQL

- **Enums**: MySQL enums become CHECK constraints in Postgres
- **AUTO_INCREMENT**: Becomes SERIAL in Postgres
- **ON UPDATE CURRENT_TIMESTAMP**: Postgres uses triggers (handled by application)
- **Case sensitivity**: Postgres is case-sensitive, so column names are quoted
- **JSON**: MySQL TEXT becomes JSONB in Postgres (better performance)

