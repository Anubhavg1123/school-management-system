"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = exports.changePasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const response_1 = require("../utils/response");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Valid email address is required'),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    phone: zod_1.z.string().optional(),
    whatsAppNumber: zod_1.z.string().min(8, 'Valid WhatsApp number is mandatory'),
    altPhone: zod_1.z.string().optional(),
    dob: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    address: zod_1.z.string().optional(),
    emergencyContactName: zod_1.z.string().optional(),
    emergencyContactPhone: zod_1.z.string().optional(),
    userCategory: zod_1.z.enum(['TEACHING_STAFF', 'NON_TEACHING_STAFF', 'ADMINISTRATIVE', 'STUDENT', 'OTHER']).optional(),
    requestedRole: zod_1.z.string().min(1, 'Role must be selected'),
    departmentId: zod_1.z.string().optional(),
    applicationNotes: zod_1.z.string().optional(),
    idProofUrl: zod_1.z.string().optional(),
    idProofType: zod_1.z.string().optional(),
    idProofNumber: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(1, 'Email or username is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
    selectedRole: zod_1.z.string().optional(),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters'),
});
class AuthController {
    static async register(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.get('user-agent');
            const result = await auth_service_1.AuthService.register({
                ...req.body,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
                userAgent,
            });
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.get('user-agent');
            const result = await auth_service_1.AuthService.login({
                ...req.body,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
                userAgent,
            });
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async refresh(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.get('user-agent');
            const result = await auth_service_1.AuthService.refreshToken(req.body.refreshToken, typeof ipAddress === 'string' ? ipAddress : undefined, userAgent);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await auth_service_1.AuthService.logout(req.user.id, req.body.refreshToken, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async logoutAll(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await auth_service_1.AuthService.logoutAllSessions(req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async me(req, res, next) {
        try {
            return (0, response_1.sendSuccess)(res, req.user, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async changePassword(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await auth_service_1.AuthService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
