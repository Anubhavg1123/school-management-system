"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resultEngineRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const result_engine_controller_1 = require("../controllers/result-engine.controller");
const types_1 = require("../types");
exports.resultEngineRouter = (0, express_1.Router)();
// Publicly accessible verification token endpoint (e.g. for official QR code verification)
exports.resultEngineRouter.get('/verify-token/:token', (req, res, next) => result_engine_controller_1.ResultEngineController.verifyToken(req, res).catch(next));
// Protected endpoints
exports.resultEngineRouter.use(auth_1.requireAuth);
exports.resultEngineRouter.post('/:examId/calculate', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN, types_1.UserRoleEnum.HOD]), (req, res, next) => result_engine_controller_1.ResultEngineController.calculateResults(req, res).catch(next));
exports.resultEngineRouter.post('/:examId/publish', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN, types_1.UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => result_engine_controller_1.ResultEngineController.publishResults(req, res).catch(next));
exports.resultEngineRouter.get('/students/:studentId', (req, res, next) => result_engine_controller_1.ResultEngineController.getStudentResults(req, res).catch(next));
exports.default = exports.resultEngineRouter;
