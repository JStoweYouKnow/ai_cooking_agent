# Stripe Price IDs Configuration

This document contains the actual Stripe Product and Price IDs created for the AI Cooking Agent application.

## Products Created

| Product Name | Product ID | Description |
|-------------|------------|-------------|
| Sous Premium | `prod_TVvN6Fy81bQ0vN` | Unlimited recipes, AI assistant, and meal planning |
| Sous Family Plan | `prod_TVvN3pwOfurDTp` | Premium for up to 5 family members |
| Sous Lifetime Access | `prod_TVvNW8NVfEss3v` | One-time payment for lifetime access |

## Prices Created

| Price Name | Price ID | Product | Amount | Billing Period |
|------------|----------|---------|--------|----------------|
| Premium Monthly | `price_1SYtXR9rKYrAFwcoDAhBVLaC` | prod_TVvN6Fy81bQ0vN | $4.99 | Monthly |
| Premium Yearly | `price_1SYtXT9rKYrAFwcoAm0Er0cV` | prod_TVvN6Fy81bQ0vN | $49.99 | Yearly |
| Family Monthly | `price_1SYtXU9rKYrAFwcoaKcT8wHL` | prod_TVvN3pwOfurDTp | $9.99 | Monthly |
| Family Yearly | `price_1SYtXV9rKYrAFwcoCTS4LWkj` | prod_TVvN3pwOfurDTp | $99.99 | Yearly |
| Lifetime | `price_1SYtXF9rKYrAFwcoshbIFfKA` | prod_TVvNW8NVfEss3v | $149.99 | One-time |

## Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration (get secret keys from Stripe Dashboard)
STRIPE_SECRET_KEY=<your_secret_key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_publishable_key>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret>

# Stripe Product IDs
STRIPE_PRODUCT_PREMIUM=prod_TVvN6Fy81bQ0vN
STRIPE_PRODUCT_FAMILY=prod_TVvN3pwOfurDTp
STRIPE_PRODUCT_LIFETIME=prod_TVvNW8NVfEss3v

# Stripe Price IDs
STRIPE_PRICE_PREMIUM_MONTHLY=price_1SYtXR9rKYrAFwcoDAhBVLaC
STRIPE_PRICE_PREMIUM_YEARLY=price_1SYtXT9rKYrAFwcoAm0Er0cV
STRIPE_PRICE_FAMILY_MONTHLY=price_1SYtXU9rKYrAFwcoaKcT8wHL
STRIPE_PRICE_FAMILY_YEARLY=price_1SYtXV9rKYrAFwcoCTS4LWkj
STRIPE_PRICE_LIFETIME=price_1SYtXF9rKYrAFwcoshbIFfKA

# Default subscription price ID (Premium Monthly)
STRIPE_PRICE_ID=price_1SYtXR9rKYrAFwcoDAhBVLaC
```

## Usage in Code

### Server-side (TypeScript)

```typescript
import { STRIPE_PRICE_IDS, STRIPE_PRODUCTS_CONFIG } from "@shared/stripe-constants";
import { ENV } from "@server/_core/env";

// Use price ID from constants
const priceId = STRIPE_PRICE_IDS.PREMIUM_MONTHLY;

// Or use from environment
const priceId = ENV.stripePricePremiumMonthly;

// Get product config
const product = STRIPE_PRODUCTS_CONFIG.find(p => p.priceId === priceId);
```

### Client-side (TypeScript)

```typescript
import { STRIPE_PRICE_IDS } from "@shared/stripe-constants";

// Use in checkout
const { url } = await trpc.subscription.createCheckoutSession.mutate({
  priceId: STRIPE_PRICE_IDS.PREMIUM_MONTHLY,
});
```

## Mapping to Apple Product IDs

| Stripe Price ID | Apple Product ID | Tier |
|----------------|-----------------|------|
| `price_1SYtXR9rKYrAFwcoDAhBVLaC` | `com.aicookingagent.app.premium.monthly` | premium |
| `price_1SYtXT9rKYrAFwcoAm0Er0cV` | `com.aicookingagent.app.premium.yearly` | premium |
| `price_1SYtXU9rKYrAFwcoaKcT8wHL` | `com.aicookingagent.app.family.monthly` | family |
| `price_1SYtXV9rKYrAFwcoCTS4LWkj` | `com.aicookingagent.app.family.yearly` | family |
| `price_1SYtXF9rKYrAFwcoshbIFfKA` | `com.aicookingagent.app.lifetime` | lifetime |

## Notes

- All prices are in USD
- Prices are in **test mode** (livemode: false) - switch to live mode for production
- To switch to live mode, create new products/prices in Stripe Dashboard with live mode enabled
- Update environment variables with live mode price IDs before production deployment

## Verification

You can verify these products and prices in Stripe Dashboard:
- [Products](https://dashboard.stripe.com/test/products)
- [Prices](https://dashboard.stripe.com/test/prices)

Or using Stripe CLI:
```bash
stripe products list
stripe prices list
```



