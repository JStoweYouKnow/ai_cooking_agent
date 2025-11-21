/**
 * Frontend monitoring and error tracking
 * Supports Sentry integration when NEXT_PUBLIC_SENTRY_DSN is configured
 */

let Sentry: any = null;
let isSentryInitialized = false;

async function initSentry() {
  if (isSentryInitialized || typeof window === 'undefined') return;
  
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    // Sentry not configured, skip initialization
    isSentryInitialized = true;
    return;
  }

  try {
    // Dynamic import to avoid requiring Sentry if not configured
    const sentryModule = await import('@sentry/react');
    Sentry = sentryModule;
    
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }
        }
        return event;
      },
    });
    
    isSentryInitialized = true;
    console.debug('Sentry initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Sentry', error);
    isSentryInitialized = true; // Mark as initialized to prevent retries
  }
}

/**
 * Capture an exception to error tracking service
 */
export async function captureException(error: Error, context?: Record<string, unknown>) {
  await initSentry();
  
  if (Sentry) {
    try {
      Sentry.captureException(error, {
        extra: context,
      });
    } catch (err) {
      console.error('Failed to capture exception to Sentry', err);
    }
  }
  
  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Exception occurred', error, context);
  }
}

/**
 * Capture a message to error tracking service
 */
export async function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
) {
  await initSentry();
  
  if (Sentry) {
    try {
      Sentry.captureMessage(message, {
        level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
        extra: context,
      });
    } catch (err) {
      console.error('Failed to capture message to Sentry', err);
    }
  }
  
  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](message, context);
  }
}

/**
 * Set user context for error tracking
 */
export async function setUserContext(userId: number, email?: string, username?: string) {
  await initSentry();
  
  if (Sentry) {
    try {
      Sentry.setUser({
        id: userId.toString(),
        email,
        username,
      });
    } catch (err) {
      console.warn('Failed to set Sentry user context', err);
    }
  }
}

/**
 * Clear user context
 */
export async function clearUserContext() {
  await initSentry();
  
  if (Sentry) {
    try {
      Sentry.setUser(null);
    } catch (err) {
      // Silently fail
    }
  }
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initSentry().catch(() => {
    // Silently fail initialization
  });
}

