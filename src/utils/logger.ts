/**
 * Centralized logging utility
 * Replaces console.log statements throughout the application
 *
 * Features:
 * - Environment-aware (logs only in development)
 * - Structured logging with levels
 * - Easy to integrate with external services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  /**
   * Format log message with timestamp and context
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Send logs to external service (placeholder for future integration)
   */
  private sendToService(level: LogLevel, message: string, context?: LogContext) {
    // TODO: Integrate with logging service
    // Example: Sentry, LogRocket, DataDog, etc.
    // if (level === 'error') {
    //   Sentry.captureException(new Error(message), { extra: context });
    // }
  }

  /**
   * Debug level logging - development only
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.format('debug', message, context));
    }
  }

  /**
   * Info level logging - development only
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.info(this.format('info', message, context));
    }
  }

  /**
   * Warning level logging - always logs
   */
  warn(message: string, context?: LogContext) {
    console.warn(this.format('warn', message, context));
    this.sendToService('warn', message, context);
  }

  /**
   * Error level logging - always logs and sends to service
   */
  error(message: string, error?: Error | any, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error
    };

    console.error(this.format('error', message, errorContext));
    this.sendToService('error', message, errorContext);
  }

  /**
   * Log auth-related events
   */
  auth(event: string, details?: LogContext) {
    this.info(`[AUTH] ${event}`, details);
  }

  /**
   * Log API calls
   */
  api(method: string, endpoint: string, details?: LogContext) {
    this.debug(`[API] ${method} ${endpoint}`, details);
  }

  /**
   * Log user actions
   */
  userAction(action: string, details?: LogContext) {
    this.info(`[USER_ACTION] ${action}`, details);
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const { debug, info, warn, error, auth, api, userAction } = logger;
