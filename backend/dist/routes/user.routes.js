"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Roles and permissions metadata (accessible to all authenticated users)
router.get('/roles', user_controller_1.UserController.listRoles);
router.get('/permissions', user_controller_1.UserController.listPermissions);
// User directory (Principal, Office, HOD)
router.get('/', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), user_controller_1.UserController.listUsers);
// Admin create user
router.post('/', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), (0, validate_1.validateRequest)({ body: user_controller_1.createUserSchema }), user_controller_1.UserController.createUser);
// Specific user profile
router.get('/:id', user_controller_1.UserController.getUser);
// Update user profile (Self or Super Admin)
router.put('/:id', (0, validate_1.validateRequest)({ body: user_controller_1.updateUserSchema }), user_controller_1.UserController.updateProfile);
// Super Admin actions
router.patch('/:id/status', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), (0, validate_1.validateRequest)({ body: user_controller_1.updateStatusSchema }), user_controller_1.UserController.updateStatus);
router.post('/:id/roles', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), (0, validate_1.validateRequest)({ body: user_controller_1.assignRolesSchema }), user_controller_1.UserController.assignRoles);
router.post('/:id/reset-password', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), (0, validate_1.validateRequest)({ body: user_controller_1.resetPasswordSchema }), user_controller_1.UserController.resetPassword);
router.get('/:id/audit', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), user_controller_1.UserController.getUserAuditTrail);
exports.default = router;
