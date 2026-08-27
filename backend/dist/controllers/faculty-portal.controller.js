"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacultyPortalController = exports.createAnnouncementSchema = exports.reviewVehicleSchema = exports.registerVehicleSchema = exports.requestExtraClassSchema = exports.requestFacultyLeaveSchema = exports.createAssignmentSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const faculty_portal_service_1 = require("../services/faculty-portal.service");
// Validation Schemas
exports.updateProfileSchema = zod_1.z.object({
    phone: zod_1.z.string().optional(),
    whatsAppNumber: zod_1.z.string().optional(),
    altPhone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    emergencyContactName: zod_1.z.string().optional(),
    emergencyContactPhone: zod_1.z.string().optional(),
});
exports.createAssignmentSchema = zod_1.z.object({
    academicYearId: zod_1.z.string().optional(),
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    sectionId: zod_1.z.string().min(1, 'Section ID is required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID is required'),
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    description: zod_1.z.string().min(5, 'Description must be at least 5 characters'),
    dueDate: zod_1.z.string().min(1, 'Due date is required'),
    attachments: zod_1.z
        .array(zod_1.z.object({
        title: zod_1.z.string(),
        fileUrl: zod_1.z.string(),
        fileSize: zod_1.z.number().optional(),
        mimeType: zod_1.z.string().optional(),
    }))
        .optional(),
});
exports.requestFacultyLeaveSchema = zod_1.z.object({
    leaveType: zod_1.z.enum(['CASUAL', 'MEDICAL', 'DUTY', 'EARNED', 'MATERNITY_PATERNITY', 'OTHER']),
    startDate: zod_1.z.string().min(1, 'Start date is required'),
    endDate: zod_1.z.string().min(1, 'End date is required'),
    reason: zod_1.z.string().min(5, 'Reason must be at least 5 characters'),
});
exports.requestExtraClassSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    sectionId: zod_1.z.string().min(1, 'Section ID is required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID is required'),
    roomId: zod_1.z.string().min(1, 'Room ID is required'),
    date: zod_1.z.string().min(1, 'Date is required'),
    timeSlotId: zod_1.z.string().optional(),
    startTime: zod_1.z.string().min(1, 'Start time is required'),
    endTime: zod_1.z.string().min(1, 'End time is required'),
    reason: zod_1.z.string().min(3, 'Reason is required'),
});
exports.registerVehicleSchema = zod_1.z.object({
    vehicleNumber: zod_1.z.string().min(3, 'Vehicle number is required'),
    vehicleType: zod_1.z.enum(['TWO_WHEELER', 'FOUR_WHEELER', 'BICYCLE', 'OTHER']),
    makeModel: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    registrationDetails: zod_1.z.string().optional(),
    documentUrl: zod_1.z.string().optional(),
});
exports.reviewVehicleSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: zod_1.z.string().optional(),
});
exports.createAnnouncementSchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    sectionId: zod_1.z.string().min(1, 'Section ID is required'),
    title: zod_1.z.string().min(3, 'Title is required'),
    content: zod_1.z.string().min(5, 'Content is required'),
    category: zod_1.z.string().optional(),
});
class FacultyPortalController {
    static async getDashboard(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.getFacultyDashboard(req.user.id);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getProfile(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.getFacultyProfile(req.user.id);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async updateProfile(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.updateFacultyProfile(req.user.id, req.body);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getAssignedClasses(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.getAssignedClasses(req.user.id);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getAssignedStudents(req, res, next) {
        try {
            const sectionId = String(req.params.sectionId);
            const data = await faculty_portal_service_1.FacultyPortalService.getAssignedStudents(req.user.id, sectionId);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getStudentProfile(req, res, next) {
        try {
            const studentId = String(req.params.studentId);
            const data = await faculty_portal_service_1.FacultyPortalService.getStudentProfileForFaculty(req.user.id, studentId);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getTimetable(req, res, next) {
        try {
            const dayOfWeek = typeof req.query.dayOfWeek === 'string' ? req.query.dayOfWeek : undefined;
            const data = await faculty_portal_service_1.FacultyPortalService.getFacultyTimetable(req.user.id, dayOfWeek);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async createAssignment(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.createAssignment(req.user.id, req.body);
            res.status(201).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async publishAssignment(req, res, next) {
        try {
            const id = String(req.params.id);
            const data = await faculty_portal_service_1.FacultyPortalService.publishAssignment(req.user.id, id);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getAssignments(req, res, next) {
        try {
            const filters = {
                status: typeof req.query.status === 'string' ? req.query.status : undefined,
                classId: typeof req.query.classId === 'string' ? req.query.classId : undefined,
                sectionId: typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined,
                subjectId: typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined,
            };
            const data = await faculty_portal_service_1.FacultyPortalService.getFacultyAssignments(req.user.id, filters);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async requestLeave(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.requestFacultyLeave(req.user.id, req.body);
            res.status(201).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getLeaves(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.getFacultyLeaves(req.user.id);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async requestExtraClass(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.requestExtraClass(req.user.id, req.body);
            res.status(201).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getExtraClasses(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.getFacultyExtraClasses(req.user.id);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async registerVehicle(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.registerVehicle(req.user.id, req.body);
            res.status(201).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getVehicles(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.getFacultyVehicles(req.user.id);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async reviewVehicle(req, res, next) {
        try {
            const id = String(req.params.id);
            const data = await faculty_portal_service_1.FacultyPortalService.reviewVehicleRegistration(req.user.id, id, req.body);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async createAnnouncement(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.createClassAnnouncement(req.user.id, req.body);
            res.status(201).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getAnnouncements(req, res, next) {
        try {
            const filters = {
                classId: typeof req.query.classId === 'string' ? req.query.classId : undefined,
                sectionId: typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined,
            };
            const data = await faculty_portal_service_1.FacultyPortalService.getFacultyAnnouncements(req.user.id, filters);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getNotifications(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.getFacultyNotifications(req.user.id);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async markNotificationRead(req, res, next) {
        try {
            const id = String(req.params.id);
            const data = await faculty_portal_service_1.FacultyPortalService.markNotificationRead(req.user.id, id);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    static async getWorkload(req, res, next) {
        try {
            const data = await faculty_portal_service_1.FacultyPortalService.getFacultyWorkload(req.user.id);
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.FacultyPortalController = FacultyPortalController;
