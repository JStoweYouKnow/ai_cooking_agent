# Product IDs & Price IDs Setup Guide

Complete reference for setting up Apple In-App Purchases and Stripe pricing.

---

## 🍎 Apple In-App Purchase Product IDs

Apple Product IDs must follow reverse-domain notation and be **unique across the entire App Store**.

### Naming Convention

Format: `com.aicookingagent.app.{tier}.{billing_period}`

### Product IDs to Create

```
# Monthly Subscriptions
com.aicookingagent.app.premium.monthly
com.aicookingagent.app.family.monthly

# Annual Subscriptions
com.aicookingagent.app.premium.yearly
com.aicookingagent.app.family.yearly

# Lifetime Purchase (Non-Consumable)
com.aicookingagent.app.lifetime

# Introductory/Launch Pricing (Optional - use subscription offers instead)
# These are handled via "Introductory Offers" in App Store Connect, not separate product IDs
```

---

## 📋 Apple Product Configuration Table

| Product ID | Type | Display Name | Price | Billing Period |
|------------|------|--------------|-------|----------------|
| `com.aicookingagent.app.premium.monthly` | Auto-Renewable Subscription | Premium Chef - Monthly | $4.99 | 1 Month |
| `com.aicookingagent.app.premium.yearly` | Auto-Renewable Subscription | Premium Chef - Annual | $49.99 | 1 Year |
| `com.aicookingagent.app.family.monthly` | Auto-Renewable Subscription | Family Kitchen Master - Monthly | $9.99 | 1 Month |
| `com.aicookingagent.app.family.yearly` | Auto-Renewable Subscription | Family Kitchen Master - Annual | $99.99 | 1 Year |
| `com.aicookingagent.app.lifetime` | Non-Consumable | Culinary Legend Lifetime | $149.99 | N/A |

---

## 🎁 Introductory Offers (Launch Pricing)

Instead of creating separate product IDs for launch pricing, use **Subscription Offers** in App Store Connect:

### Premium Monthly - Introductory Offer
- **Product ID:** `com.aicookingagent.app.premium.monthly`
- **Offer Type:** Introductory Offer
- **Offer Code:** `FOUNDING_MEMBER`
- **Duration:** First 3 months
- **Price:** $2.99/month
- **Then:** $4.99/month automatically

### Premium Annual - Introductory Offer
- **Product ID:** `com.aicookingagent.app.premium.yearly`
- **Offer Type:** Introductory Offer
- **Offer Code:** `FOUNDING_YEAR`
- **Duration:** First year
- **Price:** $29.99/year
- **Then:** $49.99/year at renewal

---

## 💳 Stripe Price IDs (Web/Direct Sales)

If you're also selling via Stripe (web app), create corresponding Price IDs.

### Naming Convention

Format: `price_{product}_{tier}_{billing_period}_{currency}`

### Stripe Product Structure

```
# First, create Products in Stripe Dashboard:
prod_sous_premium
prod_sous_family
prod_sous_lifetime

# Then, create Prices for each Product:
```

### Stripe Price IDs

```
# Premium Monthly
price_premium_monthly_usd
  Product: prod_sous_premium
  Price: $4.99
  Billing: Monthly recurring
  Currency: USD

# Premium Annual
price_premium_yearly_usd
  Product: prod_sous_premium
  Price: $49.99
  Billing: Yearly recurring
  Currency: USD

# Family Monthly
price_family_monthly_usd
  Product: prod_sous_family
  Price: $9.99
  Billing: Monthly recurring
  Currency: USD

# Family Annual
price_family_yearly_usd
  Product: prod_sous_family
  Price: $99.99
  Billing: Yearly recurring
  Currency: USD

# Lifetime
price_lifetime_onetime_usd
  Product: prod_sous_lifetime
  Price: $149.99
  Billing: One-time
  Currency: USD

# Introductory Prices (Coupons or Limited-Time Prices)
price_premium_monthly_intro_usd
  Product: prod_sous_premium
  Price: $2.99
  Billing: Monthly recurring
  Currency: USD
  Metadata: { "offer": "founding_member", "expires": "2025-03-31" }
```

