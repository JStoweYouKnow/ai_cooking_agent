-- Add subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'trialing',
  'unpaid',
  'paused'
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "stripeCustomerId" VARCHAR(255) NOT NULL UNIQUE,
  "stripeSubscriptionId" VARCHAR(255) UNIQUE,
  "stripePriceId" VARCHAR(255),
  status subscription_status NOT NULL DEFAULT 'incomplete',
  "currentPeriodStart" TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP,
  "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
  "canceledAt" TIMESTAMP,
  "trialStart" TIMESTAMP,
  "trialEnd" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS subscriptions_userId_idx ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS subscriptions_stripeCustomerId_idx ON subscriptions("stripeCustomerId");
CREATE INDEX IF NOT EXISTS subscriptions_stripeSubscriptionId_idx ON subscriptions("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "stripePaymentIntentId" VARCHAR(255) UNIQUE,
  "stripeChargeId" VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd' NOT NULL,
  status VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS payments_userId_idx ON payments("userId");
CREATE INDEX IF NOT EXISTS payments_stripePaymentIntentId_idx ON payments("stripePaymentIntentId");
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_createdAt_idx ON payments("createdAt");



