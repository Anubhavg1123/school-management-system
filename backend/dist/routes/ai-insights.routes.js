"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiInsightsRouter = void 0;
const express_1 = require("express");
const ai_insights_controller_1 = require("../controllers/ai-insights.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const types_1 = require("../types");
exports.aiInsightsRouter = (0, express_1.Router)();
exports.aiInsightsRouter.use(auth_1.requireAuth);
// Safe natural language query processing (Super Admin, Office, HOD, Faculty)
exports.aiInsightsRouter.post('/query', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), ai_insights_controller_1.AiInsightsController.query);
// Explainable administrative insights
exports.aiInsightsRouter.get('/insights/administrative', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), ai_insights_controller_1.AiInsightsController.getAdministrativeInsights);
// AI Drafting assistant
exports.aiInsightsRouter.post('/draft-notice', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD, types_1.UserRoleEnum.FACULTY]), ai_insights_controller_1.AiInsightsController.draftNotice);
exports.default = exports.aiInsightsRouter;
