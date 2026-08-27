"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = exports.updateSettingSchema = void 0;
const zod_1 = require("zod");
const settings_service_1 = require("../services/settings.service");
const response_1 = require("../utils/response");
exports.updateSettingSchema = zod_1.z.object({
    value: zod_1.z.string().min(1, 'Value is required'),
});
class SettingsController {
    static async listSettings(req, res, next) {
        try {
            const isPublic = req.user ? false : true;
            const settings = await settings_service_1.SettingsService.getSettings(isPublic);
            return (0, response_1.sendSuccess)(res, settings, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getByKey(req, res, next) {
        try {
            const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
            const setting = await settings_service_1.SettingsService.getSettingByKey(key);
            return (0, response_1.sendSuccess)(res, setting, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateSetting(req, res, next) {
        try {
            const ipAddress = req.ip || req.socket.remoteAddress;
            const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
            const setting = await settings_service_1.SettingsService.updateSetting(key, req.body.value, req.user.id, typeof ipAddress === 'string' ? ipAddress : undefined);
            return (0, response_1.sendSuccess)(res, setting, 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SettingsController = SettingsController;