---

## 🔧 Implementation in Code

### Constants File

Create `mobile/src/constants/subscriptions.ts`:

```typescript
// Apple In-App Purchase Product IDs
export const APPLE_PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.aicookingagent.app.premium.monthly',
  PREMIUM_YEARLY: 'com.aicookingagent.app.premium.yearly',
  FAMILY_MONTHLY: 'com.aicookingagent.app.family.monthly',
  FAMILY_YEARLY: 'com.aicookingagent.app.family.yearly',
  LIFETIME: 'com.aicookingagent.app.lifetime',
} as const;

// Stripe Price IDs (for web)
export const STRIPE_PRICE_IDS = {
  PREMIUM_MONTHLY: 'price_premium_monthly_usd',
  PREMIUM_YEARLY: 'price_premium_yearly_usd',
  FAMILY_MONTHLY: 'price_family_monthly_usd',
  FAMILY_YEARLY: 'price_family_yearly_usd',
  LIFETIME: 'price_lifetime_onetime_usd',

  // Introductory pricing
  PREMIUM_MONTHLY_INTRO: 'price_premium_monthly_intro_usd',
  PREMIUM_YEARLY_INTRO: 'price_premium_yearly_intro_usd',
} as const;

// Subscription tier mapping
export type SubscriptionTier = 'free' | 'premium' | 'family' | 'lifetime';

export interface SubscriptionProduct {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'lifetime';
  description: string;
  features: string[];
  isPopular?: boolean;
}

export const SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  {
    id: APPLE_PRODUCT_IDS.PREMIUM_MONTHLY,
    tier: 'premium',
    name: 'Premium Chef',
    price: 4.99,
    billingPeriod: 'monthly',
    description: 'Unlimited recipes, AI assistant, and meal planning',
    features: [
      'Unlimited recipes & collections',
      'Unlimited AI assistance',
      '7-day meal planning',
      'Nutrition analysis',
      'Recipe scaling & sharing',
      'PDF export',
      'Priority support',
    ],
    isPopular: true,
  },
  {
    id: APPLE_PRODUCT_IDS.PREMIUM_YEARLY,
    tier: 'premium',
    name: 'Premium Chef Annual',
    price: 49.99,
    billingPeriod: 'yearly',
    description: 'Save 17% with annual billing',
    features: [
      'Everything in Monthly',
      'Save $10/year',
      'Lock in your rate',
    ],
  },
  {
    id: APPLE_PRODUCT_IDS.FAMILY_MONTHLY,
    tier: 'family',
    name: 'Family Kitchen Master',
    price: 9.99,
    billingPeriod: 'monthly',
    description: 'Premium for up to 5 family members',
    features: [
      'Everything in Premium',
      'Up to 5 family members',
      'Shared recipe collections',
      'Collaborative shopping lists',
      'Multiple pantries',
      'Family meal planning',
    ],
  },
  {
    id: APPLE_PRODUCT_IDS.FAMILY_YEARLY,
    tier: 'family',
    name: 'Family Annual',
    price: 99.99,
    billingPeriod: 'yearly',
    description: 'Save 17% with annual billing',
    features: [
      'Everything in Family Monthly',
      'Save $20/year',
    ],
  },
  {
    id: APPLE_PRODUCT_IDS.LIFETIME,
    tier: 'lifetime',
    name: 'Culinary Legend',
    price: 149.99,
    billingPeriod: 'lifetime',
    description: 'Pay once, cook forever',
    features: [
      'All Premium features',
      'Lifetime access',
      'All future updates',
      'VIP support',
      'Early access to new features',
      'No recurring charges',
    ],
  },
];
```

---

## 🏗️ Step-by-Step Setup

### A. Apple App Store Connect Setup

#### 1. Create Subscription Group

