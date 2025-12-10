-- Migration: Add isShared column to recipes table
-- This allows HTML-uploaded recipes to be shared with all users

-- Add the isShared column with default false
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN DEFAULT false;

-- Mark all existing recipes uploaded via URL/HTML as shared
-- This includes recipes with source 'url_import' or recipes that have a sourceUrl
UPDATE recipes 
SET "isShared" = true 
WHERE "source" = 'url_import' OR "sourceUrl" IS NOT NULL;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS "recipes_isShared_idx" ON recipes("isShared");



