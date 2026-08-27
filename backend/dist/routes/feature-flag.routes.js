"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureFlagRouter = void 0;
const express_1 = require("express");
const feature_flag_controller_1 = require("../controllers/feature-flag.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const types_1 = require("../types");
exports.featureFlagRouter = (0, express_1.Router)();
exports.featureFlagRouter.use(auth_1.requireAuth);
// All authenticated users can read active flags
exports.featureFlagRouter.get('/', feature_flag_controller_1.FeatureFlagController.getFlags);
// Only Super Admin can toggle flags and view config history
exports.featureFlagRouter.patch('/:key', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), feature_flag_controller_1.FeatureFlagController.updateFlag);
exports.featureFlagRouter.get('/config-history', (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), feature_flag_controller_1.FeatureFlagController.getConfigHistory);
exports.default = exports.featureFlagRouter;
