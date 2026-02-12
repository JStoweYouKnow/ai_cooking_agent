-- Push tokens for Expo push notifications
-- Stores device tokens for sending push notifications to users

CREATE TABLE IF NOT EXISTS "push_tokens" (
  "id" INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" VARCHAR(255) NOT NULL,
  "platform" VARCHAR(20) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "push_tokens_token_idx" ON "push_tokens" ("token");
CREATE INDEX IF NOT EXISTS "push_tokens_user_idx" ON "push_tokens" ("userId");
