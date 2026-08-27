"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorSecurityController = void 0;
const response_1 = require("../utils/response");
const visitor_security_service_1 = require("../services/visitor-security.service");
const zod_1 = require("zod");
const createVisitorEntrySchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Visitor full name required'),
    contactNumber: zod_1.z.string().min(5, 'Contact number required'),
    visitorType: zod_1.z.string().optional(),
    studentRelationship: zod_1.z.string().optional(),
    studentId: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    idProofType: zod_1.z.string().optional(),
    idProofNumber: zod_1.z.string().optional(),
    personToMeetName: zod_1.z.string().min(2, 'Person to meet required'),
    personToMeetUserId: zod_1.z.string().optional(),
    purpose: zod_1.z.string().min(2, 'Purpose of visit required'),
    vehicleNumber: zod_1.z.string().optional(),
    vehicleType: zod_1.z.string().optional(),
    isEmergency: zod_1.z.boolean().optional(),
    emergencyReason: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
});
const campusVehicleEntrySchema = zod_1.z.object({
    vehicleNumber: zod_1.z.string().min(3, 'Vehicle number required'),
    driverOwnerName: zod_1.z.string().optional(),
    vehicleType: zod_1.z.string().optional(),
    purpose: zod_1.z.string().optional(),
});
class VisitorSecurityController {
    static async createVisitorEntry(req, res) {
        const validated = createVisitorEntrySchema.parse(req.body);
        const entry = await visitor_security_service_1.VisitorSecurityService.createVisitorEntry(req.user.id, {
            ...validated,
            visitorType: validated.visitorType || 'GUEST',
        });
        return (0, response_1.sendSuccess)(res, entry, 201);
    }
    static async markVisitorExit(req, res) {
        const remarks = typeof req.body.remarks === 'string' ? req.body.remarks : undefined;
        const exitRecord = await visitor_security_service_1.VisitorSecurityService.markVisitorExit(req.user.id, req.params.passNumberOrId, remarks);
        return (0, response_1.sendSuccess)(res, exitRecord, 200);
    }
    static async getActiveVisitors(req, res) {
        const thresholdHours = req.query.thresholdHours ? Number(req.query.thresholdHours) : 4;
        const activeVisitors = await visitor_security_service_1.VisitorSecurityService.getActiveVisitors(thresholdHours);
        return (0, response_1.sendSuccess)(res, activeVisitors, 200);
    }
    static async searchStudentForVisitor(req, res) {
        const query = typeof req.query.query === 'string' ? req.query.query : '';
        const students = await visitor_security_service_1.VisitorSecurityService.searchStudentForVisitor(query);
        return (0, response_1.sendSuccess)(res, students, 200);
    }
    static async verifyRegisteredVehicle(req, res) {
        const vehicleNumber = req.params.vehicleNumber;
        const verification = await visitor_security_service_1.VisitorSecurityService.verifyRegisteredVehicle(vehicleNumber);
        return (0, response_1.sendSuccess)(res, verification, 200);
    }
    static async recordCampusVehicleEntry(req, res) {
        const validated = campusVehicleEntrySchema.parse(req.body);
        const log = await visitor_security_service_1.VisitorSecurityService.recordCampusVehicleEntry(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, log, 201);
    }
    static async recordCampusVehicleExit(req, res) {
        const log = await visitor_security_service_1.VisitorSecurityService.recordCampusVehicleExit(req.user.id, req.params.vehicleLogId);
        return (0, response_1.sendSuccess)(res, log, 200);
    }
    static async getVisitorPass(req, res) {
        const pass = await visitor_security_service_1.VisitorSecurityService.getVisitorPass(req.params.passTokenOrNumber);
        return (0, response_1.sendSuccess)(res, pass, 200);
    }
    static async searchVisitors(req, res) {
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const type = typeof req.query.type === 'string' ? req.query.type : undefined;
        const date = typeof req.query.date === 'string' ? req.query.date : undefined;
        const history = await visitor_security_service_1.VisitorSecurityService.searchVisitors({ search, type, date });
        return (0, response_1.sendSuccess)(res, history, 200);
    }
}
exports.VisitorSecurityController = VisitorSecurityController;
