-- Postgres + pgvector Migration
-- Run this migration on your Postgres database (e.g., Railway)
-- This adds pgvector support and new columns to the recipes table

-- Enable pgvector extension (requires extension available on Railway)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add columns we use for recipe ingestion with embeddings
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS recipe_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS yield_text TEXT,
  ADD COLUMN IF NOT EXISTS prep_time_minutes INT,
  ADD COLUMN IF NOT EXISTS cook_time_minutes INT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS categories TEXT[],
  ADD COLUMN IF NOT EXISTS nutrition JSONB,
  ADD COLUMN IF NOT EXISTS ingredients JSONB,
  ADD COLUMN IF NOT EXISTS steps JSONB,
  ADD COLUMN IF NOT EXISTS html TEXT,
  ADD COLUMN IF NOT EXISTS embedding vector(1536); -- embedding dim for text-embedding-3-small

-- Optional: index to speed up vector search (Approx index)
-- Note: IVFFlat index requires at least some data. You may want to create this after importing recipes.
-- CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING ivfflat (embedding) WITH (lists = 100);

-- For better performance with smaller datasets, you can use HNSW index instead:
-- CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING hnsw (embedding vector_cosine_ops);

