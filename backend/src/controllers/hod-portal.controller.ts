import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { HodPortalService } from '../services/hod-portal.service';

const getQueryString = (val: any): string | undefined => {
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
  return undefined;
};

// Zod Validation Schemas
export const updateDepartmentProfileSchema = z.object({
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const assignFacultySubjectSchema = z.object({
  facultyId: z.string().min(1, 'Faculty ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().optional(),
  subjectId: z.string().min(1, 'Subject ID is required'),
  academicYearId: z.string().optional(),
});

export const assignClassCoordinatorSchema = z.object({
  facultyId: z.string().min(1, 'Faculty ID is required'),
});

export const reviewApprovalSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
});

export const assignSubstituteSchema = z.object({
  originalFacultyId: z.string().min(1, 'Original Faculty ID is required'),
  substituteFacultyId: z.string().min(1, 'Substitute Faculty ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  timeSlotId: z.string().min(1, 'Time Slot ID is required'),
  date: z.string().min(1, 'Date is required'),
  reason: z.string().min(1, 'Reason is required'),
});

export const createTimetableEntrySchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  facultyId: z.string().min(1, 'Faculty ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  timeSlotId: z.string().min(1, 'Time Slot ID is required'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
});

export const whatsAppConfigSchema = z.object({
  whatsAppGroupId: z.string().optional(),
  whatsAppGroupStatus: z.enum(['UNCONFIGURED', 'PENDING_SETUP', 'ACTIVE', 'ARCHIVED']).optional(),
});

export const createDepartmentNoticeSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  content: z.string().min(5, 'Content is required'),
  targetScope: z.enum(['DEPARTMENT', 'FACULTY_ONLY', 'STUDENT_ONLY', 'SPECIFIC_CLASS']).optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
});

export class HodPortalController {
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getHodDashboard(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getDepartmentProfile(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getDepartmentProfile(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async updateDepartmentProfile(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.updateDepartmentProfile(req.user!.id, req.body, requestedDeptId);
      res.json({ success: true, data, message: 'Department profile updated successfully.' });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getFaculty(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const search = getQueryString(req.query.search);
      const status = getQueryString(req.query.status);
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 25;

      const data = await HodPortalService.getDepartmentFaculty(
        req.user!.id,
        { search, status, page, limit },
        requestedDeptId
      );
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getFacultyProfile(req: AuthRequest, res: Response) {
    try {
      const facultyId = req.params.id as string;
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getFacultyProfileForHod(req.user!.id, facultyId, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async assignFacultySubject(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.assignFacultySubject(req.user!.id, req.body, requestedDeptId);
      res.status(201).json({ success: true, data, message: 'Subject assigned to faculty successfully.' });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getFacultyWorkload(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getFacultyWorkloadSummary(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getClasses(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getDepartmentClasses(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async assignClassCoordinator(req: AuthRequest, res: Response) {
    try {
      const sectionId = req.params.sectionId as string;
      const { facultyId } = req.body;
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.assignClassCoordinator(req.user!.id, sectionId, facultyId, requestedDeptId);
      res.json({ success: true, data, message: 'Class Coordinator assigned successfully.' });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getStudents(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const search = getQueryString(req.query.search);
      const classId = getQueryString(req.query.classId);
      const sectionId = getQueryString(req.query.sectionId);
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 25;

      const data = await HodPortalService.getDepartmentStudents(
        req.user!.id,
        { search, classId, sectionId, page, limit },
        requestedDeptId
      );
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getLowAttendance(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getLowAttendanceDashboard(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getCorrections(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getDepartmentCorrections(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async reviewCorrection(req: AuthRequest, res: Response) {
    try {
      const correctionId = req.params.id as string;
      const { action, reviewNotes } = req.body;
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.reviewCorrection(req.user!.id, correctionId, action, reviewNotes, requestedDeptId);
      res.json({ success: true, data, message: `Attendance correction ${action.toLowerCase()} successfully.` });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getBypasses(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getDepartmentBypasses(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async reviewBypass(req: AuthRequest, res: Response) {
    try {
      const bypassId = req.params.id as string;
      const { action, reviewNotes } = req.body;
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.reviewBypass(req.user!.id, bypassId, action, reviewNotes, requestedDeptId);
      res.json({ success: true, data, message: `Academic bypass ${action.toLowerCase()} successfully.` });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getLeaves(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getDepartmentLeaves(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async reviewFacultyLeave(req: AuthRequest, res: Response) {
    try {
      const leaveId = req.params.id as string;
      const { action, reviewNotes } = req.body;
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.reviewFacultyLeave(req.user!.id, leaveId, action, reviewNotes, requestedDeptId);
      res.json({ success: true, data, message: `Faculty leave ${action.toLowerCase()} successfully.` });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async assignSubstitute(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.assignSubstituteFaculty(req.user!.id, req.body, requestedDeptId);
      res.status(201).json({ success: true, data, message: 'Substitute faculty assigned successfully.' });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getExtraClasses(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getDepartmentExtraClasses(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async reviewExtraClass(req: AuthRequest, res: Response) {
    try {
      const requestId = req.params.id as string;
      const { action, reviewNotes } = req.body;
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.reviewExtraClass(req.user!.id, requestId, action, reviewNotes, requestedDeptId);
      res.json({ success: true, data, message: `Extra class request ${action.toLowerCase()} successfully.` });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getTimetable(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getDepartmentTimetable(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async createTimetableEntry(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.createTimetableEntry(req.user!.id, req.body, requestedDeptId);
      res.status(201).json({ success: true, data, message: 'Timetable entry created successfully.' });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async updateWhatsAppConfig(req: AuthRequest, res: Response) {
    try {
      const sectionId = req.params.sectionId as string;
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.updateSectionWhatsAppConfig(req.user!.id, sectionId, req.body, requestedDeptId);
      res.json({ success: true, data, message: 'Section WhatsApp group updated.' });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getNotices(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.getDepartmentNotices(req.user!.id, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async createNotice(req: AuthRequest, res: Response) {
    try {
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.createDepartmentNotice(req.user!.id, req.body, requestedDeptId);
      res.status(201).json({ success: true, data, message: 'Department notice broadcasted successfully.' });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }

  static async getReport(req: AuthRequest, res: Response) {
    try {
      const type = (getQueryString(req.query.type) as any) || 'FACULTY';
      const requestedDeptId = getQueryString(req.query.departmentId);
      const data = await HodPortalService.generateDepartmentReport(req.user!.id, type, requestedDeptId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
    }
  }
}
