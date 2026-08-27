"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRateLimiter = exports.apiGeneralRateLimiter = exports.authRateLimiter = exports.createRateLimiter = void 0;
const response_1 = require("../utils/response");
const memoryStore = {};
const createRateLimiter = (options) => {
    const { windowMs = 60 * 1000, maxRequests = 100, message = 'Too many requests from this IP, please try again later.', keyGenerator = (req) => req.ip || req.socket.remoteAddress || 'unknown-ip', } = options;
    return (req, res, next) => {
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
            return (0, response_1.sendError)(res, message, 429, 'TOO_MANY_REQUESTS', { retryAfter: retryAfterSeconds });
        }
        next();
    };
};
exports.createRateLimiter = createRateLimiter;
// Standard preconfigured limiters
exports.authRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 mins
    maxRequests: 30, // 30 requests per 15 mins for auth
    message: 'Too many authentication attempts. Please try again later.',
});
exports.apiGeneralRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 60 * 1000, // 1 min
    maxRequests: 120, // 120 requests per min
    message: 'API rate limit exceeded. Please slow down your requests.',
});
exports.paymentRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 5 * 60 * 1000, // 5 mins
    maxRequests: 20,
    message: 'Too many payment verification requests.',
});