1. Go to https://appstoreconnect.apple.com/
2. **My Apps** → Select your app → **Subscriptions**
3. Click **+** to create **Subscription Group**
4. **Reference Name:** "Sous Premium Subscriptions"
5. **Group Name (visible to users):** "Sous Premium"

#### 2. Create Each Subscription

**For Premium Monthly:**

1. Click **+** in your subscription group
2. **Reference Name:** "Premium Chef Monthly"
3. **Product ID:** `com.aicookingagent.app.premium.monthly`
4. **Subscription Duration:** 1 Month
5. Click **Create**

6. **Subscription Prices:**
   - Click **+** next to Subscription Prices
   - **Territory:** United States (or select all)
   - **Price:** $4.99 USD
   - Click **Add**

7. **Subscription Localizations:**
   - **Display Name:** Premium Chef
   - **Description:** Unlimited recipes, AI assistant, and smart meal planning

8. **Review Information:**
   - Upload screenshot showing premium features
   - Provide review notes

**Repeat for all other subscriptions**

#### 3. Create Introductory Offers

For each subscription:

1. Click the subscription
2. Scroll to **Introductory Offers**
3. Click **Set Up Introductory Offers**
4. **Offer Type:** Pay As You Go
5. **Duration:** 3 months (for monthly) or 1 year (for yearly)
6. **Price:** $2.99 (monthly) or $29.99 (yearly)
7. **Number of Periods:** 3 or 1
8. **Territories:** United States (or all)
9. Click **Create**

#### 4. Create Lifetime (Non-Consumable)

1. **My Apps** → Select your app → **In-App Purchases**
2. Click **+** to create new
3. **Type:** Non-Consumable
4. **Reference Name:** "Culinary Legend Lifetime"
5. **Product ID:** `com.aicookingagent.app.lifetime`
6. **Price:** $149.99
7. Click **Create**
8. Add localization and screenshot

---

### B. Stripe Setup (Optional - for Web)

#### 1. Create Products

1. Go to https://dashboard.stripe.com/products
2. Click **+ Add product**

**Premium Product:**
```
Name: Sous Premium
Description: Unlimited recipes, AI assistant, and meal planning
Statement Descriptor: SOUS PREMIUM
```

**Family Product:**
```
Name: Sous Family Plan
Description: Premium for up to 5 family members
Statement Descriptor: SOUS FAMILY
```

**Lifetime Product:**
```
Name: Sous Lifetime Access
Description: One-time payment for lifetime access
Statement Descriptor: SOUS LIFETIME
```

#### 2. Create Prices

For each product, click **Add price**:

**Premium Monthly:**
```
Pricing Model: Standard pricing
Price: $4.99 USD
Billing period: Monthly
Price description: Premium Monthly
```

Copy the Price ID (starts with `price_`) and save it.

**Repeat for all pricing tiers**

#### 3. Save Price IDs

Update your `.env` file:

```bash
# Stripe Price IDs
STRIPE_PRICE_PREMIUM_MONTHLY=price_1234567890abcdef
STRIPE_PRICE_PREMIUM_YEARLY=price_0987654321zyxwvu
STRIPE_PRICE_FAMILY_MONTHLY=price_abcdef1234567890
STRIPE_PRICE_FAMILY_YEARLY=price_zyxwvu0987654321
STRIPE_PRICE_LIFETIME=price_qwertyuiopasdfgh
```

---

## 🧪 Testing

### Test Product IDs (Sandbox)

For testing in development, Apple uses the **same Product IDs** but in Sandbox mode:

1. Create a Sandbox Tester account in App Store Connect
2. Sign in with Sandbox account on iOS device
3. Test purchases use the same Product IDs
4. No real money is charged

**Sandbox Apple ID:**
- Go to App Store Connect → **Users and Access** → **Sandbox Testers**
- Create test accounts (e.g., `test@yourdomain.com`)

### Stripe Test Mode

Stripe automatically provides test mode:

```bash
# Use Test Price IDs (start with price_test_...)
STRIPE_TEST_PRICE_PREMIUM_MONTHLY=price_test_1234567890
```

---

## 📊 Product ID Mapping Table

