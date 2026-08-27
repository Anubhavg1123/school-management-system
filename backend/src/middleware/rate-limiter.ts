import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const memoryStore: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs = 60 * 1000,
    maxRequests = 100,
    message = 'Too many requests from this IP, please try again later.',
    keyGenerator = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown-ip',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    const record = memoryStore[key];

    if (!record || now > record.resetTime) {
      memoryStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', Math.ceil((now + windowMs) / 1000));
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, maxRequests - record.count);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return sendError(res, message, 429, 'TOO_MANY_REQUESTS', { retryAfter: retryAfterSeconds });
    }

    next();
  };
};

// Standard preconfigured limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  maxRequests: 30, // 30 requests per 15 mins for auth
  message: 'Too many authentication attempts. Please try again later.',
});

export const apiGeneralRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 min
  maxRequests: 120, // 120 requests per min
  message: 'API rate limit exceeded. Please slow down your requests.',
});

export const paymentRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 mins
  maxRequests: 20,
  message: 'Too many payment verification requests.',
});
