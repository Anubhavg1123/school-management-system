import { Request, Response, NextFunction } from 'express';
import { FeatureFlagService } from '../services/feature-flag.service';
import { sendSuccess } from '../utils/response';

export class FeatureFlagController {
  static async getFlags(req: Request, res: Response, next: NextFunction) {
    try {
      const flags = await FeatureFlagService.getFeatureFlags();
      return sendSuccess(res, { flags }, 200);
    } catch (err) {
      next(err);
    }
  }

  static async updateFlag(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
      const { isEnabled, reason } = req.body;

      if (typeof isEnabled !== 'boolean') {
        return res.status(400).json({ success: false, error: { message: 'isEnabled (boolean) is required.', code: 'VALIDATION_ERROR' } });
      }

      const updated = await FeatureFlagService.updateFeatureFlag(key, isEnabled, user.id, reason);
      return sendSuccess(res, updated, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getConfigHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await FeatureFlagService.getConfigAuditHistory();
      return sendSuccess(res, { history }, 200);
    } catch (err) {
      next(err);
    }
  }
}
