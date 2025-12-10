/**
 * S3 Image Upload Utilities for Mobile App
 *
 * Note: AWS SDK doesn't work in React Native, so we use the server's
 * tRPC endpoints to handle S3 uploads.
 */

import { trpc } from '../api/trpc';

/**
 * Method 1: Direct upload to S3 using presigned URL
 * This is more efficient for large files as data doesn't go through the server
 */
export async function uploadImageToS3Direct(
  imageUri: string,
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  // Note: This method requires you to pass the tRPC client
  // Usage example in a component:
  // const uploadMutation = trpc.ingredients.getUploadUrl.useMutation();
  // const { uploadUrl, publicUrl } = await uploadMutation.mutateAsync({ fileName, contentType });

  // Fetch the image as blob
  const response = await fetch(imageUri);
  const blob = await response.blob();

  // Upload to S3 using presigned URL
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to S3');
  }

  return publicUrl;
}

/**
 * Method 2: Upload via server (base64)
 * Simpler but less efficient for large files
 */
export async function convertImageToBase64(imageUri: string): Promise<string> {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper to extract filename from URI
 */
export function getFileNameFromUri(uri: string): string {
  const filename = uri.split('/').pop() || 'image.jpg';
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}-${timestamp}.${extension}`;
}

/**
 * Helper to get content type from URI
 */
export function getContentTypeFromUri(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}
