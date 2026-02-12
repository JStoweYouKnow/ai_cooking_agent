/**
 * Image upload to S3 for ingredient photo recognition
 * Supports both static credentials and STS role assumption for temporary credentials
 * Similar to the Java example provided - uses AWS STS to assume IAM roles
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import { ENV } from "./env";

// Cache for temporary credentials
let cachedCredentials: {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
} | null = null;

/**
 * Assume an IAM role and get temporary credentials via STS
 * Similar to the Java example provided
 */
async function assumeRoleAndGetCredentials(): Promise<{
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}> {
  if (!ENV.awsRoleArn) {
    throw new Error("AWS_ROLE_ARN environment variable is not set for STS role assumption");
  }

  // Create STS client with base credentials (from environment or IAM role)
  const stsClient = new STSClient({
    region: ENV.awsRegion,
    credentials: ENV.awsAccessKeyId && ENV.awsSecretAccessKey
      ? {
          accessKeyId: ENV.awsAccessKeyId,
          secretAccessKey: ENV.awsSecretAccessKey,
        }
      : undefined, // Will use IAM role credentials if running on EC2/Lambda
  });

  const roleRequest = new AssumeRoleCommand({
    RoleArn: ENV.awsRoleArn,
    RoleSessionName: ENV.awsRoleSessionName,
    DurationSeconds: 3600, // 1 hour
  });

  try {
    const roleResponse = await stsClient.send(roleRequest);
    const credentials = roleResponse.Credentials;

    if (!credentials?.AccessKeyId || !credentials?.SecretAccessKey || !credentials?.SessionToken) {
      throw new Error("Failed to obtain temporary credentials from STS");
    }

    return {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
    };
  } catch (error: any) {
    console.error("STS AssumeRole error:", error);
    throw new Error(
      `Failed to assume IAM role: ${error.message || error.name || "Unknown error"}. ` +
      "Check that AWS_ROLE_ARN is correct and your base credentials have permission to assume the role."
    );
  }
}

/**
 * Get S3 client with appropriate credentials
 * Uses temporary credentials from STS if role ARN is configured, otherwise uses static credentials
 */
async function getS3Client(): Promise<S3Client> {
  // If role ARN is configured, use STS temporary credentials
  if (ENV.awsRoleArn) {
    // Check if we have valid cached credentials
    if (cachedCredentials && cachedCredentials.expiration > new Date()) {
      return new S3Client({
        region: ENV.awsRegion,
        credentials: {
          accessKeyId: cachedCredentials.accessKeyId,
          secretAccessKey: cachedCredentials.secretAccessKey,
          sessionToken: cachedCredentials.sessionToken,
        },
      });
    }

    // Get new temporary credentials
    const tempCreds = await assumeRoleAndGetCredentials();
    
    // Cache credentials (expire 5 minutes before actual expiration for safety)
    cachedCredentials = {
      ...tempCreds,
      expiration: new Date(Date.now() + 55 * 60 * 1000), // 55 minutes
    };

    return new S3Client({
      region: ENV.awsRegion,
      credentials: tempCreds,
    });
  }

  // Use static credentials or IAM role credentials (from environment)
  return new S3Client({
    region: ENV.awsRegion,
    credentials: ENV.awsAccessKeyId && ENV.awsSecretAccessKey
      ? {
          accessKeyId: ENV.awsAccessKeyId,
          secretAccessKey: ENV.awsSecretAccessKey,
        }
      : undefined, // Will use IAM role credentials if running on EC2/Lambda
  });
}

export type S3BucketType = "ingredients" | "recipes";

function getBucketAndPrefix(type: S3BucketType): { bucket: string; keyPrefix: string } {
  const bucket = type === "recipes" ? ENV.s3BucketRecipeImages : ENV.s3BucketIngredients;
  const keyPrefix = type === "recipes" ? "recipes/" : "ingredients/";
  return { bucket, keyPrefix };
}

/**
 * Upload image to S3 and return presigned URL
 * The presigned URL allows temporary access to the image even if the bucket is private
 */
