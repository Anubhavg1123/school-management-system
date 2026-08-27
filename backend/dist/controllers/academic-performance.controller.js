"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicPerformanceController = void 0;
const response_1 = require("../utils/response");
const academic_performance_service_1 = require("../services/academic-performance.service");
class AcademicPerformanceController {
    static async getStudentTrend(req, res) {
        const trend = await academic_performance_service_1.AcademicPerformanceService.getStudentPerformanceTrend(req.params.studentId);
        return (0, response_1.sendSuccess)(res, trend, 200);
    }
    static async getClassPerformance(req, res) {
        const examId = typeof req.query.examinationId === 'string' ? req.query.examinationId : undefined;
        const analytics = await academic_performance_service_1.AcademicPerformanceService.getClassPerformance(req.params.classId, examId);
        return (0, response_1.sendSuccess)(res, analytics, 200);
    }
}
exports.AcademicPerformanceController = AcademicPerformanceController;
