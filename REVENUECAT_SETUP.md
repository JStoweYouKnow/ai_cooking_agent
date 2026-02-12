# RevenueCat Setup Guide

## Entitlements

Create the following entitlements in the RevenueCat dashboard:

| Entitlement ID | Description |
|----------------|-------------|
| `premium` | Access to premium features (single user) |
| `family` | Access to family plan features (multiple users) |

## Products

Create these products in App Store Connect, then link them in RevenueCat:

| Product ID | Type | Price | Entitlement |
|------------|------|-------|-------------|
| `com.aicookingagent.app.premium.monthly` | Auto-renewable subscription | $4.99/mo | `premium` |
| `com.aicookingagent.app.premium.yearly` | Auto-renewable subscription | $49.99/yr | `premium` |
| `com.aicookingagent.app.family.monthly` | Auto-renewable subscription | $9.99/mo | `family` |
| `com.aicookingagent.app.family.yearly` | Auto-renewable subscription | $99.99/yr | `family` |
| `com.aicookingagent.app.lifetime` | Non-consumable | $149.99 | `premium` |

## Offering Configuration

Create a default offering with the following packages:

| Package | Product |
|---------|---------|
| `$rc_monthly` | `com.aicookingagent.app.premium.monthly` |
| `$rc_annual` | `com.aicookingagent.app.premium.yearly` |
| `family_monthly` | `com.aicookingagent.app.family.monthly` |
| `family_annual` | `com.aicookingagent.app.family.yearly` |
| `lifetime` | `com.aicookingagent.app.lifetime` |

## Webhook Configuration

1. Go to **Project Settings > Integrations > Webhooks**
2. Add a new webhook with:
   - **URL**: `https://sous.projcomfort.com/api/revenuecat/webhook`
   - **Authorization Header**: Set a secure secret value
3. Enable the following events:
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `CANCELLATION`
   - `UNCANCELLATION`
   - `NON_RENEWING_PURCHASE`
   - `SUBSCRIPTION_PAUSED`
   - `EXPIRATION`
   - `BILLING_ISSUE`
   - `PRODUCT_CHANGE`
   - `TRANSFER`

## Environment Variables

Add these to your environment:

```bash
# RevenueCat iOS API Key (from Project Settings > API Keys)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxx

# Webhook Authorization Secret (the value you set in webhook config)
REVENUECAT_WEBHOOK_SECRET=your_webhook_secret_here
```

## App Store Connect Setup

1. **Create Subscription Group**: "Sous Premium"
2. **Add Products**: Create each subscription product listed above
3. **Set Prices**: Configure pricing for each territory
4. **Add Descriptions**: Localized names and descriptions
5. **Review Information**: Screenshots and review notes

## Testing

### Sandbox Testing
1. Create a Sandbox Apple ID in App Store Connect
2. Sign out of the App Store on your test device
3. Sign in with the Sandbox account when prompted during purchase
4. Use RevenueCat's sandbox environment for testing

### StoreKit Configuration (Xcode)
1. Create a StoreKit Configuration file in Xcode
2. Add your products for local testing
3. Enable StoreKit Testing in your scheme

## Checklist

- [ ] Create `premium` entitlement in RevenueCat
- [ ] Create `family` entitlement in RevenueCat
- [ ] Create all 5 products in App Store Connect
- [ ] Link products to RevenueCat
- [ ] Configure offering with all packages
- [ ] Set up webhook with correct URL and secret
- [ ] Add `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` to app.json
- [ ] Add `REVENUECAT_WEBHOOK_SECRET` to server environment
- [ ] Run database migration: `drizzle/0010_add_revenuecat_fields.sql`
- [ ] Test sandbox purchase flow
- [ ] Test restore purchases
- [ ] Verify webhook events are received
