/**
 * Monitoring and error tracking utilities
 * Supports Sentry integration when SENTRY_DSN is configured
 */

import { logger } from './logger';

// Sentry integration (optional - only if SENTRY_DSN is set)
let Sentry: any = null;
let isSentryInitialized = false;

async function initSentry() {
  if (isSentryInitialized) return;
  
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.debug('Sentry DSN not configured, skipping initialization');
    isSentryInitialized = true;
    return;
  }

  try {
    // Dynamic import to avoid requiring Sentry if not configured
    const sentryModule = await import('@sentry/node');
    Sentry = sentryModule;
    
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
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
    logger.info('Sentry initialized successfully');
  } catch (error) {
    logger.warn('Failed to initialize Sentry', { error });
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
      logger.error('Failed to capture exception to Sentry', { error: err });
    }
  }
  
  // Always log to our logger
  logger.error('Exception occurred', context, error);
}

/**
 * Capture a message to error tracking service
 */
export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>) {
  await initSentry();
  
  if (Sentry) {
    try {
      Sentry.captureMessage(message, {
        level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
        extra: context,
      });
    } catch (err) {
      logger.error('Failed to capture message to Sentry', { error: err });
    }
  }
  
  // Always log to our logger
  logger[level](message, context);
}

/**
 * Add breadcrumb for debugging
 */
export async function addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, unknown>) {
  await initSentry();
  
  if (Sentry) {
    try {
      Sentry.addBreadcrumb({
        message,
        category,
        level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
        data,
      });
    } catch (err) {
      // Silently fail breadcrumb addition
    }
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
      logger.warn('Failed to set Sentry user context', { error: err });
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

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      await addBreadcrumb(
        context ? `Starting ${context}` : 'Function call',
        'function',
        'info',
        { args: args.length }
      );
      const result = await fn(...args);
      await addBreadcrumb(
        context ? `Completed ${context}` : 'Function completed',
        'function',
        'info',
        { success: true }
      );
      return result;
    } catch (error) {
      await captureException(
        error instanceof Error ? error : new Error(String(error)),
        { context, args: args.length }
      );
      throw error;
    }
  }) as T;
}

