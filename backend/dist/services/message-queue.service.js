"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueService = void 0;
const prisma_1 = require("../prisma");
const whatsapp_service_1 = require("./whatsapp.service");
const email_service_1 = require("./email.service");
const sms_service_1 = require("./sms.service");
class MessageQueueService {
    /**
     * 1. Process Queued Deliveries & Perform Controlled Retries
     */
    static async processQueue(batchSize = 20) {
        const now = new Date();
        // Fetch deliveries queued or pending retry
        const pendingDeliveries = await prisma_1.prisma.notificationDelivery.findMany({
            where: {
                OR: [
                    { status: 'QUEUED' },
                    {
                        status: 'FAILED',
                        retryCount: { lt: 3 },
                        nextRetryAt: { lte: now },
                    },
                ],
            },
            take: batchSize,
            orderBy: { createdAt: 'asc' },
        });
        const results = {
            processed: 0,
            succeeded: 0,
            failed: 0,
        };
        for (const item of pendingDeliveries) {
            results.processed++;
            // Update status to PROCESSING
            await prisma_1.prisma.notificationDelivery.update({
                where: { id: item.id },
                data: { status: 'PROCESSING' },
            });
            try {
                if (item.channel === 'WHATSAPP') {
                    if (!whatsapp_service_1.WhatsAppService.isConfigured()) {
                        throw new Error('WhatsApp provider not configured.');
                    }
                    await whatsapp_service_1.WhatsAppService.sendTemplateMessage({
                        recipientPhone: item.recipientContact,
                        templateCode: item.templateCode || 'student_absence',
                        variables: item.variables ? JSON.parse(item.variables) : {},
                        eventId: item.eventId || undefined,
                        userId: item.userId || undefined,
                    });
                }
                else if (item.channel === 'EMAIL') {
                    await email_service_1.EmailService.sendEmail({
                        toEmail: item.recipientContact,
                        subject: 'Campus Notification',
                        bodyText: 'Notification message body',
                        userId: item.userId || undefined,
                        eventId: item.eventId || undefined,
                    });
                }
                else if (item.channel === 'SMS') {
                    await sms_service_1.SmsService.sendSms({
                        toPhone: item.recipientContact,
                        message: 'Campus SMS alert',
                        userId: item.userId || undefined,
                        eventId: item.eventId || undefined,
                    });
                }
                results.succeeded++;
            }
            catch (err) {
                results.failed++;
                const nextRetryCount = item.retryCount + 1;
                const delaySeconds = Math.pow(2, nextRetryCount) * 10; // Exponential backoff: 20s, 40s, 80s
                const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
                await prisma_1.prisma.notificationDelivery.update({
                    where: { id: item.id },
                    data: {
                        status: 'FAILED',
                        retryCount: nextRetryCount,
                        nextRetryAt: nextRetryCount >= item.maxRetries ? null : nextRetryAt,
                        failureReason: err.message,
                    },
                });
            }
        }
        return results;
    }
}
exports.MessageQueueService = MessageQueueService;
