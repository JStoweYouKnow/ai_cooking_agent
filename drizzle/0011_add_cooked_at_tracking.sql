-- Add cookedAt tracking to recipes table
-- This tracks when a user has marked a recipe as "cooked"

ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "cookedAt" TIMESTAMP;
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "cookedCount" INTEGER DEFAULT 0;

-- Create index for querying recently cooked recipes
CREATE INDEX IF NOT EXISTS "recipes_cookedAt_idx" ON "recipes" ("cookedAt");
