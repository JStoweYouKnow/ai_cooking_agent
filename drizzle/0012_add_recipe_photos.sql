-- Recipe Photo Journal for "I Made This!" feature
-- Allows users to save photos of recipes they've cooked

CREATE TABLE IF NOT EXISTS "recipe_photos" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "recipeId" INTEGER NOT NULL REFERENCES "recipes"("id") ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "imageUrl" TEXT NOT NULL,
  "caption" TEXT,
  "rating" INTEGER CHECK ("rating" >= 1 AND "rating" <= 5),
  "notes" TEXT,
  "cookedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "recipe_photos_recipeId_idx" ON "recipe_photos" ("recipeId");
CREATE INDEX IF NOT EXISTS "recipe_photos_userId_idx" ON "recipe_photos" ("userId");
CREATE INDEX IF NOT EXISTS "recipe_photos_cookedAt_idx" ON "recipe_photos" ("cookedAt");
