#!/usr/bin/env node
/**
 * Test S3 upload with your current env vars.
 * Run from project root: node scripts/test-s3-upload.mjs
 * Ensure .env is loaded (e.g. export $(grep -E '^(S3_|AWS_)' .env | xargs) && node scripts/test-s3-upload.mjs)
 *
 * Tests both buckets if S3_BUCKET_INGREDIENTS and S3_BUCKET_RECIPE_IMAGES are set.
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "us-east-2";
const buckets = {
  ingredients: process.env.S3_BUCKET_INGREDIENTS || process.env.S3_BUCKET,
  recipes: process.env.S3_BUCKET_RECIPE_IMAGES || process.env.S3_BUCKET,
};
const hasKey = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

console.log("S3 upload test");
console.log("  Region:", region);
console.log("  Buckets: ingredients=" + (buckets.ingredients || "(not set)") + ", recipes=" + (buckets.recipes || "(not set)"));
console.log("  Credentials:", hasKey ? "AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY" : "MISSING (set in .env or shell)");
console.log("");

if (!hasKey) {
  console.error("ERROR: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set.");
  process.exit(1);
}

const client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testBucket(name, bucket, keyPrefix) {
  if (!bucket) {
    console.log(`  [${name}] Skipped (bucket not configured)`);
    return true;
  }
  const testKey = `${keyPrefix}${Date.now()}-test-upload.txt`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: `S3 upload test - ${name}`,
      ContentType: "text/plain",
    })
  );
  const { Body } = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: testKey })
  );
  await Body?.transformToString();
  console.log(`  ✓ ${name} (${bucket}): PutObject + GetObject OK`);
  return true;
}

try {
  if (buckets.ingredients) await testBucket("ingredients", buckets.ingredients, "ingredients/");
  if (buckets.recipes) await testBucket("recipes", buckets.recipes, "recipes/");
  if (!buckets.ingredients && !buckets.recipes) {
    console.error("\nERROR: No S3 buckets configured. Set S3_BUCKET_INGREDIENTS and/or S3_BUCKET_RECIPE_IMAGES (or S3_BUCKET).");
    process.exit(1);
  }
  console.log("\n✓ S3 access works. Your IAM user has the right permissions.");
  console.log("  If the app still fails, check Vercel/server env vars.");
} catch (err) {
  console.error("\n✗ S3 error:", err.name, err.message);
  if (err.Code === "AccessDenied") {
    console.error(`\n  Fix: Add s3:PutObject and s3:GetObject for both buckets. Example:`);
    console.error(`
  {
    "Version": "2012-10-17",
    "Statement": [
      { "Effect": "Allow", "Action": ["s3:PutObject", "s3:GetObject"], "Resource": "arn:aws:s3:::sous-ingredients/*" },
      { "Effect": "Allow", "Action": ["s3:PutObject", "s3:GetObject"], "Resource": "arn:aws:s3:::sous-recipe-images/*" }
    ]
  }
`);
  }
  if (err.name === "NoSuchBucket") {
    console.error("\n  Fix: Bucket does not exist or is in a different region. Check AWS_REGION.");
  }
  process.exit(1);
}
