/**
 * Production-ready logging utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;

    const logObject: Record<string, unknown> = {
      timestamp,
      level: level.toUpperCase(),
      message,
    };

    if (context && Object.keys(context).length > 0) {
      logObject.context = context;
    }

    if (error) {
      logObject.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // In production, you might want to send this to a logging service
    // (e.g., Datadog, Sentry, CloudWatch, etc.)
    return JSON.stringify(logObject);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    const formattedLog = this.formatLog(entry);

    // Output to console (in production, this goes to your logging service)
    switch (level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, contextOrError?: Record<string, unknown> | Error, maybeError?: Error) {
    if (contextOrError instanceof Error) {
      this.log('error', message, undefined, contextOrError);
    } else {
      this.log('error', message, contextOrError, maybeError);
    }
  }

  // Request logging helper
  logRequest(req: { method?: string; url?: string; ip?: string; userId?: number }) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.userId,
    });
  }

  // Database query logging helper
  logQuery(query: string, duration?: number) {
    this.debug('Database Query', {
      query,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  // External API call logging
  logApiCall(service: string, endpoint: string, duration?: number, success: boolean = true) {
    this.info('External API Call', {
      service,
      endpoint,
      duration: duration ? `${duration}ms` : undefined,
      success,
    });
  }
}

// Get log level from environment or default to 'info'
const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

// Export singleton instance
export const logger = new Logger(logLevel);

// Export for testing or custom instances
export { Logger };
