"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const crypto_1 = require("crypto");
const requestIdMiddleware = (req, res, next) => {
    const existingId = req.headers['x-request-id'];
    const requestId = existingId || (0, crypto_1.randomUUID)();
    // Attach to request and response header
    req.id = requestId;
    res.setHeader('x-request-id', requestId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
