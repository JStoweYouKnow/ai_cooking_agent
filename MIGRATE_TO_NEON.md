# Migrating from Railway MySQL to Neon Postgres

## Overview
You can keep Railway for hosting your application and just switch the database connection to Neon. The database and application hosting are separate.

## Step 1: Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Create a new project
3. Copy your connection string (it will look like: `postgresql://user:password@host.neon.tech/dbname`)
4. **Enable pgvector**: Neon has pgvector pre-installed, just enable it:
   - Go to Neon dashboard → SQL Editor
   - Run: `CREATE EXTENSION vector;`

## Step 2: Update Your Database Connection

### For Local Development (.env.local):
```env
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname
```

### For Production (Railway/Vercel):
1. Go to your Railway project (or Vercel if that's where you deploy)
2. Go to **Variables** or **Environment Variables**
3. Update `DATABASE_URL` to your Neon connection string
4. **Don't delete the old MySQL database yet** - keep it as backup

## Step 3: Set Up Schema on Neon

Run the complete schema setup on your new Neon database:

```bash
# Update .env.local with Neon DATABASE_URL first
node scripts/setup-complete-postgres-schema.js
```

Then enable pgvector and add embedding column:

```bash
node scripts/enable-pgvector.js
```

## Step 4: Migrate Data (If You Have Existing Data)

If you have data in your MySQL database that you want to keep:

### Option A: Manual Export/Import (Small datasets)
1. Export from MySQL:
   ```bash
   mysqldump -u user -p database_name > backup.sql
   ```
2. Convert SQL to Postgres format (manual or use a tool)
3. Import to Neon via SQL Editor

### Option B: Use a Migration Tool
- **pgloader**: Converts MySQL to Postgres automatically
- **AWS DMS**: For larger datasets
- **Manual script**: Write a Node.js script to copy data

### Option C: Start Fresh (If no important data)
- Just use the new Neon database with empty tables
- Users will need to re-register, but everything else works

## Step 5: Test Everything

1. **Local testing:**
   ```bash
   pnpm dev
   ```
   - Test login/registration
   - Test recipe import
   - Verify everything works

2. **Production testing:**
   - Deploy to Railway/Vercel with new DATABASE_URL
   - Test all features
   - Monitor for any issues

## Step 6: Clean Up (After Everything Works)

**Only after confirming everything works in production:**

1. ✅ Keep Railway MySQL database for 1-2 weeks as backup
2. ✅ Then you can delete it if you want
3. ✅ You can also keep Railway for app hosting (just using Neon for database)

## Important Notes

### What Stays on Railway:
- ✅ Your application code/deployment
- ✅ Environment variables (except DATABASE_URL)
- ✅ Build and deployment process

### What Moves to Neon:
- ✅ Database storage
- ✅ All your data (after migration)
- ✅ pgvector support

### You DON'T Need To:
- ❌ Shut down Railway project
- ❌ Change your deployment setup
- ❌ Reconfigure your application
- ❌ Just update the DATABASE_URL!

## Architecture After Migration

```
┌─────────────────┐
│  Railway/Vercel │  ← Your app deployment (stays here)
│   (Hosting)     │
└────────┬────────┘
         │
         │ DATABASE_URL points to Neon
         │
         ▼
┌─────────────────┐
│  Neon Database  │  ← Your database (moves here)
│  (Postgres +    │
│   pgvector)     │
└─────────────────┘
```

## Troubleshooting

### Connection Issues
- Make sure Neon allows connections from your IP
- Check Neon dashboard for connection pooling settings
- Use Neon's connection string format (they provide it)

### Schema Issues
- Run `setup-complete-postgres-schema.js` again if needed
- Verify pgvector is enabled: `SELECT * FROM pg_extension WHERE extname = 'vector';`

### Data Migration Issues
- Start with a fresh database if you don't have critical data
- Migrate data in stages (users first, then recipes, etc.)

## Quick Start Commands

```bash
# 1. Update .env.local with Neon DATABASE_URL
# Edit .env.local manually

# 2. Set up schema
node scripts/setup-complete-postgres-schema.js

# 3. Enable pgvector
node scripts/enable-pgvector.js

# 4. Test locally
pnpm dev

# 5. Update production DATABASE_URL in Railway/Vercel
# 6. Deploy and test
```

