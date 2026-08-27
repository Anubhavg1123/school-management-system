"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistrationService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const audit_service_1 = require("./audit.service");
const types_1 = require("../types");
class RegistrationService {
    static async getPendingRegistrations(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const where = {
            status: query.includeUnderReview !== false
                ? { in: [types_1.RegistrationStatusEnum.PENDING, types_1.RegistrationStatusEnum.UNDER_REVIEW] }
                : types_1.RegistrationStatusEnum.PENDING,
        };
        if (query.roleId)
            where.requestedRoleId = query.roleId;
        if (query.departmentId)
            where.departmentId = query.departmentId;
        const [requests, total] = await Promise.all([
            prisma_1.prisma.registrationRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'asc' },
                include: {
                    user: {
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
                            createdAt: true,
                        },
                    },
                    requestedRole: true,
                    department: true,
                },
            }),
            prisma_1.prisma.registrationRequest.count({ where }),
        ]);
        return {
            requests,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    static async getRegistrationById(id) {
        const registration = await prisma_1.prisma.registrationRequest.findUnique({
            where: { id },
            include: {
                user: {
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
                        createdAt: true,
                    },
                },
                requestedRole: true,
                department: true,
                approvalRecords: {
                    include: {
                        reviewer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { reviewedAt: 'desc' },
                },
            },
        });
        if (!registration) {
            throw new errorHandler_1.AppError('Registration request not found.', 404, 'REGISTRATION_NOT_FOUND');
        }
        return registration;
    }
    static async markUnderReview(params) {
        const reg = await prisma_1.prisma.registrationRequest.findUnique({
            where: { id: params.id },
        });
        if (!reg) {
            throw new errorHandler_1.AppError('Registration request not found.', 404, 'REGISTRATION_NOT_FOUND');
        }
        if (reg.status === types_1.RegistrationStatusEnum.APPROVED || reg.status === types_1.RegistrationStatusEnum.REJECTED) {
            throw new errorHandler_1.AppError(`Cannot mark as under review. Request is already ${reg.status.toLowerCase()}.`, 400, 'ALREADY_PROCESSED');
        }
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            const r = await tx.registrationRequest.update({
                where: { id: reg.id },
                data: {
                    status: types_1.RegistrationStatusEnum.UNDER_REVIEW,
                    reviewerNotes: params.reviewerNotes || reg.reviewerNotes,
                    reviewedByUserId: params.reviewerId,
                    reviewedAt: new Date(),
                },
            });
            await tx.approvalRecord.create({
                data: {
                    registrationId: reg.id,
                    reviewerId: params.reviewerId,
                    action: 'UNDER_REVIEW',
                    reason: params.reviewerNotes || 'Application moved to Under Review stage by administrator.',
                },
            });
            return r;
        });
        await audit_service_1.AuditService.log({
            userId: params.reviewerId,
            action: 'REGISTRATION_MARKED_UNDER_REVIEW',
            entityType: 'RegistrationRequest',
            entityId: reg.id,
            ipAddress: params.ipAddress,
        });
        return updated;
    }
    static async approveRegistration(params) {
        const reg = await prisma_1.prisma.registrationRequest.findUnique({
            where: { id: params.id },
            include: { user: true, requestedRole: true },
        });
        if (!reg) {
            throw new errorHandler_1.AppError('Registration request not found.', 404, 'REGISTRATION_NOT_FOUND');
        }
        if (reg.status === types_1.RegistrationStatusEnum.APPROVED || reg.status === types_1.RegistrationStatusEnum.REJECTED) {
            throw new errorHandler_1.AppError(`Registration request is already ${reg.status.toLowerCase()}.`, 400, 'ALREADY_PROCESSED');
        }
        const deptId = params.departmentId || reg.departmentId || null;
        const roleName = reg.requestedRole.name;
        await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Update Registration Request
            await tx.registrationRequest.update({
                where: { id: reg.id },
                data: {
                    status: types_1.RegistrationStatusEnum.APPROVED,
                    departmentId: deptId,
                    reviewerNotes: params.reviewerNotes || 'Application verified and approved by authority.',
                    reviewedByUserId: params.reviewerId,
                    reviewedAt: new Date(),
                },
            });
            // 2. Create Approval Record
            await tx.approvalRecord.create({
                data: {
                    registrationId: reg.id,
                    reviewerId: params.reviewerId,
                    action: 'APPROVED',
                    reason: params.reviewerNotes || 'Application verified and approved by authority.',
                },
            });
            // 3. Activate User Account
            await tx.user.update({
                where: { id: reg.userId },
                data: {
                    status: types_1.UserStatusEnum.ACTIVE,
                },
            });
            // 4. Create User Role mapping
            await tx.userRole.create({
                data: {
                    userId: reg.userId,
                    roleId: reg.requestedRoleId,
                    departmentId: deptId,
                    isPrimary: true,
                    assignedBy: params.reviewerId,
                },
            });
            // 5. Create specific profile records
            const code = params.employeeOrAdmissionCode || `ID-${Date.now().toString().slice(-6)}`;
            if (roleName === types_1.UserRoleEnum.FACULTY || roleName === types_1.UserRoleEnum.HOD) {
                if (!deptId) {
                    throw new errorHandler_1.AppError('Department is mandatory when approving a Faculty or HOD account.', 400, 'DEPARTMENT_REQUIRED');
                }
                await tx.faculty.create({
                    data: {
                        userId: reg.userId,
                        employeeCode: code,
                        departmentId: deptId,
                        designation: params.designation || (roleName === types_1.UserRoleEnum.HOD ? 'HEAD_OF_DEPARTMENT' : 'ASST_PROFESSOR'),
                        isHod: roleName === types_1.UserRoleEnum.HOD,
                        status: 'ACTIVE',
                    },
                });
                if (roleName === types_1.UserRoleEnum.HOD) {
                    await tx.department.update({
                        where: { id: deptId },
                        data: { hodUserId: reg.userId },
                    });
                }
            }
            else if (roleName === types_1.UserRoleEnum.NON_FACULTY) {
                await tx.nonFacultyStaff.create({
                    data: {
                        userId: reg.userId,
                        employeeCode: code,
                        jobTitle: params.designation || 'STAFF',
                        departmentOrUnit: deptId || 'FACILITIES',
                        status: 'ACTIVE',
                    },
                });
            }
            // 6. Create welcome notification
            await tx.notification.create({
                data: {
                    userId: reg.userId,
                    title: 'Account Approved',
                    message: `Your registration for role '${reg.requestedRole.displayName}' has been approved. You may now log in to the portal.`,
                    type: 'APPROVAL',
                },
            });
        });
        // Audit log
        await audit_service_1.AuditService.log({
            userId: params.reviewerId,
            action: 'REGISTRATION_APPROVED',
            entityType: 'RegistrationRequest',
            entityId: reg.id,
            afterState: { userId: reg.userId, role: roleName, deptId },
            ipAddress: params.ipAddress,
        });
        return {
            message: 'Registration approved successfully. User account is now active.',
            userId: reg.userId,
            status: 'ACTIVE',
        };
    }
    static async rejectRegistration(params) {
        if (!params.reason || params.reason.trim().length === 0) {
            throw new errorHandler_1.AppError('A rejection reason must be provided.', 400, 'REASON_REQUIRED');
        }
        const reg = await prisma_1.prisma.registrationRequest.findUnique({
            where: { id: params.id },
            include: { user: true, requestedRole: true },
        });
        if (!reg) {
            throw new errorHandler_1.AppError('Registration request not found.', 404, 'REGISTRATION_NOT_FOUND');
        }
        if (reg.status === types_1.RegistrationStatusEnum.APPROVED || reg.status === types_1.RegistrationStatusEnum.REJECTED) {
            throw new errorHandler_1.AppError(`Registration request is already ${reg.status.toLowerCase()}.`, 400, 'ALREADY_PROCESSED');
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Update Registration Request
            await tx.registrationRequest.update({
                where: { id: reg.id },
                data: {
                    status: types_1.RegistrationStatusEnum.REJECTED,
                    rejectionReason: params.reason,
                    reviewedByUserId: params.reviewerId,
                    reviewedAt: new Date(),
                },
            });
            // 2. Create Approval Record
            await tx.approvalRecord.create({
                data: {
                    registrationId: reg.id,
                    reviewerId: params.reviewerId,
                    action: 'REJECTED',
                    reason: params.reason,
                },
            });
            // 3. Keep user status INACTIVE
            await tx.user.update({
                where: { id: reg.userId },
                data: {
                    status: types_1.UserStatusEnum.INACTIVE,
                },
            });
            // 4. Create Notification
            await tx.notification.create({
                data: {
                    userId: reg.userId,
                    title: 'Registration Rejected',
                    message: `Your registration request was not approved. Reason: ${params.reason}`,
                    type: 'APPROVAL',
                },
            });
        });
        // Audit log
        await audit_service_1.AuditService.log({
            userId: params.reviewerId,
            action: 'REGISTRATION_REJECTED',
            entityType: 'RegistrationRequest',
            entityId: reg.id,
            afterState: { reason: params.reason },
            ipAddress: params.ipAddress,
        });
        return {
            message: 'Registration request rejected.',
            status: 'REJECTED',
        };
    }
    static async getRecentlyReviewed(limit = 10) {
        const [approved, rejected] = await Promise.all([
            prisma_1.prisma.registrationRequest.findMany({
                where: { status: types_1.RegistrationStatusEnum.APPROVED },
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            userCategory: true,
                        },
                    },
                    requestedRole: true,
                    department: true,
                },
            }),
            prisma_1.prisma.registrationRequest.findMany({
                where: { status: types_1.RegistrationStatusEnum.REJECTED },
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    requestedRole: true,
                    department: true,
                },
            }),
        ]);
        return { approved, rejected };
    }
}
exports.RegistrationService = RegistrationService;
