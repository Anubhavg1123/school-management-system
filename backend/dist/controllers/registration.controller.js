"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationController = exports.underReviewSchema = exports.rejectRegistrationSchema = exports.approveRegistrationSchema = void 0;
const zod_1 = require("zod");
const registration_service_1 = require("../services/registration.service");
const response_1 = require("../utils/response");
exports.approveRegistrationSchema = zod_1.z.object({
    departmentId: zod_1.z.string().optional(),
    employeeOrAdmissionCode: zod_1.z.string().optional(),
    designation: zod_1.z.string().optional(),
    reviewerNotes: zod_1.z.string().optional(),
});
exports.rejectRegistrationSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3, 'A valid rejection reason must be provided (min 3 characters).'),
});
exports.underReviewSchema = zod_1.z.object({
    reviewerNotes: zod_1.z.string().optional(),
});
class RegistrationController {
    static async getPending(req, res, next) {
        try {
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
            const roleId = req.query.roleId;
            const departmentId = req.query.departmentId;
            const includeUnderReview = req.query.includeUnderReview !== 'false';
            const result = await registration_service_1.RegistrationService.getPendingRegistrations({
                page,
                limit,
                roleId,
                departmentId,
                includeUnderReview,
            });
            return (0, response_1.sendSuccess)(res, result.requests, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    static async getRecentlyReviewed(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
            const result = await registration_service_1.RegistrationService.getRecentlyReviewed(limit);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await registration_service_1.RegistrationService.getRegistrationById(id);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async markUnderReview(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await registration_service_1.RegistrationService.markUnderReview({
                id,
                reviewerId: req.user.id,
                reviewerNotes: req.body.reviewerNotes,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async approve(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await registration_service_1.RegistrationService.approveRegistration({
                id,
                reviewerId: req.user.id,
                departmentId: req.body.departmentId,
                employeeOrAdmissionCode: req.body.employeeOrAdmissionCode,
                designation: req.body.designation,
                reviewerNotes: req.body.reviewerNotes,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async reject(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await registration_service_1.RegistrationService.rejectRegistration({
                id,
                reviewerId: req.user.id,
                reason: req.body.reason,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.RegistrationController = RegistrationController;
