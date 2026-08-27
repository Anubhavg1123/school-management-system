"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlagController = void 0;
const feature_flag_service_1 = require("../services/feature-flag.service");
const response_1 = require("../utils/response");
class FeatureFlagController {
    static async getFlags(req, res, next) {
        try {
            const flags = await feature_flag_service_1.FeatureFlagService.getFeatureFlags();
            return (0, response_1.sendSuccess)(res, { flags }, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async updateFlag(req, res, next) {
        try {
            const user = req.user;
            const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
            const { isEnabled, reason } = req.body;
            if (typeof isEnabled !== 'boolean') {
                return res.status(400).json({ success: false, error: { message: 'isEnabled (boolean) is required.', code: 'VALIDATION_ERROR' } });
            }
            const updated = await feature_flag_service_1.FeatureFlagService.updateFeatureFlag(key, isEnabled, user.id, reason);
            return (0, response_1.sendSuccess)(res, updated, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async getConfigHistory(req, res, next) {
        try {
            const history = await feature_flag_service_1.FeatureFlagService.getConfigAuditHistory();
            return (0, response_1.sendSuccess)(res, { history }, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.FeatureFlagController = FeatureFlagController;
