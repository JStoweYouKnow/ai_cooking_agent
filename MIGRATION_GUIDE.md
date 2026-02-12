# RevenueCat Database Migration Guide

This guide will help you run the RevenueCat database migration to add the necessary fields for iOS in-app purchases.

## Prerequisites

1. **Database Connection**: Ensure your `DATABASE_URL` environment variable is set
2. **PostgreSQL Database**: This migration is for PostgreSQL databases
3. **Backup**: ⚠️ **Always backup your database before running migrations**

## Migration Overview

The migration (`drizzle/0010_add_revenuecat_fields.sql`) will:
- Add 8 new RevenueCat-specific columns to the `subscriptions` table
- Make `stripeCustomerId` nullable (for RevenueCat-only subscriptions)
- Create 3 indexes for better query performance

## Method 1: Run Specific RevenueCat Migration (Recommended)

Use the dedicated script to run just the RevenueCat migration:

```bash
node scripts/run-revenuecat-migration.js
```

This script will:
- ✅ Connect to your database
- ✅ Run the migration statements
- ✅ Verify the migration was successful
- ✅ Show you the new columns and indexes

## Method 2: Run All Migrations

If you want to run all pending migrations:

```bash
pnpm db:migrate
```

or

```bash
node scripts/run-migrations.js
```

This will run all SQL files in the `drizzle/` directory in order.

## Method 3: Manual SQL Execution

If you prefer to run the SQL manually:

1. **Connect to your database** using your preferred PostgreSQL client (psql, pgAdmin, etc.)

2. **Run the migration SQL**:
   ```bash
   psql $DATABASE_URL -f drizzle/0010_add_revenuecat_fields.sql
   ```

   Or copy the contents of `drizzle/0010_add_revenuecat_fields.sql` and execute it directly.

## Verification

After running the migration, verify it was successful:

### Check Columns

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name LIKE 'revenuecat%'
ORDER BY column_name;
```

You should see these columns:
- `revenuecatAppUserId`
- `revenuecatOriginalAppUserId`
- `revenuecatProductId`
- `revenuecatOriginalTransactionId`
- `revenuecatPurchaseDate`
- `revenuecatExpirationDate`
- `revenuecatEnvironment`
- `subscriptionPlatform`

### Check Indexes

```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'subscriptions' 
AND indexname LIKE '%revenuecat%';
```

You should see these indexes:
- `subscriptions_revenuecatAppUserId_idx`
- `subscriptions_subscriptionPlatform_idx`
- `subscriptions_revenuecatOriginalTransactionId_idx`

### Check Nullable Constraint

```sql
SELECT column_name, is_nullable
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
AND column_name = 'stripeCustomerId';
```

The `stripeCustomerId` column should now be nullable (`is_nullable = 'YES'`).

## Troubleshooting

### Error: "column already exists"

If you see errors about columns already existing, that's OK! The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times. The script will skip existing columns.

### Error: "relation does not exist"

Make sure you're connected to the correct database and that the `subscriptions` table exists. If it doesn't, you may need to run earlier migrations first.

### Error: "permission denied"

Ensure your database user has the necessary permissions:
- `ALTER TABLE` permission on the `subscriptions` table
- `CREATE INDEX` permission

### SSL Connection Issues

If you're using SSL, you may need to set:
```bash
export DB_SSL_REJECT_UNAUTHORIZED=false  # For development only
# or
export DB_SSL_CA="your-certificate-here"  # For production
```

## Rollback (If Needed)

If you need to rollback the migration, run:

```sql
-- Drop indexes
DROP INDEX IF EXISTS subscriptions_revenuecatAppUserId_idx;
DROP INDEX IF EXISTS subscriptions_subscriptionPlatform_idx;
DROP INDEX IF EXISTS subscriptions_revenuecatOriginalTransactionId_idx;

-- Drop columns
ALTER TABLE subscriptions DROP COLUMN IF EXISTS "revenuecatAppUserId";
ALTER TABLE subscriptions DROP COLUMN IF EXISTS "revenuecatOriginalAppUserId";
ALTER TABLE subscriptions DROP COLUMN IF EXISTS "revenuecatProductId";
ALTER TABLE subscriptions DROP COLUMN IF EXISTS "revenuecatOriginalTransactionId";
ALTER TABLE subscriptions DROP COLUMN IF EXISTS "revenuecatPurchaseDate";
ALTER TABLE subscriptions DROP COLUMN IF EXISTS "revenuecatExpirationDate";
ALTER TABLE subscriptions DROP COLUMN IF EXISTS "revenuecatEnvironment";
ALTER TABLE subscriptions DROP COLUMN IF EXISTS "subscriptionPlatform";

-- Restore NOT NULL constraint (if you had data)
-- ALTER TABLE subscriptions ALTER COLUMN "stripeCustomerId" SET NOT NULL;
```

⚠️ **Warning**: Only rollback if absolutely necessary. This will remove all RevenueCat subscription data.

## Production Deployment

For production deployments:

1. **Backup your database first**
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Run the migration during a maintenance window** (if possible)

3. **Verify the migration** using the verification queries above

4. **Monitor your application** for any issues after deployment

## Next Steps

After running the migration:

1. ✅ Verify the migration was successful
2. ✅ Set `REVENUECAT_WEBHOOK_SECRET` in your production environment
3. ✅ Configure the webhook URL in RevenueCat dashboard
4. ✅ Test the integration with a sandbox purchase

## SupportIf you encounter any issues:
1. Check the error message carefully
2. Verify your `DATABASE_URL` is correct
3. Ensure you have the necessary database permissions
4. Check the database logs for more details