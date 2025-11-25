-- Complete Postgres Schema Migration
-- This recreates all tables from MySQL schema + adds pgvector support
-- Run this on your new Postgres database with pgvector

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(255) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  "dietaryPreferences" TEXT,
  allergies TEXT,
  goals TEXT,
  "calorieBudget" INTEGER,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "lastSignedIn" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS users_openId_idx ON users("openId");

-- ============================================================================
-- INGREDIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100),
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS ingredients_name_idx ON ingredients(name);

-- ============================================================================
-- RECIPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "externalId" VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  "imageUrl" TEXT,
  cuisine VARCHAR(100),
  category VARCHAR(100),
  "cookingTime" INTEGER,
  servings INTEGER,
  "caloriesPerServing" INTEGER,
  "sourceUrl" TEXT,
  source VARCHAR(100) DEFAULT 'user_import',
  "isFavorite" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  -- New columns for recipe ingestion with embeddings
  recipe_id TEXT,
  yield_text TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  tags TEXT[],
  categories TEXT[],
  nutrition JSONB,
  ingredients JSONB,
  steps JSONB,
  html TEXT,
  embedding vector(1536) -- pgvector embedding for similarity search
);

CREATE INDEX IF NOT EXISTS recipes_userId_idx ON recipes("userId");
CREATE INDEX IF NOT EXISTS recipes_externalId_idx ON recipes("externalId");
CREATE INDEX IF NOT EXISTS recipes_cuisine_idx ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS recipes_category_idx ON recipes(category);
CREATE INDEX IF NOT EXISTS recipes_isFavorite_idx ON recipes("isFavorite");

-- ============================================================================
-- RECIPE INGREDIENTS JUNCTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id SERIAL PRIMARY KEY,
  "recipeId" INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  "ingredientId" INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity VARCHAR(100),
  unit VARCHAR(50),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS recipe_ingredients_recipeId_idx ON recipe_ingredients("recipeId");
CREATE INDEX IF NOT EXISTS recipe_ingredients_ingredientId_idx ON recipe_ingredients("ingredientId");

-- ============================================================================
-- USER INGREDIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_ingredients (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "ingredientId" INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity VARCHAR(100),
  unit VARCHAR(50),
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS user_ingredients_userId_idx ON user_ingredients("userId");
CREATE INDEX IF NOT EXISTS user_ingredients_ingredientId_idx ON user_ingredients("ingredientId");

-- ============================================================================
-- SHOPPING LISTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS shopping_lists_userId_idx ON shopping_lists("userId");

-- ============================================================================
-- SHOPPING LIST ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id SERIAL PRIMARY KEY,
  "shoppingListId" INTEGER NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  "ingredientId" INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity VARCHAR(100),
  unit VARCHAR(50),
  "isChecked" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS shopping_list_items_shoppingListId_idx ON shopping_list_items("shoppingListId");
CREATE INDEX IF NOT EXISTS shopping_list_items_ingredientId_idx ON shopping_list_items("ingredientId");

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  "isRead" BOOLEAN DEFAULT false,
  "actionUrl" TEXT,
  metadata TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_userId_idx ON notifications("userId");
CREATE INDEX IF NOT EXISTS notifications_isRead_idx ON notifications("isRead");
CREATE INDEX IF NOT EXISTS notifications_createdAt_idx ON notifications("createdAt");

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  "user1Id" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "user2Id" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "lastMessageAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS conversations_user1Id_idx ON conversations("user1Id");
CREATE INDEX IF NOT EXISTS conversations_user2Id_idx ON conversations("user2Id");
CREATE INDEX IF NOT EXISTS conversations_lastMessageAt_idx ON conversations("lastMessageAt");

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  "conversationId" INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  "senderId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS messages_conversationId_idx ON messages("conversationId");
CREATE INDEX IF NOT EXISTS messages_senderId_idx ON messages("senderId");
CREATE INDEX IF NOT EXISTS messages_createdAt_idx ON messages("createdAt");

-- ============================================================================
-- VECTOR INDEX (Create after importing some recipes)
-- ============================================================================
-- Uncomment and run after you have imported some recipes:
-- CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING ivfflat (embedding) WITH (lists = 100);
-- Or for better performance with smaller datasets:
-- CREATE INDEX IF NOT EXISTS recipes_embedding_idx ON recipes USING hnsw (embedding vector_cosine_ops);


