"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiInsightsController = void 0;
const ai_insights_service_1 = require("../services/ai-insights.service");
const response_1 = require("../utils/response");
class AiInsightsController {
    static async query(req, res, next) {
        try {
            const user = req.user;
            const { query } = req.body;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({ success: false, error: { message: 'query (string) is required.', code: 'VALIDATION_ERROR' } });
            }
            const result = await ai_insights_service_1.AiInsightsService.processNaturalQuery({
                query,
                userId: user.id,
                userRole: user.activeRole,
                departmentId: user.departmentId,
            });
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async getAdministrativeInsights(req, res, next) {
        try {
            const insights = await ai_insights_service_1.AiInsightsService.getAdministrativeInsights();
            return (0, response_1.sendSuccess)(res, { insights }, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async draftNotice(req, res, next) {
        try {
            const { topic, targetAudience, keyPoints } = req.body;
            if (!topic || !targetAudience || !Array.isArray(keyPoints)) {
                return res.status(400).json({
                    success: false,
                    error: { message: 'topic, targetAudience, and keyPoints (array) are required.', code: 'VALIDATION_ERROR' },
                });
            }
            const draft = await ai_insights_service_1.AiInsightsService.generateDraftNotice({ topic, targetAudience, keyPoints });
            return (0, response_1.sendSuccess)(res, draft, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AiInsightsController = AiInsightsController;
