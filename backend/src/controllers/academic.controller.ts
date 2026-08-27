import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AcademicService } from '../services/academic.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const createDepartmentSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  hodUserId: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const assignHodSchema = z.object({
  hodUserId: z.string().min(1, 'HOD user ID required'),
  reason: z.string().min(3, 'Reason for appointment required'),
});

export const createAcademicYearSchema = z.object({
  name: z.string().min(4, 'Name required (e.g. 2026-2027)'),
  startDate: z.string(),
  endDate: z.string(),
  isCurrent: z.boolean().optional(),
  enrollmentPrefix: z.string().optional(),
  enrollmentSeqLength: z.number().int().positive().optional(),
  status: z.enum(['UPCOMING', 'ACTIVE', 'ARCHIVED']).optional(),
});

export const setAcademicYearStatusSchema = z.object({
  isCurrent: z.boolean(),
});

export const createClassSchema = z.object({
  name: z.string().min(1, 'Class name required'),
  code: z.string().min(1, 'Class code required'),
  order: z.number().int().optional(),
  educationLevel: z.enum(['PRIMARY', 'MIDDLE', 'SECONDARY', 'HIGHER_SECONDARY', 'BELOW_10TH', '10TH', 'ABOVE_10TH']).optional(),
  departmentId: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year required'),
});

export const createSectionSchema = z.object({
  classId: z.string().min(1, 'Class ID required'),
  name: z.string().min(1, 'Section name required'),
  capacity: z.number().int().positive().optional(),
  coordinatorFacultyId: z.string().optional(),
});

export const assignCoordinatorSchema = z.object({
  facultyId: z.string().min(1, 'Faculty ID required'),
  academicYearId: z.string().min(1, 'Academic year required'),
  reason: z.string().min(3, 'Reason required'),
});

export const createSubjectSchema = z.object({
  code: z.string().min(2, 'Subject code required'),
  name: z.string().min(2, 'Subject name required'),
  type: z.enum(['THEORY', 'PRACTICAL', 'LAB', 'ELECTIVE']).optional(),
  credits: z.number().positive().optional(),
  departmentId: z.string().optional(),
  description: z.string().optional(),
});

export const updateSubjectSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['THEORY', 'PRACTICAL', 'LAB', 'ELECTIVE']).optional(),
  credits: z.number().positive().optional(),
  departmentId: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const assignClassSubjectsSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year required'),
  subjectIds: z.array(z.string()).min(1, 'At least one subject required'),
});

export const assignFacultySubjectSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year required'),
  facultyId: z.string().min(1, 'Faculty ID required'),
  classId: z.string().min(1, 'Class ID required'),
  sectionId: z.string().optional(),
  subjectId: z.string().min(1, 'Subject ID required'),
});

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number required'),
  name: z.string().min(1, 'Room name required'),
  building: z.string().min(1, 'Building required'),
  floor: z.number().int().optional(),
  capacity: z.number().int().positive().optional(),
  type: z.enum(['CLASSROOM', 'LAB', 'COMPUTER_LAB', 'SEMINAR_HALL', 'AUDITORIUM', 'SPORTS_AREA', 'OTHER']).optional(),
  equipment: z.string().optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().optional(),
  building: z.string().optional(),
  floor: z.number().int().optional(),
  capacity: z.number().int().positive().optional(),
  type: z.enum(['CLASSROOM', 'LAB', 'COMPUTER_LAB', 'SEMINAR_HALL', 'AUDITORIUM', 'SPORTS_AREA', 'OTHER']).optional(),
  equipment: z.string().optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).optional(),
});

export const createTimeSlotSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year required'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  periodNumber: z.number().int().positive(),
  name: z.string().min(1, 'Period name required'),
  startTime: z.string().min(4, 'Start time required (HH:MM)'),
  endTime: z.string().min(4, 'End time required (HH:MM)'),
  isBreak: z.boolean().optional(),
});

export const updateTimeSlotSchema = z.object({
  name: z.string().optional(),
  startTime: z.string().min(4).optional(),
  endTime: z.string().min(4).optional(),
  isBreak: z.boolean().optional(),
});

export const setFacultyAvailabilitySchema = z.object({
  facultyId: z.string().min(1, 'Faculty ID required'),
  academicYearId: z.string().min(1, 'Academic year required'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  timeSlotId: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isAvailable: z.boolean(),
  reason: z.string().optional(),
});

export const createTimetableEntrySchema = z.object({
  academicYearId: z.string().min(1, 'Academic year required'),
  departmentId: z.string().optional(),
  classId: z.string().min(1, 'Class ID required'),
  sectionId: z.string().min(1, 'Section ID required'),
  subjectId: z.string().optional(),
  facultyId: z.string().optional(),
  roomId: z.string().optional(),
  timeSlotId: z.string().min(1, 'Time slot ID required'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
});

export const generateTimetableGridSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year ID required'),
  classId: z.string().min(1, 'Class ID required'),
  sectionId: z.string().min(1, 'Section ID required'),
  days: z.array(z.string()).optional(),
  periods: z.array(z.object({
    periodNumber: z.number().int().positive(),
    name: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    isBreak: z.boolean().optional(),
  })).optional(),
  forceRegenerate: z.boolean().optional(),
});

