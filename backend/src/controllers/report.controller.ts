import { Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class ReportController {
  static async getStudentRoster(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as string | undefined,
        classId: req.query.classId as string | undefined,
        sectionId: req.query.sectionId as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
        academicYearId: req.query.academicYearId as string | undefined,
      };

      const format = req.query.format as string | undefined;
      const data = await ReportService.getStudentRoster(filters);

      if (format === 'csv') {
        const headers = [
          'Admission No',
          'Enrollment No',
          'Full Name',
          'Email',
          'WhatsApp',
          'Class',
          'Section',
          'Department',
          'Status',
          'Admission Date',
        ];

        const csvRows = [
          headers.join(','),
          ...data.rows.map((r) =>
            [
              `"${r.admissionNumber}"`,
              `"${r.enrollmentNumber}"`,
              `"${r.fullName}"`,
              `"${r.email}"`,
              `"${r.whatsAppNumber}"`,
              `"${r.className}"`,
              `"${r.sectionName}"`,
              `"${r.departmentName}"`,
              `"${r.status}"`,
              `"${r.admissionDate}"`,
            ].join(',')
          ),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="student_roster_report.csv"');
        return res.status(200).send(csvRows);
      }

      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getClassWise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const academicYearId = req.query.academicYearId as string | undefined;
      const data = await ReportService.getClassWiseReport(academicYearId);
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getDepartmentWise(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getDepartmentWiseReport();
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getTransfers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const data = await ReportService.getTransferReport(limit);
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAdmissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getAdmissionsReport();
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  // ===== PHASE 15: NEW REPORT ENDPOINTS =====

  static async getAttendanceReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        classId: req.query.classId as string | undefined,
        sectionId: req.query.sectionId as string | undefined,
        academicYearId: req.query.academicYearId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const data = await ReportService.getAttendanceReport(filters);
      const format = req.query.format as string | undefined;
      if (format === 'csv') {
        const csv = ReportService.exportToCSV(data.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
        return res.status(200).send(csv);
      }
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getFinanceReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        academicYearId: req.query.academicYearId as string | undefined,
        classId: req.query.classId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const data = await ReportService.getFinanceReport(filters);
      const format = req.query.format as string | undefined;
      if (format === 'csv') {
        const csv = ReportService.exportToCSV(data.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="finance_report.csv"');
        return res.status(200).send(csv);
      }
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getExaminationReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        academicYearId: req.query.academicYearId as string | undefined,
        classId: req.query.classId as string | undefined,
      };
      const data = await ReportService.getExaminationReport(filters);
      const format = req.query.format as string | undefined;
      if (format === 'csv') {
        const csv = ReportService.exportToCSV(data.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="examination_report.csv"');
        return res.status(200).send(csv);
      }
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getStaffReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getStaffReport();
      const format = req.query.format as string | undefined;
      if (format === 'csv') {
        const csv = ReportService.exportToCSV(data.faculty as any[]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="staff_report.csv"');
        return res.status(200).send(csv);
      }
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getVisitorReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        purpose: req.query.purpose as string | undefined,
      };
      const data = await ReportService.getVisitorReport(filters);
      const format = req.query.format as string | undefined;
      if (format === 'csv') {
        const csv = ReportService.exportToCSV(data.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="visitor_report.csv"');
        return res.status(200).send(csv);
      }
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAuditReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const filters = {
        entityType: req.query.entityType as string | undefined,
        action: req.query.action as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      const data = await ReportService.getAuditReport(filters);
      const format = req.query.format as string | undefined;
      if (format === 'csv') {
        const csv = ReportService.exportToCSV(data.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit_report.csv"');
        return res.status(200).send(csv);
      }
      return sendSuccess(res, data, 200);
    } catch (error) {
      next(error);
    }
  }
}

