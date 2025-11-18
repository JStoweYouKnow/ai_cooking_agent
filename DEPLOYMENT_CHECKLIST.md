# 🚀 Vercel Deployment Checklist

Quick reference checklist for deploying AI Cooking Agent to Vercel.

## Pre-Deployment (Local)

### Code Quality
- [ ] Run `pnpm check` - No TypeScript errors
- [ ] Run `pnpm build` - Build succeeds locally
- [ ] Run `pnpm test` - All tests pass
- [ ] Review and commit all changes
- [ ] No sensitive data in code (API keys, passwords)

### Git Repository
- [ ] Code pushed to GitHub/GitLab/Bitbucket
- [ ] `.env` file in `.gitignore` (never commit!)
- [ ] `.env.example` is up to date
- [ ] README.md updated with setup instructions
- [ ] No large files in repo (> 100MB)

### Database Ready
- [ ] PlanetScale database created
- [ ] Connection string obtained
- [ ] Schema migrations ready
- [ ] Test connection works

## Vercel Setup

### Project Configuration
- [ ] Vercel account created
- [ ] Project imported from Git repo
- [ ] Framework preset: Next.js selected
- [ ] Build command: `pnpm build`
- [ ] Install command: `pnpm install`
- [ ] Root directory set correctly

### Environment Variables (All Required)

Copy from `.env.production.example` to Vercel:

#### Database
- [ ] `DATABASE_URL` - PlanetScale connection string
  ```
  mysql://user:pass@aws.connect.psdb.cloud/db?ssl={"rejectUnauthorized":true}
  ```

#### OAuth
- [ ] `OAUTH_AUTHORIZATION_URL`
- [ ] `OAUTH_TOKEN_URL`
- [ ] `OAUTH_CLIENT_ID`
- [ ] `OAUTH_CLIENT_SECRET`
- [ ] `OAUTH_REDIRECT_URI` - Use your Vercel URL
  ```
  https://your-app.vercel.app/api/oauth/callback
  ```

#### Security
- [ ] `SESSION_SECRET` - Generated with `openssl rand -base64 32`

#### LLM
- [ ] `LLM_API_KEY` - Gemini API key from Google AI Studio
- [ ] `LLM_BASE_URL` - `https://generativelanguage.googleapis.com/v1beta`

#### Application
- [ ] `NODE_ENV` - `production`
- [ ] `NEXT_PUBLIC_APP_URL` - Your Vercel URL
- [ ] `ALLOWED_HOSTS` - Your Vercel domain

#### Optional
- [ ] `AWS_ACCESS_KEY_ID` (if using S3)
- [ ] `AWS_SECRET_ACCESS_KEY` (if using S3)
- [ ] `AWS_REGION` (if using S3)
- [ ] `AWS_S3_BUCKET` (if using S3)
- [ ] `OWNER_OPEN_ID` (admin user ID)
- [ ] `RATE_LIMIT_WINDOW_MS`
- [ ] `RATE_LIMIT_MAX_REQUESTS`
- [ ] `LOG_LEVEL`

### Environment Variable Settings
- [ ] All variables set for **Production**
- [ ] All variables set for **Preview** (optional)
- [ ] Sensitive values marked as sensitive
- [ ] No trailing spaces in values
- [ ] No quotes around values (Vercel adds them)

## First Deployment

### Deploy
- [ ] Click "Deploy" in Vercel dashboard
  OR
- [ ] Run `vercel --prod` from terminal
  OR
- [ ] Push to `main` branch (auto-deploys)

### Monitor Build
- [ ] Watch build logs in Vercel dashboard
- [ ] No build errors
- [ ] No TypeScript errors
- [ ] Build completes successfully (~5-7 minutes)
- [ ] Deployment URL generated

## Post-Deployment Verification

### Functionality Tests
- [ ] Visit deployment URL
- [ ] Home page loads without errors
- [ ] Check browser console for errors (should be none)
- [ ] Responsive design works on mobile
- [ ] Navigation works (header, sidebar, bottom nav)

