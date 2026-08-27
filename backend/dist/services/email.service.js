"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class EmailService {
    static isConfigured() {
        const host = process.env.SMTP_HOST || process.env.EMAIL_API_KEY;
        return !!(host && host.trim().length > 0);
    }
    static async sendEmail(payload) {
        const isConfigured = this.isConfigured();
        const delivery = await prisma_1.prisma.notificationDelivery.create({
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
            throw new errorHandler_1.AppError('Email provider not configured in environment.', 400, 'EMAIL_NOT_CONFIGURED');
        }
        return delivery;
    }
}
exports.EmailService = EmailService;
