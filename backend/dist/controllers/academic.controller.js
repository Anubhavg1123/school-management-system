"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicController = exports.uploadDocumentSchema = exports.updateStudentStatusSchema = exports.transferStudentSchema = exports.admitStudentSchema = exports.assignSubstituteSchema = exports.reviewExtraClassSchema = exports.requestExtraClassSchema = exports.checkTimetableConflictsSchema = exports.updateTimetableEntrySchema = exports.createTimetableEntrySchema = exports.setFacultyAvailabilitySchema = exports.createTimeSlotSchema = exports.updateRoomSchema = exports.createRoomSchema = exports.assignFacultySubjectSchema = exports.assignClassSubjectsSchema = exports.updateSubjectSchema = exports.createSubjectSchema = exports.assignCoordinatorSchema = exports.createSectionSchema = exports.createClassSchema = exports.setAcademicYearStatusSchema = exports.createAcademicYearSchema = exports.assignHodSchema = exports.updateDepartmentSchema = exports.createDepartmentSchema = void 0;
const zod_1 = require("zod");
const academic_service_1 = require("../services/academic.service");
const response_1 = require("../utils/response");
exports.createDepartmentSchema = zod_1.z.object({
    code: zod_1.z.string().min(2, 'Code must be at least 2 characters'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    hodUserId: zod_1.z.string().optional(),
});
exports.updateDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
exports.assignHodSchema = zod_1.z.object({
    hodUserId: zod_1.z.string().min(1, 'HOD user ID required'),
    reason: zod_1.z.string().min(3, 'Reason for appointment required'),
});
exports.createAcademicYearSchema = zod_1.z.object({
    name: zod_1.z.string().min(4, 'Name required (e.g. 2026-2027)'),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
    isCurrent: zod_1.z.boolean().optional(),
});
exports.setAcademicYearStatusSchema = zod_1.z.object({
    isCurrent: zod_1.z.boolean(),
});
exports.createClassSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Class name required'),
    code: zod_1.z.string().min(2, 'Class code required'),
    departmentId: zod_1.z.string().optional(),
    academicYearId: zod_1.z.string().min(1, 'Academic year required'),
});
exports.createSectionSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, 'Class ID required'),
    name: zod_1.z.string().min(1, 'Section name required'),
    capacity: zod_1.z.number().int().positive().optional(),
    coordinatorFacultyId: zod_1.z.string().optional(),
});
exports.assignCoordinatorSchema = zod_1.z.object({
    facultyId: zod_1.z.string().min(1, 'Faculty ID required'),
    academicYearId: zod_1.z.string().min(1, 'Academic year required'),
    reason: zod_1.z.string().min(3, 'Reason required'),
});
exports.createSubjectSchema = zod_1.z.object({
    code: zod_1.z.string().min(2, 'Subject code required'),
    name: zod_1.z.string().min(2, 'Subject name required'),
    type: zod_1.z.enum(['THEORY', 'PRACTICAL', 'LAB', 'ELECTIVE']).optional(),
    credits: zod_1.z.number().positive().optional(),
    departmentId: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
exports.updateSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    type: zod_1.z.enum(['THEORY', 'PRACTICAL', 'LAB', 'ELECTIVE']).optional(),
    credits: zod_1.z.number().positive().optional(),
    departmentId: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
exports.assignClassSubjectsSchema = zod_1.z.object({
    academicYearId: zod_1.z.string().min(1, 'Academic year required'),
    subjectIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one subject required'),
});
exports.assignFacultySubjectSchema = zod_1.z.object({
    academicYearId: zod_1.z.string().min(1, 'Academic year required'),
    facultyId: zod_1.z.string().min(1, 'Faculty ID required'),
    classId: zod_1.z.string().min(1, 'Class ID required'),
    sectionId: zod_1.z.string().optional(),
    subjectId: zod_1.z.string().min(1, 'Subject ID required'),
});
exports.createRoomSchema = zod_1.z.object({
    roomNumber: zod_1.z.string().min(1, 'Room number required'),
    name: zod_1.z.string().min(1, 'Room name required'),
    building: zod_1.z.string().min(1, 'Building required'),
    floor: zod_1.z.number().int().optional(),
    capacity: zod_1.z.number().int().positive().optional(),
    type: zod_1.z.enum(['CLASSROOM', 'LAB', 'COMPUTER_LAB', 'SEMINAR_HALL', 'AUDITORIUM', 'SPORTS_AREA', 'OTHER']).optional(),
    equipment: zod_1.z.string().optional(),
});
exports.updateRoomSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    building: zod_1.z.string().optional(),
    floor: zod_1.z.number().int().optional(),
    capacity: zod_1.z.number().int().positive().optional(),
    type: zod_1.z.enum(['CLASSROOM', 'LAB', 'COMPUTER_LAB', 'SEMINAR_HALL', 'AUDITORIUM', 'SPORTS_AREA', 'OTHER']).optional(),
    equipment: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).optional(),
});
exports.createTimeSlotSchema = zod_1.z.object({
    academicYearId: zod_1.z.string().min(1, 'Academic year required'),
    dayOfWeek: zod_1.z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    periodNumber: zod_1.z.number().int().positive(),
    name: zod_1.z.string().min(1, 'Period name required'),
    startTime: zod_1.z.string().min(4, 'Start time required (HH:MM)'),
    endTime: zod_1.z.string().min(4, 'End time required (HH:MM)'),
    isBreak: zod_1.z.boolean().optional(),
});
exports.setFacultyAvailabilitySchema = zod_1.z.object({
    facultyId: zod_1.z.string().min(1, 'Faculty ID required'),
    academicYearId: zod_1.z.string().min(1, 'Academic year required'),
    dayOfWeek: zod_1.z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    timeSlotId: zod_1.z.string().optional(),
    startTime: zod_1.z.string().optional(),
    endTime: zod_1.z.string().optional(),
    isAvailable: zod_1.z.boolean(),
    reason: zod_1.z.string().optional(),
});
exports.createTimetableEntrySchema = zod_1.z.object({
    academicYearId: zod_1.z.string().min(1, 'Academic year required'),
    departmentId: zod_1.z.string().optional(),
    classId: zod_1.z.string().min(1, 'Class ID required'),
    sectionId: zod_1.z.string().min(1, 'Section ID required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID required'),
    facultyId: zod_1.z.string().min(1, 'Faculty ID required'),
    roomId: zod_1.z.string().min(1, 'Room ID required'),
    timeSlotId: zod_1.z.string().min(1, 'Time slot ID required'),
    dayOfWeek: zod_1.z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
});
exports.updateTimetableEntrySchema = zod_1.z.object({
    subjectId: zod_1.z.string().optional(),
    facultyId: zod_1.z.string().optional(),
    roomId: zod_1.z.string().optional(),
    timeSlotId: zod_1.z.string().optional(),
    dayOfWeek: zod_1.z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']).optional(),
});
exports.checkTimetableConflictsSchema = exports.createTimetableEntrySchema.extend({
    excludeEntryId: zod_1.z.string().optional(),
});
exports.requestExtraClassSchema = zod_1.z.object({
    academicYearId: zod_1.z.string().min(1, 'Academic year required'),
    classId: zod_1.z.string().min(1, 'Class ID required'),
    sectionId: zod_1.z.string().min(1, 'Section ID required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID required'),
    facultyId: zod_1.z.string().min(1, 'Faculty ID required'),
    roomId: zod_1.z.string().min(1, 'Room ID required'),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    timeSlotId: zod_1.z.string().optional(),
    startTime: zod_1.z.string().min(4, 'Start time required'),
    endTime: zod_1.z.string().min(4, 'End time required'),
    reason: zod_1.z.string().min(3, 'Reason required'),
});
exports.reviewExtraClassSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVED', 'REJECTED']),
    reviewNotes: zod_1.z.string().optional(),
});
exports.assignSubstituteSchema = zod_1.z.object({
    timetableEntryId: zod_1.z.string().optional(),
    originalFacultyId: zod_1.z.string().min(1, 'Original faculty required'),
    substituteFacultyId: zod_1.z.string().min(1, 'Substitute faculty required'),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    classId: zod_1.z.string().min(1, 'Class ID required'),
    sectionId: zod_1.z.string().min(1, 'Section ID required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID required'),
    timeSlotId: zod_1.z.string().min(1, 'Time slot ID required'),
    roomId: zod_1.z.string().optional(),
    reason: zod_1.z.string().min(3, 'Reason required'),
});
exports.admitStudentSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1, 'First name required'),
    lastName: zod_1.z.string().min(1, 'Last name required'),
    email: zod_1.z.string().email('Valid email required'),
    phone: zod_1.z.string().optional(),
    whatsAppNumber: zod_1.z.string().min(8, 'Mandatory WhatsApp contact required'),
    altPhone: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
    gender: zod_1.z.string().optional(),
    bloodGroup: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    emergencyContact: zod_1.z.string().optional(),
    admissionNumber: zod_1.z.string().min(1, 'Admission number required'),
    enrollmentNumber: zod_1.z.string().optional(),
    rollNumber: zod_1.z.string().optional(),
    academicYearId: zod_1.z.string().optional(),
    departmentId: zod_1.z.string().optional(),
    sectionId: zod_1.z.string().min(1, 'Section ID required'),
    previousSchool: zod_1.z.string().optional(),
    previousGrade: zod_1.z.string().optional(),
    previousScore: zod_1.z.string().optional(),
    photoUrl: zod_1.z.string().optional(),
    guardian: zod_1.z.object({
        fullName: zod_1.z.string().min(1, 'Guardian full name required'),
        relationship: zod_1.z.string().min(1, 'Relationship required'),
        phone: zod_1.z.string().min(1, 'Guardian phone required'),
        email: zod_1.z.string().email().optional(),
        occupation: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
    }),
});
exports.transferStudentSchema = zod_1.z.object({
    toSectionId: zod_1.z.string().min(1, 'Destination section required'),
    toClassId: zod_1.z.string().optional(),
    toDepartmentId: zod_1.z.string().optional(),
    toAcademicYearId: zod_1.z.string().optional(),
    transferType: zod_1.z.enum(['CLASS_TRANSFER', 'SECTION_TRANSFER', 'PROMOTION', 'DEPT_TRANSFER', 'STATUS_CHANGE']).default('SECTION_TRANSFER'),
    reason: zod_1.z.string().min(3, 'Reason for transfer/promotion required'),
});
exports.updateStudentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'LEFT_INSTITUTION', 'GRADUATED', 'SUSPENDED']),
    reason: zod_1.z.string().min(3, 'Administrative justification required'),
});
exports.uploadDocumentSchema = zod_1.z.object({
    docType: zod_1.z.enum(['PHOTO', 'BIRTH_CERTIFICATE', 'PREVIOUS_MARKSHEET', 'ID_PROOF', 'TRANSFER_CERTIFICATE', 'MEDICAL_RECORD', 'OTHER']),
    title: zod_1.z.string().min(1, 'Document title required'),
    fileUrl: zod_1.z.string().min(1, 'File URL required'),
    fileSize: zod_1.z.number().optional(),
    mimeType: zod_1.z.string().optional(),
});
class AcademicController {
    // 1. Departments & HOD
    static async listDepartments(req, res, next) {
        try {
            const depts = await academic_service_1.AcademicService.getDepartments();
            return (0, response_1.sendSuccess)(res, depts, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getDepartmentById(req, res, next) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const dept = await academic_service_1.AcademicService.getDepartmentById(id);
            return (0, response_1.sendSuccess)(res, dept, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async createDepartment(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const dept = await academic_service_1.AcademicService.createDepartment(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, dept, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateDepartment(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const dept = await academic_service_1.AcademicService.updateDepartment(id, req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, dept, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async assignDepartmentHod(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await academic_service_1.AcademicService.assignDepartmentHod(id, req.body.hodUserId, req.body.reason, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // 2. Academic Years
    static async listAcademicYears(req, res, next) {
        try {
            const years = await academic_service_1.AcademicService.getAcademicYears();
            return (0, response_1.sendSuccess)(res, years, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async createAcademicYear(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const year = await academic_service_1.AcademicService.createAcademicYear(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, year, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async setAcademicYearStatus(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const year = await academic_service_1.AcademicService.setAcademicYearStatus(id, req.body.isCurrent, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, year, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // 3. Classes & Sections & Coordinators
    static async listClasses(req, res, next) {
        try {
            const departmentId = req.query.departmentId;
            const academicYearId = req.query.academicYearId;
            const classes = await academic_service_1.AcademicService.getClasses(departmentId, academicYearId);
            return (0, response_1.sendSuccess)(res, classes, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async createClass(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const newClass = await academic_service_1.AcademicService.createClass(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, newClass, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async listSections(req, res, next) {
        try {
            const classId = req.query.classId;
            const sections = await academic_service_1.AcademicService.getSections(classId);
            return (0, response_1.sendSuccess)(res, sections, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async createSection(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const section = await academic_service_1.AcademicService.createSection(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, section, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async assignCoordinator(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await academic_service_1.AcademicService.assignClassCoordinator(id, req.body.facultyId, req.body.academicYearId, req.body.reason, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // 4. Subjects & Class Subjects
    static async listSubjects(req, res, next) {
        try {
            const departmentId = req.query.departmentId;
            const subjects = await academic_service_1.AcademicService.getSubjects(departmentId);
            return (0, response_1.sendSuccess)(res, subjects, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async createSubject(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const subject = await academic_service_1.AcademicService.createSubject(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, subject, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateSubject(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const subject = await academic_service_1.AcademicService.updateSubject(id, req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, subject, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async assignClassSubjects(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
            const assignments = await academic_service_1.AcademicService.assignSubjectsToClass(req.body.academicYearId, classId, req.body.subjectIds, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, assignments, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getClassSubjects(req, res, next) {
        try {
            const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
            const academicYearId = req.query.academicYearId;
            const subjects = await academic_service_1.AcademicService.getClassSubjects(classId, academicYearId);
            return (0, response_1.sendSuccess)(res, subjects, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // 5. Faculty Subject Assignments
    static async assignFacultySubject(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const assignment = await academic_service_1.AcademicService.assignFacultyToSubject(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, assignment, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async listFacultyAssignments(req, res, next) {
        try {
            const academicYearId = req.query.academicYearId;
            const facultyId = req.query.facultyId;
            const departmentId = req.query.departmentId;
            const classId = req.query.classId;
            const assignments = await academic_service_1.AcademicService.getFacultyAssignments({
                academicYearId,
                facultyId,
                departmentId,
                classId,
            });
            return (0, response_1.sendSuccess)(res, assignments, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteFacultyAssignment(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await academic_service_1.AcademicService.deleteFacultyAssignment(id, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // 6. Rooms & Time Slots
    static async listRooms(req, res, next) {
        try {
            const type = req.query.type;
            const status = req.query.status;
            const rooms = await academic_service_1.AcademicService.getRooms(type, status);
            return (0, response_1.sendSuccess)(res, rooms, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async createRoom(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const room = await academic_service_1.AcademicService.createRoom(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, room, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateRoom(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const room = await academic_service_1.AcademicService.updateRoom(id, req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, room, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async listTimeSlots(req, res, next) {
        try {
            const academicYearId = req.query.academicYearId || 'default';
            const dayOfWeek = req.query.dayOfWeek;
            const slots = await academic_service_1.AcademicService.getTimeSlots(academicYearId, dayOfWeek);
            return (0, response_1.sendSuccess)(res, slots, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async createTimeSlot(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const slot = await academic_service_1.AcademicService.createTimeSlot(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, slot, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async generateDefaultTimeSlots(req, res, next) {
        try {
            const academicYearId = req.body.academicYearId;
            const days = req.body.days;
            const slots = await academic_service_1.AcademicService.generateDefaultTimeSlots(academicYearId, days, req.user.id);
            return (0, response_1.sendSuccess)(res, slots, 201);
        }
        catch (error) {
            next(error);
        }
    }
    // 7. Faculty Availability
    static async getFacultyAvailability(req, res, next) {
        try {
            const facultyId = Array.isArray(req.params.facultyId) ? req.params.facultyId[0] : req.params.facultyId;
            const academicYearId = req.query.academicYearId;
            const availability = await academic_service_1.AcademicService.getFacultyAvailability(facultyId, academicYearId);
            return (0, response_1.sendSuccess)(res, availability, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async setFacultyAvailability(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const record = await academic_service_1.AcademicService.setFacultyAvailability(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, record, 201);
        }
        catch (error) {
            next(error);
        }
    }
    // 8. Timetable
    static async getTimetable(req, res, next) {
        try {
            const academicYearId = req.query.academicYearId;
            const departmentId = req.query.departmentId;
            const classId = req.query.classId;
            const sectionId = req.query.sectionId;
            const facultyId = req.query.facultyId;
            const roomId = req.query.roomId;
            const dayOfWeek = req.query.dayOfWeek;
            const entries = await academic_service_1.AcademicService.getTimetable({
                academicYearId,
                departmentId,
                classId,
                sectionId,
                facultyId,
                roomId,
                dayOfWeek,
            });
            return (0, response_1.sendSuccess)(res, entries, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async createTimetableEntry(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const entry = await academic_service_1.AcademicService.createTimetableEntry(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, entry, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateTimetableEntry(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const updated = await academic_service_1.AcademicService.updateTimetableEntry(id, req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, updated, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteTimetableEntry(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await academic_service_1.AcademicService.deleteTimetableEntry(id, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async checkConflicts(req, res, next) {
        try {
            const result = await academic_service_1.AcademicService.checkTimetableConflicts(req.body);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // 9. Extra Classes
    static async requestExtraClass(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const extra = await academic_service_1.AcademicService.requestExtraClass(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, extra, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async listExtraClasses(req, res, next) {
        try {
            const academicYearId = req.query.academicYearId;
            const departmentId = req.query.departmentId;
            const status = req.query.status;
            const facultyId = req.query.facultyId;
            const extras = await academic_service_1.AcademicService.getExtraClassRequests({
                academicYearId,
                departmentId,
                status,
                facultyId,
            });
            return (0, response_1.sendSuccess)(res, extras, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async reviewExtraClass(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const updated = await academic_service_1.AcademicService.reviewExtraClassRequest(id, req.body.action, req.body.reviewNotes, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, updated, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // 10. Substitute Faculty
    static async assignSubstitute(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await academic_service_1.AcademicService.assignSubstituteFaculty(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async listSubstitutes(req, res, next) {
        try {
            const date = req.query.date;
            const classId = req.query.classId;
            const facultyId = req.query.facultyId;
            const results = await academic_service_1.AcademicService.getSubstituteAssignments({
                date,
                classId,
                facultyId,
            });
            return (0, response_1.sendSuccess)(res, results, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // 11. Dashboards
    static async getHodDashboard(req, res, next) {
        try {
            const departmentId = (Array.isArray(req.params.departmentId) ? req.params.departmentId[0] : req.params.departmentId) || req.user?.departmentId;
            if (!departmentId) {
                return res.status(400).json({ success: false, error: { code: 'NO_DEPT_SPECIFIED', message: 'Department ID required.' } });
            }
            const academicYearId = req.query.academicYearId;
            const dashboard = await academic_service_1.AcademicService.getHodDashboard(departmentId, academicYearId);
            return (0, response_1.sendSuccess)(res, dashboard, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getFacultyAcademicDashboard(req, res, next) {
        try {
            const academicYearId = req.query.academicYearId;
            const dashboard = await academic_service_1.AcademicService.getFacultyAcademicDashboard(req.user.id, academicYearId);
            return (0, response_1.sendSuccess)(res, dashboard, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // 12. Students & Admissions (Retained from Phase 3)
    static async listStudents(req, res, next) {
        try {
            const page = req.query.page ? parseInt(req.query.page, 10) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
            const search = req.query.search;
            const sectionId = req.query.sectionId;
            const classId = req.query.classId;
            const departmentId = req.query.departmentId;
            const academicYearId = req.query.academicYearId;
            const status = req.query.status;
            const result = await academic_service_1.AcademicService.getStudents({
                page,
                limit,
                search,
                sectionId,
                classId,
                departmentId,
                academicYearId,
                status,
            });
            return (0, response_1.sendSuccess)(res, result.students, 200, result.meta);
        }
        catch (error) {
            next(error);
        }
    }
    static async getStudentById(req, res, next) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const student = await academic_service_1.AcademicService.getStudentById(id);
            return (0, response_1.sendSuccess)(res, student, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async admitStudent(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const admission = await academic_service_1.AcademicService.admitStudent(req.body, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, admission, 201);
        }
        catch (error) {
            next(error);
        }
    }
    static async transferStudent(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const updated = await academic_service_1.AcademicService.transferStudent({
                studentId: id,
                ...req.body,
                actorId: req.user.id,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, updated, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateStudentStatus(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await academic_service_1.AcademicService.updateStudentStatus({
                studentId: id,
                status: req.body.status,
                reason: req.body.reason,
                actorId: req.user.id,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async uploadDocument(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const doc = await academic_service_1.AcademicService.uploadDocument({
                studentId: id,
                ...req.body,
                actorId: req.user.id,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : undefined,
            });
            return (0, response_1.sendSuccess)(res, doc, 201);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AcademicController = AcademicController;
