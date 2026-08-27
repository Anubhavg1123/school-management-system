"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartCampusRouter = void 0;
const express_1 = require("express");
const smart_campus_controller_1 = require("../controllers/smart-campus.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const types_1 = require("../types");
exports.smartCampusRouter = (0, express_1.Router)();
exports.smartCampusRouter.use(auth_1.requireAuth);
// Live occupancy & vehicle document alerts
exports.smartCampusRouter.get('/live-status', smart_campus_controller_1.SmartCampusController.getLiveOccupancy);
exports.smartCampusRouter.get('/vehicle-alerts', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.NON_FACULTY]), smart_campus_controller_1.SmartCampusController.getVehicleAlerts);
// Pre-registration
exports.smartCampusRouter.post('/pre-register-visitor', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY, types_1.UserRoleEnum.NON_FACULTY]), smart_campus_controller_1.SmartCampusController.preRegisterVisitor);
exports.smartCampusRouter.get('/pre-registered-visitors', smart_campus_controller_1.SmartCampusController.getPreRegisteredVisitors);
// Security Fast-Track check-in
exports.smartCampusRouter.post('/pre-registered-visitors/:id/check-in', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.NON_FACULTY]), smart_campus_controller_1.SmartCampusController.checkInPreRegisteredVisitor);
exports.default = exports.smartCampusRouter;
