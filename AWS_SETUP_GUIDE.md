# AWS S3 Setup Guide - Finding Your Access Keys

## Table of Contents
1. [Finding Your AWS Access Keys](#finding-your-aws-access-keys)
2. [Creating New Access Keys](#creating-new-access-keys)
3. [Setting Up S3 Bucket](#setting-up-s3-bucket)
4. [Configuring Environment Variables](#configuring-environment-variables)
5. [Using IAM Roles (Recommended for Production)](#using-iam-roles-recommended-for-production)

---

## Finding Your AWS Access Keys

### Method 1: Create New Access Keys (Recommended)

1. **Sign in to AWS Console**
   - Go to https://console.aws.amazon.com/
   - Sign in with your AWS account credentials

2. **Navigate to IAM (Identity and Access Management)**
   - Click on your account name in the top-right corner
   - Select **"Security credentials"** from the dropdown
   - OR search for "IAM" in the search bar and click on it

3. **Access Your User**
   - In the left sidebar, click **"Users"**
   - Click on your username
   - Click the **"Security credentials"** tab

4. **Create Access Key**
   - Scroll down to **"Access keys"** section
   - Click **"Create access key"**
   - Select use case: Choose **"Application running outside AWS"** or **"Command line interface (CLI)"**
   - Click **"Next"**
   - Add a description tag (optional): e.g., "Cooking App S3 Access"
   - Click **"Create access key"**

5. **Save Your Credentials** ⚠️ IMPORTANT
   ```
   Access Key ID:     AKIAIOSFODNN7EXAMPLE
   Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ```

   **⚠️ WARNING:** This is your ONLY chance to see the Secret Access Key!
   - Download the CSV file OR
   - Copy both keys to a secure password manager
   - Never share these keys or commit them to Git

---

## Creating New Access Keys

If you don't have access keys or lost them, create new ones:

### Step 1: Create IAM User (if you don't have one)

1. Go to **IAM Console** → **Users** → **Add users**
2. User name: `cooking-app-s3-user`
3. Select **"Access key - Programmatic access"**
4. Click **"Next: Permissions"**

### Step 2: Attach Permissions

**Option A: Full S3 Access (Simple but less secure)**
1. Click **"Attach existing policies directly"**
2. Search for `AmazonS3FullAccess`
3. Check the box next to it
4. Click **"Next: Tags"** → **"Next: Review"** → **"Create user"**

**Option B: Limited S3 Access (Recommended - Most Secure)**
1. Click **"Attach existing policies directly"**
2. Click **"Create policy"**
3. Select **JSON** tab and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

4. Replace `YOUR-BUCKET-NAME` with your actual bucket name
5. Click **"Next"** → Name it `CookingAppS3Policy`
6. Click **"Create policy"**
7. Go back to user creation and attach this policy

---

## Setting Up S3 Bucket

### Step 1: Create S3 Bucket

1. Go to **S3 Console**: https://s3.console.aws.amazon.com/
2. Click **"Create bucket"**
3. **Bucket name**: `your-cooking-app-images` (must be globally unique)
4. **AWS Region**: Choose closest to your users (e.g., `us-east-1`)
5. **Block Public Access settings**:
   - ⚠️ **UNCHECK** "Block all public access"
   - Check the acknowledgment box
6. Click **"Create bucket"**

### Step 2: Configure Bucket Policy

1. Click on your newly created bucket
2. Go to **"Permissions"** tab
3. Scroll to **"Bucket policy"** → Click **"Edit"**
4. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

5. Click **"Save changes"**

### Step 3: Configure CORS

1. Still in **"Permissions"** tab, scroll to **"Cross-origin resource sharing (CORS)"**
2. Click **"Edit"**
3. Paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

4. Click **"Save changes"**

### Step 4: Test Bucket

1. Go to **"Objects"** tab
2. Click **"Upload"**
3. Upload a test image
4. Click on the uploaded file
5. Copy the **"Object URL"**
6. Open it in a new browser tab - you should see the image

---

## Configuring Environment Variables

### For Local Development

1. **Navigate to your server directory**
   ```bash
   cd /Users/v/Downloads/ai_cooking_agent
   ```

2. **Create or edit `.env` file**
   ```bash
   nano .env
   # or
   code .env
   ```

3. **Add these environment variables**
   ```bash
   # Required - S3 Configuration
   S3_BUCKET=your-cooking-app-images
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
   AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

   # Optional - For STS Role Assumption (Advanced)
   # AWS_ROLE_ARN=arn:aws:iam::123456789012:role/YourRoleName
   # AWS_ROLE_SESSION_NAME=cooking-app-session
   ```

4. **Replace with your actual values**
   - `S3_BUCKET`: Your bucket name from Step 1
   - `AWS_REGION`: The region where you created the bucket
   - `AWS_ACCESS_KEY_ID`: From the access key you created
   - `AWS_SECRET_ACCESS_KEY`: From the access key you created

5. **Save the file**
   - Press `Ctrl+O` then `Enter` (nano)
   - Press `Ctrl+X` to exit (nano)

6. **⚠️ Verify `.env` is in `.gitignore`**
   ```bash
   cat .gitignore | grep .env
   ```

   If not found, add it:
   ```bash
   echo ".env" >> .gitignore
   ```

### For Production Deployment

**Never put credentials in your code or version control!**

**Option 1: Environment Variables on Your Server**
```bash
export S3_BUCKET=your-cooking-app-images
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-key
```

**Option 2: Use Platform-Specific Secrets**
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment
- **Heroku**: Settings → Config Vars
- **AWS ECS/EC2**: Use IAM Roles (see below)

---

## Using IAM Roles (Recommended for Production)

If your server runs on AWS (EC2, ECS, Lambda), use IAM roles instead of access keys.

### Advantages
✅ No credentials to manage
✅ Automatically rotated by AWS
✅ More secure than static keys
✅ No risk of accidentally committing keys

### Setup for EC2

1. **Create IAM Role**
   - Go to **IAM Console** → **Roles** → **Create role**
   - Select **"AWS service"** → **"EC2"**
   - Attach `AmazonS3FullAccess` or your custom policy
   - Name it `EC2-S3-Access-Role`
   - Click **"Create role"**

2. **Attach Role to EC2 Instance**
   - Go to **EC2 Console**
   - Select your instance
   - **Actions** → **Security** → **Modify IAM role**
   - Select `EC2-S3-Access-Role`
   - Click **"Update IAM role"**

3. **Update `.env`** (remove keys, keep bucket info)
   ```bash
   S3_BUCKET=your-cooking-app-images
   AWS_REGION=us-east-1
   # Don't set AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY
   # EC2 will automatically use the IAM role
   ```

### Advanced: STS Role Assumption

Your server already supports AWS STS for temporary credentials!

**When to use:**
- Cross-account access
- Enhanced security with short-lived credentials
- Compliance requirements

**Setup:**
1. Create a role in IAM
2. Get the Role ARN (e.g., `arn:aws:iam::123456789012:role/S3UploadRole`)
3. Add to `.env`:
   ```bash
   AWS_ROLE_ARN=arn:aws:iam::123456789012:role/S3UploadRole
   AWS_ROLE_SESSION_NAME=cooking-app-session
   ```

The server will automatically:
- Assume the role using STS
- Cache temporary credentials
- Refresh before expiration
- Use for all S3 operations

---

## Testing Your Setup

### 1. Restart Your Server

```bash
npm run dev
# or
pnpm dev
```

### 2. Check Server Logs

Look for any S3-related errors:
```
✓ S3 bucket configured: your-cooking-app-images
✓ AWS region: us-east-1
```

### 3. Test Upload via API

Using the web app:
1. Go to Pantry page
2. Try adding an ingredient with a photo
3. Check if image uploads successfully

Or test via mobile app:
```typescript
const uploadMutation = trpc.ingredients.uploadImage.useMutation();
const result = await uploadMutation.mutateAsync({
  imageData: 'data:image/jpeg;base64,...',
  fileName: 'test.jpg',
  contentType: 'image/jpeg'
});
console.log('Uploaded to:', result.url);
```

### 4. Verify in S3 Console

1. Go to S3 Console
2. Click on your bucket
3. You should see uploaded images in `ingredients/` folder

---

## Common Issues & Solutions

### Error: "S3_BUCKET environment variable is not set"
**Solution:**
- Check `.env` file exists in server root
- Verify variable name is exactly `S3_BUCKET`
- Restart server after changing `.env`

### Error: "Access denied to S3 bucket"
**Solution:**
- Verify IAM user has S3 permissions
- Check bucket policy allows PutObject
- Ensure access keys are correct

### Error: "The AWS Access Key Id you provided does not exist"
**Solution:**
- Double-check the access key ID
- Ensure no extra spaces or characters
- Create new access keys if needed

### Error: "SignatureDoesNotMatch"
**Solution:**
- Verify secret access key is correct
- Check for invisible characters (copy/paste issues)
- Regenerate access keys

### Images Upload but Don't Display
**Solution:**
- Check bucket has public read access
- Verify bucket policy is correct
- Ensure ACL is `public-read`
- Test URL directly in browser

### CORS Errors
**Solution:**
- Add CORS configuration to bucket
- Allow GET, PUT methods
- Allow origin `*` or your specific domain

---

## Security Best Practices

1. ✅ **Never commit `.env` to Git**
   - Add to `.gitignore`
   - Use environment-specific configs

2. ✅ **Use Least Privilege**
   - Only grant necessary S3 permissions
   - Limit to specific bucket

3. ✅ **Rotate Keys Regularly**
   - Create new keys every 90 days
   - Delete old keys

4. ✅ **Use IAM Roles in Production**
   - Prefer roles over static keys
   - Let AWS manage credentials

5. ✅ **Monitor Access**
   - Enable CloudTrail logging
   - Review S3 access logs

6. ✅ **Secure Storage**
   - Use password manager for keys
   - Never email or share keys

---

## Quick Reference

### Environment Variables
```bash
S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJal...

# Optional - STS
AWS_ROLE_ARN=arn:aws:iam::...:role/RoleName
AWS_ROLE_SESSION_NAME=session-name
```

### Common AWS Regions
- `us-east-1` - US East (N. Virginia)
- `us-west-2` - US West (Oregon)
- `eu-west-1` - Europe (Ireland)
- `ap-southeast-1` - Asia Pacific (Singapore)

### Useful AWS CLI Commands

```bash
# List buckets
aws s3 ls

# List bucket contents
aws s3 ls s3://your-bucket-name/

# Upload test file
aws s3 cp test.jpg s3://your-bucket-name/test.jpg --acl public-read

# Check bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name

# Test credentials
aws sts get-caller-identity
```

---

## Need Help?

- **AWS Documentation**: https://docs.aws.amazon.com/s3/
- **IAM Best Practices**: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- **S3 Pricing**: https://aws.amazon.com/s3/pricing/

Remember: Your access keys are like passwords - keep them secret and secure! 🔐
