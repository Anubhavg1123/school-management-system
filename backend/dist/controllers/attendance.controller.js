"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = exports.reviewCorrectionSchema = exports.correctionRequestSchema = exports.checkOutSchema = exports.checkInSchema = void 0;
const zod_1 = require("zod");
const attendance_service_1 = require("../services/attendance.service");
const response_1 = require("../utils/response");
exports.checkInSchema = zod_1.z.object({
    source: zod_1.z.enum(['WEB', 'KIOSK', 'MANUAL']).optional(),
    kioskIdentifier: zod_1.z.string().optional(),
    deviceId: zod_1.z.string().optional(),
    targetUserId: zod_1.z.string().optional(), // For manual marking by admin/faculty
});
exports.checkOutSchema = zod_1.z.object({
    source: zod_1.z.enum(['WEB', 'KIOSK', 'MANUAL']).optional(),
    targetUserId: zod_1.z.string().optional(),
});
exports.correctionRequestSchema = zod_1.z.object({
    attendanceId: zod_1.z.string().min(1, 'Attendance ID is required'),
    proposedCheckIn: zod_1.z.string().optional(),
    proposedCheckOut: zod_1.z.string().optional(),
    proposedStatus: zod_1.z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED']).optional(),
    reason: zod_1.z.string().min(5, 'Reason must be at least 5 characters'),
});
exports.reviewCorrectionSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: zod_1.z.string().optional(),
});
class AttendanceController {
    static async checkIn(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const targetUserId = req.body.targetUserId || req.user.id;
            const markedByUserId = req.body.targetUserId ? req.user.id : undefined;
            const record = await attendance_service_1.AttendanceService.checkIn({
                userId: targetUserId,
                source: req.body.source,
                kioskIdentifier: req.body.kioskIdentifier,
                deviceId: req.body.deviceId,
                markedByUserId,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, record, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async checkOut(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const targetUserId = req.body.targetUserId || req.user.id;
            const record = await attendance_service_1.AttendanceService.checkOut({
                userId: targetUserId,
                source: req.body.source,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, record, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getTodayStatus(req, res, next) {
        try {
            const targetUserId = req.query.userId ? req.query.userId : req.user.id;
            const status = await attendance_service_1.AttendanceService.getTodayStatus(targetUserId);
            return (0, response_1.sendSuccess)(res, status, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getMyRecords(req, res, next) {
        try {
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            const records = await attendance_service_1.AttendanceService.getMyRecords(req.user.id, startDate, endDate);
            return (0, response_1.sendSuccess)(res, records, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async listRecords(req, res, next) {
        try {
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
            const date = req.query.date;
            const status = req.query.status;
            const departmentId = req.query.departmentId;
            const role = req.query.role;
            const result = await attendance_service_1.AttendanceService.getAttendanceRecords({
                page,
                limit,
                date,
                status,
                departmentId,
                role,
            });
            return (0, response_1.sendSuccess)(res, result.records, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    static async requestCorrection(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await attendance_service_1.AttendanceService.requestCorrection({
                attendanceId: req.body.attendanceId,
                userId: req.user.id,
                proposedCheckIn: req.body.proposedCheckIn,
                proposedCheckOut: req.body.proposedCheckOut,
                proposedStatus: req.body.proposedStatus,
                reason: req.body.reason,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async reviewCorrection(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await attendance_service_1.AttendanceService.reviewCorrection({
                correctionId: id,
                reviewerId: req.user.id,
                action: req.body.action,
                rejectionReason: req.body.rejectionReason,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AttendanceController = AttendanceController;
