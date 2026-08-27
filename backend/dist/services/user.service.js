"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const audit_service_1 = require("./audit.service");
const password_1 = require("../utils/password");
const types_1 = require("../types");
class UserService {
    static async getUsers(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.userCategory) {
            where.userCategory = query.userCategory;
        }
        if (query.search) {
            const search = query.search.toLowerCase();
            where.OR = [
                { email: { contains: search } },
                { username: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { whatsAppNumber: { contains: search } },
            ];
        }
        if (query.role) {
            where.userRoles = {
                some: {
                    role: {
                        name: query.role,
                    },
                },
            };
        }
        if (query.departmentId) {
            where.userRoles = {
                some: {
                    departmentId: query.departmentId,
                },
            };
        }
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    whatsAppNumber: true,
                    altPhone: true,
                    dob: true,
                    gender: true,
                    address: true,
                    emergencyContactName: true,
                    emergencyContactPhone: true,
                    userCategory: true,
                    status: true,
                    failedLoginAttempts: true,
                    lockoutUntil: true,
                    lastLoginAt: true,
                    createdAt: true,
                    userRoles: {
                        include: {
                            role: true,
                            department: true,
                        },
                    },
                    facultyProfile: true,
                    nonFacultyProfile: true,
                    studentProfile: true,
                },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        return {
            users,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    static async getUserById(id) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                phone: true,
                whatsAppNumber: true,
                altPhone: true,
                dob: true,
                gender: true,
                address: true,
                emergencyContactName: true,
                emergencyContactPhone: true,
                userCategory: true,
                idProofType: true,
                idProofNumber: true,
                status: true,
                failedLoginAttempts: true,
                lockoutUntil: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true,
                                    },
                                },
                            },
                        },
                        department: true,
                    },
                },
                facultyProfile: {
                    include: {
                        department: true,
                    },
                },
                nonFacultyProfile: true,
                studentProfile: {
                    include: {
                        section: {
                            include: {
                                class: true,
                            },
                        },
                        guardians: true,
                    },
                },
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found.', 404, 'USER_NOT_FOUND');
        }
        return user;
    }
    static async createUser(data, actorId, ipAddress) {
        const existingEmail = await prisma_1.prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
        if (existingEmail) {
            throw new errorHandler_1.AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
        }
        const existingUsername = await prisma_1.prisma.user.findUnique({ where: { username: data.username.toLowerCase() } });
        if (existingUsername) {
            throw new errorHandler_1.AppError('This username is already taken.', 409, 'USERNAME_TAKEN');
        }
        const targetRole = await prisma_1.prisma.role.findUnique({ where: { name: data.role } });
        if (!targetRole) {
            throw new errorHandler_1.AppError(`Role '${data.role}' is invalid.`, 400, 'INVALID_ROLE');
        }
        const initialPassword = data.password || 'Welcome@Secure2026!';
        const passwordHash = await (0, password_1.hashPassword)(initialPassword);
        const code = data.employeeCode || `ID-${Date.now().toString().slice(-6)}`;
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email: data.email.toLowerCase(),
                    username: data.username.toLowerCase(),
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone || null,
                    whatsAppNumber: data.whatsAppNumber || null,
                    altPhone: data.altPhone || null,
                    dob: data.dob ? new Date(data.dob) : null,
                    gender: data.gender || null,
                    address: data.address || null,
                    emergencyContactName: data.emergencyContactName || null,
                    emergencyContactPhone: data.emergencyContactPhone || null,
                    userCategory: data.userCategory || 'TEACHING_STAFF',
                    status: types_1.UserStatusEnum.ACTIVE,
                },
            });
            await tx.userRole.create({
                data: {
                    userId: user.id,
                    roleId: targetRole.id,
                    departmentId: data.departmentId || null,
                    isPrimary: true,
                    assignedBy: actorId,
                },
            });
            if (data.role === types_1.UserRoleEnum.FACULTY || data.role === types_1.UserRoleEnum.HOD) {
                if (!data.departmentId) {
                    throw new errorHandler_1.AppError('Department ID is required for Faculty or HOD users.', 400, 'DEPARTMENT_REQUIRED');
                }
                await tx.faculty.create({
                    data: {
                        userId: user.id,
                        employeeCode: code,
                        departmentId: data.departmentId,
                        designation: data.designation || (data.role === types_1.UserRoleEnum.HOD ? 'HEAD_OF_DEPARTMENT' : 'ASST_PROFESSOR'),
                        isHod: data.role === types_1.UserRoleEnum.HOD,
                        status: 'ACTIVE',
                    },
                });
                if (data.role === types_1.UserRoleEnum.HOD) {
                    await tx.department.update({
                        where: { id: data.departmentId },
                        data: { hodUserId: user.id },
                    });
                }
            }
            else if (data.role === types_1.UserRoleEnum.NON_FACULTY) {
                await tx.nonFacultyStaff.create({
                    data: {
                        userId: user.id,
                        employeeCode: code,
                        jobTitle: data.designation || 'STAFF',
                        departmentOrUnit: data.departmentId || 'FACILITIES',
                        status: 'ACTIVE',
                    },
                });
            }
            return user;
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'USER_CREATED_BY_ADMIN',
            entityType: 'User',
            entityId: result.id,
            afterState: { email: result.email, role: data.role, dept: data.departmentId },
            ipAddress,
        });
        return result;
    }
    static async updateUser(id, data, actorId, ipAddress) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new errorHandler_1.AppError('User not found.', 404, 'USER_NOT_FOUND');
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id },
            data: {
                firstName: data.firstName ?? user.firstName,
                lastName: data.lastName ?? user.lastName,
                phone: data.phone !== undefined ? data.phone : user.phone,
                whatsAppNumber: data.whatsAppNumber !== undefined ? data.whatsAppNumber : user.whatsAppNumber,
                altPhone: data.altPhone !== undefined ? data.altPhone : user.altPhone,
                dob: data.dob ? new Date(data.dob) : user.dob,
                gender: data.gender !== undefined ? data.gender : user.gender,
                address: data.address !== undefined ? data.address : user.address,
                emergencyContactName: data.emergencyContactName !== undefined ? data.emergencyContactName : user.emergencyContactName,
                emergencyContactPhone: data.emergencyContactPhone !== undefined ? data.emergencyContactPhone : user.emergencyContactPhone,
                userCategory: data.userCategory !== undefined ? data.userCategory : user.userCategory,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'USER_PROFILE_UPDATED',
            entityType: 'User',
            entityId: id,
            beforeState: { firstName: user.firstName, lastName: user.lastName, phone: user.phone },
            afterState: { firstName: updated.firstName, lastName: updated.lastName, phone: updated.phone },
            ipAddress,
        });
        return updated;
    }
    static async assignRoles(id, roles, actorId, ipAddress) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id },
            include: { userRoles: { include: { role: true } } },
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found.', 404, 'USER_NOT_FOUND');
        }
        if (roles.length === 0) {
            throw new errorHandler_1.AppError('At least one role must be assigned.', 400, 'ROLE_REQUIRED');
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            // Clear old roles
            await tx.userRole.deleteMany({ where: { userId: id } });
            // Insert new roles
            for (const r of roles) {
                const roleRecord = await tx.role.findUnique({ where: { name: r.roleName } });
                if (!roleRecord) {
                    throw new errorHandler_1.AppError(`Role '${r.roleName}' not found.`, 400, 'ROLE_NOT_FOUND');
                }
                await tx.userRole.create({
                    data: {
                        userId: id,
                        roleId: roleRecord.id,
                        departmentId: r.departmentId || null,
                        isPrimary: r.isPrimary ?? false,
                        assignedBy: actorId,
                    },
                });
            }
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'USER_ROLES_MODIFIED',
            entityType: 'User',
            entityId: id,
            afterState: { roles },
            ipAddress,
        });
        return this.getUserById(id);
    }
    static async resetUserPassword(id, newPassword, actorId, ipAddress) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new errorHandler_1.AppError('User not found.', 404, 'USER_NOT_FOUND');
        }
        const pass = newPassword || 'Password@Reset2026!';
        const strength = (0, password_1.validatePasswordStrength)(pass);
        if (!strength.valid) {
            throw new errorHandler_1.AppError(strength.message || 'Weak password provided.', 400, 'WEAK_PASSWORD');
        }
        const passwordHash = await (0, password_1.hashPassword)(pass);
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.user.update({
                where: { id },
                data: {
                    passwordHash,
                    failedLoginAttempts: 0,
                    lockoutUntil: null,
                },
            }),
            // Revoke all existing sessions
            prisma_1.prisma.refreshToken.updateMany({
                where: { userId: id, isRevoked: false },
                data: { isRevoked: true },
            }),
        ]);
        await audit_service_1.AuditService.log({
            userId: actorId || id,
            action: 'ADMIN_USER_PASSWORD_RESET',
            entityType: 'User',
            entityId: id,
            ipAddress,
        });
        return { message: 'Password has been reset successfully. All active user sessions revoked.' };
    }
    static async getUserAuditTrail(id) {
        return prisma_1.prisma.auditLog.findMany({
            where: {
                OR: [{ userId: id }, { entityId: id }],
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    static async updateUserStatus(id, status, actorId, ipAddress) {
        const validStatuses = Object.values(types_1.UserStatusEnum);
        if (!validStatuses.includes(status)) {
            throw new errorHandler_1.AppError(`Invalid status: ${status}. Valid options: ${validStatuses.join(', ')}`, 400, 'INVALID_STATUS');
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new errorHandler_1.AppError('User not found.', 404, 'USER_NOT_FOUND');
        }
        const updateData = { status };
        if (status === types_1.UserStatusEnum.ACTIVE) {
            updateData.failedLoginAttempts = 0;
            updateData.lockoutUntil = null;
        }
        const updated = await prisma_1.prisma.user.update({
            where: { id },
            data: updateData,
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'USER_STATUS_CHANGED',
            entityType: 'User',
            entityId: id,
            beforeState: { status: user.status },
            afterState: { status: updated.status },
            ipAddress,
        });
        return updated;
    }
    static async getRoles() {
        return prisma_1.prisma.role.findMany({
            include: {
                rolePermissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });
    }
    static async getPermissions() {
        return prisma_1.prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { code: 'asc' }],
        });
    }
}
exports.UserService = UserService;
