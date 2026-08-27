import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { InstitutionSettingsService } from '../services/institution-settings.service';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  institutionName: z.string().optional(),
  logoUrl: z.string().optional(),
  address: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  activeAcademicYearId: z.string().optional(),
  attendanceThresholdPercent: z.number().optional(),
  attendanceSubmissionWindowMins: z.number().optional(),
  visitorMaxHoursAlert: z.number().optional(),
  currencySymbol: z.string().optional(),
  dateFormat: z.string().optional(),
  timezone: z.string().optional(),
});

const promoteBatchSchema = z.object({
  fromAcademicYearId: z.string().min(1, 'From Academic Year ID required'),
  toAcademicYearId: z.string().min(1, 'To Academic Year ID required'),
  fromClassId: z.string().min(1, 'From Class ID required'),
  toClassId: z.string().min(1, 'To Class ID required'),
  remarks: z.string().optional(),
});

export class InstitutionSettingsController {
  static async getSettings(req: AuthRequest, res: Response) {
    const settings = await InstitutionSettingsService.getSettings();
    return sendSuccess(res, settings, 200);
  }

  static async updateSettings(req: AuthRequest, res: Response) {
    const validated = updateSettingsSchema.parse(req.body);
    const settings = await InstitutionSettingsService.updateSettings(req.user!.id, validated);
    return sendSuccess(res, settings, 200);
  }

  static async promoteStudentsBatch(req: AuthRequest, res: Response) {
    const validated = promoteBatchSchema.parse(req.body);
    const result = await InstitutionSettingsService.promoteStudentsBatch(req.user!.id, validated);
    return sendSuccess(res, result, 200);
  }
}
