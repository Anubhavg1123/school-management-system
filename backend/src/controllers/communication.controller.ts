import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { WhatsAppService } from '../services/whatsapp.service';
import { NotificationService } from '../services/notification.service';
import { MessageQueueService } from '../services/message-queue.service';
import { prisma } from '../prisma';
import { z } from 'zod';

const sendTemplateSchema = z.object({
  recipientPhone: z.string().min(5, 'Recipient phone required'),
  templateCode: z.string().min(1, 'Template code required'),
  variables: z.record(z.string()),
});

export class CommunicationController {
  static async getTemplates(req: AuthRequest, res: Response) {
    await WhatsAppService.seedStandardTemplates();
    const templates = await prisma.messageTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, templates, 200);
  }

  static async sendWhatsAppTemplate(req: AuthRequest, res: Response) {
    const validated = sendTemplateSchema.parse(req.body);
    const result = await WhatsAppService.sendTemplateMessage({
      ...validated,
      userId: req.user!.id,
    });
    return sendSuccess(res, result, 201);
  }

  static async getCommunicationLogs(req: AuthRequest, res: Response) {
    const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const where: any = {};
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { recipientContact: { contains: search } },
        { providerMessageId: { contains: search } },
        { templateCode: { contains: search } },
      ];
    }

    const deliveries = await prisma.notificationDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const isWhatsAppConfigured = WhatsAppService.isConfigured();

    return sendSuccess(
      res,
      {
        providerConfigured: isWhatsAppConfigured,
        deliveries,
      },
      200
    );
  }

  static async triggerQueueWorker(req: AuthRequest, res: Response) {
    const result = await MessageQueueService.processQueue();
    return sendSuccess(res, result, 200);
  }
}
