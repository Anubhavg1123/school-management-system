"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = exports.resetPasswordSchema = exports.assignOperationalRoleSchema = exports.assignRolesSchema = exports.updateStatusSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const user_service_1 = require("../services/user.service");
const response_1 = require("../utils/response");
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email is required'),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').optional(),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    phone: zod_1.z.string().optional(),
    whatsAppNumber: zod_1.z.string().optional(),
    altPhone: zod_1.z.string().optional(),
    dob: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    address: zod_1.z.string().optional(),
    emergencyContactName: zod_1.z.string().optional(),
    emergencyContactPhone: zod_1.z.string().optional(),
    userCategory: zod_1.z.enum(['TEACHING_STAFF', 'NON_TEACHING_STAFF', 'ADMINISTRATIVE', 'STUDENT', 'OTHER']).optional(),
    role: zod_1.z.string().min(1, 'Role is required'),
    departmentId: zod_1.z.string().optional(),
    designation: zod_1.z.string().optional(),
    employeeCode: zod_1.z.string().optional(),
});
exports.updateUserSchema = zod_1.z.object({
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    whatsAppNumber: zod_1.z.string().optional(),
    altPhone: zod_1.z.string().optional(),
    dob: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    address: zod_1.z.string().optional(),
    emergencyContactName: zod_1.z.string().optional(),
    emergencyContactPhone: zod_1.z.string().optional(),
    userCategory: zod_1.z.enum(['TEACHING_STAFF', 'NON_TEACHING_STAFF', 'ADMINISTRATIVE', 'STUDENT', 'OTHER']).optional(),
});
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']),
});
exports.assignRolesSchema = zod_1.z.object({
    roles: zod_1.z.array(zod_1.z.object({
        roleName: zod_1.z.string(),
        departmentId: zod_1.z.string().optional(),
        isPrimary: zod_1.z.boolean().optional(),
    })).min(1, 'At least one role must be provided'),
    reason: zod_1.z.string().optional(),
});
exports.assignOperationalRoleSchema = zod_1.z.object({
    role: zod_1.z.string().min(1, 'Operational role is required'),
    departmentId: zod_1.z.string().optional(),
    designation: zod_1.z.string().optional(),
    employeeOrAdmissionCode: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
});
exports.resetPasswordSchema = zod_1.z.object({
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters').optional(),
});
class UserController {
    static async listUsers(req, res, next) {
        try {
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
            const search = req.query.search;
            const role = req.query.role;
            const status = req.query.status;
            const departmentId = req.query.departmentId;
            const userCategory = req.query.userCategory;
            const result = await user_service_1.UserService.getUsers({
                page,
                limit,
                search,
                role,
                status,
                departmentId,
                userCategory,
            });
            return (0, response_1.sendSuccess)(res, result.users, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    static async getUser(req, res, next) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const user = await user_service_1.UserService.getUserById(id);
            return (0, response_1.sendSuccess)(res, user, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async createUser(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const user = await user_service_1.UserService.createUser(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, user, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateProfile(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const targetId = paramId || req.user.id;
            const result = await user_service_1.UserService.updateUser(targetId, req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await user_service_1.UserService.updateUserStatus(id, req.body.status, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async assignOperationalRole(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await user_service_1.UserService.assignOperationalRole(id, req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async assignRoles(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await user_service_1.UserService.assignRoles(id, req.body.roles, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined, req.body.reason);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async resetPassword(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await user_service_1.UserService.resetUserPassword(id, req.body.newPassword, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getUserAuditTrail(req, res, next) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const trail = await user_service_1.UserService.getUserAuditTrail(id);
            return (0, response_1.sendSuccess)(res, trail, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async listRoles(req, res, next) {
        try {
            const roles = await user_service_1.UserService.getRoles();
            return (0, response_1.sendSuccess)(res, roles, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async listPermissions(req, res, next) {
        try {
            const permissions = await user_service_1.UserService.getPermissions();
            return (0, response_1.sendSuccess)(res, permissions, 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.UserController = UserController;
