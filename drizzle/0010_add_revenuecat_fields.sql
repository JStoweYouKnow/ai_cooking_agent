-- Add RevenueCat fields to subscriptions table for iOS in-app purchases
-- This allows unified subscription management across Stripe (web/Android) and RevenueCat (iOS)

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "revenuecatAppUserId" VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "revenuecatOriginalAppUserId" VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "revenuecatProductId" VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "revenuecatOriginalTransactionId" VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "revenuecatPurchaseDate" TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "revenuecatExpirationDate" TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "revenuecatEnvironment" VARCHAR(20) DEFAULT 'production';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "subscriptionPlatform" VARCHAR(20) DEFAULT 'stripe';

-- Make stripeCustomerId nullable for RevenueCat-only subscriptions
ALTER TABLE subscriptions ALTER COLUMN "stripeCustomerId" DROP NOT NULL;

-- Add indexes for RevenueCat queries
CREATE INDEX IF NOT EXISTS "subscriptions_revenuecatAppUserId_idx" ON subscriptions("revenuecatAppUserId");
CREATE INDEX IF NOT EXISTS "subscriptions_subscriptionPlatform_idx" ON subscriptions("subscriptionPlatform");
CREATE INDEX IF NOT EXISTS "subscriptions_revenuecatOriginalTransactionId_idx" ON subscriptions("revenuecatOriginalTransactionId");
