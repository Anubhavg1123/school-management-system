import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { ExamService } from '../services/exam.service';
import { z } from 'zod';

const createExamSchema = z.object({
  name: z.string().min(1, 'Exam name required'),
  code: z.string().optional(),
  examType: z.string().optional(),
  academicYearId: z.string().min(1, 'Academic year required'),
  term: z.string().optional(),
  startDate: z.string().min(1, 'Start date required'),
  endDate: z.string().min(1, 'End date required'),
  description: z.string().optional(),
  classIds: z.array(z.string()).min(1, 'At least one class required'),
});

const scheduleSubjectSchema = z.object({
  examinationId: z.string().min(1, 'Exam ID required'),
  classId: z.string().min(1, 'Class ID required'),
  subjectId: z.string().min(1, 'Subject ID required'),
  maxTheoryMarks: z.number().optional(),
  maxPracticalMarks: z.number().optional(),
  maxInternalMarks: z.number().optional(),
  totalMaxMarks: z.number().optional(),
  passingMarks: z.number().optional(),
  weightage: z.number().optional(),
  examDate: z.string().min(1, 'Exam date required'),
  startTime: z.string().min(1, 'Start time required'),
  endTime: z.string().min(1, 'End time required'),
  roomId: z.string().optional(),
  invigilatorFacultyId: z.string().optional(),
  instructions: z.string().optional(),
});

export class ExamController {
  static async createExam(req: AuthRequest, res: Response) {
    const validated = createExamSchema.parse(req.body);
    const exam = await ExamService.createExam(req.user!.id, validated);
    return sendSuccess(res, exam, 201);
  }

  static async scheduleSubject(req: AuthRequest, res: Response) {
    const validated = scheduleSubjectSchema.parse(req.body);
    const paper = await ExamService.scheduleExamSubject(req.user!.id, validated);
    return sendSuccess(res, paper, 200);
  }

  static async resolveEligibility(req: AuthRequest, res: Response) {
    const eligibilities = await ExamService.resolveExamEligibility(req.params.id as string);
    return sendSuccess(res, eligibilities, 200);
  }

  static async recordAttendance(req: AuthRequest, res: Response) {
    const { examinationSubjectId, attendances } = req.body;
    const records = await ExamService.recordExamAttendance(req.user!.id, examinationSubjectId, attendances);
    return sendSuccess(res, records, 200);
  }

  static async updateStatus(req: AuthRequest, res: Response) {
    const { status } = req.body;
    const updated = await ExamService.updateExamStatus(req.user!.id, req.params.id as string, status);
    return sendSuccess(res, updated, 200);
  }
}
