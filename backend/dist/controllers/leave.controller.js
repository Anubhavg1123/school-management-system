"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveController = exports.reviewLeaveSchema = exports.requestLeaveSchema = void 0;
const zod_1 = require("zod");
const leave_service_1 = require("../services/leave.service");
const response_1 = require("../utils/response");
exports.requestLeaveSchema = zod_1.z.object({
    leaveType: zod_1.z.enum(['CASUAL', 'MEDICAL', 'DUTY', 'EARNED', 'MATERNITY_PATERNITY', 'OTHER']),
    startDate: zod_1.z.string().min(1, 'Start date is required'),
    endDate: zod_1.z.string().min(1, 'End date is required'),
    reason: zod_1.z.string().min(5, 'Reason must be at least 5 characters'),
});
exports.reviewLeaveSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: zod_1.z.string().optional(),
});
class LeaveController {
    static async requestLeave(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const leave = await leave_service_1.LeaveService.requestLeave({
                userId: req.user.id,
                leaveType: req.body.leaveType,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                reason: req.body.reason,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, leave, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async getMyLeaves(req, res, next) {
        try {
            const leaves = await leave_service_1.LeaveService.getMyLeaves(req.user.id);
            return (0, response_1.sendSuccess)(res, leaves, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getPendingLeaves(req, res, next) {
        try {
            const leaves = await leave_service_1.LeaveService.getPendingLeaves({
                departmentId: req.user.departmentId || undefined,
                userRole: req.user.activeRole,
            });
            return (0, response_1.sendSuccess)(res, leaves, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async reviewLeave(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await leave_service_1.LeaveService.reviewLeave({
                id,
                reviewerId: req.user.id,
                reviewerRole: req.user.activeRole,
                reviewerDepartmentId: req.user.departmentId,
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
exports.LeaveController = LeaveController;
