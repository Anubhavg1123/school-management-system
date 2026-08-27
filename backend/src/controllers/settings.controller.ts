import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { SettingsService } from '../services/settings.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const updateSettingSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

export class SettingsController {
  static async listSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const isPublic = req.user ? false : true;
      const settings = await SettingsService.getSettings(isPublic);
      return sendSuccess(res, settings, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getByKey(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
      const setting = await SettingsService.getSettingByKey(key);
      return sendSuccess(res, setting, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateSetting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
      const setting = await SettingsService.updateSetting(
        key,
        req.body.value,
        req.user!.id,
        typeof ipAddress === 'string' ? ipAddress : undefined
      );
      return sendSuccess(res, setting, 200);
    } catch (error) {
      next(error);
    }
  }
}
