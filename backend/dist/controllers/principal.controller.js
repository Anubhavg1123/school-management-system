"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrincipalController = void 0;
const response_1 = require("../utils/response");
const principal_service_1 = require("../services/principal.service");
class PrincipalController {
    static async getDashboardMetrics(req, res) {
        const metrics = await principal_service_1.PrincipalService.getDashboardMetrics();
        return (0, response_1.sendSuccess)(res, metrics, 200);
    }
    static async getExecutiveSummary(req, res) {
        const summary = await principal_service_1.PrincipalService.getExecutiveSummary();
        return (0, response_1.sendSuccess)(res, summary, 200);
    }
    static async getDepartmentOverview(req, res) {
        const departments = await principal_service_1.PrincipalService.getDepartmentOverview();
        return (0, response_1.sendSuccess)(res, departments, 200);
    }
    static async searchGlobal(req, res) {
        const q = typeof req.query.q === 'string' ? req.query.q : '';
        const results = await principal_service_1.PrincipalService.searchGlobal(q);
        return (0, response_1.sendSuccess)(res, results, 200);
    }
    static async logOverride(req, res) {
        const { action, entityType, entityId, reason, beforeState, afterState } = req.body;
        const log = await principal_service_1.PrincipalService.logOverride(req.user.id, action, entityType, entityId, reason, beforeState, afterState);
        return (0, response_1.sendSuccess)(res, log, 201);
    }
    static async getSystemHealth(req, res) {
        const health = await principal_service_1.PrincipalService.getSystemHealth();
        return (0, response_1.sendSuccess)(res, health, 200);
    }
}
exports.PrincipalController = PrincipalController;