export async function uploadImageToS3(
  imageData: Buffer | string,
  fileName: string,
  contentType: string = "image/jpeg",
  /** Presigned URL expiry in seconds. Default 1hr. Max 604800 (7 days) for S3 SigV4 presigned URLs. */
  expiresIn: number = 3600,
  /** Which bucket to use: "ingredients" (sous-ingredients) or "recipes" (sous-recipe-images). Default: ingredients */
  bucketType: S3BucketType = "ingredients"
): Promise<string> {
  const { bucket, keyPrefix } = getBucketAndPrefix(bucketType);

  if (!bucket) {
    throw new Error(
      `S3 bucket for ${bucketType} is not configured. ` +
      "Set S3_BUCKET_INGREDIENTS and/or S3_BUCKET_RECIPE_IMAGES (or S3_BUCKET for both). " +
      "Also set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY."
    );
  }

  if (!ENV.awsRegion) {
    throw new Error("AWS_REGION environment variable is not set");
  }

  // Check if credentials are provided (optional for public buckets, but recommended)
  if (!ENV.awsRoleArn && (!ENV.awsAccessKeyId || !ENV.awsSecretAccessKey)) {
    console.warn("AWS credentials not configured. S3 upload may fail if bucket requires authentication.");
  }

  const key = `${keyPrefix}${Date.now()}-${fileName}`;

  // Parse base64 data - handle both data URLs and raw base64 strings
  let buffer: Buffer;
  if (typeof imageData === "string") {
    // Check if it's a data URL (data:image/...;base64,...)
    if (imageData.includes(",")) {
      // Extract base64 part after the comma
      const base64Data = imageData.split(",")[1];
      buffer = Buffer.from(base64Data, "base64");
    } else {
      // Assume it's already just base64
      buffer = Buffer.from(imageData, "base64");
    }
  } else {
    buffer = imageData;
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    // ACL removed - modern S3 buckets often have ACLs disabled
    // Public access should be controlled via bucket policy instead
  });

  // Get S3 client once and reuse it
  const client = await getS3Client();
  
  try {
    await client.send(command);
  } catch (error: any) {
    console.error("S3 upload error:", error);
    // Provide more detailed error message
    if (error.name === "CredentialsProviderError" || error.message?.includes("credentials")) {
      throw new Error("AWS credentials are invalid or not configured. Please check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or AWS_ROLE_ARN for STS.");
    }
    if (error.name === "NoSuchBucket") {
      throw new Error(`S3 bucket "${bucket}" does not exist or is not accessible.`);
    }
    if (error.name === "AccessDenied") {
      throw new Error(`Access denied to S3 bucket "${bucket}". Check bucket permissions and IAM policies.`);
    }
    // Handle region mismatch errors
    if (error.message?.includes("must be addressed using the specified endpoint") || error.code === "PermanentRedirect") {
      // Try to extract region hint from error message
      let regionHint = "";
      const endpointMatch = error.message?.match(/s3[.-]([a-z0-9-]+)\.amazonaws\.com/);
      if (endpointMatch && endpointMatch[1] && endpointMatch[1] !== "amazonaws") {
        regionHint = ` The bucket appears to be in region: ${endpointMatch[1]}`;
      }
      
      throw new Error(
        `S3 bucket region mismatch. The bucket "${bucket}" is in a different region than configured (${ENV.awsRegion}).` +
        `${regionHint || ""} ` +
        `Please set AWS_REGION environment variable to the correct region. ` +
        `You can find the bucket region in AWS Console: S3 → Buckets → "${bucket}" → Properties → AWS Region. ` +
        `Error: ${error.message || error.name}`
      );
    }
    throw new Error(`S3 upload failed: ${error.message || error.name || "Unknown error"}`);
  }

  // Generate a presigned GET URL so the LLM can access the image
  // Presigned URLs work even if the bucket is private
  const getCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  const presignedUrl = await getSignedUrl(client, getCommand, { expiresIn });
  
  // Log to verify presigned URL is generated (contains query parameters)
  console.log(`[S3 Upload] Generated presigned URL for ${key}: ${presignedUrl.substring(0, 100)}...`);
  
  return presignedUrl;
}

/**
 * Generate presigned URL for direct client upload (ingredients bucket only)
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string = "image/jpeg"
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { bucket } = getBucketAndPrefix("ingredients");
  if (!bucket) {
    throw new Error("S3_BUCKET_INGREDIENTS or S3_BUCKET environment variable is not set");
  }

  const key = `ingredients/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const client = await getS3Client();
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  const publicUrl = ENV.awsRegion === "us-east-1"
    ? `https://${bucket}.s3.amazonaws.com/${key}`
    : `https://${bucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl };
}
