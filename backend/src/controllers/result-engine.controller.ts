import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { ResultEngineService } from '../services/result-engine.service';

export class ResultEngineController {
  static async calculateResults(req: AuthRequest, res: Response) {
    const results = await ResultEngineService.calculateExamResults(req.user!.id, req.params.examId as string);
    return sendSuccess(res, results, 200);
  }

  static async publishResults(req: AuthRequest, res: Response) {
    const result = await ResultEngineService.publishExamResults(req.user!.id, req.params.examId as string);
    return sendSuccess(res, result, 200);
  }

  static async getStudentResults(req: AuthRequest, res: Response) {
    const results = await ResultEngineService.getStudentResults(
      req.user!.id,
      req.user!.activeRole,
      req.params.studentId as string
    );
    return sendSuccess(res, results, 200);
  }

  static async verifyToken(req: AuthRequest, res: Response) {
    const tokenInfo = await ResultEngineService.verifyResultToken(req.params.token as string);
    return sendSuccess(res, tokenInfo, 200);
  }
}
