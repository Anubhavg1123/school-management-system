import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../types';
import { FeeService } from '../services/fee.service';

const createFeeCategorySchema = z.object({
  code: z.string().min(2, 'Category code is required'),
  name: z.string().min(2, 'Category name is required'),
  description: z.string().optional(),
});

const createFeeStructureSchema = z.object({
  code: z.string().min(2, 'Structure code is required'),
  name: z.string().min(2, 'Structure name is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().optional(),
  departmentId: z.string().optional(),
  description: z.string().optional(),
  items: z.array(
    z.object({
      feeCategoryId: z.string().min(1, 'Fee category is required'),
      amount: z.number().positive('Amount must be greater than zero'),
      isOptional: z.boolean().optional(),
      dueDate: z.string().optional(),
      installmentCount: z.number().int().positive().optional(),
    })
  ).min(1, 'At least one fee item is required'),
});

const assignFeeSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  feeStructureId: z.string().min(1, 'Fee structure ID is required'),
  academicYearId: z.string().optional(),
  notes: z.string().optional(),
  customInstallments: z.number().int().min(1).max(12).optional(),
});

const applyDiscountSchema = z.object({
  feeAssignmentId: z.string().min(1, 'Fee assignment ID is required'),
  type: z.enum(['FIXED_AMOUNT', 'PERCENTAGE', 'SCHOLARSHIP', 'CONCESSION', 'WAIVER']),
  amount: z.number().positive().optional(),
  percentage: z.number().min(0.01).max(100).optional(),
  reason: z.string().min(3, 'Detailed justification reason is required'),
});

const collectPaymentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  feeAssignmentId: z.string().min(1, 'Fee assignment ID is required'),
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'ONLINE', 'CHEQUE', 'OTHER']),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

const processRefundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().positive('Refund amount must be greater than zero'),
  reason: z.string().min(3, 'Detailed refund reason is required'),
});

export class FeeController {
  // ----------------------------------------------------
  // Fee Categories
  // ----------------------------------------------------
  static async getCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = await FeeService.getFeeCategories();
      res.status(200).json({ success: true, data: categories });
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = createFeeCategorySchema.parse(req.body);
      const category = await FeeService.createFeeCategory(body);
      res.status(201).json({ success: true, data: category });
    } catch (err) {
      next(err);
    }
  }

  // ----------------------------------------------------
  // Fee Structures
  // ----------------------------------------------------
  static async getStructures(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { academicYearId, classId, departmentId } = req.query;
      const structures = await FeeService.getFeeStructures({
        academicYearId: academicYearId as string,
        classId: classId as string,
        departmentId: departmentId as string,
      });
      res.status(200).json({ success: true, data: structures });
    } catch (err) {
      next(err);
    }
  }

  static async getStructureById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const structure = await FeeService.getFeeStructureById(req.params.id as string);
      res.status(200).json({ success: true, data: structure });
    } catch (err) {
      next(err);
    }
  }

  static async createStructure(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = createFeeStructureSchema.parse(req.body);
      const structure = await FeeService.createFeeStructure(body, req.user?.id);
      res.status(201).json({ success: true, data: structure });
    } catch (err) {
      next(err);
    }
  }

  // ----------------------------------------------------
  // Student Fee Assignments
  // ----------------------------------------------------
  static async assignFee(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = assignFeeSchema.parse(req.body);
      const assignment = await FeeService.assignFeeToStudent({
        ...body,
        assignedByUserId: req.user?.id,
      });
      res.status(201).json({ success: true, data: assignment });
    } catch (err) {
      next(err);
    }
  }

  static async getAssignments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { studentId, academicYearId, status, classId, page, limit } = req.query;
      const result = await FeeService.getStudentFeeAssignments({
        studentId: studentId as string,
        academicYearId: academicYearId as string,
        status: status as string,
        classId: classId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      res.status(200).json({ success: true, data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }

  // ----------------------------------------------------
  // Discounts & Scholarships
  // ----------------------------------------------------
  static async applyDiscount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = applyDiscountSchema.parse(req.body);
      const discount = await FeeService.applyDiscount({
        ...body,
        approvedByUserId: req.user?.id || '',
      });
      res.status(201).json({ success: true, data: discount });
    } catch (err) {
      next(err);
    }
  }

  // ----------------------------------------------------
  // Payment Collection & Receipts
  // ----------------------------------------------------
  static async collectPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = collectPaymentSchema.parse(req.body);
      const result = await FeeService.collectPayment({
        ...body,
        receivedByUserId: req.user?.id || '',
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ----------------------------------------------------
  // Refunds & Reversals
  // ----------------------------------------------------
  static async processRefund(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const body = processRefundSchema.parse(req.body);
      const refund = await FeeService.processRefund({
        ...body,
        requestedByUserId: req.user?.id || '',
        approvedByUserId: req.user?.id,
      });
      res.status(201).json({ success: true, data: refund });
    } catch (err) {
      next(err);
    }
  }

  // ----------------------------------------------------
  // Student Financial Profile
  // ----------------------------------------------------
  static async getStudentFinancialProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await FeeService.getStudentFinancialProfile(req.params.studentId as string);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  // ----------------------------------------------------
  // Financial Dashboard & Reports
  // ----------------------------------------------------
  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await FeeService.getFinancialDashboard();
      res.status(200).json({ success: true, data: dashboard });
    } catch (err) {
      next(err);
    }
  }

  static async getOutstandingReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { classId, departmentId, status, page, limit, format } = req.query;
      const result = await FeeService.getOutstandingReport({
        classId: classId as string,
        departmentId: departmentId as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 25,
      });

      if (format === 'csv') {
        const headers = [
          'Admission No',
          'Student Name',
          'Class',
          'Section',
          'Department',
          'Fee Structure',
          'Net Payable',
          'Total Paid',
          'Total Refunded',
          'Outstanding Balance',
          'Overdue Amount',
          'Status',
        ];

        const rows = result.rows.map((r) => [
          `"${r.admissionNumber}"`,
          `"${r.studentName}"`,
          `"${r.className}"`,
          `"${r.sectionName}"`,
          `"${r.departmentName}"`,
          `"${r.feeStructureName}"`,
          r.netPayable,
          r.totalPaid,
          r.totalRefunded,
          r.outstandingBalance,
          r.overdueAmount,
          `"${r.status}"`,
        ]);

        const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="fee_outstanding_report_${Date.now()}.csv"`);
        return res.status(200).send(csvContent);
      }

      res.status(200).json({ success: true, data: result.rows, meta: result.meta });
    } catch (err) {
      next(err);
    }
  }
}
