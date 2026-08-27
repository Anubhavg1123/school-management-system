"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HodPortalController = exports.createDepartmentNoticeSchema = exports.whatsAppConfigSchema = exports.createTimetableEntrySchema = exports.assignSubstituteSchema = exports.reviewApprovalSchema = exports.assignClassCoordinatorSchema = exports.assignFacultySubjectSchema = exports.updateDepartmentProfileSchema = void 0;
const zod_1 = require("zod");
const hod_portal_service_1 = require("../services/hod-portal.service");
const getQueryString = (val) => {
    if (typeof val === 'string')
        return val;
    if (Array.isArray(val) && typeof val[0] === 'string')
        return val[0];
    return undefined;
};
// Zod Validation Schemas
exports.updateDepartmentProfileSchema = zod_1.z.object({
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
exports.assignFacultySubjectSchema = zod_1.z.object({
    facultyId: zod_1.z.string().min(1, 'Faculty ID is required'),
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    sectionId: zod_1.z.string().optional(),
    subjectId: zod_1.z.string().min(1, 'Subject ID is required'),
    academicYearId: zod_1.z.string().optional(),
});
exports.assignClassCoordinatorSchema = zod_1.z.object({
    facultyId: zod_1.z.string().min(1, 'Faculty ID is required'),
});
exports.reviewApprovalSchema = zod_1.z.object({
    action: zod_1.z.enum(['APPROVED', 'REJECTED']),
    reviewNotes: zod_1.z.string().optional(),
});
exports.assignSubstituteSchema = zod_1.z.object({
    originalFacultyId: zod_1.z.string().min(1, 'Original Faculty ID is required'),
    substituteFacultyId: zod_1.z.string().min(1, 'Substitute Faculty ID is required'),
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    sectionId: zod_1.z.string().min(1, 'Section ID is required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID is required'),
    timeSlotId: zod_1.z.string().min(1, 'Time Slot ID is required'),
    date: zod_1.z.string().min(1, 'Date is required'),
    reason: zod_1.z.string().min(1, 'Reason is required'),
});
exports.createTimetableEntrySchema = zod_1.z.object({
    classId: zod_1.z.string().min(1, 'Class ID is required'),
    sectionId: zod_1.z.string().min(1, 'Section ID is required'),
    subjectId: zod_1.z.string().min(1, 'Subject ID is required'),
    facultyId: zod_1.z.string().min(1, 'Faculty ID is required'),
    roomId: zod_1.z.string().min(1, 'Room ID is required'),
    timeSlotId: zod_1.z.string().min(1, 'Time Slot ID is required'),
    dayOfWeek: zod_1.z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
});
exports.whatsAppConfigSchema = zod_1.z.object({
    whatsAppGroupId: zod_1.z.string().optional(),
    whatsAppGroupStatus: zod_1.z.enum(['UNCONFIGURED', 'PENDING_SETUP', 'ACTIVE', 'ARCHIVED']).optional(),
});
exports.createDepartmentNoticeSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title is required'),
    content: zod_1.z.string().min(5, 'Content is required'),
    targetScope: zod_1.z.enum(['DEPARTMENT', 'FACULTY_ONLY', 'STUDENT_ONLY', 'SPECIFIC_CLASS']).optional(),
    classId: zod_1.z.string().optional(),
    sectionId: zod_1.z.string().optional(),
});
class HodPortalController {
    static async getDashboard(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getHodDashboard(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getDepartmentProfile(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getDepartmentProfile(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async updateDepartmentProfile(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.updateDepartmentProfile(req.user.id, req.body, requestedDeptId);
            res.json({ success: true, data, message: 'Department profile updated successfully.' });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getFaculty(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const search = getQueryString(req.query.search);
            const status = getQueryString(req.query.status);
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 25;
            const data = await hod_portal_service_1.HodPortalService.getDepartmentFaculty(req.user.id, { search, status, page, limit }, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getFacultyProfile(req, res) {
        try {
            const facultyId = req.params.id;
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getFacultyProfileForHod(req.user.id, facultyId, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async assignFacultySubject(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.assignFacultySubject(req.user.id, req.body, requestedDeptId);
            res.status(201).json({ success: true, data, message: 'Subject assigned to faculty successfully.' });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getFacultyWorkload(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getFacultyWorkloadSummary(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getClasses(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getDepartmentClasses(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async assignClassCoordinator(req, res) {
        try {
            const sectionId = req.params.sectionId;
            const { facultyId } = req.body;
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.assignClassCoordinator(req.user.id, sectionId, facultyId, requestedDeptId);
            res.json({ success: true, data, message: 'Class Coordinator assigned successfully.' });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getStudents(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const search = getQueryString(req.query.search);
            const classId = getQueryString(req.query.classId);
            const sectionId = getQueryString(req.query.sectionId);
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 25;
            const data = await hod_portal_service_1.HodPortalService.getDepartmentStudents(req.user.id, { search, classId, sectionId, page, limit }, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getLowAttendance(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getLowAttendanceDashboard(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getCorrections(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getDepartmentCorrections(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async reviewCorrection(req, res) {
        try {
            const correctionId = req.params.id;
            const { action, reviewNotes } = req.body;
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.reviewCorrection(req.user.id, correctionId, action, reviewNotes, requestedDeptId);
            res.json({ success: true, data, message: `Attendance correction ${action.toLowerCase()} successfully.` });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getBypasses(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getDepartmentBypasses(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async reviewBypass(req, res) {
        try {
            const bypassId = req.params.id;
            const { action, reviewNotes } = req.body;
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.reviewBypass(req.user.id, bypassId, action, reviewNotes, requestedDeptId);
            res.json({ success: true, data, message: `Academic bypass ${action.toLowerCase()} successfully.` });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getLeaves(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getDepartmentLeaves(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async reviewFacultyLeave(req, res) {
        try {
            const leaveId = req.params.id;
            const { action, reviewNotes } = req.body;
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.reviewFacultyLeave(req.user.id, leaveId, action, reviewNotes, requestedDeptId);
            res.json({ success: true, data, message: `Faculty leave ${action.toLowerCase()} successfully.` });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async assignSubstitute(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.assignSubstituteFaculty(req.user.id, req.body, requestedDeptId);
            res.status(201).json({ success: true, data, message: 'Substitute faculty assigned successfully.' });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getExtraClasses(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getDepartmentExtraClasses(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async reviewExtraClass(req, res) {
        try {
            const requestId = req.params.id;
            const { action, reviewNotes } = req.body;
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.reviewExtraClass(req.user.id, requestId, action, reviewNotes, requestedDeptId);
            res.json({ success: true, data, message: `Extra class request ${action.toLowerCase()} successfully.` });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getTimetable(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getDepartmentTimetable(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async createTimetableEntry(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.createTimetableEntry(req.user.id, req.body, requestedDeptId);
            res.status(201).json({ success: true, data, message: 'Timetable entry created successfully.' });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async updateWhatsAppConfig(req, res) {
        try {
            const sectionId = req.params.sectionId;
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.updateSectionWhatsAppConfig(req.user.id, sectionId, req.body, requestedDeptId);
            res.json({ success: true, data, message: 'Section WhatsApp group updated.' });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getNotices(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.getDepartmentNotices(req.user.id, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async createNotice(req, res) {
        try {
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.createDepartmentNotice(req.user.id, req.body, requestedDeptId);
            res.status(201).json({ success: true, data, message: 'Department notice broadcasted successfully.' });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
    static async getReport(req, res) {
        try {
            const type = getQueryString(req.query.type) || 'FACULTY';
            const requestedDeptId = getQueryString(req.query.departmentId);
            const data = await hod_portal_service_1.HodPortalService.generateDepartmentReport(req.user.id, type, requestedDeptId);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(err.statusCode || 500).json({ success: false, error: { message: err.message } });
        }
    }
}
exports.HodPortalController = HodPortalController;
