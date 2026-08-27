import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export interface EmailPayload {
  toEmail: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  userId?: string;
  eventId?: string;
}

export class EmailService {
  static isConfigured(): boolean {
    const host = process.env.SMTP_HOST || process.env.EMAIL_API_KEY;
    return !!(host && host.trim().length > 0);
  }

  static async sendEmail(payload: EmailPayload) {
    const isConfigured = this.isConfigured();

    const delivery = await prisma.notificationDelivery.create({
      data: {
        eventId: payload.eventId || null,
        userId: payload.userId || null,
        channel: 'EMAIL',
        provider: isConfigured ? (process.env.EMAIL_PROVIDER || 'SMTP') : 'SMTP',
        providerMessageId: `EML-${Date.now()}`,
        recipientContact: payload.toEmail,
        status: isConfigured ? 'SENT' : 'FAILED',
        failureReason: isConfigured ? null : 'Email provider / SMTP credentials not configured in environment.',
        sentAt: isConfigured ? new Date() : null,
      },
    });

    if (!isConfigured) {
      throw new AppError('Email provider not configured in environment.', 400, 'EMAIL_NOT_CONFIGURED');
    }

    return delivery;
  }
}
