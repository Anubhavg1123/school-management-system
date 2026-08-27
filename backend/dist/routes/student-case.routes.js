"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentCaseRouter = void 0;
const express_1 = require("express");
const student_case_controller_1 = require("../controllers/student-case.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const types_1 = require("../types");
exports.studentCaseRouter = (0, express_1.Router)();
exports.studentCaseRouter.use(auth_1.requireAuth);
// Student cases list & stats
exports.studentCaseRouter.get('/', student_case_controller_1.StudentCaseController.getCases);
exports.studentCaseRouter.get('/stats', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), student_case_controller_1.StudentCaseController.getCaseStats);
exports.studentCaseRouter.get('/:id', student_case_controller_1.StudentCaseController.getCaseById);
// Create case (Super Admin, Office, HOD, Faculty)
exports.studentCaseRouter.post('/', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), student_case_controller_1.StudentCaseController.createCase);
// Update case status / resolve (Super Admin, Office, HOD, Assigned Faculty)
exports.studentCaseRouter.patch('/:id/status', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), student_case_controller_1.StudentCaseController.updateCaseStatus);
// Add progress action note
exports.studentCaseRouter.post('/:id/actions', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), student_case_controller_1.StudentCaseController.addCaseAction);
exports.default = exports.studentCaseRouter;
