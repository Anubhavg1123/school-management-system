"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const report_service_1 = require("../services/report.service");
const response_1 = require("../utils/response");
class ReportController {
    static async getStudentRoster(req, res, next) {
        try {
            const filters = {
                status: req.query.status,
                classId: req.query.classId,
                sectionId: req.query.sectionId,
                departmentId: req.query.departmentId,
                academicYearId: req.query.academicYearId,
            };
            const format = req.query.format;
            const data = await report_service_1.ReportService.getStudentRoster(filters);
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
                    ...data.rows.map((r) => [
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
                    ].join(',')),
                ].join('\n');
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="student_roster_report.csv"');
                return res.status(200).send(csvRows);
            }
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getClassWise(req, res, next) {
        try {
            const academicYearId = req.query.academicYearId;
            const data = await report_service_1.ReportService.getClassWiseReport(academicYearId);
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getDepartmentWise(req, res, next) {
        try {
            const data = await report_service_1.ReportService.getDepartmentWiseReport();
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getTransfers(req, res, next) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
            const data = await report_service_1.ReportService.getTransferReport(limit);
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getAdmissions(req, res, next) {
        try {
            const data = await report_service_1.ReportService.getAdmissionsReport();
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
    // ===== PHASE 15: NEW REPORT ENDPOINTS =====
    static async getAttendanceReport(req, res, next) {
        try {
            const filters = {
                classId: req.query.classId,
                sectionId: req.query.sectionId,
                academicYearId: req.query.academicYearId,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const data = await report_service_1.ReportService.getAttendanceReport(filters);
            const format = req.query.format;
            if (format === 'csv') {
                const csv = report_service_1.ReportService.exportToCSV(data.rows);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
                return res.status(200).send(csv);
            }
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getFinanceReport(req, res, next) {
        try {
            const filters = {
                academicYearId: req.query.academicYearId,
                classId: req.query.classId,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
            };
            const data = await report_service_1.ReportService.getFinanceReport(filters);
            const format = req.query.format;
            if (format === 'csv') {
                const csv = report_service_1.ReportService.exportToCSV(data.rows);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="finance_report.csv"');
                return res.status(200).send(csv);
            }
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getExaminationReport(req, res, next) {
        try {
            const filters = {
                academicYearId: req.query.academicYearId,
                classId: req.query.classId,
            };
            const data = await report_service_1.ReportService.getExaminationReport(filters);
            const format = req.query.format;
            if (format === 'csv') {
                const csv = report_service_1.ReportService.exportToCSV(data.rows);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="examination_report.csv"');
                return res.status(200).send(csv);
            }
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getStaffReport(req, res, next) {
        try {
            const data = await report_service_1.ReportService.getStaffReport();
            const format = req.query.format;
            if (format === 'csv') {
                const csv = report_service_1.ReportService.exportToCSV(data.faculty);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="staff_report.csv"');
                return res.status(200).send(csv);
            }
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getVisitorReport(req, res, next) {
        try {
            const filters = {
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                purpose: req.query.purpose,
            };
            const data = await report_service_1.ReportService.getVisitorReport(filters);
            const format = req.query.format;
            if (format === 'csv') {
                const csv = report_service_1.ReportService.exportToCSV(data.rows);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="visitor_report.csv"');
                return res.status(200).send(csv);
            }
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
    static async getAuditReport(req, res, next) {
        try {
            const filters = {
                entityType: req.query.entityType,
                action: req.query.action,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            };
            const data = await report_service_1.ReportService.getAuditReport(filters);
            const format = req.query.format;
            if (format === 'csv') {
                const csv = report_service_1.ReportService.exportToCSV(data.rows);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="audit_report.csv"');
                return res.status(200).send(csv);
            }
            return (0, response_1.sendSuccess)(res, data, 200);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportController = ReportController;
