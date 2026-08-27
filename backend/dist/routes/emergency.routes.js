"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyRouter = void 0;
const express_1 = require("express");
const emergency_controller_1 = require("../controllers/emergency.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const types_1 = require("../types");
exports.emergencyRouter = (0, express_1.Router)();
exports.emergencyRouter.use(auth_1.requireAuth);
// Read alerts & campus status (All authenticated users)
exports.emergencyRouter.get('/alerts', emergency_controller_1.EmergencyController.getAlerts);
exports.emergencyRouter.get('/campus-status', emergency_controller_1.EmergencyController.getCampusStatus);
// Create / Cancel alerts & Change campus status (Super Admin / Office Admin / Security)
exports.emergencyRouter.post('/alerts', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.NON_FACULTY]), emergency_controller_1.EmergencyController.createAlert);
exports.emergencyRouter.post('/alerts/:id/cancel', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), emergency_controller_1.EmergencyController.cancelAlert);
exports.emergencyRouter.post('/campus-status', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.NON_FACULTY]), emergency_controller_1.EmergencyController.updateCampusStatus);
exports.default = exports.emergencyRouter;
