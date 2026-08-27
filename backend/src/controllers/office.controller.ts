import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { OfficeService } from '../services/office.service';
import { z } from 'zod';

const createStudentSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  dob: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  guardianName: z.string().min(1, 'Guardian name required'),
  guardianRelationship: z.string().min(1, 'Guardian relationship required'),
  guardianWhatsAppNumber: z.string().optional().default(''),
  guardianAltPhone: z.string().optional(),
  guardianEmail: z.string().optional(),
  admissionNumber: z.string().optional(),
  enrollmentNumber: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().min(1, 'Section required'),
  departmentId: z.string().optional(),
  academicYearId: z.string().optional(),
});

const updateStudentStatusSchema = z.object({
  status: z.string().min(1, 'Status required'),
  reason: z.string().min(1, 'Reason required'),
});

const recordPaymentSchema = z.object({
  studentId: z.string().min(1, 'Student ID required'),
  studentFeeAssignmentId: z.string().min(1, 'Fee assignment ID required'),
  amount: z.number().positive('Payment amount must be positive'),
  paymentMethod: z.string().min(1, 'Payment method required'),
  transactionRef: z.string().optional(),
  remarks: z.string().optional(),
});

export class OfficeController {
  static async getOfficeDashboard(req: AuthRequest, res: Response) {
    const metrics = await OfficeService.getOfficeDashboardMetrics();
    return sendSuccess(res, metrics, 200);
  }

  static async createStudentMaster(req: AuthRequest, res: Response) {
    const validated = createStudentSchema.parse(req.body);
    const student = await OfficeService.createStudentMaster(req.user!.id, validated);
    return sendSuccess(res, student, 201);
  }

  static async updateStudentStatus(req: AuthRequest, res: Response) {
    const validated = updateStudentStatusSchema.parse(req.body);
    const student = await OfficeService.updateStudentStatus(
      req.user!.id,
      req.params.id as string,
      validated.status,
      validated.reason
    );
    return sendSuccess(res, student, 200);
  }

  static async uploadDocument(req: AuthRequest, res: Response) {
    const { docType, title, fileUrl, fileSize, mimeType } = req.body;
    const doc = await OfficeService.uploadStudentDocument(req.user!.id, req.params.id as string, {
      docType,
      title,
      fileUrl,
      fileSize,
      mimeType,
    });
    return sendSuccess(res, doc, 201);
  }

  static async recordFeePayment(req: AuthRequest, res: Response) {
    const validated = recordPaymentSchema.parse(req.body);
    const payment = await OfficeService.recordFeePayment(req.user!.id, validated);
    return sendSuccess(res, payment, 201);
  }
}
