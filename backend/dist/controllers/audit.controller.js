"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditController = void 0;
const audit_service_1 = require("../services/audit.service");
const response_1 = require("../utils/response");
class AuditController {
    static async listLogs(req, res, next) {
        try {
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 25;
            const userId = req.query.userId;
            const action = req.query.action;
            const entityType = req.query.entityType;
            const status = req.query.status;
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const result = await audit_service_1.AuditService.getLogs({
                page,
                limit,
                userId,
                action,
                entityType,
                status,
                startDate,
                endDate,
            });
            return (0, response_1.sendSuccess)(res, result.logs, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuditController = AuditController;
