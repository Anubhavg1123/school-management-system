"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const prisma_1 = require("../prisma");
const errorHandler_1 = require("../middleware/errorHandler");
const audit_service_1 = require("./audit.service");
class SettingsService {
    static async getSettings(isPublicOnly = false) {
        const where = isPublicOnly ? { isPublic: true } : {};
        return prisma_1.prisma.systemSetting.findMany({
            where,
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });
    }
    static async getSettingByKey(key) {
        const setting = await prisma_1.prisma.systemSetting.findUnique({ where: { key } });
        if (!setting) {
            throw new errorHandler_1.AppError(`Setting '${key}' not found.`, 404, 'SETTING_NOT_FOUND');
        }
        return setting;
    }
    static async updateSetting(key, value, actorId, ipAddress) {
        const existing = await prisma_1.prisma.systemSetting.findUnique({ where: { key } });
        if (!existing) {
            throw new errorHandler_1.AppError(`Setting '${key}' not found.`, 404, 'SETTING_NOT_FOUND');
        }
        const updated = await prisma_1.prisma.systemSetting.update({
            where: { key },
            data: {
                value,
                updatedBy: actorId,
            },
        });
        await audit_service_1.AuditService.log({
            userId: actorId,
            action: 'SYSTEM_SETTING_UPDATED',
            entityType: 'SystemSetting',
            entityId: key,
            beforeState: { value: existing.value },
            afterState: { value: updated.value },
            ipAddress,
        });
        return updated;
    }
}
exports.SettingsService = SettingsService;
