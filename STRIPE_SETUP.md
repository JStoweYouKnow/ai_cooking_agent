# Stripe Monetization Setup Guide

This guide will help you set up Stripe payments for your AI Cooking Agent application.

## Prerequisites

✅ Stripe CLI is installed and authenticated (version 1.33.0 verified)

## Step 1: Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Stripe Configuration (get keys from Stripe Dashboard)
STRIPE_SECRET_KEY=<your_secret_key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_publishable_key>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret>

# Stripe Product IDs (created)
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

### Getting Your Stripe Keys

1. **Secret Key & Publishable Key:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Copy your "Secret key" → `STRIPE_SECRET_KEY`
   - Copy your "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

2. **Price ID:**
   - Go to [Stripe Products](https://dashboard.stripe.com/test/products)
   - Create a product and price (or use existing)
   - Copy the Price ID → `STRIPE_PRICE_ID`

3. **Webhook Secret:**
   - After setting up webhooks (Step 3), copy the webhook signing secret

## Step 2: Database Migration

Run the database migration to create subscription and payment tables:

```bash
# If using PostgreSQL directly
psql $DATABASE_URL -f drizzle/0008_add_stripe_subscriptions.sql

# Or use your migration tool
npm run db:migrate
```

## Step 3: Set Up Stripe Webhooks

### Local Development

1. **Start the Stripe CLI webhook listener:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **Copy the webhook signing secret** and add it to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
   ```

### Production

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your production URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and add it to your production environment variables

## Step 4: Test the Integration

### Test Checkout Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Use the tRPC subscription router:
   ```typescript
   // Create checkout session
   const { sessionId, url } = await trpc.subscription.createCheckoutSession.mutate({
     priceId: 'price_...', // Optional, uses default from env if not provided
   });
   
   // Redirect user to url
   window.location.href = url;
   ```

3. Test with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Use any future expiry date and any CVC

### Test Webhook Events

Use Stripe CLI to trigger test events:

```bash
# Simulate checkout completion
stripe trigger checkout.session.completed

# Simulate subscription update
stripe trigger customer.subscription.updated

# Simulate payment success
stripe trigger invoice.payment_succeeded
```

## Step 5: Frontend Integration

The subscription router is available via tRPC:

```typescript
// Check subscription status
const subscription = await trpc.subscription.get.query();

// Check if user has active subscription
const hasActive = await trpc.subscription.hasActive.query();

// Create checkout session
const { url } = await trpc.subscription.createCheckoutSession.mutate();

// Open customer portal
const { url } = await trpc.subscription.createCustomerPortalSession.mutate();

// Get payment history
const payments = await trpc.subscription.getPayments.query({ limit: 10 });
```

## API Routes

The following API routes are available:

- `POST /api/stripe/create-checkout-session` - Create a Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhook events
- `POST /api/stripe/customer-portal` - Create customer portal session

## Database Schema

### Subscriptions Table
- `id` - Primary key
- `userId` - Foreign key to users table
- `stripeCustomerId` - Stripe customer ID (unique)
- `stripeSubscriptionId` - Stripe subscription ID (unique)
- `stripePriceId` - Stripe price ID
- `status` - Subscription status enum
- `currentPeriodStart` - Current billing period start
- `currentPeriodEnd` - Current billing period end
- `cancelAtPeriodEnd` - Whether to cancel at period end
- `canceledAt` - Cancellation timestamp
- `trialStart` - Trial period start
- `trialEnd` - Trial period end

### Payments Table
- `id` - Primary key
- `userId` - Foreign key to users table
- `stripePaymentIntentId` - Stripe payment intent ID (unique)
- `stripeChargeId` - Stripe charge ID
- `amount` - Payment amount in cents
- `currency` - Currency code (default: 'usd')
- `status` - Payment status
- `description` - Payment description
- `metadata` - Additional metadata (JSONB)

## Security Notes

1. **Never expose secret keys** - Only use `STRIPE_SECRET_KEY` on the server
2. **Always verify webhooks** - The webhook handler verifies signatures
3. **Use HTTPS in production** - Required for Stripe webhooks
4. **Validate user authentication** - All subscription endpoints require authentication

## Troubleshooting

### Webhook signature verification fails
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- For local development, use the secret from `stripe listen`
- For production, use the secret from Stripe Dashboard

### Checkout session creation fails
- Verify `STRIPE_SECRET_KEY` is set
- Check that the price ID exists in Stripe
- Ensure user is authenticated

### Subscription not updating after payment
- Check webhook logs in Stripe Dashboard
- Verify webhook endpoint is accessible
- Check server logs for webhook processing errors

## Next Steps

1. Create subscription plans in Stripe Dashboard
2. Build frontend UI for subscription management
3. Implement feature gating based on subscription status
4. Set up email notifications for subscription events
5. Add analytics tracking for subscription metrics

