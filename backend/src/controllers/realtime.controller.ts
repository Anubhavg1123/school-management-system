import { Request, Response } from 'express';
import { RealtimeService } from '../services/realtime.service';
import { sendSuccess } from '../utils/response';

export class RealtimeController {
  static streamEvents(req: Request, res: Response) {
    const user = (req as any).user;
    const clientId = `client_${user?.id || 'anon'}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    RealtimeService.addClient(clientId, user?.id, user?.activeRole, user?.departmentId, res);
  }

  static getStats(req: Request, res: Response) {
    const stats = RealtimeService.getStats();
    return sendSuccess(res, stats, 200);
  }
}
