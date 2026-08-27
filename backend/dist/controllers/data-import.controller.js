"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataImportController = void 0;
const data_import_service_1 = require("../services/data-import.service");
const response_1 = require("../utils/response");
class DataImportController {
    static async previewStudentImport(req, res, next) {
        try {
            const uploadedByUserId = req.user.id;
            const { csvContent, filename } = req.body;
            if (!csvContent || typeof csvContent !== 'string') {
                return res.status(400).json({ success: false, error: { message: 'csvContent (string) is required.', code: 'VALIDATION_ERROR' } });
            }
            const preview = await data_import_service_1.DataImportService.previewStudentImport(csvContent, filename || 'student_import.csv', uploadedByUserId);
            return (0, response_1.sendSuccess)(res, preview, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async confirmStudentImport(req, res, next) {
        try {
            const confirmedByUserId = req.user.id;
            const { importLogId, defaultAcademicYearId } = req.body;
            if (!importLogId) {
                return res.status(400).json({ success: false, error: { message: 'importLogId is required.', code: 'VALIDATION_ERROR' } });
            }
            const result = await data_import_service_1.DataImportService.confirmStudentImport(importLogId, confirmedByUserId, defaultAcademicYearId);
            return (0, response_1.sendSuccess)(res, result, 200);
        }
        catch (err) {
            next(err);
        }
    }
    static async getImportLogs(req, res, next) {
        try {
            const requesterRole = req.user.activeRole;
            const uploadedByUserId = req.user.id;
            // Only admins see all logs; others see own
            const filterUserId = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PRINCIPAL'].includes(requesterRole)
                ? undefined
                : uploadedByUserId;
            const logs = await data_import_service_1.DataImportService.getImportLogs(filterUserId);
            return (0, response_1.sendSuccess)(res, { logs }, 200);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DataImportController = DataImportController;
