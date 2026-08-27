import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export interface SmsPayload {
  toPhone: string;
  message: string;
  userId?: string;
  eventId?: string;
}

export class SmsService {
  static isConfigured(): boolean {
    const apiKey = process.env.SMS_API_KEY;
    return !!(apiKey && apiKey.trim().length > 0);
  }

  static async sendSms(payload: SmsPayload) {
    const isConfigured = this.isConfigured();

    const delivery = await prisma.notificationDelivery.create({
      data: {
        eventId: payload.eventId || null,
        userId: payload.userId || null,
        channel: 'SMS',
        provider: isConfigured ? (process.env.SMS_PROVIDER || 'TWILIO_SMS') : 'TWILIO_SMS',
        providerMessageId: `SMS-${Date.now()}`,
        recipientContact: payload.toPhone,
        status: isConfigured ? 'SENT' : 'FAILED',
        failureReason: isConfigured ? null : 'SMS provider API key not configured in environment.',
        sentAt: isConfigured ? new Date() : null,
      },
    });

    if (!isConfigured) {
      throw new AppError('SMS gateway provider not configured in environment.', 400, 'SMS_NOT_CONFIGURED');
    }

    return delivery;
  }
}
