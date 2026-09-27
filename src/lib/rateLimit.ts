export interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimitStore {
  get(key: string): RateLimitRecord | undefined;
  set(key: string, record: RateLimitRecord): void;
  delete(key: string): void;
}

class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, RateLimitRecord>();

  constructor() {
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        const now = Date.now();
        this.store.forEach((record, key) => {
          if (now > record.resetTime) {
            this.store.delete(key);
          }
        });
      }, 5 * 60 * 1000);
    }
  }

  get(key: string): RateLimitRecord | undefined {
    return this.store.get(key);
  }

  set(key: string, record: RateLimitRecord): void {
    this.store.set(key, record);
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

let activeStore: RateLimitStore = new MemoryRateLimitStore();

/**
 * Configure a custom or shared rate limit store (e.g. for multi-instance production)
 */
export function setRateLimitStore(store: RateLimitStore) {
  activeStore = store;
}

/**
 * Sliding window rate limiter (uses in-memory by default, customizable via setRateLimitStore)
 * @param key unique identifier (e.g. client IP + route)
 * @param limit maximum allowed requests within the time window
 * @param windowMs window duration in milliseconds (default 60s)
 */
export function checkRateLimit(key: string, limit: number = 10, windowMs: number = 60 * 1000): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const now = Date.now();
  const record = activeStore.get(key);

  if (!record || now > record.resetTime) {
    activeStore.set(key, { count: 1, resetTime: now + windowMs });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(record.resetTime / 1000),
    };
  }

  record.count += 1;
  activeStore.set(key, record);
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: Math.ceil(record.resetTime / 1000),
  };
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
