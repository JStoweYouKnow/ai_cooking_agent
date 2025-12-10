# Fix S3 Bucket Region Mismatch Error

## Error Message
```
S3 bucket region mismatch. The bucket "sous-ingredients" is in a different region than configured (us-east-1).
```

## Solution

The bucket `sous-ingredients` is in the **us-east-2** region. The default has been updated to `us-east-2`, but you still need to ensure the environment variable is set correctly.

### Step 1: Find the Bucket Region

**Option A: AWS Console (Easiest)**
1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Click on the bucket `sous-ingredients`
3. Go to the **Properties** tab
4. Scroll down to **AWS Region** - this is the region you need

**Option B: AWS CLI**
```bash
aws s3api get-bucket-location --bucket sous-ingredients
```

**Option C: Check the Error Message**
The improved error message may now include a region hint extracted from AWS's response.

### Step 2: Update AWS_REGION Environment Variable

**For Local Development:**
Create or update `.env` file in the project root:
```bash
AWS_REGION=us-east-2
S3_BUCKET=sous-ingredients
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**For Production/Server:**
Set the environment variable where your server is running:

**If using Railway:**
- Go to your Railway project → Variables tab
- Add or update `AWS_REGION` with the correct region

**If using Vercel:**
- Go to Project Settings → Environment Variables
- Add or update `AWS_REGION`

**If using Docker/Server:**
```bash
export AWS_REGION=us-east-2
```

Or update `docker-compose.yml` - AWS_REGION is now included in the environment variables section.

### Step 3: Restart Your Server

After updating the environment variable, restart your server:
```bash
# For local development
pnpm dev

# For production
# Restart your server/container
```

### Common AWS Regions

- `us-east-1` (N. Virginia)
- `us-east-2` (Ohio)
- `us-west-1` (N. California)
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)
- `ap-southeast-1` (Singapore)
- `ap-southeast-2` (Sydney)

## Verification

After updating, try uploading an image again. The error should be resolved if the region matches.

