import { Request, Response, NextFunction } from 'express';
import { AiInsightsService } from '../services/ai-insights.service';
import { sendSuccess } from '../utils/response';

export class AiInsightsController {
  static async query(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, error: { message: 'query (string) is required.', code: 'VALIDATION_ERROR' } });
      }

      const result = await AiInsightsService.processNaturalQuery({
        query,
        userId: user.id,
        userRole: user.activeRole,
        departmentId: user.departmentId,
      });

      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getAdministrativeInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const insights = await AiInsightsService.getAdministrativeInsights();
      return sendSuccess(res, { insights }, 200);
    } catch (err) {
      next(err);
    }
  }

  static async draftNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { topic, targetAudience, keyPoints } = req.body;
      if (!topic || !targetAudience || !Array.isArray(keyPoints)) {
        return res.status(400).json({
          success: false,
          error: { message: 'topic, targetAudience, and keyPoints (array) are required.', code: 'VALIDATION_ERROR' },
        });
      }

      const draft = await AiInsightsService.generateDraftNotice({ topic, targetAudience, keyPoints });
      return sendSuccess(res, draft, 200);
    } catch (err) {
      next(err);
    }
  }
}
