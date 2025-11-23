# Database Configuration Troubleshooting

## Error Message
```
Database not configured. Please add DATABASE_URL to your .env.local file. 
Example: DATABASE_URL=mysql://appuser:apppassword@localhost:3306/ai_cooking_agent
```

## Quick Fix: Add DATABASE_URL to Vercel

### Step 1: Set Up a Database

You have several options:

#### Option A: PlanetScale (Recommended for Production)
1. Go to [PlanetScale](https://planetscale.com/)
2. Create a free account
3. Create a new database
4. Get your connection string from the dashboard
5. Format: `mysql://user:password@aws.connect.psdb.cloud/database_name?ssl={"rejectUnauthorized":true}`

#### Option B: Railway
1. Go to [Railway](https://railway.app/)
2. Create a new project
3. Add a MySQL service
4. Copy the connection string from the service variables

#### Option C: Supabase (PostgreSQL - requires schema changes)
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Get the connection string from Settings > Database

### Step 2: Add Environment Variable to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Add the following:

   **Name:** `DATABASE_URL`
   
   **Value:** Your database connection string (from Step 1)
   
   **Environment:** Select all (Production, Preview, Development)

5. Click **Save**

### Step 3: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab in Vercel
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

### Step 4: Run Database Migrations

After the first deployment with DATABASE_URL:

1. **Option A: Using Vercel CLI** (Recommended)
   ```bash
   # Install Vercel CLI if not already installed
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link to your project
   vercel link
   
   # Run migrations with production DATABASE_URL
   vercel env pull .env.local
   DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2-) pnpm db:push
   ```

2. **Option B: Using Vercel Remote Build**
   ```bash
   # Set DATABASE_URL in your local environment
   export DATABASE_URL="your_production_database_url"
   
   # Run migrations
   pnpm db:push
   ```

3. **Option C: Using PlanetScale CLI** (If using PlanetScale)
   ```bash
   # Install PlanetScale CLI
   npm i -g pscale
   
   # Login
   pscale auth login
   
   # Connect and run migrations
   pscale connect your-database-name main --execute "pnpm db:push"
   ```

## Verify Database Connection

After setting up, verify the connection:

1. Check the Vercel deployment logs for any database connection errors
2. Visit your app and check if the error message is gone
3. Test creating a recipe or adding an ingredient

## Additional Required Environment Variables

While fixing DATABASE_URL, make sure you also have these set in Vercel:

### Required for Basic Functionality
- `DATABASE_URL` - Database connection string
- `SESSION_SECRET` - Random 32+ character string (generate with `openssl rand -base64 32`)
- `OAUTH_AUTHORIZATION_URL` - Your OAuth provider authorization endpoint
- `OAUTH_TOKEN_URL` - Your OAuth provider token endpoint
- `OAUTH_CLIENT_ID` - OAuth client ID
- `OAUTH_CLIENT_SECRET` - OAuth client secret
- `OAUTH_REDIRECT_URI` - Should be `https://your-app.vercel.app/api/oauth/callback`
- `OWNER_OPEN_ID` - Your admin user's OpenID

### Optional but Recommended
- `LLM_API_KEY` - For AI recipe parsing (Gemini API key)
- `LLM_BASE_URL` - Default: `https://generativelanguage.googleapis.com/v1beta`
- `STORAGE_API_URL` - For image uploads
- `STORAGE_API_KEY` - Storage API key
- `NODE_ENV` - Set to `production` for production deployments

## Common Issues

### Issue: "Database connection failed"
- **Cause:** DATABASE_URL is set but incorrect or database is not accessible
- **Fix:** 
  - Verify the connection string format
  - Check if your database allows connections from Vercel's IPs
  - For PlanetScale, ensure SSL is configured correctly

### Issue: "Table doesn't exist"
- **Cause:** Database migrations haven't been run
- **Fix:** Run `pnpm db:push` with the production DATABASE_URL

### Issue: "Access denied"
- **Cause:** Database credentials are incorrect
- **Fix:** Regenerate connection string from your database provider

### Issue: Environment variable not updating
- **Cause:** Vercel caches environment variables
- **Fix:** 
  - Redeploy after adding/changing environment variables
  - Clear Vercel build cache if needed

## Testing Locally

To test database connection locally:

1. Create `.env.local` file:
   ```bash
   DATABASE_URL=your_database_connection_string
   ```

2. Run migrations:
   ```bash
   pnpm db:push
   ```

3. Start dev server:
   ```bash
   pnpm dev
   ```

## Need Help?

If you're still experiencing issues:

1. Check Vercel deployment logs for detailed error messages
2. Verify your database is running and accessible
3. Test the connection string locally first
4. Check the database provider's status page

