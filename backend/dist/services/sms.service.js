"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class SmsService {
    static isConfigured() {
        const apiKey = process.env.SMS_API_KEY;
        return !!(apiKey && apiKey.trim().length > 0);
    }
    static async sendSms(payload) {
        const isConfigured = this.isConfigured();
        const delivery = await prisma_1.prisma.notificationDelivery.create({
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
            throw new errorHandler_1.AppError('SMS gateway provider not configured in environment.', 400, 'SMS_NOT_CONFIGURED');
        }
        return delivery;
    }
}
exports.SmsService = SmsService;
