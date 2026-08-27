import { Request, Response, NextFunction } from 'express';
import { DataImportService } from '../services/data-import.service';
import { sendSuccess } from '../utils/response';

export class DataImportController {
  static async previewStudentImport(req: Request, res: Response, next: NextFunction) {
    try {
      const uploadedByUserId = (req as any).user.id;
      const { csvContent, filename } = req.body;

      if (!csvContent || typeof csvContent !== 'string') {
        return res.status(400).json({ success: false, error: { message: 'csvContent (string) is required.', code: 'VALIDATION_ERROR' } });
      }

      const preview = await DataImportService.previewStudentImport(
        csvContent,
        filename || 'student_import.csv',
        uploadedByUserId
      );

      return sendSuccess(res, preview, 200);
    } catch (err) {
      next(err);
    }
  }

  static async confirmStudentImport(req: Request, res: Response, next: NextFunction) {
    try {
      const confirmedByUserId = (req as any).user.id;
      const { importLogId, defaultAcademicYearId } = req.body;

      if (!importLogId) {
        return res.status(400).json({ success: false, error: { message: 'importLogId is required.', code: 'VALIDATION_ERROR' } });
      }

      const result = await DataImportService.confirmStudentImport(importLogId, confirmedByUserId, defaultAcademicYearId);
      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  static async getImportLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterRole = (req as any).user.activeRole;
      const uploadedByUserId = (req as any).user.id;

      // Only admins see all logs; others see own
      const filterUserId = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'PRINCIPAL'].includes(requesterRole)
        ? undefined
        : uploadedByUserId;

      const logs = await DataImportService.getImportLogs(filterUserId);
      return sendSuccess(res, { logs }, 200);
    } catch (err) {
      next(err);
    }
  }
}
