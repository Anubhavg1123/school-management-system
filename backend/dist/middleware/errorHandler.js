"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 400, code = 'APP_ERROR', details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    logger_1.logger.error(`Error processing ${req.method} ${req.originalUrl}: ${err.message}`, {
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const formattedErrors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        return (0, response_1.sendError)(res, 'Validation failed', 422, 'VALIDATION_ERROR', formattedErrors);
    }
    // Handle custom AppError
    if (err instanceof AppError) {
        return (0, response_1.sendError)(res, err.message, err.statusCode, err.code, err.details);
    }
    // Handle Prisma known errors safely without leaking DB internals
    if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
        if (err.code === 'P2002') {
            return (0, response_1.sendError)(res, 'A record with this unique field already exists.', 409, 'DUPLICATE_RECORD');
        }
        if (err.code === 'P2025') {
            return (0, response_1.sendError)(res, 'Requested record was not found.', 404, 'RECORD_NOT_FOUND');
        }
        return (0, response_1.sendError)(res, 'A database error occurred.', 500, 'DATABASE_ERROR');
    }
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return (0, response_1.sendError)(res, 'Invalid or expired session token.', 401, 'UNAUTHORIZED');
    }
    // Default Internal Server Error
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    return (0, response_1.sendError)(res, message, 500, 'INTERNAL_SERVER_ERROR');
};
exports.errorHandler = errorHandler;
