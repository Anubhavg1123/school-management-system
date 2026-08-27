"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartCampusController = void 0;
const smart_campus_service_1 = require("../services/smart-campus.service");
const response_1 = require("../utils/response");
class SmartCampusController {
    static async preRegisterVisitor(req, res, next) {
        try {
            const hostUserId = req.user.id;
            const { visitorFullName, contactNumber, expectedDate, purpose } = req.body;
            const record = await smart_campus_service_1.SmartCampusService.preRegisterVisitor(hostUserId, {
                visitorFullName,
                contactNumber,
                expectedDate,
                purpose,
            });
            return (0, response_1.sendSuccess)(res, record, 201);
        }
        catch (err) {
            next(err);
        }
    }
    static async getPreRegisteredVisitors(req, res, next) {
        try {
            const { expectedDate, status, hostUserId } = req.query;
            const records = await smart_campus_service_1.SmartCampusService.getPreRegisteredVisitors({
                expectedDate: expectedDate,
                status: status,
                hostUserId: hostUserId,
            });
            return (0, response_1.sendSuccess)(res, { records }, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async checkInPreRegisteredVisitor(req, res, next) {
        try {
            const securityUserId = req.user.id;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const entryExit = await smart_campus_service_1.SmartCampusService.checkInPreRegisteredVisitor(id, securityUserId);
            return (0, response_1.sendSuccess)(res, entryExit, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async getLiveOccupancy(req, res, next) {
        try {
            const occupancy = await smart_campus_service_1.SmartCampusService.getLiveCampusOccupancy();
            return (0, response_1.sendSuccess)(res, occupancy, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async getVehicleAlerts(req, res, next) {
        try {
            const alerts = await smart_campus_service_1.SmartCampusService.getVehicleDocumentAlerts();
            return (0, response_1.sendSuccess)(res, alerts, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SmartCampusController = SmartCampusController;
