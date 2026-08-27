"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLeaveRequest = exports.createProfileUpdateRequest = exports.getStudentAttendance = exports.getStudentTimetable = exports.getStudentDashboard = void 0;
const student_portal_service_1 = require("../services/student-portal.service");
const getStudentDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data = await student_portal_service_1.StudentPortalService.getDashboard(userId);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentDashboard = getStudentDashboard;
const getStudentTimetable = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const studentId = String(req.params.studentId);
        const dayOfWeek = req.query.dayOfWeek ? String(req.query.dayOfWeek) : undefined;
        const data = await student_portal_service_1.StudentPortalService.getTimetable(userId, studentId, dayOfWeek);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentTimetable = getStudentTimetable;
const getStudentAttendance = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const studentId = String(req.params.studentId);
        const data = await student_portal_service_1.StudentPortalService.getAttendance(userId, studentId);
        res.json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.getStudentAttendance = getStudentAttendance;
const createProfileUpdateRequest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const studentId = String(req.params.studentId);
        const data = await student_portal_service_1.StudentPortalService.createProfileUpdateRequest(userId, studentId, req.body);
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createProfileUpdateRequest = createProfileUpdateRequest;
const createLeaveRequest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const studentId = String(req.params.studentId);
        const data = await student_portal_service_1.StudentPortalService.createLeaveRequest(userId, studentId, req.body);
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
};
exports.createLeaveRequest = createLeaveRequest;
