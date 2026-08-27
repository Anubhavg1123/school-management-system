"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const go_live_check_service_1 = require("../services/go-live-check.service");
const reconciliation_service_1 = require("../services/reconciliation.service");
const response_1 = require("../utils/response");
class AdminController {
    /**
     * GET /api/admin/go-live-check
     * Returns full go-live readiness status (PASS/WARNING/FAIL per subsystem)
     */
    static async getGoLiveCheck(req, res, next) {
        try {
            const result = await go_live_check_service_1.GoLiveCheckService.runChecks();
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/admin/config-check
     * Returns non-secret configuration summary
     */
    static async getConfigCheck(req, res, next) {
        try {
            const configStatus = {
                nodeEnv: process.env.NODE_ENV || 'development',
                apiPrefix: process.env.API_PREFIX || '/api',
                corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
                databaseUrl: process.env.DATABASE_URL ? 'CONFIGURED' : 'NOT_SET',
                jwtAccessSecret: process.env.JWT_ACCESS_SECRET
                    ? process.env.JWT_ACCESS_SECRET.length >= 32 ? 'STRONG' : 'WEAK'
                    : 'NOT_SET',
                jwtRefreshSecret: process.env.JWT_REFRESH_SECRET
                    ? process.env.JWT_REFRESH_SECRET.length >= 32 ? 'STRONG' : 'WEAK'
                    : 'NOT_SET',
                whatsapp: process.env.WHATSAPP_ACCESS_TOKEN ? 'CONFIGURED' : 'NOT_SET',
                email: (process.env.SMTP_HOST || process.env.SENDGRID_API_KEY) ? 'CONFIGURED' : 'NOT_SET',
                paymentGateway: process.env.PAYMENT_GATEWAY_KEY ? 'CONFIGURED' : 'NOT_SET',
                mfaAvailable: true,
                rateLimitingEnabled: true,
                helmetEnabled: true,
                requestCorrelationIdsEnabled: true,
            };
            return (0, response_1.sendSuccess)(res, configStatus, 200);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/admin/reconciliation/finance
     */
    static async getFinanceReconciliation(req, res, next) {
        try {
            const result = await reconciliation_service_1.ReconciliationService.getFinanceReconciliation();
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/admin/reconciliation/enrollment
     */
    static async getEnrollmentReconciliation(req, res, next) {
        try {
            const result = await reconciliation_service_1.ReconciliationService.getEnrollmentReconciliation();
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/admin/reconciliation/attendance
     */
    static async getAttendanceReconciliation(req, res, next) {
        try {
            const result = await reconciliation_service_1.ReconciliationService.getAttendanceReconciliation();
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminController = AdminController;
