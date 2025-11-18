# Database Setup Guide - FREE Options

## 🎯 Recommended: Railway (Easiest Free Option)

### Steps:
1. **Sign up** at [railway.app](https://railway.app) (free: $5 credit/month)
2. **Create new project** → Click "New" → Select "Database" → Choose "MySQL"
3. **Copy connection string** from the MySQL service (click on it → "Connect" tab)
4. **Add to `.env.local`**:
   ```bash
   DATABASE_URL=[connection_string_from_railway]
   ```
5. **Run migrations**:
   ```bash
   npm run db:push
   ```
6. **Restart dev server**: `npm run dev`

### Benefits:
- ✅ **FREE** - $5 credit/month (enough for small apps)
- ✅ **Easiest setup** - Just a few clicks
- ✅ **Auto-scaling** - Grows with your app
- ✅ **Simple dashboard** - Easy to manage
- ✅ **Works immediately** - No code changes needed

---

## Option 2: GoogieHost (100% Free MySQL - No Credit Card)

### Steps:
1. **Sign up** at [googiehost.com/free-mysql-hosting](https://www.googiehost.com/free-mysql-hosting)
2. **Create database** (no credit card required)
3. **Get connection details** from dashboard
4. **Add to `.env.local`**:
   ```bash
   DATABASE_URL=mysql://[username]:[password]@[host]/[database]
   ```
5. **Run migrations**:
   ```bash
   npm run db:push
   ```

### Benefits:
- ✅ **100% FREE** - No credit card required
- ✅ **No time limits** - Free forever
- ✅ **phpMyAdmin included** - Easy database management
- ✅ **Free SSL certificates**
- ⚠️ **Note:** May have resource limits, good for development/testing

---

## Option 3: AWS RDS Free Tier (12 Months Free)

### Steps:
1. **Sign up** at [aws.amazon.com/free](https://aws.amazon.com/free) (free tier available)
2. **Go to RDS** → Create database → Choose MySQL
3. **Select "Free tier"** template (db.t3.micro)
4. **Get connection string** after creation
5. **Add to `.env.local`**:
   ```bash
   DATABASE_URL=mysql://[username]:[password]@[host]:3306/[database]
   ```
6. **Run migrations**:
   ```bash
   npm run db:push
   ```

### Benefits:
- ✅ **FREE** - 750 hours/month for 12 months
- ✅ **20GB storage** included
- ✅ **Production-ready** - AWS infrastructure
- ⚠️ **Note:** Only free for first 12 months, then ~$15/month

---

## Option 4: Azure Free Account (30 Days + $200 Credit)

### Steps:
1. **Sign up** at [azure.microsoft.com/free](https://azure.microsoft.com/free) (free account)
2. **Create Azure Database for MySQL** → Flexible Server
3. **Select Burstable B1MS** (free tier eligible)
4. **Get connection string** after creation
5. **Add to `.env.local`**:
   ```bash
   DATABASE_URL=mysql://[username]:[password]@[host]:3306/[database]
   ```
6. **Run migrations**:
   ```bash
   npm run db:push
   ```

### Benefits:
- ✅ **FREE** - $200 credit for first 30 days
- ✅ **750 hours/month** of B1MS compute
- ✅ **32GB storage** included
- ⚠️ **Note:** After 30 days, pay-as-you-go pricing

---

## 🚀 Quick Start (Recommended: Railway)

1. **Sign up** at [railway.app](https://railway.app)
2. **Create project** → Add MySQL database
3. **Copy connection string**
4. **Add to `.env.local`**:
   ```bash
   DATABASE_URL=[your_railway_connection_string]
   ```
5. **Run**: `npm run db:push`
6. **Restart**: `npm run dev`

**That's it!** Your app will work immediately.

---

## 💡 Which Option Should You Choose?

- **For quick start**: **Railway** (Option 1) - Easiest, $5/month credit
- **For 100% free forever**: **GoogieHost** (Option 2) - No credit card needed
- **For production scale**: **AWS RDS** (Option 3) - Free for 12 months, then paid

**My recommendation**: Start with **Railway** - it's the easiest and $5/month credit is usually enough for development and small apps.

---

## 📝 Notes

- All options work with your existing code - no changes needed!
- Just add the `DATABASE_URL` to `.env.local` and run `npm run db:push`
- The app automatically uses the database from the connection string
