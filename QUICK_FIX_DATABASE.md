# Quick Fix: Database Error on Vercel

## The Problem
Your app is showing: "Database not configured. Please add DATABASE_URL to your .env.local file"

## The Solution (5 minutes)

### 1. Get a Database (Choose one)

**PlanetScale (Easiest - Free tier available)**
- Go to https://planetscale.com
- Sign up and create a database
- Copy the connection string

**Railway (Also easy)**
- Go to https://railway.app
- Create project → Add MySQL
- Copy connection string from variables

### 2. Add to Vercel

1. Open your Vercel project: https://vercel.com/dashboard
2. Go to **Settings** → **Environment Variables**
3. Click **Add New**
4. Name: `DATABASE_URL`
5. Value: Paste your connection string
6. Check all environments (Production, Preview, Development)
7. Click **Save**

### 3. Redeploy

- Go to **Deployments** tab
- Click **⋯** on latest deployment
- Click **Redeploy**

### 4. Run Migrations (One-time setup)

After redeploy, run this locally:

mysql://root:ApOAGMdiDJEOyQMtBuYRWpHYqndqfPmF@switchyard.proxy.rlwy.net:47577/railway
```

Or use PlanetScale CLI:
```bash
pscale connect your-db-name main --execute "pnpm db:push"
```

## Done! ✅

Your app should now work. The error will disappear after the next deployment.

## Still having issues?

Check the full guide: `TROUBLESHOOTING_DATABASE.md`
