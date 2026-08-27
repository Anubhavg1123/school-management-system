"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeController = void 0;
const realtime_service_1 = require("../services/realtime.service");
const response_1 = require("../utils/response");
class RealtimeController {
    static streamEvents(req, res) {
        const user = req.user;
        const clientId = `client_${user?.id || 'anon'}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        realtime_service_1.RealtimeService.addClient(clientId, user?.id, user?.activeRole, user?.departmentId, res);
    }
    static getStats(req, res) {
        const stats = realtime_service_1.RealtimeService.getStats();
        return (0, response_1.sendSuccess)(res, stats, 200);
    }
}
exports.RealtimeController = RealtimeController;
