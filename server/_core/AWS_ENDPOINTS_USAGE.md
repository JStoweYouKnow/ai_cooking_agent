# AWS Endpoints Usage Guide

## tRPC Endpoint Format

tRPC endpoints use different HTTP methods:
- **Queries** (.query()) - **MUST use GET requests** (cannot use POST)
- **Mutations** (.mutation()) - Use POST requests with JSON bodies
- **Via tRPC client** (TypeScript/JavaScript - recommended)

For queries, tRPC uses GET with a URL-encoded `input` query parameter.

## Available AWS Endpoints

### 1. List Access Keys

**Endpoint:** `system.listAccessKeys`  
**Method:** GET (queries must use GET, not POST)  
**Auth:** Admin only

**Request (GET method with URL-encoded input):**
```bash
# With userName parameter (URL-encoded JSON)
# The input {"userName":"optional-username"} becomes %7B%22userName%22%3A%22optional-username%22%7D
curl "http://localhost:3000/api/trpc/system.listAccessKeys?input=%7B%22userName%22%3A%22optional-username%22%7D" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or using jq for URL encoding (easier to read):
curl "http://localhost:3000/api/trpc/system.listAccessKeys?input=$(echo '{"userName":"optional-username"}' | jq -sRr @uri)" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Without userName parameter (lists keys for current authenticated user)
curl "http://localhost:3000/api/trpc/system.listAccessKeys" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With empty input object (if you need to explicitly pass empty input)
curl "http://localhost:3000/api/trpc/system.listAccessKeys?input=%7B%7D" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Using tRPC Client (TypeScript) - Recommended:**
```typescript
import { trpc } from '@/lib/trpc';

// In a React component
const { data, isLoading } = trpc.system.listAccessKeys.useQuery({
  userName: 'optional-username', // optional
});
```

**Response:**
```json
{
  "result": {
    "data": {
      "success": true,
      "keys": [
        {
          "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
          "status": "Active",
          "createDate": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  }
}
```

### 2. Verify AWS Credentials

**Endpoint:** `system.verifyAWSCredentials`  
**Method:** GET (queries must use GET)  
**Auth:** Admin only

**Request:**
```bash
curl "http://localhost:3000/api/trpc/system.verifyAWSCredentials" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Using tRPC Client:**
```typescript
const { data } = trpc.system.verifyAWSCredentials.useQuery();
```

**Response:**
```json
{
  "result": {
    "data": {
      "credentials": {
        "valid": true,
        "userName": "my-user",
        "userId": "AIDAEXAMPLE"
      },
      "s3": {
        "valid": true,
        "bucketCount": 3
      }
    }
  }
}
```

### 3. Health Check (includes AWS status)

**Endpoint:** `system.health`  
**Method:** GET (queries must use GET)  
**Auth:** Public

**Request:**
```bash
curl "http://localhost:3000/api/trpc/system.health"
```

**Response:**
```json
{
  "result": {
    "data": {
      "status": "ok",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "checks": {
        "database": {
          "status": "ok",
          "latency": 5
        },
        "aws": {
          "status": "ok",
          "message": "User: my-user",
          "latency": 150
        },
        "s3": {
          "status": "ok",
          "message": "Accessible (3 buckets)",
          "latency": 200
        }
      }
    }
  }
}
```

## Notes

- **Queries must use GET requests** - POST will return "METHOD_NOT_SUPPORTED" error (405)
- **Mutations use POST requests** with JSON bodies
- Admin endpoints require authentication (Bearer token in Authorization header or session cookie)
- The `userName` parameter in `listAccessKeys` is optional - if omitted, it lists keys for the current authenticated user
- AWS credential verification is automatically included in the health check if AWS credentials are configured

## Testing with curl

For admin endpoints, you'll need to include your session cookie or Bearer token:

```bash
# Using session cookie (GET request for queries)
curl "http://localhost:3000/api/trpc/system.listAccessKeys" \
  -H "Cookie: session=YOUR_SESSION_COOKIE"

# Using Bearer token (GET request for queries)
curl "http://localhost:3000/api/trpc/system.listAccessKeys" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With userName parameter
curl "http://localhost:3000/api/trpc/system.listAccessKeys?input=%7B%22userName%22%3A%22myuser%22%7D" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

