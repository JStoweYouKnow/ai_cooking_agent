# Subdomain Configuration Summary

Your production subdomain `https://sous.projcomfort.com` has been configured throughout the codebase.

---

## ✅ Files Updated

### 1. Mobile App Configuration

**[mobile/app.json](mobile/app.json)**
- Added `EXPO_PUBLIC_API_URL` to `extra` section
- Value: `https://sous.projcomfort.com`

**[mobile/src/api/client.ts](mobile/src/api/client.ts)**
- Updated production URL fallback (line 24)
- Changed from: `"https://your-production-url.com"`
- Changed to: `"https://sous.projcomfort.com"`

### 2. Environment Variables

**[.env.local](.env.local)**
Added production configuration:
```env
# Production API URL
EXPO_PUBLIC_API_URL=https://sous.projcomfort.com
NEXT_PUBLIC_API_URL=https://sous.projcomfort.com

# OAuth Configuration
OAUTH_REDIRECT_URI=https://sous.projcomfort.com/api/oauth/callback
```

### 3. Documentation Files

**[mobile/README.md](mobile/README.md)**
- Updated production URL example (line 66)
- Updated environment variables section (line 241)

**[mobile/OAUTH_SETUP.md](mobile/OAUTH_SETUP.md)**
- Updated API URL example (line 14)

---

## 🔧 How It Works

### Development vs Production

The app automatically switches between development and production URLs:

```typescript
// Development (when __DEV__ is true)
http://192.168.1.94:3000  // or localhost

// Production (when __DEV__ is false)
https://sous.projcomfort.com
```

### Mobile App URL Priority

The mobile app checks URLs in this order:
1. `process.env.EXPO_PUBLIC_API_URL` (from app.json extra section)
2. Fallback to `https://sous.projcomfort.com`

### Web App URL Priority

The web app uses:
1. `process.env.NEXT_PUBLIC_API_URL`
2. Relative URLs for same-origin requests

---

## 🌐 API Endpoints

All these endpoints are now available at your subdomain:

### Authentication
- `POST https://sous.projcomfort.com/api/oauth/callback`
- `GET https://sous.projcomfort.com/api/oauth/mobile-callback`

### tRPC API
- `POST https://sous.projcomfort.com/api/trpc`
- Handles all tRPC queries and mutations

### Stripe Webhooks
- `POST https://sous.projcomfort.com/api/stripe/webhook`

---

## ✅ Next Steps

### 1. Server Deployment
Ensure your server is deployed and accessible at `https://sous.projcomfort.com`:

```bash
# Test the endpoint
curl https://sous.projcomfort.com/api/trpc
```

### 2. DNS Configuration
Verify your DNS is properly configured:
- Subdomain: `sous.projcomfort.com`
- Points to: Your server IP or hosting provider
- SSL Certificate: Valid and trusted

### 3. OAuth Provider Update
Update your OAuth provider's redirect URI to:
```
https://sous.projcomfort.com/api/oauth/callback
```

### 4. Stripe Webhook Update
Update your Stripe webhook endpoint to:
```
https://sous.projcomfort.com/api/stripe/webhook
```

### 5. Mobile App Build
When building the production app:

```bash
cd mobile
eas build --platform ios --profile production
```

The app will automatically use `https://sous.projcomfort.com` in production mode.

### 6. Testing
Test the connection:

**From mobile app:**
1. Build production version
2. Check logs for: `[API] Using base URL: https://sous.projcomfort.com`
3. Verify API calls succeed

**From web app:**
1. Deploy to production
2. Test login flow
3. Verify tRPC calls succeed

---

## 🔒 Security Checklist

- [ ] HTTPS is enabled and certificate is valid
- [ ] CORS is configured for your domain
- [ ] OAuth redirect URI is whitelisted
- [ ] Stripe webhook secret is configured
- [ ] Environment variables are set in production
- [ ] API rate limiting is enabled
- [ ] Database connection uses SSL

---

## 📝 Environment Variables Reference

### Required in Production (.env.local or hosting environment)

```env
# Database
DATABASE_URL=postgresql://...

# API URLs
EXPO_PUBLIC_API_URL=https://sous.projcomfort.com
NEXT_PUBLIC_API_URL=https://sous.projcomfort.com

# OAuth
OAUTH_REDIRECT_URI=https://sous.projcomfort.com/api/oauth/callback
OAUTH_AUTHORIZATION_URL=https://your-oauth-provider.com/oauth/authorize
OAUTH_TOKEN_URL=https://your-oauth-provider.com/oauth/token
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret

# AWS S3
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=sous-ingredients

# Stripe
STRIPE_SECRET_KEY=<your_secret_key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_publishable_key>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
STRIPE_PRICE_FAMILY_MONTHLY=price_...
STRIPE_PRICE_FAMILY_YEARLY=price_...
STRIPE_PRICE_LIFETIME=price_...

# Session
SESSION_SECRET=your_random_secret_min_32_chars
```

---

## 🎯 Verification

### Test Endpoints

```bash
# Health check
curl https://sous.projcomfort.com/

# tRPC endpoint
curl https://sous.projcomfort.com/api/trpc

# OAuth callback (should redirect or show error)
curl https://sous.projcomfort.com/api/oauth/callback
```

### Expected Responses

- tRPC should return: Method not allowed or CORS headers
- OAuth callback should: Redirect or show "Missing code parameter" error
- Root path should: Return your app's HTML or redirect

---

## 🐛 Troubleshooting

### "Unable to connect to server"
- Check if server is running: `curl https://sous.projcomfort.com`
- Verify DNS is propagated: `nslookup sous.projcomfort.com`
- Check SSL certificate: `curl -v https://sous.projcomfort.com`

### CORS Errors
Add CORS configuration in your server:
```typescript
app.use(cors({
  origin: ['https://sous.projcomfort.com', 'http://localhost:3000'],
  credentials: true
}));
```

### OAuth Not Working
1. Verify redirect URI matches exactly in OAuth provider
2. Check OAuth credentials are correct
3. Test OAuth flow in browser first

### Mobile App Can't Connect
1. Ensure you're building in production mode
2. Check app.json has correct `EXPO_PUBLIC_API_URL`
3. Verify SSL certificate is trusted (not self-signed)

---

## 📚 Related Documentation

- [APP_STORE_RELEASE_GUIDE.md](mobile/APP_STORE_RELEASE_GUIDE.md) - Full App Store release process
- [BUILD_AND_SUBMIT_GUIDE.md](mobile/BUILD_AND_SUBMIT_GUIDE.md) - Build and submit instructions
- [AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md) - S3 configuration
- [STRIPE_SETUP_COMPLETE.md](STRIPE_SETUP_COMPLETE.md) - Stripe configuration

---

## ✅ Configuration Complete

Your subdomain `https://sous.projcomfort.com` is now configured throughout:
- ✅ Mobile app production URL
- ✅ Web app API URL
- ✅ OAuth redirect URI
- ✅ Environment variables
- ✅ Documentation updated

**You're ready to deploy and build for production!** 🚀
