"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticsController = void 0;
const diagnostics_service_1 = require("../services/diagnostics.service");
const response_1 = require("../utils/response");
class DiagnosticsController {
    static async runSystemDiagnostics(req, res, next) {
        try {
            const result = await diagnostics_service_1.DiagnosticsService.runSystemDiagnostics();
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async runDataQualityAudit(req, res, next) {
        try {
            const audit = await diagnostics_service_1.DiagnosticsService.runDataQualityAudit();
            return (0, response_1.sendSuccess)(res, audit, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async recordWebhook(req, res, next) {
        try {
            const { provider, eventId, eventType, payload, idempotencyKey } = req.body;
            const result = await diagnostics_service_1.DiagnosticsService.recordWebhookLog({
                provider: provider || 'CUSTOM',
                eventId,
                eventType: eventType || 'GENERIC_EVENT',
                payload: payload || {},
                idempotencyKey,
            });
            return (0, response_1.sendSuccess)(res, result, result.isDuplicate ? 200 : 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async getWebhookLogs(req, res, next) {
        try {
            const logs = await diagnostics_service_1.DiagnosticsService.getWebhookLogs();
            return (0, response_1.sendSuccess)(res, { logs }, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DiagnosticsController = DiagnosticsController;
