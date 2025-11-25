# Quick Start: Switch to Neon Database

## TL;DR
- ✅ Keep Railway for app hosting
- ✅ Use Neon for database
- ✅ Just update DATABASE_URL
- ❌ Don't shut down Railway

## Step-by-Step

### 1. Create Neon Database
1. Go to https://neon.tech
2. Create account → New Project
3. Copy connection string (looks like: `postgresql://user:pass@host.neon.tech/dbname`)

### 2. Enable pgvector in Neon
- Neon Dashboard → SQL Editor → Run:
  ```sql
  CREATE EXTENSION vector;
  ```

### 3. Update Local Development
Edit `.env.local`:
```env
DATABASE_URL=postgresql://your-neon-connection-string
```

### 4. Set Up Schema
```bash
node scripts/setup-complete-postgres-schema.js
node scripts/enable-pgvector.js
```

### 5. Update Production (Railway/Vercel)
- Railway Dashboard → Your Project → Variables
- Update `DATABASE_URL` to Neon connection string
- Redeploy (or it will auto-redeploy)

### 6. Test
```bash
pnpm dev  # Test locally first
```

## What Happens to Your MySQL Database?

**Option A: Keep as Backup (Recommended)**
- Leave Railway MySQL running for 1-2 weeks
- Delete after confirming everything works

**Option B: Delete Immediately**
- Only if you don't have important data
- Or if you've already migrated everything

## Architecture

```
┌──────────────┐         ┌──────────────┐
│   Railway    │────────▶│     Neon     │
│  (App Host)  │ DATABASE│  (Database)  │
└──────────────┘   URL   └──────────────┘
```

Your app stays on Railway, just connects to Neon instead of MySQL.

## Data Migration

**If you have existing data:**
- Export from MySQL
- Import to Neon (may need conversion)
- See MIGRATE_TO_NEON.md for details

**If starting fresh:**
- Just use new Neon database
- Users re-register
- Everything else works immediately


