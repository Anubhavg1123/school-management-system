import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { StudentAttendanceService } from '../services/student-attendance.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const generateSlotsSchema = z.object({
  date: z.string().optional(),
  academicYearId: z.string().optional(),
});

export const createExtraClassSlotSchema = z.object({
  extraClassRequestId: z.string().min(1, 'Extra Class Request ID is required'),
});

export const submitStudentAttendanceSchema = z.object({
  slotId: z.string().min(1, 'Attendance Slot ID is required'),
  studentRecords: z.array(
    z.object({
      studentId: z.string().min(1, 'Student ID is required'),
      status: z.enum(['PRESENT', 'ABSENT']),
      remarks: z.string().optional(),
    })
  ).min(1, 'At least one student record is required'),
  isFinalize: z.boolean().optional(),
});

export const studentCorrectionSchema = z.object({
  studentAttendanceId: z.string().min(1, 'Student Attendance ID is required'),
  proposedStatus: z.enum(['PRESENT', 'ABSENT', 'ACADEMIC_BYPASS']),
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});

export const reviewStudentCorrectionSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
});

export const applySchoolActivityBypassSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  attendanceSlotId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  activityType: z.enum([
    'SPORTS',
    'ACADEMIC_EVENT',
    'SCHOOL_EVENT',
    'COMPETITION',
    'OFFICIAL_SCHOOL_ACTIVITY',
    'OTHER_SCHOOL_APPROVED_ACTIVITY',
  ]),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const academicBypassSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  attendanceSlotId: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  activityName: z.string().min(3, 'Activity name must be at least 3 characters'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const reviewAcademicBypassSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
});

export class StudentAttendanceController {
  // Generate daily timetable attendance slots
  static async generateSlots(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await StudentAttendanceService.generateSlotsFromTimetable(
        req.body.date,
        req.body.academicYearId,
        req.user!.id
      );
      return sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // Create slot for approved extra class
  static async createExtraClassSlot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const slot = await StudentAttendanceService.createExtraClassSlot(
        req.body.extraClassRequestId,
        req.user!.id
      );
      return sendSuccess(res, slot, 201);
    } catch (error) {
      next(error);
    }
  }

  // List attendance slots
  static async getSlots(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string | undefined;
      const classId = req.query.classId as string | undefined;
      const sectionId = req.query.sectionId as string | undefined;
      const facultyId = req.query.facultyId as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const academicYearId = req.query.academicYearId as string | undefined;
      const status = req.query.status as string | undefined;

      const slots = await StudentAttendanceService.getAttendanceSlots({
        date,
        classId,
        sectionId,
        facultyId,
        departmentId,
        academicYearId,
        status,
      });

      return sendSuccess(res, slots, 200);
    } catch (error) {
      next(error);
    }
  }

  // Fetch slot details with enrolled student roster
  static async getSlotDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const slotId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const details = await StudentAttendanceService.getSlotDetails(slotId, {
        id: req.user!.id,
        activeRole: req.user!.activeRole,
        departmentId: req.user!.departmentId || undefined,
      });
      return sendSuccess(res, details, 200);
    } catch (error) {
      next(error);
    }
  }

  // Submit/finalize student attendance
  static async submitAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await StudentAttendanceService.submitStudentAttendance(
        {
          slotId: req.body.slotId,
          studentRecords: req.body.studentRecords,
          isFinalize: req.body.isFinalize,
        },
        {
          id: req.user!.id,
          activeRole: req.user!.activeRole,
          departmentId: req.user!.departmentId || undefined,
        },
        typeof ipAddress === 'string' ? ipAddress : undefined
      );

      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  // Request student attendance correction
  static async requestCorrection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const correction = await StudentAttendanceService.requestStudentAttendanceCorrection(
        {
          studentAttendanceId: req.body.studentAttendanceId,
          proposedStatus: req.body.proposedStatus,
          reason: req.body.reason,
        },
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );

      return sendSuccess(res, correction, 201);
    } catch (error) {
      next(error);
    }
  }

  // Review student attendance correction
  static async reviewCorrection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await StudentAttendanceService.reviewStudentAttendanceCorrection(
        {
          correctionId: id,
          action: req.body.action,
          reviewNotes: req.body.reviewNotes,
        },
        req.user!.id,
        req.user!.activeRole,
        req.user!.departmentId || undefined,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );

      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  // Apply school activity / academic bypass (Class Coordinator or Higher Admin)
  static async applyBypass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await StudentAttendanceService.applySchoolActivityBypass(
        {
          studentId: req.body.studentId,
          attendanceSlotId: req.body.attendanceSlotId,
          date: req.body.date,
          activityType: req.body.activityType,
          reason: req.body.reason,
        },
        {
          id: req.user!.id,
          activeRole: req.user!.activeRole,
          departmentId: req.user!.departmentId || undefined,
        },
        typeof ipAddress === 'string' ? ipAddress : undefined
      );

      return sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  // Request academic bypass
  static async requestBypass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const bypass = await StudentAttendanceService.requestAcademicBypass(
        {
          studentId: req.body.studentId,
          attendanceSlotId: req.body.attendanceSlotId,
          date: req.body.date,
          activityName: req.body.activityName,
          reason: req.body.reason,
        },
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );

      return sendSuccess(res, bypass, 201);
    } catch (error) {
      next(error);
    }
  }

  // Review academic bypass
  static async reviewBypass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await StudentAttendanceService.reviewAcademicBypass(
        {
          bypassId: id,
          action: req.body.action,
        },
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );

      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  // Fetch student attendance history and percentage
  static async getStudentHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
      const academicYearId = req.query.academicYearId as string | undefined;

      const history = await StudentAttendanceService.getStudentAttendanceHistory(
        studentId,
        academicYearId
      );

      return sendSuccess(res, history, 200);
    } catch (error) {
      next(error);
    }
  }

  // Daily staff/faculty attendance summary
  static async getDailyUserSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const role = req.query.role as string | undefined;

      const summary = await StudentAttendanceService.getDailyUserAttendanceSummary({
        date,
        departmentId,
        role,
      });

      return sendSuccess(res, summary, 200);
    } catch (error) {
      next(error);
    }
  }

  // Fetch attendance anomalies
  static async getAnomalies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const anomalies = await StudentAttendanceService.getAttendanceAnomalies({
        type,
        limit,
      });

      return sendSuccess(res, anomalies, 200);
    } catch (error) {
      next(error);
    }
  }
}
