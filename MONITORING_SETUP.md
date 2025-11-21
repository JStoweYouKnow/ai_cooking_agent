# Monitoring & Error Tracking Setup Guide

This guide explains how to set up comprehensive monitoring and error tracking for the AI Cooking Agent application.

## Overview

The application supports optional integration with **Sentry** for error tracking and monitoring. When configured, it provides:

- **Error Tracking**: Automatic capture of exceptions and errors
- **Performance Monitoring**: Track API response times and database queries
- **User Context**: Associate errors with specific users
- **Breadcrumbs**: Track user actions leading to errors
- **Release Tracking**: Track errors by application version

## Setup Instructions

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project
3. Select your platform:
   - **Backend**: Node.js
   - **Frontend**: React (Next.js)

### 2. Get Your DSN

After creating the project, Sentry will provide you with a DSN (Data Source Name). It looks like:
```
https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### 3. Configure Environment Variables

#### Backend (Server)

Add to your `.env` file:
```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### Frontend (Client)

Add to your `.env.local` or `.env` file:
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### 4. Install Sentry Packages

```bash
# Backend
pnpm add @sentry/node

# Frontend
pnpm add @sentry/react
```

### 5. Verify Setup

1. **Backend**: Check server logs for "Sentry initialized successfully"
2. **Frontend**: Check browser console for "Sentry initialized successfully"
3. **Test Error Capture**: Trigger a test error and verify it appears in Sentry dashboard

## Features

### Automatic Error Capture

Errors are automatically captured in:

- **Error Boundaries**: React error boundaries capture component errors
- **tRPC Errors**: Server-side errors are captured with context
- **Unhandled Exceptions**: Uncaught exceptions are automatically tracked

### Manual Error Tracking

You can manually capture errors:

```typescript
import { captureException } from '@/lib/monitoring'; // Frontend
import { captureException } from '../_core/monitoring'; // Backend

try {
  // Your code
} catch (error) {
  captureException(error, {
    context: 'user action',
    userId: 123,
  });
}
```

### User Context

Set user context to associate errors with users:

```typescript
import { setUserContext } from '@/lib/monitoring';

setUserContext(userId, email, username);
```

### Breadcrumbs

Add breadcrumbs to track user actions:

```typescript
import { addBreadcrumb } from '@/lib/monitoring';

addBreadcrumb('User clicked button', 'user-action', 'info', {
  buttonId: 'save-recipe',
});
```

## Health Check Endpoint

The application includes a comprehensive health check endpoint:

### Endpoint

```
GET /api/trpc/system.health
```

### Response

```json
{
  "status": "ok" | "degraded" | "error",
  "timestamp": "2024-11-18T12:00:00.000Z",
  "checks": {
    "database": {
      "status": "ok",
      "latency": 5
    },
    "environment": {
      "status": "ok"
    },
    "memory": {
      "status": "ok",
      "message": "RSS: 150MB, Heap: 50/100MB"
    },
    "uptime": {
      "status": "ok",
      "message": "3600 seconds"
    }
  }
}
```

### Status Codes

- **ok**: All checks passed
- **degraded**: Some checks failed but service is operational
- **error**: Critical checks failed

### Docker Health Check

The Docker Compose configuration uses this endpoint for health checks:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/trpc/system.health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Monitoring Best Practices

### 1. Filter Sensitive Data

The monitoring setup automatically filters sensitive data:
- Authorization headers
- Cookie values
- Passwords

### 2. Set Appropriate Sample Rates

In production, use lower sample rates to reduce costs:

```typescript
tracesSampleRate: 0.1, // 10% of transactions
replaysSessionSampleRate: 0.1, // 10% of sessions
replaysOnErrorSampleRate: 1.0, // 100% of error sessions
```

### 3. Environment-Specific Configuration

- **Development**: Full sampling (1.0) for debugging
- **Production**: Reduced sampling (0.1) for cost efficiency

### 4. Monitor Key Metrics

Track these metrics in Sentry:
- Error rate
- Response time (p50, p95, p99)
- Database query performance
- API endpoint performance

## Troubleshooting

### Sentry Not Initializing

1. Check environment variables are set correctly
2. Verify DSN format is correct
3. Check network connectivity to Sentry
4. Review console logs for initialization errors

### Errors Not Appearing in Sentry

1. Verify Sentry is initialized (check logs)
2. Check Sentry project settings
3. Verify DSN matches project
4. Check rate limiting in Sentry dashboard

### Health Check Failing

1. Check database connectivity
2. Verify environment variables
3. Check application logs
4. Review Docker health check logs

## Alternative Monitoring Solutions

If you prefer not to use Sentry, you can integrate:

- **Rollbar**: Similar error tracking service
- **Datadog**: Full APM solution
- **New Relic**: Application performance monitoring
- **LogRocket**: Session replay and error tracking

To use an alternative, modify:
- `server/_core/monitoring.ts` (backend)
- `client/src/lib/monitoring.ts` (frontend)

## Production Checklist

- [ ] Sentry DSN configured for backend
- [ ] Sentry DSN configured for frontend
- [ ] Health check endpoint tested
- [ ] Error tracking verified
- [ ] User context set correctly
- [ ] Sample rates configured for production
- [ ] Alerts configured in Sentry
- [ ] Docker health checks working
- [ ] Monitoring dashboard set up

## Support

For issues or questions:
1. Check Sentry documentation: https://docs.sentry.io
2. Review application logs
3. Check health check endpoint status
4. Verify environment configuration

