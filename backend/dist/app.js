"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const request_id_1 = require("./middleware/request-id");
const response_1 = require("./utils/response");
const config_validator_1 = require("./utils/config-validator");
const createApp = () => {
    // Validate production configuration
    (0, config_validator_1.enforceProductionStartupValidation)();
    const app = (0, express_1.default)();
    // Request correlation tracking
    app.use(request_id_1.requestIdMiddleware);
    // Security HTTP Headers
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", config_1.config.security.corsOrigin],
                fontSrc: ["'self'", 'https:', 'data:'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false,
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
        noSniff: true,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }));
    // CORS
    app.use((0, cors_1.default)({
        origin: [config_1.config.security.corsOrigin, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id'],
        exposedHeaders: ['x-request-id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    if (config_1.config.nodeEnv !== 'test') {
        app.use((0, morgan_1.default)('combined'));
    }
    // Health and Liveness Probes
    app.use(health_routes_1.default);
    app.use(`${config_1.config.apiPrefix}`, health_routes_1.default);
    // Mount Main API routes
    app.use(config_1.config.apiPrefix, routes_1.default);
    // 404 Handler
    app.use((req, res) => {
        (0, response_1.sendError)(res, `Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
    });
    // Centralized Error Handler
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
