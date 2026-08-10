/**
 * Production-Grade Server-Side Rate Limiter for Ledgerly
 * Enforces sliding-window rate limiting by User ID or IP address before database operations.
 */

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSec: number;
}

interface WindowRecord {
  count: number;
  startTimeMs: number;
}

// In-memory sliding window cache (server-side runtime)
const memoryStore = new Map<string, WindowRecord>();

// Cleanup stale windows periodically every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now - record.startTimeMs > 300000) {
        memoryStore.delete(key);
      }
    }
  }, 300000);
}

/**
 * Checks rate limit for a given key and configuration.
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const { key, limit, windowSeconds } = config;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  try {
    let record = memoryStore.get(key);

    if (!record || now - record.startTimeMs >= windowMs) {
      record = { count: 1, startTimeMs: now };
      memoryStore.set(key, record);

      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetTimeMs: now + windowMs,
        retryAfterSec: 0,
      };
    }

    record.count += 1;
    const remaining = Math.max(0, limit - record.count);
    const resetTimeMs = record.startTimeMs + windowMs;
    const retryAfterSec = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

    if (record.count > limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        resetTimeMs,
        retryAfterSec,
      };
    }

    return {
      success: true,
      limit,
      remaining,
      resetTimeMs,
      retryAfterSec: 0,
    };
  } catch (error) {
    console.error("[RateLimiter] Error evaluating rate limit:", error);
    // Fail closed for security safety
    return {
      success: false,
      limit,
      remaining: 0,
      resetTimeMs: now + windowMs,
      retryAfterSec: 60,
    };
  }
}

/**
 * Centralized Rate Limit Policy Presets
 */
export const RATE_LIMIT_POLICIES = {
  AUTH: { limit: 5, windowSeconds: 60 },
  MUTATION: { limit: 60, windowSeconds: 60 },
  ACCOUNT_MUTATION: { limit: 30, windowSeconds: 60 },
  IMPORT: { limit: 10, windowSeconds: 60 },
  UPLOAD: { limit: 20, windowSeconds: 60 },
  OCR: { limit: 10, windowSeconds: 60 },
  EXPENSIVE_QUERY: { limit: 15, windowSeconds: 60 },
} as const;

/**
 * Helper to construct rate limit key safely from request context
 */
export function getRateLimitKey(endpoint: string, userId?: string, clientIp?: string): string {
  if (userId) {
    return `usr:${userId}:${endpoint}`;
  }
  const ip = clientIp || "unknown_ip";
  return `ip:${ip}:${endpoint}`;
}
