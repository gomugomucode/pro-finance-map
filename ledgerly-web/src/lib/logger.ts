/**
 * Production-grade Structured Logger for Ledgerly
 * Provides JSON-formatted logging with Request IDs, Correlation IDs, and Sentry/monitoring integration hooks.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  requestId?: string;
  correlationId?: string;
  userId?: string;
  context?: Record<string, unknown>;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  public createCorrelationId(): string {
    return `corr_${this.generateId()}`;
  }

  public createRequestId(): string {
    return `req_${this.generateId()}`;
  }

  private format(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    err?: Error,
    requestId?: string,
    correlationId?: string
  ): LogPayload {
    const payload: LogPayload = {
      message,
      level,
      timestamp: this.getTimestamp(),
      requestId,
      correlationId,
      context,
    };

    if (err) {
      payload.error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    }

    return payload;
  }

  public info(message: string, context?: Record<string, unknown>, requestId?: string, correlationId?: string): void {
    const payload = this.format("info", message, context, undefined, requestId, correlationId);
    console.log(JSON.stringify(payload));
  }

  public warn(message: string, context?: Record<string, unknown>, requestId?: string, correlationId?: string): void {
    const payload = this.format("warn", message, context, undefined, requestId, correlationId);
    console.warn(JSON.stringify(payload));
  }

  public error(message: string, err?: Error, context?: Record<string, unknown>, requestId?: string, correlationId?: string): void {
    const payload = this.format("error", message, context, err, requestId, correlationId);
    console.error(JSON.stringify(payload));
  }

  public debug(message: string, context?: Record<string, unknown>, requestId?: string, correlationId?: string): void {
    if (process.env.NODE_ENV !== "production") {
      const payload = this.format("debug", message, context, undefined, requestId, correlationId);
      console.debug(JSON.stringify(payload));
    }
  }
}

export const logger = new Logger();
