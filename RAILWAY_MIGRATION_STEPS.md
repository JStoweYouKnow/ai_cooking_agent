# Railway Migration Steps

## Step 1: Get Your Database Connection Details

1. **Go to your Railway dashboard**: https://railway.app
2. **Select your project** → Click on your **MySQL database service**
3. **Click on the "Variables" tab** (or "Connect" tab)
4. **Copy these values**:
   - `MYSQLHOST` (or `MYSQL_HOST`)
   - `MYSQLPORT` (or `MYSQL_PORT`) - usually `3306`
   - `MYSQLDATABASE` (or `MYSQL_DATABASE`)
   - `MYSQLUSER` (or `MYSQL_USER`)
   - `MYSQLPASSWORD` (or `MYSQL_PASSWORD`)

## Step 2: Connect to Your Railway Database

You have **3 options** to connect:

### Option A: Railway's Built-in MySQL Client (Easiest)

1. In Railway dashboard, click on your MySQL service
2. Click **"Query"** tab (or look for "MySQL Console" / "Connect" button)
3. Railway provides a web-based MySQL client - use this!

### Option B: Using MySQL Command Line (Local)

If you have MySQL installed locally:

```bash
mysql -h YOUR_MYSQLHOST \
      -P YOUR_MYSQLPORT \
      -u YOUR_MYSQLUSER \
      -p YOUR_MYSQLDATABASE
```

Then enter your password when prompted.

### Option C: Using a MySQL GUI Tool

Use tools like:
- **MySQL Workbench** (free, official)
- **TablePlus** (paid, great UI)
- **DBeaver** (free, open source)
- **Sequel Pro** (Mac, free)

Connection settings:
- **Host**: `YOUR_MYSQLHOST`
- **Port**: `YOUR_MYSQLPORT` (usually 3306)
- **Database**: `YOUR_MYSQLDATABASE`
- **Username**: `YOUR_MYSQLUSER`
- **Password**: `YOUR_MYSQLPASSWORD`

## Step 3: Run Migrations in Order

Once connected, run these SQL statements **one at a time** in order:

### Migration 1: Add User Preferences (0005)

```sql
ALTER TABLE `users` ADD `dietaryPreferences` text;
ALTER TABLE `users` ADD `allergies` text;
```

### Migration 2: Add User Goals (0006)

```sql
ALTER TABLE `users` ADD `goals` text;
```

### Migration 3: Add Calories and Budget (0007)

```sql
ALTER TABLE `recipes` ADD `caloriesPerServing` int;
ALTER TABLE `users` ADD `calorieBudget` int;
```

## Step 4: Verify Migrations Worked

Run these verification queries:

```sql
-- Check users table structure
DESCRIBE users;

-- Should show these new columns:
-- dietaryPreferences | text | YES | | NULL |
-- allergies | text | YES | | NULL |
-- goals | text | YES | | NULL |
-- calorieBudget | int | YES | | NULL |

-- Check recipes table structure  
DESCRIBE recipes;

-- Should show:
-- caloriesPerServing | int | YES | | NULL |
```

## Step 5: Test the Application

After migrations are complete:
1. **Redeploy your app** on Railway (or wait for auto-deploy)
2. **Check the logs** - you should no longer see "Unknown column" errors
3. **Visit your app** - the recommendations widget should now work!

## Troubleshooting

### Error: "Duplicate column name"
✅ **This is OK!** It means the column already exists. Skip that statement and continue.

### Error: "Access denied"
- Double-check your username and password
- Make sure you're connecting to the correct database

### Error: "Table doesn't exist"
- Make sure you're connected to the correct database
- Check that your app has already created the base tables

### Can't find Railway connection details?
- Check Railway's **"Connect"** tab on your MySQL service
- Look for **"Private Networking"** or **"Public URL"** options
- Railway may provide a connection string you can use

## Quick Copy-Paste Commands

If using Railway's web MySQL client, copy and paste this entire block:

```sql
-- Migration 0005: Add user preferences
ALTER TABLE `users` ADD `dietaryPreferences` text;
ALTER TABLE `users` ADD `allergies` text;

-- Migration 0006: Add user goals  
ALTER TABLE `users` ADD `goals` text;

-- Migration 0007: Add calories and budget
ALTER TABLE `recipes` ADD `caloriesPerServing` int;
ALTER TABLE `users` ADD `calorieBudget` int;

-- Verify
DESCRIBE users;
DESCRIBE recipes;
```

