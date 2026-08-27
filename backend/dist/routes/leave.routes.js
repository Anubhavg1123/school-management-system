"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leave_controller_1 = require("../controllers/leave.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// All staff can request leave & view their own history
router.post('/request', (0, validate_1.validateRequest)({ body: leave_controller_1.requestLeaveSchema }), leave_controller_1.LeaveController.requestLeave);
router.get('/my-requests', leave_controller_1.LeaveController.getMyLeaves);
// HOD & Principal / Super Admin can view and review pending leave applications
router.get('/pending', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.HOD]), leave_controller_1.LeaveController.getPendingLeaves);
router.post('/:id/review', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.HOD]), (0, validate_1.validateRequest)({ body: leave_controller_1.reviewLeaveSchema }), leave_controller_1.LeaveController.reviewLeave);
exports.default = router;
