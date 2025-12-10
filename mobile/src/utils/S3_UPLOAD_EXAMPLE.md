# S3 Image Upload Guide for Mobile App

## Why AWS SDK Doesn't Work in React Native

The AWS SDK (`@aws-sdk/client-s3`) is designed for Node.js and browsers, not React Native. It won't work in your mobile app because:

1. React Native doesn't have the same JavaScript environment as browsers
2. AWS SDK uses Node.js-specific APIs that don't exist in React Native
3. Bundling AWS SDK significantly increases app size

## Solution: Use Server-Side tRPC Endpoints

The server already has tRPC endpoints for S3 uploads. Your mobile app should use these instead.

## Available tRPC Endpoints

### 1. `ingredients.getUploadUrl` - Get Presigned URL

**Best for: Large images, direct S3 upload**

```typescript
const uploadUrlMutation = trpc.ingredients.getUploadUrl.useMutation();

const { uploadUrl, publicUrl } = await uploadUrlMutation.mutateAsync({
  fileName: 'my-ingredient.jpg',
  contentType: 'image/jpeg'
});
```

### 2. `ingredients.uploadImage` - Upload Base64

**Best for: Small images, simple implementation**

```typescript
const uploadMutation = trpc.ingredients.uploadImage.useMutation();

const { url } = await uploadMutation.mutateAsync({
  imageData: 'data:image/jpeg;base64,...', // base64 string
  fileName: 'my-ingredient.jpg',
  contentType: 'image/jpeg'
});
```

## Complete Example: Upload Ingredient Photo

```typescript
import React, { useState } from 'react';
import { View, Button, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '../api/trpc';
import { convertImageToBase64, getFileNameFromUri, getContentTypeFromUri } from '../utils/s3Upload';

export default function IngredientPhotoUploader() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Method 1: Upload via server (recommended for simplicity)
  const uploadMutation = trpc.ingredients.uploadImage.useMutation({
    onSuccess: (data) => {
      setUploadedUrl(data.url);
      Alert.alert('Success', 'Image uploaded successfully!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    }
  });

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) return;

    try {
      // Convert image to base64
      const base64 = await convertImageToBase64(imageUri);

      // Upload to S3 via server
      await uploadMutation.mutateAsync({
        imageData: base64,
        fileName: getFileNameFromUri(imageUri),
        contentType: getContentTypeFromUri(imageUri),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  return (
    <View>
      <Button title="Pick Image" onPress={pickImage} />

      {imageUri && (
        <>
          <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} />
          <Button
            title="Upload to S3"
            onPress={uploadImage}
            disabled={uploadMutation.isPending}
          />
        </>
      )}

      {uploadedUrl && (
        <Image source={{ uri: uploadedUrl }} style={{ width: 200, height: 200 }} />
      )}
    </View>
  );
}
```

## Advanced Example: Direct S3 Upload with Presigned URL

```typescript
import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { trpc } from '../api/trpc';
import { getFileNameFromUri, getContentTypeFromUri } from '../utils/s3Upload';

export default function DirectS3Uploader() {
  const [uploading, setUploading] = useState(false);

  const getPresignedUrlMutation = trpc.ingredients.getUploadUrl.useMutation();

  const pickAndUpload = async () => {
    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const imageUri = result.assets[0].uri;
    const fileName = getFileNameFromUri(imageUri);
    const contentType = getContentTypeFromUri(imageUri);

    setUploading(true);

    try {
      // Step 1: Get presigned URL from server
      const { uploadUrl, publicUrl } = await getPresignedUrlMutation.mutateAsync({
        fileName,
        contentType,
      });

      // Step 2: Fetch image as blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Step 3: Upload directly to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('S3 upload failed');
      }

      // Step 4: Use publicUrl
      Alert.alert('Success', `Uploaded to: ${publicUrl}`);

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View>
      <Button
        title={uploading ? "Uploading..." : "Pick & Upload Image"}
        onPress={pickAndUpload}
        disabled={uploading}
      />
    </View>
  );
}
```

## Environment Variables (Server-Side)

Make sure these are set in your `.env` file on the **server**:

```bash
# Required
S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1

# Required for upload permissions
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## S3 Bucket Configuration

Your S3 bucket needs:

1. **Public read access** for uploaded images (ACL: public-read)
2. **CORS configuration** for presigned URLs:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

3. **Bucket Policy** for public reads:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Which Method to Use?

### Use **Base64 Upload** (`uploadImage`) when:
- ✅ Images are small (< 1MB)
- ✅ You want simple, straightforward code
- ✅ You don't need to show upload progress
- ✅ You're uploading from the device camera/gallery

### Use **Presigned URL** (`getUploadUrl`) when:
- ✅ Images are large (> 1MB)
- ✅ You want faster uploads (direct to S3)
- ✅ You need upload progress tracking
- ✅ You want to reduce server bandwidth

## Troubleshooting

### "S3_BUCKET environment variable is not set"
- Set environment variables on the **server**, not mobile app
- Check `.env` file exists in the server root directory
- Restart the server after changing `.env`

### "Access denied to S3 bucket"
- Verify AWS credentials are correct
- Check IAM user has `s3:PutObject` permission
- Verify bucket policy allows uploads

### "Failed to upload image to S3"
- Check CORS configuration on S3 bucket
- Verify presigned URL hasn't expired (valid for 1 hour)
- Check network connectivity

### Image not displaying after upload
- Verify bucket has public read access
- Check ACL is set to "public-read"
- Test URL in browser directly