### Authentication
- [ ] Click "Sign in" button
- [ ] OAuth redirect works
- [ ] Successfully authenticates
- [ ] User session persists on refresh
- [ ] Sign out works

### Database Operations
- [ ] Ingredients page loads
- [ ] Can add ingredient
- [ ] Ingredients save to database
- [ ] Can delete ingredient
- [ ] Recipe search works
- [ ] Shopping lists work

### External APIs
- [ ] Recipe search returns results (TheMealDB)
- [ ] Image recognition works (if configured)
- [ ] Gemini API responds (for recipe parsing)
- [ ] No API quota errors

### Performance
- [ ] Pages load in < 3 seconds
- [ ] Images load properly
- [ ] No JavaScript errors in console
- [ ] Lighthouse score > 80 (optional)

## Post-Deployment Configuration

### OAuth Provider
- [ ] Add production callback URL to OAuth provider:
  ```
  https://your-app.vercel.app/api/oauth/callback
  ```
- [ ] Test OAuth flow again after update
- [ ] Update `OAUTH_REDIRECT_URI` in Vercel if needed
- [ ] Redeploy if environment variables changed

### Custom Domain (Optional)
- [ ] Add domain in Vercel dashboard
- [ ] Configure DNS records (provided by Vercel)
- [ ] SSL certificate auto-generated
- [ ] Update `NEXT_PUBLIC_APP_URL`
- [ ] Update `OAUTH_REDIRECT_URI`
- [ ] Update OAuth provider callback URL
- [ ] Redeploy

### Database Migrations
- [ ] Run migrations on production database:
  ```bash
  DATABASE_URL="prod_url" pnpm db:push
  ```
- [ ] Verify tables created
- [ ] Test database connection

### Analytics & Monitoring
- [ ] Enable Vercel Analytics (optional)
- [ ] Enable Speed Insights (optional)
- [ ] Set up error tracking (Sentry, optional)
- [ ] Configure logging

## Ongoing Maintenance

### Regular Checks
- [ ] Monitor deployment logs weekly
- [ ] Check error rates in Vercel dashboard
- [ ] Review API quota usage (Gemini)
- [ ] Database storage usage
- [ ] Vercel bandwidth usage

### Updates
- [ ] Update dependencies monthly: `pnpm update`
- [ ] Security patches applied immediately
- [ ] Test updates in preview deployment first
- [ ] Monitor after production deployment

### Backups
- [ ] Database backup configured (PlanetScale auto-backups)
- [ ] Environment variables documented
- [ ] Regular git commits and pushes

## Troubleshooting Checklist

### Build Fails
- [ ] Check build logs for specific error
- [ ] Verify `pnpm build` works locally
- [ ] Check TypeScript errors: `pnpm check`
- [ ] Clear Vercel cache and redeploy
- [ ] Verify all dependencies in package.json

### Runtime Errors
- [ ] Check Function logs in Vercel dashboard
- [ ] Verify all environment variables set
- [ ] Test database connection string
- [ ] Check OAuth configuration
- [ ] Verify API keys are valid

### Database Issues
- [ ] PlanetScale database is active (not sleeping)
- [ ] Connection string includes SSL parameters
- [ ] Database user has proper permissions
- [ ] Schema migrations completed
- [ ] No connection limit reached

### OAuth Problems
- [ ] Callback URL exactly matches Vercel URL
- [ ] No trailing slash in callback URL
- [ ] OAuth provider allows domain
- [ ] Session secret is set and stable
- [ ] Cookies enabled in browser

## Quick Commands

```bash
# Pre-flight check
./scripts/deploy-check.sh

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Rollback
vercel rollback

# Check environment variables
vercel env ls

# Test production build locally
pnpm build && pnpm start
```

## Support

If you encounter issues:
1. Check [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
2. Review [Vercel Documentation](https://vercel.com/docs)
3. Check build logs for specific errors
4. Test locally with production build

---

**Ready to deploy?** ✅ Start with the Pre-Deployment section and work through each checklist item!
