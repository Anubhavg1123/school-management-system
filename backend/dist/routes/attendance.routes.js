"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("../controllers/attendance.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Check-in and Check-out
router.post('/check-in', (0, validate_1.validateRequest)({ body: attendance_controller_1.checkInSchema }), attendance_controller_1.AttendanceController.checkIn);
router.post('/check-out', (0, validate_1.validateRequest)({ body: attendance_controller_1.checkOutSchema }), attendance_controller_1.AttendanceController.checkOut);
// Personal status & records
router.get('/today', attendance_controller_1.AttendanceController.getTodayStatus);
router.get('/my-records', attendance_controller_1.AttendanceController.getMyRecords);
// Administration & HOD Attendance overview
router.get('/records', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), attendance_controller_1.AttendanceController.listRecords);
// Attendance corrections
router.post('/corrections', (0, validate_1.validateRequest)({ body: attendance_controller_1.correctionRequestSchema }), attendance_controller_1.AttendanceController.requestCorrection);
router.post('/corrections/:id/review', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: attendance_controller_1.reviewCorrectionSchema }), attendance_controller_1.AttendanceController.reviewCorrection);
exports.default = router;
