import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static async getUserNotifications(req: AuthRequest, res: Response) {
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const data = await NotificationService.getUserNotifications(req.user!.id, { unreadOnly, limit });
    return sendSuccess(res, data, 200);
  }

  static async markAsRead(req: AuthRequest, res: Response) {
    const notif = await NotificationService.markAsRead(req.user!.id, req.params.id as string);
    return sendSuccess(res, notif, 200);
  }

  static async markAllAsRead(req: AuthRequest, res: Response) {
    const result = await NotificationService.markAllAsRead(req.user!.id);
    return sendSuccess(res, result, 200);
  }

  static async deleteNotification(req: AuthRequest, res: Response) {
    const result = await NotificationService.deleteNotification(req.user!.id, req.params.id as string);
    return sendSuccess(res, result, 200);
  }
}