Use this for your backend database:

| Internal Tier | Apple Product ID | Stripe Price ID | Display Name | Price |
|---------------|------------------|-----------------|--------------|-------|
| `premium_monthly` | `com.aicookingagent.app.premium.monthly` | `price_premium_monthly_usd` | Premium Chef | $4.99/mo |
| `premium_yearly` | `com.aicookingagent.app.premium.yearly` | `price_premium_yearly_usd` | Premium Chef Annual | $49.99/yr |
| `family_monthly` | `com.aicookingagent.app.family.monthly` | `price_family_monthly_usd` | Family Plan | $9.99/mo |
| `family_yearly` | `com.aicookingagent.app.family.yearly` | `price_family_yearly_usd` | Family Plan Annual | $99.99/yr |
| `lifetime` | `com.aicookingagent.app.lifetime` | `price_lifetime_onetime_usd` | Lifetime Access | $149.99 |

---

## 🗄️ Database Schema

Store subscriptions in your database:

```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  tier VARCHAR(20) NOT NULL, -- 'free', 'premium', 'family', 'lifetime'
  platform VARCHAR(10) NOT NULL, -- 'apple' or 'stripe'
  product_id VARCHAR(100) NOT NULL, -- Apple or Stripe product ID
  price_id VARCHAR(100), -- Stripe price ID (null for Apple)
  status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'expired'
  started_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP, -- NULL for lifetime
  canceled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

---

## 🔐 Environment Variables

Add to your `.env` files:

### Mobile App (.env)
```bash
# Apple IAP Product IDs (same for dev and prod)
APPLE_PREMIUM_MONTHLY=com.aicookingagent.app.premium.monthly
APPLE_PREMIUM_YEARLY=com.aicookingagent.app.premium.yearly
APPLE_FAMILY_MONTHLY=com.aicookingagent.app.family.monthly
APPLE_FAMILY_YEARLY=com.aicookingagent.app.family.yearly
APPLE_LIFETIME=com.aicookingagent.app.lifetime
```

### Server (.env)
```bash
# Stripe Price IDs (Production)
STRIPE_PRICE_PREMIUM_MONTHLY=price_XXXXXXXXXXXXXXXX
STRIPE_PRICE_PREMIUM_YEARLY=price_YYYYYYYYYYYYYYYY
STRIPE_PRICE_FAMILY_MONTHLY=price_ZZZZZZZZZZZZZZZZ
STRIPE_PRICE_FAMILY_YEARLY=price_AAAAAAAAAAAAAAAA
STRIPE_PRICE_LIFETIME=price_BBBBBBBBBBBBBBBB

# Stripe Test Price IDs (Development)
STRIPE_TEST_PRICE_PREMIUM_MONTHLY=price_test_XXXXXXXX
STRIPE_TEST_PRICE_PREMIUM_YEARLY=price_test_YYYYYYYY
```

---

## ✅ Checklist

Before launching:

- [ ] All Apple Product IDs created in App Store Connect
- [ ] Subscription Group created and configured
- [ ] Introductory Offers set up (if using)
- [ ] Screenshots uploaded for each product
- [ ] Products submitted for review
- [ ] Stripe Products and Prices created (if using)
- [ ] Price IDs saved in environment variables
- [ ] Product IDs added to mobile constants file
- [ ] Database schema created
- [ ] Testing completed with Sandbox account
- [ ] Revenue Cat or purchase library integrated

---

## 📚 Helpful Resources

- **Apple IAP Docs:** https://developer.apple.com/in-app-purchase/
- **App Store Connect:** https://appstoreconnect.apple.com/
- **Stripe Products:** https://stripe.com/docs/products-prices/overview
- **RevenueCat (IAP Helper):** https://www.revenuecat.com/

---

**Next Steps:**
1. Create Apple Product IDs in App Store Connect
2. Copy Price IDs into constants file
3. Set up Stripe products (if using web)
4. Implement IAP logic in app
5. Test with Sandbox account

Need help with the implementation? Let me know!
