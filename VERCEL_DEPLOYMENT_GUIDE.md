# Vercel Deployment Guide - AI Cooking Agent

Complete guide to deploy your AI Cooking Agent to Vercel for production testing and hosting.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (PlanetScale)](#database-setup)
3. [Vercel Project Setup](#vercel-project-setup)
4. [Environment Variables](#environment-variables)
5. [Deploy to Vercel](#deploy-to-vercel)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Production Optimizations](#production-optimizations)

---

## Prerequisites

### Required Accounts
- ✅ [Vercel Account](https://vercel.com/signup) (free tier works)
- ✅ [PlanetScale Account](https://planetscale.com) (for MySQL database)
- ✅ [Google Cloud Account](https://cloud.google.com) (for Gemini API)
- ✅ GitHub/GitLab/Bitbucket (for code repository)

### Optional Services
- AWS Account (for S3 image storage) OR Vercel Blob Storage
- Manus OAuth provider configured

### Local Requirements
- Node.js 18+ installed
- pnpm installed: `npm install -g pnpm`
- Git installed and configured

---

## Database Setup

### Option 1: PlanetScale (Recommended for Production)

PlanetScale is a serverless MySQL database that works perfectly with Vercel.

#### Step 1: Create Database

```bash
# Install PlanetScale CLI (optional but helpful)
brew install planetscale/tap/pscale

# Or use the web dashboard: https://app.planetscale.com
```

1. Go to [PlanetScale Dashboard](https://app.planetscale.com)
2. Click **New Database**
3. Name: `ai-cooking-agent`
4. Region: Choose closest to your users (e.g., `us-east`)
5. Click **Create database**

#### Step 2: Create Connection String

1. Go to your database → **Connect**
2. Click **Generate new password**
3. Select **Prisma** or **General** format
4. Copy the connection string (looks like):
   ```
   mysql://user:pass@aws.connect.psdb.cloud/ai-cooking-agent?ssl={"rejectUnauthorized":true}
   ```
5. Save this - you'll need it for environment variables

#### Step 3: Initialize Schema

```bash
# Connect to your PlanetScale database
pscale shell ai-cooking-agent main

# Or use the connection string with drizzle
DATABASE_URL="your_planetscale_url" pnpm db:push
```

### Option 2: Other MySQL Providers

Alternatives that work with Vercel:
- **Railway** - Easy MySQL hosting
- **Neon** - Serverless Postgres (requires schema changes)
- **Supabase** - Postgres with additional features

---

## Vercel Project Setup

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit - AI Cooking Agent"

# Create GitHub repository (via GitHub website)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/ai-cooking-agent.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
   - **Output Directory**: `.next` (auto-detected)

### Step 3: Environment Variables Setup

**DO NOT deploy yet!** First, configure all environment variables:

1. In Vercel project settings, go to **Environment Variables**
2. Add each variable below (see next section)
3. Set environment to: **Production**, **Preview**, **Development** (all three)

---

## Environment Variables

### Required Variables

Copy these into Vercel's Environment Variables section:

#### Database
```
DATABASE_URL=mysql://user:pass@aws.connect.psdb.cloud/ai-cooking-agent?ssl={"rejectUnauthorized":true}
```
**Get from**: PlanetScale connection string

#### OAuth
```
OAUTH_AUTHORIZATION_URL=https://your-oauth-provider.com/oauth/authorize
OAUTH_TOKEN_URL=https://your-oauth-provider.com/oauth/token
OAUTH_CLIENT_ID=your_production_client_id
OAUTH_CLIENT_SECRET=your_production_client_secret
OAUTH_REDIRECT_URI=https://your-app.vercel.app/api/oauth/callback
```
**Get from**: Your OAuth provider dashboard
**Note**: Update `OAUTH_REDIRECT_URI` with your actual Vercel URL after first deployment

#### Session Security
```
SESSION_SECRET=your_random_32_char_secret
```
**Generate with**:
```bash
openssl rand -base64 32
```

#### LLM (Gemini)
```
LLM_API_KEY=your_gemini_api_key
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```
**Get from**: [Google AI Studio](https://makersuite.google.com/app/apikey)

#### Application Config
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
ALLOWED_HOSTS=your-app.vercel.app
```

### Optional Variables

#### AWS S3 (for image uploads)
```
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=ai-cooking-agent-images
```

#### OR use Vercel Blob Storage (easier)
```
BLOB_READ_WRITE_TOKEN=vercel_blob_token
```
**Get from**: Vercel Dashboard → Storage → Create Blob Store

#### Admin Config
```
OWNER_OPEN_ID=your_admin_user_id
```

#### Rate Limiting
```
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=warn
```

### Quick Setup Script

Use this script to set variables via Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add DATABASE_URL production
vercel env add SESSION_SECRET production
vercel env add LLM_API_KEY production
# ... continue for all variables
```

---

## Deploy to Vercel

### Method 1: Automatic Deployment (Recommended)

Once environment variables are set:

```bash
# From your local project directory
vercel

# Or deploy to production directly
vercel --prod
```

### Method 2: Via Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Click **Deployments** tab
3. Click **Redeploy** (or push to GitHub triggers auto-deploy)

### Method 3: Via Git Push

```bash
# Simply push to main branch
git add .
git commit -m "Deploy to production"
git push origin main

# Vercel auto-deploys on push to main
```

### Deployment Process

Watch the build logs:
1. **Install dependencies** - `pnpm install` (~2 min)
2. **Build Next.js** - `pnpm build` (~3 min)
3. **Deploy** - Upload to CDN (~1 min)

**Total time**: ~5-7 minutes for first deployment

---

## Post-Deployment

### Step 1: Verify Deployment

Visit your deployment URL (e.g., `https://ai-cooking-agent.vercel.app`)

Check these pages:
- ✅ Home page loads
- ✅ Authentication works (OAuth redirect)
- ✅ Ingredients page functions
- ✅ Recipe search works
- ✅ Shopping lists work
- ✅ Database connection successful

### Step 2: Update OAuth Redirect URI

1. Go to your OAuth provider settings
2. Add production redirect URI:
   ```
   https://your-app.vercel.app/api/oauth/callback
   ```
3. Update `OAUTH_REDIRECT_URI` in Vercel environment variables
4. Redeploy

### Step 3: Run Database Migrations

```bash
# Connect to production database
DATABASE_URL="your_production_db_url" pnpm db:push

# Or via PlanetScale CLI
pscale shell ai-cooking-agent main < drizzle/migrations/*.sql
```

### Step 4: Custom Domain (Optional)

1. In Vercel Dashboard → **Settings** → **Domains**
2. Add your custom domain: `cooking.yourdomain.com`
3. Follow DNS configuration instructions
4. Update environment variables:
   ```
   NEXT_PUBLIC_APP_URL=https://cooking.yourdomain.com
   OAUTH_REDIRECT_URI=https://cooking.yourdomain.com/api/oauth/callback
   ```

### Step 5: Enable Analytics (Optional)

```bash
# In Vercel Dashboard
# Analytics → Enable Web Analytics

# Add to environment variables (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

---

## Troubleshooting

### Build Failures

#### Error: "pnpm: command not found"
**Solution**:
```json
// Add to package.json
"packageManager": "pnpm@10.4.1"
```

#### Error: "Module not found"
**Solution**: Clear build cache in Vercel settings and redeploy

#### Error: TypeScript errors
**Solution**: Run locally first:
```bash
pnpm check  # Type checking
pnpm build  # Build verification
```

### Runtime Errors

#### Database Connection Failed
**Check**:
- DATABASE_URL is correct
- PlanetScale database is active
- SSL parameters included in connection string
- Database user has proper permissions

**Fix**:
```bash
# Test connection locally
DATABASE_URL="your_url" node -e "const mysql = require('mysql2'); mysql.createConnection(process.env.DATABASE_URL).connect(err => console.log(err || 'Connected'));"
```

#### OAuth Redirect Loop
**Check**:
- `OAUTH_REDIRECT_URI` matches your Vercel URL
- OAuth provider has the correct callback URL
- Session secret is set

#### LLM API Errors
**Check**:
- `LLM_API_KEY` is valid
- Gemini API is enabled in Google Cloud
- API quota not exceeded

**Fix**: Test API key:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Test"}]}]}'
```

### Performance Issues

#### Slow API Responses
**Solutions**:
1. Enable Edge Functions for faster response times
2. Add Redis caching (Vercel KV or Upstash)
3. Optimize database queries with indexes

#### Cold Starts
**Solutions**:
1. Upgrade to Vercel Pro for reduced cold starts
2. Implement warming strategy
3. Use Edge Runtime where possible

---

## Production Optimizations

### 1. Enable Caching

Add to `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=120' }
      ]
    }
  ]
};
```

### 2. Image Optimization

Already configured with Next.js Image component. For external images:

```typescript
// next.config.mjs
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'www.themealdb.com',
    },
    {
      protocol: 'https',
      hostname: 'your-s3-bucket.s3.amazonaws.com',
    }
  ]
}
```

### 3. Enable Vercel Speed Insights

```bash
# Install
pnpm add @vercel/speed-insights

# Add to app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 4. Database Connection Pooling

PlanetScale handles this automatically. For other databases:

```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const poolConnection = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10, // Vercel limit
});

export const db = drizzle(poolConnection);
```

### 5. Error Tracking

Add Sentry for production error tracking:

```bash
pnpm add @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

### 6. Environment-Specific Configs

```typescript
// lib/config.ts
export const config = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiUrl: process.env.NEXT_PUBLIC_APP_URL,
  // ... other configs
};
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`pnpm test`)
- [ ] Type check passing (`pnpm check`)
- [ ] Build successful locally (`pnpm build`)
- [ ] Environment variables documented
- [ ] Database schema up to date
- [ ] OAuth callback URLs configured
- [ ] API keys valid and have quota

### Deployment
- [ ] Repository pushed to GitHub
- [ ] Vercel project created
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] First deployment successful
- [ ] Domain connected (if using custom domain)

### Post-Deployment
- [ ] Home page loads
- [ ] Authentication works
- [ ] Database queries working
- [ ] External APIs responding (Gemini, TheMealDB)
- [ ] Images loading
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Analytics enabled
- [ ] Error tracking configured

### Ongoing
- [ ] Monitor deployment logs
- [ ] Check error rates
- [ ] Monitor API quota usage
- [ ] Review performance metrics
- [ ] Update dependencies monthly
- [ ] Backup database weekly

---

## Useful Commands

```bash
# View deployment logs
vercel logs

# Check deployment status
vercel ls

# Roll back to previous deployment
vercel rollback

# Promote a preview deployment to production
vercel promote [deployment-url]

# Remove environment variable
vercel env rm VARIABLE_NAME production

# List all environment variables
vercel env ls

# Test production build locally
vercel dev --prod
```

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [PlanetScale Docs](https://planetscale.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

## Cost Breakdown

### Free Tier (Hobby Plan)
- **Vercel**: Free (100 GB bandwidth, 100 builds/month)
- **PlanetScale**: Free (5 GB storage, 1 billion row reads/month)
- **Gemini API**: Free tier (60 requests/minute)
- **Total**: $0/month ✨

### Recommended Paid (for production)
- **Vercel Pro**: $20/month (more bandwidth, priority builds)
- **PlanetScale Scaler**: $39/month (10 GB storage, better performance)
- **Gemini API**: Pay-as-you-go
- **Total**: ~$60-80/month

---

**You're ready to deploy! 🚀**

Follow the steps above and your AI Cooking Agent will be live on Vercel in minutes.

For questions or issues, check the Troubleshooting section or open an issue on GitHub.
