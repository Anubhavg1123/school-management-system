import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { AcademicPerformanceController } from '../controllers/academic-performance.controller';

export const academicPerformanceRouter = Router();

academicPerformanceRouter.use(requireAuth);

academicPerformanceRouter.get(
  '/students/:studentId/trend',
  (req, res, next) => AcademicPerformanceController.getStudentTrend(req, res).catch(next)
);

academicPerformanceRouter.get(
  '/classes/:classId',
  (req, res, next) => AcademicPerformanceController.getClassPerformance(req, res).catch(next)
);

export default academicPerformanceRouter;
