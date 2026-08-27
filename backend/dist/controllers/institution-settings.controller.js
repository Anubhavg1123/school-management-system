"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitutionSettingsController = void 0;
const response_1 = require("../utils/response");
const institution_settings_service_1 = require("../services/institution-settings.service");
const zod_1 = require("zod");
const updateSettingsSchema = zod_1.z.object({
    institutionName: zod_1.z.string().optional(),
    logoUrl: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    contactPhone: zod_1.z.string().optional(),
    contactEmail: zod_1.z.string().optional(),
    activeAcademicYearId: zod_1.z.string().optional(),
    attendanceThresholdPercent: zod_1.z.number().optional(),
    attendanceSubmissionWindowMins: zod_1.z.number().optional(),
    visitorMaxHoursAlert: zod_1.z.number().optional(),
    currencySymbol: zod_1.z.string().optional(),
    dateFormat: zod_1.z.string().optional(),
    timezone: zod_1.z.string().optional(),
});
const promoteBatchSchema = zod_1.z.object({
    fromAcademicYearId: zod_1.z.string().min(1, 'From Academic Year ID required'),
    toAcademicYearId: zod_1.z.string().min(1, 'To Academic Year ID required'),
    fromClassId: zod_1.z.string().min(1, 'From Class ID required'),
    toClassId: zod_1.z.string().min(1, 'To Class ID required'),
    remarks: zod_1.z.string().optional(),
});
class InstitutionSettingsController {
    static async getSettings(req, res) {
        const settings = await institution_settings_service_1.InstitutionSettingsService.getSettings();
        return (0, response_1.sendSuccess)(res, settings, 200);
    }
    static async updateSettings(req, res) {
        const validated = updateSettingsSchema.parse(req.body);
        const settings = await institution_settings_service_1.InstitutionSettingsService.updateSettings(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, settings, 200);
    }
    static async promoteStudentsBatch(req, res) {
        const validated = promoteBatchSchema.parse(req.body);
        const result = await institution_settings_service_1.InstitutionSettingsService.promoteStudentsBatch(req.user.id, validated);
        return (0, response_1.sendSuccess)(res, result, 200);
    }
}
exports.InstitutionSettingsController = InstitutionSettingsController;
