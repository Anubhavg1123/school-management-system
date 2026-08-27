"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentAttendanceController = exports.reviewAcademicBypassSchema = exports.academicBypassSchema = exports.applySchoolActivityBypassSchema = exports.reviewStudentCorrectionSchema = exports.studentCorrectionSchema = exports.submitStudentAttendanceSchema = exports.createExtraClassSlotSchema = exports.generateSlotsSchema = void 0;
const zod_1 = require("zod");
const student_attendance_service_1 = require("../services/student-attendance.service");
const response_1 = require("../utils/response");
exports.generateSlotsSchema = zod_1.z.object({
    date: zod_1.z.string().optional(),
    academicYearId: zod_1.z.string().optional(),
});
exports.createExtraClassSlotSchema = zod_1.z.object({
    extraClassRequestId: zod_1.z.string().min(1, 'Extra Class Request ID is required'),
});
exports.submitStudentAttendanceSchema = zod_1.z.object({
    slotId: zod_1.z.string().min(1, 'Attendance Slot ID is required'),
    studentRecords: zod_1.z.array(zod_1.z.object({
        studentId: zod_1.z.string().min(1, 'Student ID is required'),
        status: zod_1.z.enum(['PRESENT', 'ABSENT']),
        remarks: zod_1.z.string().optional(),
    })).min(1, 'At least one student record is required'),
    isFinalize: zod_1.z.boolean().optional(),
});
exports.studentCorrectionSchema = zod_1.z.object({
    studentAttendanceId: zod_1.z.string().min(1, 'Student Attendance ID is required'),
    proposedStatus: zod_1.z.enum(['PRESENT', 'ABSENT', 'ACADEMIC_BYPASS']),
    reason: zod_1.z.string().min(5, 'Reason must be at least 5 characters long'),
});
exports.reviewStudentCorrectionSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVED', 'REJECTED']),
    reviewNotes: zod_1.z.string().optional(),
});
exports.applySchoolActivityBypassSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, 'Student ID is required'),
    attendanceSlotId: zod_1.z.string().optional(),
    date: zod_1.z.string().min(1, 'Date is required'),
    activityType: zod_1.z.enum([
        'SPORTS',
        'ACADEMIC_EVENT',
        'SCHOOL_EVENT',
        'COMPETITION',
        'OFFICIAL_SCHOOL_ACTIVITY',
        'OTHER_SCHOOL_APPROVED_ACTIVITY',
    ]),
    reason: zod_1.z.string().min(5, 'Reason must be at least 5 characters'),
});
exports.academicBypassSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1, 'Student ID is required'),
    attendanceSlotId: zod_1.z.string().optional(),
    date: zod_1.z.string().min(1, 'Date is required'),
    activityName: zod_1.z.string().min(3, 'Activity name must be at least 3 characters'),
    reason: zod_1.z.string().min(5, 'Reason must be at least 5 characters'),
});
exports.reviewAcademicBypassSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVED', 'REJECTED']),
});
class StudentAttendanceController {
    // Generate daily timetable attendance slots
    static async generateSlots(req, res, next) {
        try {
            const result = await student_attendance_service_1.StudentAttendanceService.generateSlotsFromTimetable(req.body.date, req.body.academicYearId, req.user.id);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (error) {
            next(error);
        }
    }
    // Create slot for approved extra class
    static async createExtraClassSlot(req, res, next) {
        try {
            const slot = await student_attendance_service_1.StudentAttendanceService.createExtraClassSlot(req.body.extraClassRequestId, req.user.id);
            return (0, response_1.sendSuccess)(res, slot, 201);
        }
        catch (error) {
            next(error);
        }
    }
    // List attendance slots
    static async getSlots(req, res, next) {
        try {
            const date = req.query.date;
            const classId = req.query.classId;
            const sectionId = req.query.sectionId;
            const facultyId = req.query.facultyId;
            const departmentId = req.query.departmentId;
            const academicYearId = req.query.academicYearId;
            const status = req.query.status;
            const slots = await student_attendance_service_1.StudentAttendanceService.getAttendanceSlots({
                date,
                classId,
                sectionId,
                facultyId,
                departmentId,
                academicYearId,
                status,
            });
            return (0, response_1.sendSuccess)(res, slots, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // Fetch slot details with enrolled student roster
    static async getSlotDetails(req, res, next) {
        try {
            const slotId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const details = await student_attendance_service_1.StudentAttendanceService.getSlotDetails(slotId, {
                id: req.user.id,
                activeRole: req.user.activeRole,
                departmentId: req.user.departmentId || undefined,
            });
            return (0, response_1.sendSuccess)(res, details, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // Submit/finalize student attendance
    static async submitAttendance(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await student_attendance_service_1.StudentAttendanceService.submitStudentAttendance({
                slotId: req.body.slotId,
                studentRecords: req.body.studentRecords,
                isFinalize: req.body.isFinalize,
            }, {
                id: req.user.id,
                activeRole: req.user.activeRole,
                departmentId: req.user.departmentId || undefined,
            }, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // Request student attendance correction
    static async requestCorrection(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const correction = await student_attendance_service_1.StudentAttendanceService.requestStudentAttendanceCorrection({
                studentAttendanceId: req.body.studentAttendanceId,
                proposedStatus: req.body.proposedStatus,
                reason: req.body.reason,
            }, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, correction, 201);
        }
        catch (error) {
            next(error);
        }
    }
    // Review student attendance correction
    static async reviewCorrection(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await student_attendance_service_1.StudentAttendanceService.reviewStudentAttendanceCorrection({
                correctionId: id,
                action: req.body.action,
                reviewNotes: req.body.reviewNotes,
            }, req.user.id, req.user.activeRole, req.user.departmentId || undefined, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // Apply school activity / academic bypass (Class Coordinator or Higher Admin)
    static async applyBypass(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await student_attendance_service_1.StudentAttendanceService.applySchoolActivityBypass({
                studentId: req.body.studentId,
                attendanceSlotId: req.body.attendanceSlotId,
                date: req.body.date,
                activityType: req.body.activityType,
                reason: req.body.reason,
            }, {
                id: req.user.id,
                activeRole: req.user.activeRole,
                departmentId: req.user.departmentId || undefined,
            }, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (error) {
            next(error);
        }
    }
    // Request academic bypass
    static async requestBypass(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const bypass = await student_attendance_service_1.StudentAttendanceService.requestAcademicBypass({
                studentId: req.body.studentId,
                attendanceSlotId: req.body.attendanceSlotId,
                date: req.body.date,
                activityName: req.body.activityName,
                reason: req.body.reason,
            }, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, bypass, 201);
        }
        catch (error) {
            next(error);
        }
    }
    // Review academic bypass
    static async reviewBypass(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await student_attendance_service_1.StudentAttendanceService.reviewAcademicBypass({
                bypassId: id,
                action: req.body.action,
            }, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // Fetch student attendance history and percentage
    static async getStudentHistory(req, res, next) {
        try {
            const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
            const academicYearId = req.query.academicYearId;
            const history = await student_attendance_service_1.StudentAttendanceService.getStudentAttendanceHistory(studentId, academicYearId);
            return (0, response_1.sendSuccess)(res, history, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // Daily staff/faculty attendance summary
    static async getDailyUserSummary(req, res, next) {
        try {
            const date = req.query.date;
            const departmentId = req.query.departmentId;
            const role = req.query.role;
            const summary = await student_attendance_service_1.StudentAttendanceService.getDailyUserAttendanceSummary({
                date,
                departmentId,
                role,
            });
            return (0, response_1.sendSuccess)(res, summary, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // Fetch attendance anomalies
    static async getAnomalies(req, res, next) {
        try {
            const type = req.query.type;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
            const anomalies = await student_attendance_service_1.StudentAttendanceService.getAttendanceAnomalies({
                type,
                limit,
            });
            return (0, response_1.sendSuccess)(res, anomalies, 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StudentAttendanceController = StudentAttendanceController;
