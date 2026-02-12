export const ENV = {
  appId: process.env.APP_ID ?? process.env.NEXT_PUBLIC_APP_ID ?? process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  /** Comma-separated openIds that get premium (dev + hackathon judges). Also owner gets premium. */
  premiumOpenIds: (process.env.HACKATHON_PREMIUM_OPEN_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Google Gemini (primary AI for the app)
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3-flash-preview",
  geminiProModel: process.env.GEMINI_PRO_MODEL ?? "gemini-3-pro-preview",
  // AWS S3 for image uploads
  awsRegion: process.env.AWS_REGION ?? "us-east-2",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  s3Bucket: process.env.S3_BUCKET ?? "",
  // AWS STS for temporary credentials (optional, for IAM role assumption)
  awsRoleArn: process.env.AWS_ROLE_ARN ?? "",
  awsRoleSessionName: process.env.AWS_ROLE_SESSION_NAME ?? "cooking-app-session",
  // NYT Cooking API (optional)
  nytApiKey: process.env.NYT_COOKING_API_KEY ?? "",
  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceId: process.env.STRIPE_PRICE_ID ?? "", // Default subscription price ID
  // Stripe Product IDs
  stripeProductPremium: process.env.STRIPE_PRODUCT_PREMIUM ?? "prod_TVvN6Fy81bQ0vN",
  stripeProductFamily: process.env.STRIPE_PRODUCT_FAMILY ?? "prod_TVvN3pwOfurDTp",
  stripeProductLifetime: process.env.STRIPE_PRODUCT_LIFETIME ?? "prod_TVvNW8NVfEss3v",
  // Stripe Price IDs
  stripePricePremiumMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? "price_1SYtXR9rKYrAFwcoDAhBVLaC",
  stripePricePremiumYearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY ?? "price_1SYtXT9rKYrAFwcoAm0Er0cV",
  stripePriceFamilyMonthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? "price_1SYtXU9rKYrAFwcoaKcT8wHL",
  stripePriceFamilyYearly: process.env.STRIPE_PRICE_FAMILY_YEARLY ?? "price_1SYtXV9rKYrAFwcoCTS4LWkj",
  stripePriceLifetime: process.env.STRIPE_PRICE_LIFETIME ?? "price_1SYtXF9rKYrAFwcoshbIFfKA",
  // RevenueCat (iOS In-App Purchases)
  revenuecatWebhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET ?? "",
  /** Optional secret for cron endpoints (e.g. cook-nudge). If set, requests must send Authorization: Bearer <CRON_SECRET>. */
  cronSecret: process.env.CRON_SECRET ?? "",
};
