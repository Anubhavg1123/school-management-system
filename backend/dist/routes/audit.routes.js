"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = require("../controllers/audit.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
// Audit logs are restricted to Super Admin
router.use((0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]));
router.get('/', audit_controller_1.AuditController.listLogs);
exports.default = router;
