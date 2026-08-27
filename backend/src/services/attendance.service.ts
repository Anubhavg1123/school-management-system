import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';
import { AttendanceSourceEnum, AttendanceStatusEnum, CorrectionStatusEnum, StudentStatusEnum } from '../types';

export class AttendanceService {
  private static getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  static async checkIn(params: {
    userId: string;
    source?: string;
    kioskIdentifier?: string;
    deviceId?: string;
    ipAddress?: string;
    markedByUserId?: string;
  }) {
    const todayDate = this.getTodayDateString();
    const now = new Date();

    // Verify if user is a student and check active status
    const student = await prisma.student.findUnique({
      where: { userId: params.userId },
    });

    if (student && student.status !== StudentStatusEnum.ACTIVE) {
      throw new AppError(
        `Cannot record attendance: Student account status is ${student.status.replace(/_/g, ' ')}.`,
        403,
        'STUDENT_INACTIVE'
      );
    }

    // Check if user already checked in today
    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: params.userId,
          date: todayDate,
        },
      },
    });

    if (existing && existing.checkInTime) {
      throw new AppError('Check-in already recorded for today.', 400, 'ALREADY_CHECKED_IN');
    }

    // Standard check-in records PRESENT
    const status = AttendanceStatusEnum.PRESENT;
    const lateMinutes = 0;

    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: params.userId,
          date: todayDate,
        },
      },
      update: {
        checkInTime: now,
        status,
        lateMinutes,
        source: params.source || AttendanceSourceEnum.WEB,
        kioskIdentifier: params.kioskIdentifier || null,
        deviceId: params.deviceId || null,
        ipAddress: params.ipAddress || null,
        markedByUserId: params.markedByUserId || null,
      },
      create: {
        userId: params.userId,
        date: todayDate,
        checkInTime: now,
        status,
        lateMinutes,
        source: params.source || AttendanceSourceEnum.WEB,
        kioskIdentifier: params.kioskIdentifier || null,
        deviceId: params.deviceId || null,
        ipAddress: params.ipAddress || null,
        markedByUserId: params.markedByUserId || null,
      },
    });

    await AuditService.log({
      userId: params.userId,
      action: 'ATTENDANCE_CHECK_IN',
      entityType: 'Attendance',
      entityId: attendance.id,
      afterState: { checkInTime: now, status, lateMinutes, source: params.source },
      ipAddress: params.ipAddress,
    });

    return attendance;
  }

  static async checkOut(params: {
    userId: string;
    source?: string;
    ipAddress?: string;
  }) {
    const todayDate = this.getTodayDateString();
    const now = new Date();

    const existing = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: params.userId,
          date: todayDate,
        },
      },
    });

    if (!existing || !existing.checkInTime) {
      throw new AppError('Cannot check out without an active check-in record today.', 400, 'NO_CHECK_IN_FOUND');
    }

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutTime: now,
      },
    });

    await AuditService.log({
      userId: params.userId,
      action: 'ATTENDANCE_CHECK_OUT',
      entityType: 'Attendance',
      entityId: attendance.id,
      afterState: { checkOutTime: now },
      ipAddress: params.ipAddress,
    });

    return attendance;
  }

  static async getTodayStatus(userId: string) {
    const todayDate = this.getTodayDateString();
    const attendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayDate,
        },
      },
    });

    return attendance;
  }

  static async getMyRecords(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 60,
    });
  }

  static async getAttendanceRecords(query: {
    page?: number;
    limit?: number;
    date?: string;
    status?: string;
    departmentId?: string;
    role?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.date) where.date = query.date;
    if (query.status) where.status = query.status;

    if (query.departmentId || query.role) {
      where.user = {
        userRoles: {
          some: {
            ...(query.departmentId ? { departmentId: query.departmentId } : {}),
            ...(query.role ? { role: { name: query.role } } : {}),
          },
        },
      };
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              userRoles: {
                include: {
                  role: true,
                  department: true,
                },
              },
            },
          },
          markedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async requestCorrection(data: {
    attendanceId: string;
    userId: string;
    proposedCheckIn?: string;
    proposedCheckOut?: string;
    proposedStatus?: string;
    reason: string;
    ipAddress?: string;
  }) {
    const attendance = await prisma.attendance.findUnique({
      where: { id: data.attendanceId },
    });

    if (!attendance) {
      throw new AppError('Attendance record not found.', 404, 'RECORD_NOT_FOUND');
    }

    if (attendance.userId !== data.userId) {
      throw new AppError('You can only submit correction requests for your own attendance.', 403, 'FORBIDDEN');
    }

    const correction = await prisma.attendanceCorrection.create({
      data: {
        attendanceId: data.attendanceId,
        requestedByUserId: data.userId,
        proposedCheckIn: data.proposedCheckIn ? new Date(data.proposedCheckIn) : null,
        proposedCheckOut: data.proposedCheckOut ? new Date(data.proposedCheckOut) : null,
        proposedStatus: data.proposedStatus || null,
        reason: data.reason,
        status: CorrectionStatusEnum.PENDING,
      },
    });

    await AuditService.log({
      userId: data.userId,
      action: 'ATTENDANCE_CORRECTION_REQUESTED',
      entityType: 'AttendanceCorrection',
      entityId: correction.id,
      afterState: correction,
      ipAddress: data.ipAddress,
    });

    return correction;
  }

  static async reviewCorrection(params: {
    correctionId: string;
    reviewerId: string;
    action: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    ipAddress?: string;
  }) {
    const correction = await prisma.attendanceCorrection.findUnique({
      where: { id: params.correctionId },
      include: { attendance: true },
    });

    if (!correction) {
      throw new AppError('Correction request not found.', 404, 'RECORD_NOT_FOUND');
    }

    if (correction.status !== CorrectionStatusEnum.PENDING) {
      throw new AppError(`Correction request is already ${correction.status.toLowerCase()}.`, 400, 'ALREADY_PROCESSED');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update correction record
      await tx.attendanceCorrection.update({
        where: { id: correction.id },
        data: {
          status: params.action,
          reviewedByUserId: params.reviewerId,
          reviewedAt: new Date(),
          rejectionReason: params.rejectionReason || null,
        },
      });

      // 2. If approved, apply changes to the attendance record
      if (params.action === 'APPROVED') {
        const updateData: any = {};
        if (correction.proposedCheckIn) updateData.checkInTime = correction.proposedCheckIn;
        if (correction.proposedCheckOut) updateData.checkOutTime = correction.proposedCheckOut;
        if (correction.proposedStatus) updateData.status = correction.proposedStatus;

        await tx.attendance.update({
          where: { id: correction.attendanceId },
          data: updateData,
        });
      }

      // 3. Notification
      await tx.notification.create({
        data: {
          userId: correction.requestedByUserId,
          title: `Attendance Correction ${params.action}`,
          message: `Your attendance correction request for date ${correction.attendance.date} was ${params.action.toLowerCase()}.${
            params.rejectionReason ? ` Reason: ${params.rejectionReason}` : ''
          }`,
          type: 'APPROVAL',
        },
      });
    });

    await AuditService.log({
      userId: params.reviewerId,
      action: `ATTENDANCE_CORRECTION_${params.action}`,
      entityType: 'AttendanceCorrection',
      entityId: correction.id,
      afterState: { action: params.action, rejectionReason: params.rejectionReason },
      ipAddress: params.ipAddress,
    });

    return { message: `Correction request ${params.action.toLowerCase()} successfully.` };
  }
}
