"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_import_controller_1 = require("../controllers/data-import.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// Only admins and principal can import data
const adminOnly = (0, rbac_1.requireRoles)(['SUPER_ADMIN', 'OFFICE_ADMIN', 'PRINCIPAL']);
router.use(auth_1.requireAuth);
router.post('/students/preview', adminOnly, data_import_controller_1.DataImportController.previewStudentImport);
router.post('/students/confirm', adminOnly, data_import_controller_1.DataImportController.confirmStudentImport);
router.get('/logs', adminOnly, data_import_controller_1.DataImportController.getImportLogs);
exports.default = router;
