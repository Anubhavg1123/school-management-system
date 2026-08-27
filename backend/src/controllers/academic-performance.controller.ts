import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { AcademicPerformanceService } from '../services/academic-performance.service';

export class AcademicPerformanceController {
  static async getStudentTrend(req: AuthRequest, res: Response) {
    const trend = await AcademicPerformanceService.getStudentPerformanceTrend(req.params.studentId as string);
    return sendSuccess(res, trend, 200);
  }

  static async getClassPerformance(req: AuthRequest, res: Response) {
    const examId = typeof req.query.examinationId === 'string' ? req.query.examinationId : undefined;
    const analytics = await AcademicPerformanceService.getClassPerformance(req.params.classId as string, examId);
    return sendSuccess(res, analytics, 200);
  }
}
