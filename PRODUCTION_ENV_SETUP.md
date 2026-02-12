# Production Environment Variables Setup

## Required Environment Variables

### 1. Stripe Configuration (Server-side)

Add these to your **production server** `.env` or hosting platform environment variables:

```bash
# Stripe Secret Keys (NEVER commit these! Get from Stripe Dashboard)
STRIPE_SECRET_KEY=<your_secret_key>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret>

# Stripe Product IDs
STRIPE_PRODUCT_PREMIUM=prod_TVvN6Fy81bQ0vN
STRIPE_PRODUCT_FAMILY=prod_TVvN3pwOfurDTp
STRIPE_PRODUCT_LIFETIME=prod_TVvNW8NVfEss3v

# Stripe Price IDs (Server)
STRIPE_PRICE_PREMIUM_MONTHLY=price_1SYt8X9rKYrAFwcotPFaGxgp
STRIPE_PRICE_PREMIUM_YEARLY=price_1SYt8X9rKYrAFwcoQtRChJ0g
STRIPE_PRICE_FAMILY_MONTHLY=price_1SYt9w9rKYrAFwcoDlHOLLei
STRIPE_PRICE_FAMILY_YEARLY=price_1SYtAV9rKYrAFwcoT6L357s7
STRIPE_PRICE_LIFETIME=price_1SYtD69rKYrAFwco852cG76b

# Default subscription price ID
STRIPE_PRICE_ID=price_1SYt8X9rKYrAFwcotPFaGxgp
```

### 2. Stripe Configuration (Client-side - Mobile App)

Add these to your **mobile app** `.env` (for Expo builds):

```bash
# Stripe Publishable Key (Safe for client-side - get from Stripe Dashboard)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_publishable_key>

# Stripe Price IDs (Client-side accessible)
EXPO_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY=price_1SYt8X9rKYrAFwcotPFaGxgp
EXPO_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY=price_1SYt8X9rKYrAFwcoQtRChJ0g
EXPO_PUBLIC_STRIPE_PRICE_FAMILY_MONTHLY=price_1SYt9w9rKYrAFwcoDlHOLLei
EXPO_PUBLIC_STRIPE_PRICE_FAMILY_YEARLY=price_1SYtAV9rKYrAFwcoT6L357s7
EXPO_PUBLIC_STRIPE_PRICE_LIFETIME=price_1SYtD69rKYrAFwco852cG76b
```

## GitHub Actions CI/CD Secrets

### Setting up secrets in GitHub:

1. Go to your repository: `https://github.com/JStoweYouKnow/ai_cooking_agent`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of these:

#### Server Secrets (for production deployment)

```
Name: STRIPE_SECRET_KEY
Value: (get from Stripe Dashboard → Developers → API keys)

Name: STRIPE_WEBHOOK_SECRET
Value: (get from Stripe Dashboard → Developers → Webhooks → select endpoint → Reveal)

Name: STRIPE_PRICE_PREMIUM_MONTHLY
Value: price_1SYt8X9rKYrAFwcotPFaGxgp

Name: STRIPE_PRICE_PREMIUM_YEARLY
Value: price_1SYt8X9rKYrAFwcoQtRChJ0g

Name: STRIPE_PRICE_FAMILY_MONTHLY
Value: price_1SYt9w9rKYrAFwcoDlHOLLei

Name: STRIPE_PRICE_FAMILY_YEARLY
Value: price_1SYtAV9rKYrAFwcoT6L357s7

Name: STRIPE_PRICE_LIFETIME
Value: price_1SYtD69rKYrAFwco852cG76b
```

## Vercel/Railway/Other Hosting Platforms

### For Vercel:

1. Go to your project dashboard
2. Settings → Environment Variables
3. Add each variable above
4. Select "Production" environment
5. Save and redeploy

### For Railway:

1. Select your project
2. Variables tab
3. Add each variable
4. Deploy will automatically restart

## AWS Secrets Manager (if using)

```bash
# Create secrets
aws secretsmanager create-secret \
  --name sous-stripe-secret-key \
  --secret-string "<YOUR_STRIPE_SECRET_KEY>"

aws secretsmanager create-secret \
  --name sous-stripe-webhook-secret \
  --secret-string "<YOUR_STRIPE_WEBHOOK_SECRET>"
```

## Validation

### Test that secrets are loaded correctly:

```bash
# On your production server
node -e "console.log('Stripe Secret:', process.env.STRIPE_SECRET_KEY ? '✓ Set' : '✗ Missing')"
node -e "console.log('Webhook Secret:', process.env.STRIPE_WEBHOOK_SECRET ? '✓ Set' : '✗ Missing')"
```

### Verify Stripe connection:

```bash
# Test Stripe API connection
curl https://api.stripe.com/v1/prices/price_1SYt8X9rKYrAFwcotPFaGxgp \
  -u <YOUR_STRIPE_SECRET_KEY>:
```

## Security Checklist

- [ ] Never commit `.env` files with real secrets
- [ ] Add `.env` to `.gitignore`
- [ ] Use different keys for test/production
- [ ] Rotate webhook secrets periodically
- [ ] Enable GitHub secret scanning
- [ ] Use Stripe test mode for development
- [ ] Verify all secrets are marked as "secret" in CI/CD
- [ ] Test subscription flow in production after deployment

## Troubleshooting

**If subscriptions aren't working:**
1. Check Stripe Dashboard for errors
2. Verify webhook is receiving events
3. Check server logs for Stripe API errors
4. Confirm price IDs match between env vars and Stripe Dashboard
5. Ensure webhook secret matches Stripe webhook configuration

**If webhooks fail:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Verify endpoint URL: `https://sous.projcomfort.com/api/stripe/webhook`
3. Check webhook secret matches `STRIPE_WEBHOOK_SECRET`
4. Review failed webhook events in Stripe Dashboard
