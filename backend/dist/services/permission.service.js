"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class PermissionService {
    /**
     * 1. Check if user has specific granular permission
     */
    static async hasPermission(userId, activeRole, permissionCode) {
        if (activeRole === 'SUPER_ADMIN')
            return true; // Super Admin bypasses all checks
        const role = await prisma_1.prisma.role.findUnique({
            where: { name: activeRole },
            include: {
                rolePermissions: {
                    include: { permission: true },
                },
            },
        });
        if (!role)
            return false;
        return role.rolePermissions.some((rp) => rp.permission.code === permissionCode);
    }
    /**
     * 2. Get User Effective Permissions
     */
    static async getUserPermissions(activeRole) {
        if (activeRole === 'SUPER_ADMIN') {
            const allPerms = await prisma_1.prisma.permission.findMany();
            return allPerms.map((p) => p.code);
        }
        const role = await prisma_1.prisma.role.findUnique({
            where: { name: activeRole },
            include: {
                rolePermissions: {
                    include: { permission: true },
                },
            },
        });
        if (!role)
            return [];
        return role.rolePermissions.map((rp) => rp.permission.code);
    }
    /**
     * 3. Assign Role & Permissions to User (Authorized Operator Only)
     */
    static async assignUserRole(operatorUserId, targetUserId, roleName, departmentId) {
        const targetUser = await prisma_1.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser)
            throw new errorHandler_1.AppError('Target user not found.', 404);
        const role = await prisma_1.prisma.role.findUnique({ where: { name: roleName } });
        if (!role)
            throw new errorHandler_1.AppError(`Role '${roleName}' not found.`, 404);
        const updatedUser = await prisma_1.prisma.$transaction(async (tx) => {
            // Upsert UserRole
            await tx.userRole.upsert({
                where: {
                    userId_roleId: {
                        userId: targetUserId,
                        roleId: role.id,
                    },
                },
                update: { departmentId: departmentId || null },
                create: {
                    userId: targetUserId,
                    roleId: role.id,
                    departmentId: departmentId || null,
                },
            });
            // Update primary activeRole
            return tx.user.update({
                where: { id: targetUserId },
                data: { activeRole: roleName },
            });
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: operatorUserId,
                action: 'USER_ROLE_ASSIGNED',
                entityType: 'User',
                entityId: targetUserId,
                afterState: JSON.stringify({ roleName, departmentId }),
            },
        });
        return updatedUser;
    }
    /**
     * 4. Account Suspension (Blocks login and revokes active refresh tokens!)
     */
    static async suspendUserAccount(operatorUserId, targetUserId, reason) {
        const targetUser = await prisma_1.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser)
            throw new errorHandler_1.AppError('Target user not found.', 404);
        if (targetUser.activeRole === 'SUPER_ADMIN') {
            throw new errorHandler_1.AppError('Cannot suspend Super Administrator account.', 400);
        }
        const updatedUser = await prisma_1.prisma.$transaction(async (tx) => {
            // Revoke all refresh tokens
            await tx.refreshToken.updateMany({
                where: { userId: targetUserId },
                data: { isRevoked: true },
            });
            // Set user status to SUSPENDED
            return tx.user.update({
                where: { id: targetUserId },
                data: { status: 'SUSPENDED' },
            });
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: operatorUserId,
                action: 'USER_ACCOUNT_SUSPENDED',
                entityType: 'User',
                entityId: targetUserId,
                afterState: JSON.stringify({ reason }),
            },
        });
        return updatedUser;
    }
    /**
     * 5. Account Activation
     */
    static async activateUserAccount(operatorUserId, targetUserId) {
        const targetUser = await prisma_1.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser)
            throw new errorHandler_1.AppError('Target user not found.', 404);
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: targetUserId },
            data: { status: 'ACTIVE' },
        });
        await prisma_1.prisma.auditLog.create({
            data: {
                userId: operatorUserId,
                action: 'USER_ACCOUNT_ACTIVATED',
                entityType: 'User',
                entityId: targetUserId,
            },
        });
        return updatedUser;
    }
}
exports.PermissionService = PermissionService;
