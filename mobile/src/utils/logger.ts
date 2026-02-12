/**
 * Production-ready logger utility
 * Conditionally logs based on environment and log level
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  includeTimestamp: boolean;
  includeTags: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Default configuration based on environment
const defaultConfig: LoggerConfig = {
  enabled: __DEV__,
  minLevel: __DEV__ ? "debug" : "warn",
  includeTimestamp: __DEV__,
  includeTags: true,
};

let config: LoggerConfig = { ...defaultConfig };

/**
 * Configure the logger
 */
export const configureLogger = (newConfig: Partial<LoggerConfig>) => {
  config = { ...config, ...newConfig };
};

/**
 * Format a log message with optional timestamp and tag
 */
const formatMessage = (tag: string, message: string): string => {
  const parts: string[] = [];

  if (config.includeTimestamp) {
    const now = new Date();
    parts.push(`[${now.toISOString().split("T")[1].slice(0, 12)}]`);
  }

  if (config.includeTags && tag) {
    parts.push(`[${tag}]`);
  }

  parts.push(message);

  return parts.join(" ");
};

/**
 * Check if a log level should be output
 */
const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
};

/**
 * Create a tagged logger instance
 */
export const createLogger = (tag: string) => {
  return {
    debug: (message: string, ...args: any[]) => {
      if (shouldLog("debug")) {
        console.log(formatMessage(tag, message), ...args);
      }
    },
    info: (message: string, ...args: any[]) => {
      if (shouldLog("info")) {
        console.info(formatMessage(tag, message), ...args);
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (shouldLog("warn")) {
        console.warn(formatMessage(tag, message), ...args);
      }
    },
    error: (message: string, ...args: any[]) => {
      if (shouldLog("error")) {
        console.error(formatMessage(tag, message), ...args);
      }
    },
  };
};

// Default logger instance
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (shouldLog("debug")) {
      console.log(formatMessage("App", message), ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (shouldLog("info")) {
      console.info(formatMessage("App", message), ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (shouldLog("warn")) {
      console.warn(formatMessage("App", message), ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (shouldLog("error")) {
      console.error(formatMessage("App", message), ...args);
    }
  },
};

export default logger;
