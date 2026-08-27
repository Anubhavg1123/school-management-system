"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionController = void 0;
const response_1 = require("../utils/response");
const permission_service_1 = require("../services/permission.service");
const zod_1 = require("zod");
const assignRoleSchema = zod_1.z.object({
    targetUserId: zod_1.z.string().min(1, 'Target user ID required'),
    roleName: zod_1.z.string().min(1, 'Role name required'),
    departmentId: zod_1.z.string().optional(),
});
const suspendUserSchema = zod_1.z.object({
    reason: zod_1.z.string().min(1, 'Suspension reason required'),
});
class PermissionController {
    static async getUserPermissions(req, res) {
        const permissions = await permission_service_1.PermissionService.getUserPermissions(req.user.activeRole);
        return (0, response_1.sendSuccess)(res, permissions, 200);
    }
    static async assignUserRole(req, res) {
        const validated = assignRoleSchema.parse(req.body);
        const updated = await permission_service_1.PermissionService.assignUserRole(req.user.id, validated.targetUserId, validated.roleName, validated.departmentId);
        return (0, response_1.sendSuccess)(res, updated, 200);
    }
    static async suspendUser(req, res) {
        const validated = suspendUserSchema.parse(req.body);
        const updated = await permission_service_1.PermissionService.suspendUserAccount(req.user.id, req.params.id, validated.reason);
        return (0, response_1.sendSuccess)(res, updated, 200);
    }
    static async activateUser(req, res) {
        const updated = await permission_service_1.PermissionService.activateUserAccount(req.user.id, req.params.id);
        return (0, response_1.sendSuccess)(res, updated, 200);
    }
}
exports.PermissionController = PermissionController;
