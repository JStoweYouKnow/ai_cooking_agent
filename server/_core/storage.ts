/**
 * Image upload to S3 for ingredient photo recognition
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./env";

const s3Client = new S3Client({
  region: ENV.awsRegion,
  credentials: ENV.awsAccessKeyId && ENV.awsSecretAccessKey
    ? {
        accessKeyId: ENV.awsAccessKeyId,
        secretAccessKey: ENV.awsSecretAccessKey,
      }
    : undefined,
});

/**
 * Upload image to S3 and return public URL
 */
export async function uploadImageToS3(
  imageData: Buffer | string,
  fileName: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  if (!ENV.s3Bucket) {
    throw new Error("S3_BUCKET environment variable is not set");
  }

  const key = `ingredients/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
    Body: typeof imageData === "string" ? Buffer.from(imageData.split(",")[1], "base64") : imageData,
    ContentType: contentType,
    ACL: "public-read",
  });

  await s3Client.send(command);

  // Return public URL
  return `https://${ENV.s3Bucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;
}

/**
 * Generate presigned URL for direct client upload
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string = "image/jpeg"
): Promise<{ uploadUrl: string; publicUrl: string }> {
  if (!ENV.s3Bucket) {
    throw new Error("S3_BUCKET environment variable is not set");
  }

  const key = `ingredients/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
    ContentType: contentType,
    ACL: "public-read",
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const publicUrl = `https://${ENV.s3Bucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl };
}

