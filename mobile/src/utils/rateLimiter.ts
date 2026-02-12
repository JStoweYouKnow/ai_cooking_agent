/**
 * Client-Side Rate Limiter
 * Prevents excessive API calls and protects against abuse
 */

interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

interface RateLimitState {
  requests: number[];
  blocked: boolean;
  blockedUntil: number | null;
}

// Default configurations for different operation types
const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // Standard API calls
  default: { maxRequests: 60, windowMs: 60000 }, // 60 per minute

  // Search operations (more restrictive)
  search: { maxRequests: 20, windowMs: 60000 }, // 20 per minute

  // Mutations (create, update, delete)
  mutation: { maxRequests: 30, windowMs: 60000 }, // 30 per minute

  // Image uploads
  upload: { maxRequests: 10, windowMs: 60000 }, // 10 per minute

  // Auth operations (very restrictive)
  auth: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
};

// Store rate limit state per operation type
const limitStates: Map<string, RateLimitState> = new Map();

/**
 * Get or create rate limit state for an operation
 */
const getState = (operation: string): RateLimitState => {
  if (!limitStates.has(operation)) {
    limitStates.set(operation, {
      requests: [],
      blocked: false,
      blockedUntil: null,
    });
  }
  return limitStates.get(operation)!;
};

/**
 * Clean up old requests outside the time window
 */
const cleanupRequests = (state: RateLimitState, windowMs: number): void => {
  const now = Date.now();
  const cutoff = now - windowMs;
  state.requests = state.requests.filter((timestamp) => timestamp > cutoff);
};

/**
 * Check if the operation is blocked
 */
const isBlocked = (state: RateLimitState): boolean => {
  if (!state.blocked) return false;

  if (state.blockedUntil && Date.now() >= state.blockedUntil) {
    // Block period has expired
    state.blocked = false;
    state.blockedUntil = null;
    return false;
  }

  return true;
};

/**
 * Check if an operation is allowed under rate limits
 */
export const checkRateLimit = (
  operation: string = "default"
): { allowed: boolean; retryAfterMs?: number; remaining?: number } => {
  const config = DEFAULT_CONFIGS[operation] || DEFAULT_CONFIGS.default;
  const state = getState(operation);

  // Check if currently blocked
  if (isBlocked(state)) {
    const retryAfterMs = state.blockedUntil ? state.blockedUntil - Date.now() : config.windowMs;
    return { allowed: false, retryAfterMs };
  }

  // Clean up old requests
  cleanupRequests(state, config.windowMs);

  // Check if limit exceeded
  if (state.requests.length >= config.maxRequests) {
    // Block for remaining window time
    const oldestRequest = Math.min(...state.requests);
    const retryAfterMs = oldestRequest + config.windowMs - Date.now();

    state.blocked = true;
    state.blockedUntil = Date.now() + retryAfterMs;

    console.warn(`[RateLimiter] Rate limit exceeded for operation: ${operation}`);

    return { allowed: false, retryAfterMs };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - state.requests.length,
  };
};

/**
 * Record a request for rate limiting
 */
export const recordRequest = (operation: string = "default"): void => {
  const state = getState(operation);
  state.requests.push(Date.now());
};

/**
 * Execute a function with rate limiting
 * Returns null if rate limited, otherwise returns the function result
 */
export const withRateLimit = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<{ result: T; rateLimited: false } | { result: null; rateLimited: true; retryAfterMs: number }> => {
  const check = checkRateLimit(operation);

  if (!check.allowed) {
    return {
      result: null,
      rateLimited: true,
      retryAfterMs: check.retryAfterMs || 1000,
    };
  }

  recordRequest(operation);
  const result = await fn();

  return { result, rateLimited: false };
};

/**
 * Create a rate-limited version of a function
 */
export const createRateLimitedFunction = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operation: string = "default"
): ((...args: Parameters<T>) => Promise<ReturnType<T> | null>) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
    const check = checkRateLimit(operation);

    if (!check.allowed) {
      console.warn(
        `[RateLimiter] Request blocked for ${operation}. Retry after ${check.retryAfterMs}ms`
      );
      return null;
    }

    recordRequest(operation);
    return fn(...args);
  };
};

/**
 * Reset rate limits for an operation (useful after successful login)
 */
export const resetRateLimit = (operation: string): void => {
  limitStates.delete(operation);
};

/**
 * Reset all rate limits
 */
export const resetAllRateLimits = (): void => {
  limitStates.clear();
};

/**
 * Get rate limit status for debugging
 */
export const getRateLimitStatus = (
  operation: string = "default"
): { requests: number; remaining: number; blocked: boolean; blockedUntil: number | null } => {
  const config = DEFAULT_CONFIGS[operation] || DEFAULT_CONFIGS.default;
  const state = getState(operation);

  cleanupRequests(state, config.windowMs);

  return {
    requests: state.requests.length,
    remaining: Math.max(0, config.maxRequests - state.requests.length),
    blocked: isBlocked(state),
    blockedUntil: state.blockedUntil,
  };
};

/**
 * Configure rate limit for a custom operation
 */
export const configureRateLimit = (operation: string, config: RateLimitConfig): void => {
  DEFAULT_CONFIGS[operation] = config;
};

export default {
  check: checkRateLimit,
  record: recordRequest,
  withRateLimit,
  createRateLimited: createRateLimitedFunction,
  reset: resetRateLimit,
  resetAll: resetAllRateLimits,
  getStatus: getRateLimitStatus,
  configure: configureRateLimit,
};
