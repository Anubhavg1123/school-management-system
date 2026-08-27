"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const audit_service_1 = require("./audit.service");
const types_1 = require("../types");
class LeaveService {
    static async requestLeave(params) {
        const validLeaveTypes = Object.values(types_1.LeaveTypeEnum);
        if (!validLeaveTypes.includes(params.leaveType)) {
            throw new errorHandler_1.AppError(`Invalid leave type: ${params.leaveType}. Valid options: ${validLeaveTypes.join(', ')}`, 400, 'INVALID_LEAVE_TYPE');
        }
        const start = new Date(params.startDate);
        const end = new Date(params.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new errorHandler_1.AppError('Invalid start date or end date format.', 400, 'INVALID_DATE');
        }
        if (end < start) {
            throw new errorHandler_1.AppError('End date cannot be earlier than start date.', 400, 'INVALID_DATE_RANGE');
        }
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        // Find faculty record if exists
        const faculty = await prisma_1.prisma.faculty.findUnique({
            where: { userId: params.userId },
        });
        const leave = await prisma_1.prisma.facultyLeave.create({
            data: {
                userId: params.userId,
                facultyId: faculty?.id || null,
                leaveType: params.leaveType,
                startDate: start,
                endDate: end,
                totalDays,
                reason: params.reason,
                status: types_1.LeaveStatusEnum.PENDING,
            },
        });
        await audit_service_1.AuditService.log({
            userId: params.userId,
            action: 'LEAVE_REQUEST_SUBMITTED',
            entityType: 'FacultyLeave',
            entityId: leave.id,
            afterState: { leaveType: params.leaveType, totalDays, startDate: params.startDate, endDate: params.endDate },
            ipAddress: params.ipAddress,
        });
        return leave;
    }
    static async getMyLeaves(userId) {
        return prisma_1.prisma.facultyLeave.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                reviewedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });
    }
    static async getPendingLeaves(params) {
        const where = {
            status: types_1.LeaveStatusEnum.PENDING,
        };
        // If HOD, scope to department faculty
        if (params.userRole === types_1.UserRoleEnum.HOD && params.departmentId) {
            where.user = {
                userRoles: {
                    some: {
                        departmentId: params.departmentId,
                    },
                },
            };
        }
        return prisma_1.prisma.facultyLeave.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        userRoles: {
                            include: {
                                role: true,
                                department: true,
                            },
                        },
                        facultyProfile: {
                            include: {
                                department: true,
                            },
                        },
                    },
                },
            },
        });
    }
    static async reviewLeave(params) {
        const leave = await prisma_1.prisma.facultyLeave.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    include: {
                        userRoles: true,
                    },
                },
            },
        });
        if (!leave) {
            throw new errorHandler_1.AppError('Leave request not found.', 404, 'LEAVE_NOT_FOUND');
        }
        if (leave.status !== types_1.LeaveStatusEnum.PENDING) {
            throw new errorHandler_1.AppError(`Leave request is already ${leave.status.toLowerCase()}.`, 400, 'ALREADY_PROCESSED');
        }
        // Department isolation check for HOD
        if (params.reviewerRole === types_1.UserRoleEnum.HOD) {
            const applicantDept = leave.user.userRoles.find((ur) => ur.departmentId)?.departmentId;
            if (applicantDept !== params.reviewerDepartmentId) {
                throw new errorHandler_1.AppError('Department authorization violation: You cannot review leave requests from outside your assigned department.', 403, 'DEPARTMENT_FORBIDDEN');
            }
        }
        const newStatus = params.action === 'APPROVED' ? types_1.LeaveStatusEnum.APPROVED : types_1.LeaveStatusEnum.REJECTED;
        const updated = await prisma_1.prisma.$transaction(async (tx) => {
            const r = await tx.facultyLeave.update({
                where: { id: leave.id },
                data: {
                    status: newStatus,
                    reviewedByUserId: params.reviewerId,
                    reviewedAt: new Date(),
                    rejectionReason: params.action === 'REJECTED' ? params.rejectionReason || 'Leave request declined.' : null,
                },
            });
            await tx.notification.create({
                data: {
                    userId: leave.userId,
                    title: `Leave Request ${params.action === 'APPROVED' ? 'Approved' : 'Rejected'}`,
                    message: `Your ${leave.leaveType} leave request for ${leave.totalDays} day(s) was ${params.action.toLowerCase()}.${params.rejectionReason ? ` Reason: ${params.rejectionReason}` : ''}`,
                    type: 'APPROVAL',
                },
            });
            return r;
        });
        await audit_service_1.AuditService.log({
            userId: params.reviewerId,
            action: `LEAVE_REQUEST_${params.action}`,
            entityType: 'FacultyLeave',
            entityId: leave.id,
            afterState: { status: newStatus, rejectionReason: params.rejectionReason },
            ipAddress: params.ipAddress,
        });
        return updated;
    }
}
exports.LeaveService = LeaveService;
