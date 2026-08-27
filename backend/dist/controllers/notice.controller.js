"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoticeController = void 0;
const response_1 = require("../utils/response");
const notice_service_1 = require("../services/notice.service");
const zod_1 = require("zod");
const createNoticeSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title required'),
    content: zod_1.z.string().min(5, 'Content required'),
    noticeType: zod_1.z.string().optional(),
    priority: zod_1.z.string().optional(),
    publishDate: zod_1.z.string().optional(),
    expiryDate: zod_1.z.string().optional(),
    targetAudience: zod_1.z.string().min(1, 'Target audience required'),
    departmentId: zod_1.z.string().optional(),
    classId: zod_1.z.string().optional(),
    sectionId: zod_1.z.string().optional(),
    targetUserId: zod_1.z.string().optional(),
    targetStudentId: zod_1.z.string().optional(),
    attachments: zod_1.z.array(zod_1.z.any()).optional(),
    requireAcknowledgment: zod_1.z.boolean().optional(),
});
class NoticeController {
    static async createNotice(req, res) {
        const validated = createNoticeSchema.parse(req.body);
        const notice = await notice_service_1.NoticeService.createNotice(req.user.id, req.user.activeRole, validated);
        return (0, response_1.sendSuccess)(res, notice, 201);
    }
    static async estimateRecipientCount(req, res) {
        const targetAudience = typeof req.query.targetAudience === 'string' ? req.query.targetAudience : 'ALL';
        const departmentId = typeof req.query.departmentId === 'string' ? req.query.departmentId : undefined;
        const classId = typeof req.query.classId === 'string' ? req.query.classId : undefined;
        const sectionId = typeof req.query.sectionId === 'string' ? req.query.sectionId : undefined;
        const estimate = await notice_service_1.NoticeService.estimateRecipientCount(targetAudience, departmentId, classId, sectionId);
        return (0, response_1.sendSuccess)(res, estimate, 200);
    }
    static async getNoticesForUser(req, res) {
        const search = typeof req.query.search === 'string' ? req.query.search : undefined;
        const type = typeof req.query.type === 'string' ? req.query.type : undefined;
        const notices = await notice_service_1.NoticeService.getNoticesForUser(req.user.id, req.user.activeRole, { search, type });
        return (0, response_1.sendSuccess)(res, notices, 200);
    }
    static async acknowledgeNotice(req, res) {
        const ipAddress = req.ip || req.headers['x-forwarded-for'];
        const ack = await notice_service_1.NoticeService.acknowledgeNotice(req.user.id, req.params.id, ipAddress);
        return (0, response_1.sendSuccess)(res, ack, 200);
    }
    static async processScheduler(req, res) {
        const result = await notice_service_1.NoticeService.processScheduledAndExpiredNotices();
        return (0, response_1.sendSuccess)(res, result, 200);
    }
}
exports.NoticeController = NoticeController;
