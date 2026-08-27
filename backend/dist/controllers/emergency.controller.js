"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyController = void 0;
const emergency_service_1 = require("../services/emergency.service");
const response_1 = require("../utils/response");
class EmergencyController {
    static async createAlert(req, res, next) {
        try {
            const createdById = req.user.id;
            const { title, message, priority, targetAudience, channels } = req.body;
            const alert = await emergency_service_1.EmergencyService.createEmergencyAlert(createdById, {
                title,
                message,
                priority,
                targetAudience,
                channels,
            });
            return (0, response_1.sendSuccess)(res, alert, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAlerts(req, res, next) {
        try {
            const { status, priority } = req.query;
            const alerts = await emergency_service_1.EmergencyService.getEmergencyAlerts({
                status: status,
                priority: priority,
            });
            return (0, response_1.sendSuccess)(res, { alerts }, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async cancelAlert(req, res, next) {
        try {
            const cancelledById = req.user.id;
            const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const { reason } = req.body;
            const alert = await emergency_service_1.EmergencyService.cancelEmergencyAlert(alertId, cancelledById, reason);
            return (0, response_1.sendSuccess)(res, alert, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateCampusStatus(req, res, next) {
        try {
            const updatedById = req.user.id;
            const { status, reason } = req.body;
            const log = await emergency_service_1.EmergencyService.updateCampusStatus(updatedById, status, reason);
            return (0, response_1.sendSuccess)(res, log, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async getCampusStatus(req, res, next) {
        try {
            const status = await emergency_service_1.EmergencyService.getCampusStatus();
            return (0, response_1.sendSuccess)(res, status, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.EmergencyController = EmergencyController;
