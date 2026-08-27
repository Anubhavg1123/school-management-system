"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diagnosticsRouter = void 0;
const express_1 = require("express");
const diagnostics_controller_1 = require("../controllers/diagnostics.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const types_1 = require("../types");
exports.diagnosticsRouter = (0, express_1.Router)();
// Webhook ingestion endpoint (can be public or bearer auth depending on provider)
exports.diagnosticsRouter.post('/webhooks/ingest', diagnostics_controller_1.DiagnosticsController.recordWebhook);
// Admin-only diagnostics
exports.diagnosticsRouter.use(auth_1.requireAuth);
exports.diagnosticsRouter.use((0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]));
exports.diagnosticsRouter.get('/system-check', diagnostics_controller_1.DiagnosticsController.runSystemDiagnostics);
exports.diagnosticsRouter.get('/data-quality', diagnostics_controller_1.DiagnosticsController.runDataQualityAudit);
exports.diagnosticsRouter.get('/webhooks', diagnostics_controller_1.DiagnosticsController.getWebhookLogs);
exports.default = exports.diagnosticsRouter;
