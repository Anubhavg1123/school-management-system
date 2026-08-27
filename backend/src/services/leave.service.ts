import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';
import { LeaveStatusEnum, LeaveTypeEnum, UserRoleEnum } from '../types';

export class LeaveService {
  static async requestLeave(params: {
    userId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    ipAddress?: string;
  }) {
    const validLeaveTypes = Object.values(LeaveTypeEnum);
    if (!validLeaveTypes.includes(params.leaveType as any)) {
      throw new AppError(
        `Invalid leave type: ${params.leaveType}. Valid options: ${validLeaveTypes.join(', ')}`,
        400,
        'INVALID_LEAVE_TYPE'
      );
    }

    const start = new Date(params.startDate);
    const end = new Date(params.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid start date or end date format.', 400, 'INVALID_DATE');
    }

    if (end < start) {
      throw new AppError('End date cannot be earlier than start date.', 400, 'INVALID_DATE_RANGE');
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Find faculty record if exists
    const faculty = await prisma.faculty.findUnique({
      where: { userId: params.userId },
    });

    const leave = await prisma.facultyLeave.create({
      data: {
        userId: params.userId,
        facultyId: faculty?.id || null,
        leaveType: params.leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason: params.reason,
        status: LeaveStatusEnum.PENDING,
      },
    });

    await AuditService.log({
      userId: params.userId,
      action: 'LEAVE_REQUEST_SUBMITTED',
      entityType: 'FacultyLeave',
      entityId: leave.id,
      afterState: { leaveType: params.leaveType, totalDays, startDate: params.startDate, endDate: params.endDate },
      ipAddress: params.ipAddress,
    });

    return leave;
  }

  static async getMyLeaves(userId: string) {
    return prisma.facultyLeave.findMany({
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

  static async getPendingLeaves(params: {
    departmentId?: string;
    userRole?: string;
  }) {
    const where: any = {
      status: LeaveStatusEnum.PENDING,
    };

    // If HOD, scope to department faculty
    if (params.userRole === UserRoleEnum.HOD && params.departmentId) {
      where.user = {
        userRoles: {
          some: {
            departmentId: params.departmentId,
          },
        },
      };
    }

    return prisma.facultyLeave.findMany({
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

  static async reviewLeave(params: {
    id: string;
    reviewerId: string;
    reviewerRole: string;
    reviewerDepartmentId?: string | null;
    action: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    ipAddress?: string;
  }) {
    const leave = await prisma.facultyLeave.findUnique({
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
      throw new AppError('Leave request not found.', 404, 'LEAVE_NOT_FOUND');
    }

    if (leave.status !== LeaveStatusEnum.PENDING) {
      throw new AppError(`Leave request is already ${leave.status.toLowerCase()}.`, 400, 'ALREADY_PROCESSED');
    }

    // Department isolation check for HOD
    if (params.reviewerRole === UserRoleEnum.HOD) {
      const applicantDept = leave.user.userRoles.find((ur) => ur.departmentId)?.departmentId;
      if (applicantDept !== params.reviewerDepartmentId) {
        throw new AppError(
          'Department authorization violation: You cannot review leave requests from outside your assigned department.',
          403,
          'DEPARTMENT_FORBIDDEN'
        );
      }
    }

    const newStatus = params.action === 'APPROVED' ? LeaveStatusEnum.APPROVED : LeaveStatusEnum.REJECTED;

    const updated = await prisma.$transaction(async (tx) => {
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

    await AuditService.log({
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
