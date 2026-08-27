import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { NoticeService } from '../services/notice.service';
import { z } from 'zod';

const createNoticeSchema = z.object({
  title: z.string().min(2, 'Title required'),
  content: z.string().min(5, 'Content required'),
  noticeType: z.string().optional(),
  priority: z.string().optional(),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional(),
  targetAudience: z.string().min(1, 'Target audience required'),
  departmentId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  targetUserId: z.string().optional(),
  targetStudentId: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  requireAcknowledgment: z.boolean().optional(),
});

export class NoticeController {
  static async createNotice(req: AuthRequest, res: Response) {
    const validated = createNoticeSchema.parse(req.body);
    const notice = await NoticeService.createNotice(req.user!.id, req.user!.activeRole, validated);
    return sendSuccess(res, notice, 201);
  }

  static async estimateRecipientCount(req: AuthRequest, res: Response) {
    const targetAudience = typeof req.query.targetAudience === 'string' ? req.query.targetAudience : 'ALL';
    const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined;
    const classId = typeof req.query.classId === 'string' ? req.query.classId : undefined;
    const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;

    const estimate = await NoticeService.estimateRecipientCount(targetAudience, departmentId, classId, sectionId);
    return sendSuccess(res, estimate, 200);
  }

  static async getNoticesForUser(req: AuthRequest, res: Response) {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;

    const notices = await NoticeService.getNoticesForUser(req.user!.id, req.user!.activeRole, { search, type });
    return sendSuccess(res, notices, 200);
  }

  static async acknowledgeNotice(req: AuthRequest, res: Response) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const ack = await NoticeService.acknowledgeNotice(req.user!.id, req.params.id as string, ipAddress);
    return sendSuccess(res, ack, 200);
  }

  static async processScheduler(req: AuthRequest, res: Response) {
    const result = await NoticeService.processScheduledAndExpiredNotices();
    return sendSuccess(res, result, 200);
  }
}
