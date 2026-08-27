"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, statusCode = 200, meta) => {
    const response = {
        success: true,
        data,
        meta,
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 400, code = 'BAD_REQUEST', details) => {
    const response = {
        success: false,
        error: {
            code,
            message,
            details,
        },
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
