"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const audit_service_1 = require("./audit.service");
const types_1 = require("../types");
class AttendanceService {
    static getTodayDateString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }
    static async checkIn(params) {
        const todayDate = this.getTodayDateString();
        const now = new Date();
        // Verify if user is a student and check active status
        const student = await prisma_1.prisma.student.findUnique({
            where: { userId: params.userId },
        });
        if (student && student.status !== types_1.StudentStatusEnum.ACTIVE) {
            throw new errorHandler_1.AppError(`Cannot record attendance: Student account status is ${student.status.replace(/_/g, ' ')}.`, 403, 'STUDENT_INACTIVE');
        }
        // Check if user already checked in today
        const existing = await prisma_1.prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId: params.userId,
                    date: todayDate,
                },
            },
        });
        if (existing && existing.checkInTime) {
            throw new errorHandler_1.AppError('Check-in already recorded for today.', 400, 'ALREADY_CHECKED_IN');
        }
        // Determine Late Status (Standard start time 09:15 AM)
        const standardStart = new Date();
        standardStart.setHours(9, 15, 0, 0);
        let status = types_1.AttendanceStatusEnum.PRESENT;
        let lateMinutes = 0;
        if (now > standardStart) {
            status = types_1.AttendanceStatusEnum.LATE;
            lateMinutes = Math.max(0, Math.floor((now.getTime() - standardStart.getTime()) / 60000));
        }
        const attendance = await prisma_1.prisma.attendance.upsert({
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
                source: params.source || types_1.AttendanceSourceEnum.WEB,
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
                source: params.source || types_1.AttendanceSourceEnum.WEB,
                kioskIdentifier: params.kioskIdentifier || null,
                deviceId: params.deviceId || null,
                ipAddress: params.ipAddress || null,
                markedByUserId: params.markedByUserId || null,
            },
        });
        await audit_service_1.AuditService.log({
            userId: params.userId,
            action: 'ATTENDANCE_CHECK_IN',
            entityType: 'Attendance',
            entityId: attendance.id,
            afterState: { checkInTime: now, status, lateMinutes, source: params.source },
            ipAddress: params.ipAddress,
        });
        return attendance;
    }
    static async checkOut(params) {
        const todayDate = this.getTodayDateString();
        const now = new Date();
        const existing = await prisma_1.prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId: params.userId,
                    date: todayDate,
                },
            },
        });
        if (!existing || !existing.checkInTime) {
            throw new errorHandler_1.AppError('Cannot check out without an active check-in record today.', 400, 'NO_CHECK_IN_FOUND');
        }
        const attendance = await prisma_1.prisma.attendance.update({
            where: { id: existing.id },
            data: {
                checkOutTime: now,
            },
        });
        await audit_service_1.AuditService.log({
            userId: params.userId,
            action: 'ATTENDANCE_CHECK_OUT',
            entityType: 'Attendance',
            entityId: attendance.id,
            afterState: { checkOutTime: now },
            ipAddress: params.ipAddress,
        });
        return attendance;
    }
    static async getTodayStatus(userId) {
        const todayDate = this.getTodayDateString();
        const attendance = await prisma_1.prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: todayDate,
                },
            },
        });
        return attendance;
    }
    static async getMyRecords(userId, startDate, endDate) {
        const where = { userId };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = startDate;
            if (endDate)
                where.date.lte = endDate;
        }
        return prisma_1.prisma.attendance.findMany({
            where,
            orderBy: { date: 'desc' },
            take: 60,
        });
    }
    static async getAttendanceRecords(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.date)
            where.date = query.date;
        if (query.status)
            where.status = query.status;
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
            prisma_1.prisma.attendance.findMany({
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
            prisma_1.prisma.attendance.count({ where }),
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
    static async requestCorrection(data) {
        const attendance = await prisma_1.prisma.attendance.findUnique({
            where: { id: data.attendanceId },
        });
        if (!attendance) {
            throw new errorHandler_1.AppError('Attendance record not found.', 404, 'RECORD_NOT_FOUND');
        }
        if (attendance.userId !== data.userId) {
            throw new errorHandler_1.AppError('You can only submit correction requests for your own attendance.', 403, 'FORBIDDEN');
        }
        const correction = await prisma_1.prisma.attendanceCorrection.create({
            data: {
                attendanceId: data.attendanceId,
                requestedByUserId: data.userId,
                proposedCheckIn: data.proposedCheckIn ? new Date(data.proposedCheckIn) : null,
                proposedCheckOut: data.proposedCheckOut ? new Date(data.proposedCheckOut) : null,
                proposedStatus: data.proposedStatus || null,
                reason: data.reason,
                status: types_1.CorrectionStatusEnum.PENDING,
            },
        });
        await audit_service_1.AuditService.log({
            userId: data.userId,
            action: 'ATTENDANCE_CORRECTION_REQUESTED',
            entityType: 'AttendanceCorrection',
            entityId: correction.id,
            afterState: correction,
            ipAddress: data.ipAddress,
        });
        return correction;
    }
    static async reviewCorrection(params) {
        const correction = await prisma_1.prisma.attendanceCorrection.findUnique({
            where: { id: params.correctionId },
            include: { attendance: true },
        });
        if (!correction) {
            throw new errorHandler_1.AppError('Correction request not found.', 404, 'RECORD_NOT_FOUND');
        }
        if (correction.status !== types_1.CorrectionStatusEnum.PENDING) {
            throw new errorHandler_1.AppError(`Correction request is already ${correction.status.toLowerCase()}.`, 400, 'ALREADY_PROCESSED');
        }
        await prisma_1.prisma.$transaction(async (tx) => {
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
                const updateData = {};
                if (correction.proposedCheckIn)
                    updateData.checkInTime = correction.proposedCheckIn;
                if (correction.proposedCheckOut)
                    updateData.checkOutTime = correction.proposedCheckOut;
                if (correction.proposedStatus)
                    updateData.status = correction.proposedStatus;
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
                    message: `Your attendance correction request for date ${correction.attendance.date} was ${params.action.toLowerCase()}.${params.rejectionReason ? ` Reason: ${params.rejectionReason}` : ''}`,
                    type: 'APPROVAL',
                },
            });
        });
        await audit_service_1.AuditService.log({
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
exports.AttendanceService = AttendanceService;
