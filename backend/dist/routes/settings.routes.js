"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validate_1 = require("../middleware/validate");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// Public settings can be read without authentication
router.get('/', settings_controller_1.SettingsController.listSettings);
router.get('/:key', settings_controller_1.SettingsController.getByKey);
// Updates are restricted to Super Admin
router.put('/:key', auth_1.requireAuth, (0, rbac_1.requireRoles)([types_1.UserRoleEnum.SUPER_ADMIN]), (0, validate_1.validateRequest)({ body: settings_controller_1.updateSettingSchema }), settings_controller_1.SettingsController.updateSetting);
exports.default = router;