export const updateTimetableEntrySchema = z.object({
  subjectId: z.string().nullable().optional(),
  facultyId: z.string().nullable().optional(),
  roomId: z.string().nullable().optional(),
  timeSlotId: z.string().optional(),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']).optional(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'MOVED']).optional(),
});

export const checkTimetableConflictsSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year required'),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  facultyId: z.string().optional(),
  roomId: z.string().optional(),
  timeSlotId: z.string().min(1, 'Time slot ID required'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  excludeEntryId: z.string().optional(),
});

export const requestExtraClassSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year required'),
  classId: z.string().min(1, 'Class ID required'),
  sectionId: z.string().min(1, 'Section ID required'),
  subjectId: z.string().min(1, 'Subject ID required'),
  facultyId: z.string().min(1, 'Faculty ID required'),
  roomId: z.string().min(1, 'Room ID required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timeSlotId: z.string().optional(),
  startTime: z.string().min(4, 'Start time required'),
  endTime: z.string().min(4, 'End time required'),
  reason: z.string().min(3, 'Reason required'),
});

export const reviewExtraClassSchema = z.object({
  action: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
});

export const assignSubstituteSchema = z.object({
  timetableEntryId: z.string().optional(),
  originalFacultyId: z.string().min(1, 'Original faculty required'),
  substituteFacultyId: z.string().min(1, 'Substitute faculty required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  classId: z.string().min(1, 'Class ID required'),
  sectionId: z.string().min(1, 'Section ID required'),
  subjectId: z.string().min(1, 'Subject ID required'),
  timeSlotId: z.string().min(1, 'Time slot ID required'),
  roomId: z.string().optional(),
  reason: z.string().min(3, 'Reason required'),
});

export const admitStudentSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  whatsAppNumber: z.string().min(8, 'Mandatory WhatsApp contact required'),
  altPhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  admissionNumber: z.string().optional(),
  enrollmentNumber: z.string().optional(),
  rollNumber: z.string().optional(),
  academicYearId: z.string().optional(),
  departmentId: z.string().optional(),
  sectionId: z.string().min(1, 'Section ID required'),
  previousSchool: z.string().optional(),
  previousGrade: z.string().optional(),
  previousScore: z.string().optional(),
  photoUrl: z.string().optional(),
  guardian: z.object({
    fullName: z.string().min(1, 'Guardian full name required'),
    relationship: z.string().min(1, 'Relationship required'),
    phone: z.string().min(1, 'Guardian phone required'),
    email: z.string().email().optional(),
    occupation: z.string().optional(),
    address: z.string().optional(),
  }),
});

export const transferStudentSchema = z.object({
  toSectionId: z.string().min(1, 'Destination section required'),
  toClassId: z.string().optional(),
  toDepartmentId: z.string().optional(),
  toAcademicYearId: z.string().optional(),
  transferType: z.enum(['CLASS_TRANSFER', 'SECTION_TRANSFER', 'PROMOTION', 'DEPT_TRANSFER', 'STATUS_CHANGE']).default('SECTION_TRANSFER'),
  reason: z.string().min(3, 'Reason for transfer/promotion required'),
});

export const updateStudentStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'LEFT_INSTITUTION', 'GRADUATED', 'SUSPENDED']),
  reason: z.string().min(3, 'Administrative justification required'),
});

