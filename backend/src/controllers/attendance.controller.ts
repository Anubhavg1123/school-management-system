import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AttendanceService } from '../services/attendance.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const checkInSchema = z.object({
  source: z.enum(['WEB', 'KIOSK', 'MANUAL']).optional(),
  kioskIdentifier: z.string().optional(),
  deviceId: z.string().optional(),
  targetUserId: z.string().optional(), // For manual marking by admin/faculty
});

export const checkOutSchema = z.object({
  source: z.enum(['WEB', 'KIOSK', 'MANUAL']).optional(),
  targetUserId: z.string().optional(),
});

export const correctionRequestSchema = z.object({
  attendanceId: z.string().min(1, 'Attendance ID is required'),
  proposedCheckIn: z.string().optional(),
  proposedCheckOut: z.string().optional(),
  proposedStatus: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED']).optional(),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const reviewCorrectionSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export class AttendanceController {
  static async checkIn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const targetUserId = req.body.targetUserId || req.user!.id;
      const markedByUserId = req.body.targetUserId ? req.user!.id : undefined;

      const record = await AttendanceService.checkIn({
        userId: targetUserId,
        source: req.body.source,
        kioskIdentifier: req.body.kioskIdentifier,
        deviceId: req.body.deviceId,
        markedByUserId,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });

      return sendSuccess(res, record, 200);
    } catch (error) {
      next(error);
    }
  }

  static async checkOut(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const targetUserId = req.body.targetUserId || req.user!.id;

      const record = await AttendanceService.checkOut({
        userId: targetUserId,
        source: req.body.source,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });

      return sendSuccess(res, record, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getTodayStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.query.userId ? (req.query.userId as string) : req.user!.id;
      const status = await AttendanceService.getTodayStatus(targetUserId);
      return sendSuccess(res, status, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getMyRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const records = await AttendanceService.getMyRecords(req.user!.id, startDate, endDate);
      return sendSuccess(res, records, 200);
    } catch (error) {
      next(error);
    }
  }

  static async listRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const date = req.query.date as string | undefined;
      const status = req.query.status as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const role = req.query.role as string | undefined;

      const result = await AttendanceService.getAttendanceRecords({
        page,
        limit,
        date,
        status,
        departmentId,
        role,
      });

      return sendSuccess(res, result.records, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async requestCorrection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AttendanceService.requestCorrection({
        attendanceId: req.body.attendanceId,
        userId: req.user!.id,
        proposedCheckIn: req.body.proposedCheckIn,
        proposedCheckOut: req.body.proposedCheckOut,
        proposedStatus: req.body.proposedStatus,
        reason: req.body.reason,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });

      return sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async reviewCorrection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await AttendanceService.reviewCorrection({
        correctionId: id,
        reviewerId: req.user!.id,
        action: req.body.action,
        rejectionReason: req.body.rejectionReason,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });

      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
