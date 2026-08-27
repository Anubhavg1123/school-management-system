"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const response_1 = require("../utils/response");
const notification_service_1 = require("../services/notification.service");
class NotificationController {
    static async getUserNotifications(req, res) {
        const unreadOnly = req.query.unreadOnly === 'true';
        const limit = req.query.limit ? Number(req.query.limit) : 50;
        const data = await notification_service_1.NotificationService.getUserNotifications(req.user.id, { unreadOnly, limit });
        return (0, response_1.sendSuccess)(res, data, 200);
    }
    static async markAsRead(req, res) {
        const notif = await notification_service_1.NotificationService.markAsRead(req.user.id, req.params.id);
        return (0, response_1.sendSuccess)(res, notif, 200);
    }
    static async markAllAsRead(req, res) {
        const result = await notification_service_1.NotificationService.markAllAsRead(req.user.id);
        return (0, response_1.sendSuccess)(res, result, 200);
    }
    static async deleteNotification(req, res) {
        const result = await notification_service_1.NotificationService.deleteNotification(req.user.id, req.params.id);
        return (0, response_1.sendSuccess)(res, result, 200);
    }
}
exports.NotificationController = NotificationController;
