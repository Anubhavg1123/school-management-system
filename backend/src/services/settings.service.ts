import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';

export class SettingsService {
  static async getSettings(isPublicOnly = false) {
    const where = isPublicOnly ? { isPublic: true } : {};
    return prisma.systemSetting.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  static async getSettingByKey(key: string) {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) {
      throw new AppError(`Setting '${key}' not found.`, 404, 'SETTING_NOT_FOUND');
    }
    return setting;
  }

  static async updateSetting(
    key: string,
    value: string,
    actorId: string,
    ipAddress?: string
  ) {
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    if (!existing) {
      throw new AppError(`Setting '${key}' not found.`, 404, 'SETTING_NOT_FOUND');
    }

    const updated = await prisma.systemSetting.update({
      where: { key },
      data: {
        value,
        updatedBy: actorId,
      },
    });

    await AuditService.log({
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
