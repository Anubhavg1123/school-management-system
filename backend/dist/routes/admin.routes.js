"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
const adminOnly = (0, rbac_1.requireRoles)(['SUPER_ADMIN', 'PRINCIPAL']);
const officeAdmin = (0, rbac_1.requireRoles)(['SUPER_ADMIN', 'PRINCIPAL', 'OFFICE_ADMIN']);
router.use(auth_1.requireAuth);
// Go-live readiness check
router.get('/go-live-check', adminOnly, admin_controller_1.AdminController.getGoLiveCheck);
// Configuration check (no secrets exposed)
router.get('/config-check', adminOnly, admin_controller_1.AdminController.getConfigCheck);
// Reconciliation endpoints
router.get('/reconciliation/finance', officeAdmin, admin_controller_1.AdminController.getFinanceReconciliation);
router.get('/reconciliation/enrollment', officeAdmin, admin_controller_1.AdminController.getEnrollmentReconciliation);
router.get('/reconciliation/attendance', officeAdmin, admin_controller_1.AdminController.getAttendanceReconciliation);
exports.default = router;
