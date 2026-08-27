"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentAttendanceRouter = void 0;
const express_1 = require("express");
const student_attendance_controller_1 = require("../controllers/student-attendance.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const types_1 = require("../types");
exports.studentAttendanceRouter = (0, express_1.Router)();
// 1. Slots generation & query
exports.studentAttendanceRouter.post('/generate-slots', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: student_attendance_controller_1.generateSlotsSchema }), student_attendance_controller_1.StudentAttendanceController.generateSlots);
exports.studentAttendanceRouter.post('/extra-class-slot', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), (0, validate_1.validateRequest)({ body: student_attendance_controller_1.createExtraClassSlotSchema }), student_attendance_controller_1.StudentAttendanceController.createExtraClassSlot);
exports.studentAttendanceRouter.get('/slots', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), student_attendance_controller_1.StudentAttendanceController.getSlots);
exports.studentAttendanceRouter.get('/slots/:id', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), student_attendance_controller_1.StudentAttendanceController.getSlotDetails);
// 2. Attendance submission
exports.studentAttendanceRouter.post('/submit', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), (0, validate_1.validateRequest)({ body: student_attendance_controller_1.submitStudentAttendanceSchema }), student_attendance_controller_1.StudentAttendanceController.submitAttendance);
// 3. Student Attendance Corrections
exports.studentAttendanceRouter.post('/corrections', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), (0, validate_1.validateRequest)({ body: student_attendance_controller_1.studentCorrectionSchema }), student_attendance_controller_1.StudentAttendanceController.requestCorrection);
exports.studentAttendanceRouter.post('/corrections/:id/review', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: student_attendance_controller_1.reviewStudentCorrectionSchema }), student_attendance_controller_1.StudentAttendanceController.reviewCorrection);
// 4. School Activity / Academic Bypass (Class Coordinator or Higher Authority)
exports.studentAttendanceRouter.post('/bypass', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), (0, validate_1.validateRequest)({ body: student_attendance_controller_1.applySchoolActivityBypassSchema }), student_attendance_controller_1.StudentAttendanceController.applyBypass);
exports.studentAttendanceRouter.post('/bypass/:id/review', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: student_attendance_controller_1.reviewAcademicBypassSchema }), student_attendance_controller_1.StudentAttendanceController.reviewBypass);
// 5. Student History & Percentage
exports.studentAttendanceRouter.get('/student/:studentId', auth_1.requireAuth, student_attendance_controller_1.StudentAttendanceController.getStudentHistory);
// 6. Daily User Attendance Summary
exports.studentAttendanceRouter.get('/daily-summary', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), student_attendance_controller_1.StudentAttendanceController.getDailyUserSummary);
// 7. Attendance Anomalies
exports.studentAttendanceRouter.get('/anomalies', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), student_attendance_controller_1.StudentAttendanceController.getAnomalies);
