# Postgres + pgvector Migration Guide

This migration adds pgvector support and new columns to the recipes table for recipe ingestion with embeddings.

## Prerequisites

1. **Postgres Database**: You need a Postgres database (e.g., on Railway, Supabase, or AWS RDS)
2. **pgvector Extension**: Ensure the `pgvector` extension is available in your Postgres instance
   - Railway: pgvector is available by default
   - Other providers: You may need to enable it manually

## Migration Steps

1. **Run the migration SQL**:
   ```bash
   # Connect to your Postgres database and run:
   psql $DATABASE_URL -f drizzle/postgres_pgvector_migration.sql
   
   # Or use your database GUI tool to execute the SQL file
   ```

2. **Create the vector index** (optional, but recommended for performance):
   ```sql
   -- After importing some recipes, create the index for faster vector searches
   CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING ivfflat (embedding) WITH (lists = 100);
   
   -- Or for better performance with smaller datasets, use HNSW:
   -- CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING hnsw (embedding vector_cosine_ops);
   ```

## Environment Variables

Make sure you have these set in your `.env.local` or production environment:

```env
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=your_openai_api_key
EMBEDDING_MODEL=text-embedding-3-small  # optional, defaults to text-embedding-3-small
VECTOR_DIM=1536  # optional, defaults to 1536
IMAGE_BASE_URL=https://your-cdn.com  # optional, for rewriting image URLs
```

## API Usage

The new API endpoint is available at:
```
POST /api/import-recipes
Content-Type: multipart/form-data
Body: file (HTML file containing recipe data)
```

The endpoint will:
1. Parse HTML recipe data from the uploaded file
2. Normalize ingredients and extract structured data
3. Generate embeddings using OpenAI
4. Check for duplicates using vector similarity
5. Insert new recipes into the database

## Notes

- The migration assumes your `recipes` table already exists
- If your table uses different column names (e.g., snake_case vs camelCase), adjust the migration SQL accordingly
- The `userId` column is still required - you may need to set a default or adjust the schema if importing recipes without user association
- Duplicate detection uses both vector similarity (threshold: 0.12) and exact title matching


