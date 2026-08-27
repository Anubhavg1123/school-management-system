"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const registration_controller_1 = require("../controllers/registration.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// Only Super Admin (Principal) and Academic Office can view and process registrations
router.use(auth_1.requireAuth);
router.use((0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]));
router.get('/pending', registration_controller_1.RegistrationController.getPending);
router.get('/recently-reviewed', registration_controller_1.RegistrationController.getRecentlyReviewed);
router.get('/:id', registration_controller_1.RegistrationController.getById);
router.patch('/:id/under-review', (0, validate_1.validateRequest)({ body: registration_controller_1.underReviewSchema }), registration_controller_1.RegistrationController.markUnderReview);
router.post('/:id/approve', (0, validate_1.validateRequest)({ body: registration_controller_1.approveRegistrationSchema }), registration_controller_1.RegistrationController.approve);
router.post('/:id/reject', (0, validate_1.validateRequest)({ body: registration_controller_1.rejectRegistrationSchema }), registration_controller_1.RegistrationController.reject);
exports.default = router;
