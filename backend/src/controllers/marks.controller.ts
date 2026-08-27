import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { MarksService } from '../services/marks.service';
import { z } from 'zod';

const submitMarksSchema = z.object({
  examinationSubjectId: z.string().min(1, 'Exam subject ID required'),
  marks: z.array(
    z.object({
      studentId: z.string().min(1, 'Student ID required'),
      obtainedTheoryMarks: z.number().optional(),
      obtainedPracticalMarks: z.number().optional(),
      obtainedInternalMarks: z.number().optional(),
      isAbsent: z.boolean().optional(),
      remarks: z.string().optional(),
    })
  ),
  isDraft: z.boolean().optional(),
});

const verifyMarksSchema = z.object({
  action: z.enum(['VERIFIED', 'RETURNED_FOR_CORRECTION']),
  reason: z.string().optional(),
});

const requestCorrectionSchema = z.object({
  studentMarksId: z.string().min(1, 'Marks ID required'),
  requestedMarks: z.number().nonnegative('Requested marks must be non-negative'),
  reason: z.string().min(1, 'Correction reason required'),
});

export class MarksController {
  static async submitMarks(req: AuthRequest, res: Response) {
    const validated = submitMarksSchema.parse(req.body);
    const results = await MarksService.submitStudentMarksBatch(
      req.user!.id,
      validated.examinationSubjectId,
      validated.marks,
      validated.isDraft ?? true
    );
    return sendSuccess(res, results, 200);
  }

  static async verifyMarks(req: AuthRequest, res: Response) {
    const validated = verifyMarksSchema.parse(req.body);
    const result = await MarksService.verifySubjectMarks(
      req.user!.id,
      req.params.subjectId as string,
      validated.action,
      validated.reason
    );
    return sendSuccess(res, result, 200);
  }

  static async requestCorrection(req: AuthRequest, res: Response) {
    const validated = requestCorrectionSchema.parse(req.body);
    const correction = await MarksService.requestMarksCorrection(
      req.user!.id,
      validated.studentMarksId,
      validated.requestedMarks,
      validated.reason
    );
    return sendSuccess(res, correction, 201);
  }

  static async reviewCorrection(req: AuthRequest, res: Response) {
    const { action } = req.body;
    const result = await MarksService.reviewMarksCorrection(req.user!.id, req.params.id as string, action);
    return sendSuccess(res, result, 200);
  }
}
