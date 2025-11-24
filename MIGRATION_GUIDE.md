# Database Migration Guide

This guide explains how to run database migrations for the AI Cooking Agent application.

## 🏠 Local Development

### Option 1: Using Drizzle Kit Push (Recommended for Development)

This automatically syncs your schema to the database:

```bash
pnpm db:push
```

**Note:** This is a **development-only** command. It doesn't create migration files and directly modifies the database schema.

### Option 2: Generate and Run Migrations (Recommended for Production)

1. **Generate migration files** from schema changes:
   ```bash
   pnpm db:generate
   ```

2. **Run migrations manually**:
   ```bash
   pnpm db:migrate
   ```

   Or use the script directly:
   ```bash
   node scripts/run-migrations.js
   ```

## 🚀 Production (Vercel/Cloud)

### Method 1: Manual SQL Execution (Recommended)

Connect to your production database and run the migration SQL files in order:

1. **Get your database connection details** from Vercel environment variables or your database provider

2. **Connect to MySQL**:
   ```bash
   mysql -h YOUR_HOST -u YOUR_USER -p YOUR_DATABASE
   ```

3. **Run each migration file** in order:
   ```sql
   -- Run migration 0005
   SOURCE drizzle/0005_add_user_preferences.sql;
   
   -- Run migration 0006
   SOURCE drizzle/0006_add_user_goals.sql;
   
   -- Run migration 0007
   SOURCE drizzle/0007_add_calories_and_budget.sql;
   ```

   Or copy-paste the SQL directly into your MySQL client.

### Method 2: Using Migration Script

If you have Node.js access to your production environment:

1. **Set DATABASE_URL** environment variable
2. **Run the migration script**:
   ```bash
   node scripts/run-migrations.js
   ```

### Method 3: Vercel Post-Deploy Hook

You can add a post-deploy script in `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "crons": []
}
```

Then create a Vercel serverless function that runs migrations on deploy (advanced).

## 📋 Current Migrations

The following migrations need to be applied:

1. **0005_add_user_preferences.sql** - Adds `dietaryPreferences` and `allergies` columns to `users` table
2. **0006_add_user_goals.sql** - Adds `goals` column to `users` table  
3. **0007_add_calories_and_budget.sql** - Adds `caloriesPerServing` to `recipes` and `calorieBudget` to `users`

## ✅ Verify Migrations

After running migrations, verify they were applied:

```sql
-- Check if columns exist
DESCRIBE users;
DESCRIBE recipes;

-- Should show:
-- users: dietaryPreferences, allergies, goals, calorieBudget
-- recipes: caloriesPerServing
```

## 🔍 Troubleshooting

### Error: "Unknown column 'dietaryPreferences'"

This means migrations haven't been run yet. Follow the steps above to apply them.

### Error: "Table already exists" or "Duplicate column name"

This is OK - it means the migration was already applied. The migration script will skip these automatically.

### Error: "Access denied"

Make sure your database user has `ALTER TABLE` permissions.

## 📝 Notes

- Migrations are **idempotent** - safe to run multiple times
- Always **backup your database** before running migrations in production
- Test migrations in a **staging environment** first
- The app will work without migrations (with graceful fallbacks), but features requiring new columns won't function

