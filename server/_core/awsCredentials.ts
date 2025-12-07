/**
 * AWS credential verification and management utilities
 * Provides functions to verify AWS credentials and list IAM access keys
 */
import { IAMClient, ListAccessKeysCommand, GetUserCommand } from "@aws-sdk/client-iam";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";
import { ENV } from "./env";

const iamClient = new IAMClient({
  region: ENV.awsRegion,
  credentials: ENV.awsAccessKeyId && ENV.awsSecretAccessKey
    ? {
        accessKeyId: ENV.awsAccessKeyId,
        secretAccessKey: ENV.awsSecretAccessKey,
      }
    : undefined,
});

/**
 * Verify AWS credentials by attempting to get the current user
 */
export async function verifyAWSCredentials(): Promise<{
  valid: boolean;
  userName?: string;
  userId?: string;
  error?: string;
}> {
  try {
    const command = new GetUserCommand({});
    const response = await iamClient.send(command);
    
    return {
      valid: true,
      userName: response.User?.UserName,
      userId: response.User?.UserId,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || error.name || "Unknown error",
    };
  }
}

/**
 * Verify S3 access by attempting to list buckets
 */
export async function verifyS3Access(): Promise<{
  valid: boolean;
  bucketCount?: number;
  error?: string;
}> {
  try {
    const s3Client = new S3Client({
      region: ENV.awsRegion,
      credentials: ENV.awsAccessKeyId && ENV.awsSecretAccessKey
        ? {
            accessKeyId: ENV.awsAccessKeyId,
            secretAccessKey: ENV.awsSecretAccessKey,
          }
        : undefined,
    });

    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    return {
      valid: true,
      bucketCount: response.Buckets?.length || 0,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || error.name || "Unknown error",
    };
  }
}

/**
 * A generator function that handles paginated results for listing access keys
 * Similar to the provided JavaScript example
 * 
 * @param {string} userName - The IAM user name to list access keys for (optional, defaults to current user)
 */
export async function* listAccessKeys(userName?: string): AsyncGenerator<{
  AccessKeyId: string;
  Status: string;
  CreateDate: Date;
}, void, unknown> {
  try {
    const command = new ListAccessKeysCommand({
      MaxItems: 5,
      UserName: userName,
    });

    let response = await iamClient.send(command);

    while (response?.AccessKeyMetadata?.length) {
      for (const key of response.AccessKeyMetadata) {
        if (key.AccessKeyId && key.Status && key.CreateDate) {
          yield {
            AccessKeyId: key.AccessKeyId,
            Status: key.Status,
            CreateDate: key.CreateDate,
          };
        }
      }

      if (response.IsTruncated && response.Marker) {
        response = await iamClient.send(
          new ListAccessKeysCommand({
            Marker: response.Marker,
            MaxItems: 5,
            UserName: userName,
          })
        );
      } else {
        break;
      }
    }
  } catch (error: any) {
    console.error("Error listing access keys:", error);
    throw new Error(`Failed to list access keys: ${error.message || error.name || "Unknown error"}`);
  }
}

/**
 * Get all access keys for a user (non-generator version)
 */
export async function getAllAccessKeys(userName?: string): Promise<Array<{
  AccessKeyId: string;
  Status: string;
  CreateDate: Date;
}>> {
  const keys: Array<{
    AccessKeyId: string;
    Status: string;
    CreateDate: Date;
  }> = [];

  for await (const key of listAccessKeys(userName)) {
    keys.push(key);
  }

  return keys;
}



