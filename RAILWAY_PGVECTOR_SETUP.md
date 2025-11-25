# Setting Up pgvector on Railway

## Issue
The pgvector extension is not available even though you're using the `pgvector/pgvector:pg18` Docker image.

## Solutions

### Option 1: Check Railway Variables/Settings Tab

1. Go to your Railway dashboard
2. Click on your pgvector database
3. Look for **"Variables"** or **"Settings"** tab
4. Check if there's an option to enable extensions or configure the database
5. Some Railway templates require enabling extensions via environment variables

### Option 2: Use Railway CLI (if available)

If you have Railway CLI installed:

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login
railway login

# Connect to your database
railway connect
```

Then run:
```sql
CREATE EXTENSION vector;
```

### Option 3: Check Database Version

The pgvector extension might need to be installed differently depending on Postgres version. Let's check:

```bash
node scripts/check-postgres-version.js
```

### Option 4: Manual Installation via Connection

If you have `psql` installed locally:

```bash
# Connect directly
psql $DATABASE_URL

# Then run:
CREATE EXTENSION vector;
```

### Option 5: Contact Railway Support

If the pgvector template doesn't have the extension available, this might be a Railway configuration issue. Contact Railway support or check their documentation for the pgvector template.

### Option 6: Use Without Embeddings (Temporary)

You can use the database without the embedding column for now:

1. The recipes table works without embeddings
2. Recipe import will work but won't generate embeddings
3. Duplicate detection will fall back to title matching only
4. You can add embeddings later when pgvector is available

## Current Status

✅ **Database Schema:** Complete (all 10 tables created)
✅ **Application Ready:** Can run without embeddings
❌ **pgvector Extension:** Not available (needs Railway configuration)

## Next Steps

1. Check Railway's Variables/Settings tab for extension options
2. Try Railway CLI if available
3. Contact Railway support about pgvector template
4. Or proceed without embeddings for now (everything else works)