export const uploadDocumentSchema = z.object({
  docType: z.enum(['PHOTO', 'BIRTH_CERTIFICATE', 'PREVIOUS_MARKSHEET', 'ID_PROOF', 'TRANSFER_CERTIFICATE', 'MEDICAL_RECORD', 'OTHER']),
  title: z.string().min(1, 'Document title required'),
  fileUrl: z.string().min(1, 'File URL required'),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

export class AcademicController {
  // 1. Departments & HOD
  static async listDepartments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const depts = await AcademicService.getDepartments();
      return sendSuccess(res, depts, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const dept = await AcademicService.getDepartmentById(id);
      return sendSuccess(res, dept, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const dept = await AcademicService.createDepartment(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, dept, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const dept = await AcademicService.updateDepartment(
        id,
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, dept, 200);
    } catch (error) {
      next(error);
    }
  }

  static async assignDepartmentHod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await AcademicService.assignDepartmentHod(
        id,
        req.body.hodUserId,
        req.body.reason,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  // 2. Academic Years
  static async listAcademicYears(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const years = await AcademicService.getAcademicYears();
      return sendSuccess(res, years, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createAcademicYear(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const year = await AcademicService.createAcademicYear(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, year, 201);
    } catch (error) {
      next(error);
    }
  }

  static async setAcademicYearStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const year = await AcademicService.setAcademicYearStatus(
        id,
        req.body.isCurrent,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, year, 200);
    } catch (error) {
      next(error);
    }
  }

  // 3. Classes & Sections & Coordinators
  static async listClasses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const departmentId = req.query.departmentId as string | undefined;
      const academicYearId = req.query.academicYearId as string | undefined;
      const classes = await AcademicService.getClasses(departmentId, academicYearId);
      return sendSuccess(res, classes, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createClass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const newClass = await AcademicService.createClass(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, newClass, 201);
    } catch (error) {
      next(error);
    }
  }

  static async listSections(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const classId = req.query.classId as string | undefined;
      const sections = await AcademicService.getSections(classId);
      return sendSuccess(res, sections, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createSection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const section = await AcademicService.createSection(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, section, 201);
    } catch (error) {
      next(error);
    }
  }

  static async assignCoordinator(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await AcademicService.assignClassCoordinator(
        id,
        req.body.facultyId,
        req.body.academicYearId,
        req.body.reason,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async unassignCoordinator(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await AcademicService.unassignClassCoordinator(
        id,
        req.user!.id,
        req.body?.reason,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getCoordinatorHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const history = await AcademicService.getClassCoordinatorHistory(id);
      return sendSuccess(res, history, 200);
    } catch (error) {
      next(error);
    }
  }

  // 4. Subjects & Class Subjects
  static async listSubjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const departmentId = req.query.departmentId as string | undefined;
      const subjects = await AcademicService.getSubjects(departmentId);
      return sendSuccess(res, subjects, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createSubject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const subject = await AcademicService.createSubject(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, subject, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateSubject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const subject = await AcademicService.updateSubject(
        id,
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, subject, 200);
    } catch (error) {
      next(error);
    }
  }

  static async assignClassSubjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
      const assignments = await AcademicService.assignSubjectsToClass(
        req.body.academicYearId,
        classId,
        req.body.subjectIds,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, assignments, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getClassSubjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
      const academicYearId = req.query.academicYearId as string | undefined;
      const subjects = await AcademicService.getClassSubjects(classId, academicYearId);
      return sendSuccess(res, subjects, 200);
    } catch (error) {
      next(error);
    }
  }

  // 5. Faculty Subject Assignments
  static async assignFacultySubject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const assignment = await AcademicService.assignFacultyToSubject(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, assignment, 201);
    } catch (error) {
      next(error);
    }
  }

  static async listFacultyAssignments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const academicYearId = req.query.academicYearId as string | undefined;
      const facultyId = req.query.facultyId as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const classId = req.query.classId as string | undefined;

      const assignments = await AcademicService.getFacultyAssignments({
        academicYearId,
        facultyId,
        departmentId,
        classId,
      });
      return sendSuccess(res, assignments, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteFacultyAssignment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await AcademicService.deleteFacultyAssignment(
        id,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  // 6. Rooms & Time Slots
  static async listRooms(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;
      const rooms = await AcademicService.getRooms(type, status);
      return sendSuccess(res, rooms, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createRoom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const room = await AcademicService.createRoom(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, room, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateRoom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const room = await AcademicService.updateRoom(
        id,
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, room, 200);
    } catch (error) {
      next(error);
    }
  }

  static async listTimeSlots(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const academicYearId = (req.query.academicYearId as string) || 'default';
      const dayOfWeek = req.query.dayOfWeek as string | undefined;
      const slots = await AcademicService.getTimeSlots(academicYearId, dayOfWeek);
      return sendSuccess(res, slots, 200);
    } catch (error) {
      next(error);
    }
  }

  static async createTimeSlot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const slot = await AcademicService.createTimeSlot(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, slot, 201);
    } catch (error) {
      next(error);
    }
  }

  static async generateDefaultTimeSlots(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const academicYearId = req.body.academicYearId;
      const days = req.body.days;
      const slots = await AcademicService.generateDefaultTimeSlots(academicYearId, days, req.user!.id);
      return sendSuccess(res, slots, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateTimeSlot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const slot = await AcademicService.updateTimeSlot(
        id,
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, slot, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteTimeSlot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await AcademicService.deleteTimeSlot(
        id,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  // 7. Faculty Availability
  static async getFacultyAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const facultyId = Array.isArray(req.params.facultyId) ? req.params.facultyId[0] : req.params.facultyId;
      const academicYearId = req.query.academicYearId as string;
      const availability = await AcademicService.getFacultyAvailability(facultyId, academicYearId);
      return sendSuccess(res, availability, 200);
    } catch (error) {
      next(error);
    }
  }

  static async setFacultyAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const record = await AcademicService.setFacultyAvailability(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, record, 201);
    } catch (error) {
      next(error);
    }
  }

  // 8. Timetable
  static async getTimetable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const academicYearId = req.query.academicYearId as string;
      const departmentId = req.query.departmentId as string | undefined;
      const classId = req.query.classId as string | undefined;
      const sectionId = req.query.sectionId as string | undefined;
      const facultyId = req.query.facultyId as string | undefined;
      const roomId = req.query.roomId as string | undefined;
      const dayOfWeek = req.query.dayOfWeek as string | undefined;

      const entries = await AcademicService.getTimetable({
        academicYearId,
        departmentId,
        classId,
        sectionId,
        facultyId,
        roomId,
        dayOfWeek,
      });
      return sendSuccess(res, entries, 200);
    } catch (error) {
      next(error);
    }
  }

  static async generateTimetableGrid(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AcademicService.generateTimetableGrid(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async createTimetableEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const entry = await AcademicService.createTimetableEntry(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, entry, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateTimetableEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await AcademicService.updateTimetableEntry(
        id,
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteTimetableEntry(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await AcademicService.deleteTimetableEntry(
        id,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async checkConflicts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AcademicService.checkTimetableConflicts(req.body);
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  // 9. Extra Classes
  static async requestExtraClass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const extra = await AcademicService.requestExtraClass(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, extra, 201);
    } catch (error) {
      next(error);
    }
  }

  static async listExtraClasses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const academicYearId = req.query.academicYearId as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const status = req.query.status as string | undefined;
      const facultyId = req.query.facultyId as string | undefined;

      const extras = await AcademicService.getExtraClassRequests({
        academicYearId,
        departmentId,
        status,
        facultyId,
      });
      return sendSuccess(res, extras, 200);
    } catch (error) {
      next(error);
    }
  }

  static async reviewExtraClass(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await AcademicService.reviewExtraClassRequest(
        id,
        req.body.action,
        req.body.reviewNotes,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, updated, 200);
    } catch (error) {
      next(error);
    }
  }

  // 10. Substitute Faculty
  static async assignSubstitute(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AcademicService.assignSubstituteFaculty(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async listSubstitutes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const date = req.query.date as string | undefined;
      const classId = req.query.classId as string | undefined;
      const facultyId = req.query.facultyId as string | undefined;

      const results = await AcademicService.getSubstituteAssignments({
        date,
        classId,
        facultyId,
      });
      return sendSuccess(res, results, 200);
    } catch (error) {
      next(error);
    }
  }

  // 11. Dashboards
  static async getHodDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const departmentId = (Array.isArray(req.params.departmentId) ? req.params.departmentId[0] : req.params.departmentId) || req.user?.departmentId;
      if (!departmentId) {
        return res.status(400).json({ success: false, error: { code: 'NO_DEPT_SPECIFIED', message: 'Department ID required.' } });
      }
      const academicYearId = req.query.academicYearId as string | undefined;
      const dashboard = await AcademicService.getHodDashboard(departmentId, academicYearId);
      return sendSuccess(res, dashboard, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getFacultyAcademicDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const academicYearId = req.query.academicYearId as string | undefined;
      const dashboard = await AcademicService.getFacultyAcademicDashboard(req.user!.id, academicYearId);
      return sendSuccess(res, dashboard, 200);
    } catch (error) {
      next(error);
    }
  }

  // 12. Students & Admissions (Retained from Phase 3)
  static async listStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const sectionId = req.query.sectionId as string | undefined;
      const classId = req.query.classId as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;
      const academicYearId = req.query.academicYearId as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await AcademicService.getStudents({
        page,
        limit,
        search,
        sectionId,
        classId,
        departmentId,
        academicYearId,
        status,
      });

      return sendSuccess(res, result.students, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const student = await AcademicService.getStudentById(id);
      return sendSuccess(res, student, 200);
    } catch (error) {
      next(error);
    }
  }

  static async admitStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const admission = await AcademicService.admitStudent(
        req.body,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, admission, 201);
    } catch (error) {
      next(error);
    }
  }

  static async transferStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await AcademicService.transferStudent({
        studentId: id,
        ...req.body,
        actorId: req.user!.id,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });
      return sendSuccess(res, updated, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateStudentStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await AcademicService.updateStudentStatus({
        studentId: id,
        status: req.body.status,
        reason: req.body.reason,
        actorId: req.user!.id,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });
      return sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async uploadDocument(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const doc = await AcademicService.uploadDocument({
        studentId: id,
        ...req.body,
        actorId: req.user!.id,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
      });
      return sendSuccess(res, doc, 201);
    } catch (error) {
      next(error);
    }
  }
}
