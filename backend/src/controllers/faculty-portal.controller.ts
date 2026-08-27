import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { FacultyPortalService } from '../services/faculty-portal.service';
import { AuthRequest } from '../types';

// Validation Schemas
export const updateProfileSchema = z.object({
  phone: z.string().optional(),
  whatsAppNumber: z.string().optional(),
  altPhone: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export const createAssignmentSchema = z.object({
  academicYearId: z.string().optional(),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  dueDate: z.string().min(1, 'Due date is required'),
  attachments: z
    .array(
      z.object({
        title: z.string(),
        fileUrl: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .optional(),
});

export const requestFacultyLeaveSchema = z.object({
  leaveType: z.enum(['CASUAL', 'MEDICAL', 'DUTY', 'EARNED', 'MATERNITY_PATERNITY', 'OTHER']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const requestExtraClassSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  date: z.string().min(1, 'Date is required'),
  timeSlotId: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  reason: z.string().min(3, 'Reason is required'),
});

export const registerVehicleSchema = z.object({
  vehicleNumber: z.string().min(3, 'Vehicle number is required'),
  vehicleType: z.enum(['TWO_WHEELER', 'FOUR_WHEELER', 'BICYCLE', 'OTHER']),
  makeModel: z.string().optional(),
  color: z.string().optional(),
  registrationDetails: z.string().optional(),
  documentUrl: z.string().optional(),
});

export const reviewVehicleSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
});

export const createAnnouncementSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  title: z.string().min(3, 'Title is required'),
  content: z.string().min(5, 'Content is required'),
  category: z.string().optional(),
});

export class FacultyPortalController {
  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.getFacultyDashboard(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.getFacultyProfile(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.updateFacultyProfile(req.user!.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAssignedClasses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.getAssignedClasses(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAssignedStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sectionId = String(req.params.sectionId);
      const data = await FacultyPortalService.getAssignedStudents(req.user!.id, sectionId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = String(req.params.studentId);
      const data = await FacultyPortalService.getStudentProfileForFaculty(req.user!.id, studentId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getTimetable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dayOfWeek = typeof req.query.dayOfWeek === 'string' ? req.query.dayOfWeek : undefined;
      const data = await FacultyPortalService.getFacultyTimetable(req.user!.id, dayOfWeek);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async createAssignment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.createAssignment(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async publishAssignment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const data = await FacultyPortalService.publishAssignment(req.user!.id, id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAssignments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        classId: typeof req.query.classId === 'string' ? req.query.classId : undefined,
        sectionId: typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined,
        subjectId: typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined,
      };
      const data = await FacultyPortalService.getFacultyAssignments(req.user!.id, filters);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async requestLeave(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.requestFacultyLeave(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getLeaves(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.getFacultyLeaves(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async requestExtraClass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.requestExtraClass(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getExtraClasses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.getFacultyExtraClasses(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async registerVehicle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.registerVehicle(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getVehicles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.getFacultyVehicles(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async reviewVehicle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const data = await FacultyPortalService.reviewVehicleRegistration(req.user!.id, id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async createAnnouncement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.createClassAnnouncement(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAnnouncements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        classId: typeof req.query.classId === 'string' ? req.query.classId : undefined,
        sectionId: typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined,
      };
      const data = await FacultyPortalService.getFacultyAnnouncements(req.user!.id, filters);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.getFacultyNotifications(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async markNotificationRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const data = await FacultyPortalService.markNotificationRead(req.user!.id, id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getWorkload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await FacultyPortalService.getFacultyWorkload(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
