"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationController = void 0;
const response_1 = require("../utils/response");
const whatsapp_service_1 = require("../services/whatsapp.service");
const message_queue_service_1 = require("../services/message-queue.service");
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
const sendTemplateSchema = zod_1.z.object({
    recipientPhone: zod_1.z.string().min(5, 'Recipient phone required'),
    templateCode: zod_1.z.string().min(1, 'Template code required'),
    variables: zod_1.z.record(zod_1.z.string()),
});
class CommunicationController {
    static async getTemplates(req, res) {
        await whatsapp_service_1.WhatsAppService.seedStandardTemplates();
        const templates = await prisma_1.prisma.messageTemplate.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return (0, response_1.sendSuccess)(res, templates, 200);
    }
    static async sendWhatsAppTemplate(req, res) {
        const validated = sendTemplateSchema.parse(req.body);
        const result = await whatsapp_service_1.WhatsAppService.sendTemplateMessage({
            ...validated,
            userId: req.user.id,
        });
        return (0, response_1.sendSuccess)(res, result, 201);
    }
    static async getCommunicationLogs(req, res) {
        const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined;
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const where = {};
        if (channel)
            where.channel = channel;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { recipientContact: { contains: search } },
                { providerMessageId: { contains: search } },
                { templateCode: { contains: search } },
            ];
        }
        const deliveries = await prisma_1.prisma.notificationDelivery.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        const isWhatsAppConfigured = whatsapp_service_1.WhatsAppService.isConfigured();
        return (0, response_1.sendSuccess)(res, {
            providerConfigured: isWhatsAppConfigured,
            deliveries,
        }, 200);
    }
    static async triggerQueueWorker(req, res) {
        const result = await message_queue_service_1.MessageQueueService.processQueue();
        return (0, response_1.sendSuccess)(res, result, 200);
    }
}
exports.CommunicationController = CommunicationController;
