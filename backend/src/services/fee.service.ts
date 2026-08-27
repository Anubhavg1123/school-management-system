import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';
import {
  FeeAssignmentStatusEnum,
  InstallmentStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  DiscountTypeEnum,
} from '../types';

const prisma = new PrismaClient();

export class FeeService {
  // ----------------------------------------------------
  // 1. FEE CATEGORIES
  // ----------------------------------------------------
  static async getFeeCategories() {
    return prisma.feeCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async createFeeCategory(data: { code: string; name: string; description?: string }) {
    const code = data.code.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await prisma.feeCategory.findUnique({ where: { code } });
    if (existing) {
      throw new AppError(`Fee category with code '${code}' already exists.`, 409, 'CATEGORY_EXISTS');
    }

    return prisma.feeCategory.create({
      data: {
        code,
        name: data.name.trim(),
        description: data.description,
      },
    });
  }

  // ----------------------------------------------------
  // 2. FEE STRUCTURES
  // ----------------------------------------------------
  static async getFeeStructures(filters?: { academicYearId?: string; classId?: string; departmentId?: string }) {
    const where: any = {};
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    return prisma.feeStructure.findMany({
      where,
      include: {
        academicYear: true,
        class: true,
        department: true,
        items: {
          include: {
            feeCategory: true,
          },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getFeeStructureById(id: string) {
    const structure = await prisma.feeStructure.findUnique({
      where: { id },
      include: {
        academicYear: true,
        class: true,
        department: true,
        items: {
          include: {
            feeCategory: true,
          },
        },
        assignments: {
          include: {
            student: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!structure) {
      throw new AppError('Fee structure not found.', 404, 'FEE_STRUCTURE_NOT_FOUND');
    }

    return structure;
  }

  static async createFeeStructure(
    data: {
      code: string;
      name: string;
      academicYearId: string;
      classId?: string;
      departmentId?: string;
      description?: string;
      items: Array<{
        feeCategoryId: string;
        amount: number;
        isOptional?: boolean;
        dueDate?: string;
        installmentCount?: number;
      }>;
    },
    userId?: string
  ) {
    const code = data.code.trim().toUpperCase().replace(/\s+/g, '-');
    const existing = await prisma.feeStructure.findUnique({ where: { code } });
    if (existing) {
      throw new AppError(`Fee structure with code '${code}' already exists.`, 409, 'STRUCTURE_EXISTS');
    }

    if (!data.items || data.items.length === 0) {
      throw new AppError('Fee structure must contain at least one fee category item.', 400, 'NO_ITEMS');
    }

    const structure = await prisma.$transaction(async (tx) => {
      const created = await tx.feeStructure.create({
        data: {
          code,
          name: data.name.trim(),
          academicYearId: data.academicYearId,
          classId: data.classId || null,
          departmentId: data.departmentId || null,
          description: data.description,
        },
      });

      for (const item of data.items) {
        await tx.feeStructureItem.create({
          data: {
            feeStructureId: created.id,
            feeCategoryId: item.feeCategoryId,
            amount: Number(item.amount),
            isOptional: Boolean(item.isOptional),
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            installmentCount: item.installmentCount ? Number(item.installmentCount) : 1,
          },
        });
      }

      return tx.feeStructure.findUnique({
        where: { id: created.id },
        include: {
          academicYear: true,
          class: true,
          department: true,
          items: {
            include: { feeCategory: true },
          },
        },
      });
    });

    if (userId) {
      await AuditService.log({
        userId,
        action: 'FEE_STRUCTURE_CREATED',
        entityType: 'FeeStructure',
        entityId: structure?.id,
        afterState: JSON.stringify({ code: structure?.code, name: structure?.name }),
      });
    }

    return structure;
  }

  // ----------------------------------------------------
  // 3. STUDENT FEE ASSIGNMENTS & INSTALLMENT SCHEDULING
  // ----------------------------------------------------
  static async assignFeeToStudent(
    data: {
      studentId: string;
      feeStructureId: string;
      academicYearId?: string;
      notes?: string;
      assignedByUserId?: string;
      customInstallments?: number;
    }
  ) {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { section: { include: { class: true } } },
    });

    if (!student) {
      throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const structure = await prisma.feeStructure.findUnique({
      where: { id: data.feeStructureId },
      include: { items: { include: { feeCategory: true } } },
    });

    if (!structure) {
      throw new AppError('Fee structure not found.', 404, 'STRUCTURE_NOT_FOUND');
    }

    const existingAssignment = await prisma.studentFeeAssignment.findUnique({
      where: {
        studentId_feeStructureId: {
          studentId: data.studentId,
          feeStructureId: data.feeStructureId,
        },
      },
    });

    if (existingAssignment) {
      throw new AppError('This fee structure is already assigned to this student.', 409, 'ALREADY_ASSIGNED');
    }

    const academicYearId = data.academicYearId || structure.academicYearId || student.academicYearId;
    if (!academicYearId) {
      throw new AppError('Academic year must be specified for fee assignment.', 400, 'NO_ACADEMIC_YEAR');
    }

    // Calculate total amount from mandatory items
    let totalAssignedAmount = 0;
    const itemsToCreate: Array<{ feeCategoryId: string; amount: number }> = [];

    for (const item of structure.items) {
      totalAssignedAmount += item.amount;
      itemsToCreate.push({
        feeCategoryId: item.feeCategoryId,
        amount: item.amount,
      });
    }

    const installmentCount = data.customInstallments || 3; // Default 3 term installments
    const installmentAmount = Math.round((totalAssignedAmount / installmentCount) * 100) / 100;

    const assignment = await prisma.$transaction(async (tx) => {
      const createdAssignment = await tx.studentFeeAssignment.create({
        data: {
          studentId: data.studentId,
          feeStructureId: data.feeStructureId,
          academicYearId,
          totalAssignedAmount,
          totalDiscountAmount: 0,
          totalPaidAmount: 0,
          totalRefundedAmount: 0,
          netPayableAmount: totalAssignedAmount,
          status: FeeAssignmentStatusEnum.UNPAID,
          assignedByUserId: data.assignedByUserId || null,
          notes: data.notes,
        },
      });

      // Create itemized fee rows
      for (const it of itemsToCreate) {
        await tx.studentFeeItem.create({
          data: {
            feeAssignmentId: createdAssignment.id,
            feeCategoryId: it.feeCategoryId,
            originalAmount: it.amount,
            discountAmount: 0,
            netAmount: it.amount,
            paidAmount: 0,
            status: FeeAssignmentStatusEnum.UNPAID,
          },
        });
      }

      // Generate Installment Schedule
      const now = new Date();
      for (let i = 1; i <= installmentCount; i++) {
        const dueDate = new Date(now);
        dueDate.setMonth(dueDate.getMonth() + (i - 1) * 3); // Spaced 3 months apart
        dueDate.setDate(15); // Due on 15th of the month

        // Handle rounding difference on final installment
        const currentInstAmount =
          i === installmentCount
            ? totalAssignedAmount - installmentAmount * (installmentCount - 1)
            : installmentAmount;

        await tx.feeInstallment.create({
          data: {
            feeAssignmentId: createdAssignment.id,
            installmentNumber: i,
            name: `Installment ${i} (Term ${i})`,
            amount: currentInstAmount,
            dueDate,
            paidAmount: 0,
            status: i === 1 ? InstallmentStatusEnum.DUE : InstallmentStatusEnum.UPCOMING,
          },
        });
      }

      return tx.studentFeeAssignment.findUnique({
        where: { id: createdAssignment.id },
        include: {
          feeStructure: true,
          items: { include: { feeCategory: true } },
          installments: { orderBy: { installmentNumber: 'asc' } },
        },
      });
    });

    if (data.assignedByUserId) {
      await AuditService.log({
        userId: data.assignedByUserId,
        action: 'FEE_ASSIGNED_TO_STUDENT',
        entityType: 'StudentFeeAssignment',
        entityId: assignment?.id,
        afterState: JSON.stringify({
          studentId: data.studentId,
          feeStructureId: data.feeStructureId,
          totalAmount: totalAssignedAmount,
        }),
      });
    }

    return assignment;
  }

  static async getStudentFeeAssignments(filters?: {
    studentId?: string;
    academicYearId?: string;
    status?: string;
    classId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(100, Math.max(1, filters?.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters?.status) where.status = filters.status;
    if (filters?.classId) {
      where.student = { section: { classId: filters.classId } };
    }

    const [total, rows] = await Promise.all([
      prisma.studentFeeAssignment.count({ where }),
      prisma.studentFeeAssignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              user: true,
              section: { include: { class: true } },
              department: true,
            },
          },
          feeStructure: true,
          academicYear: true,
          installments: { orderBy: { installmentNumber: 'asc' } },
          discounts: true,
          payments: {
            include: { receipt: true },
            orderBy: { paymentDate: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // ----------------------------------------------------
  // 4. DISCOUNTS & SCHOLARSHIPS
  // ----------------------------------------------------
  static async applyDiscount(data: {
    feeAssignmentId: string;
    type: string;
    amount?: number;
    percentage?: number;
    reason: string;
    approvedByUserId: string;
  }) {
    const assignment = await prisma.studentFeeAssignment.findUnique({
      where: { id: data.feeAssignmentId },
      include: { installments: { orderBy: { installmentNumber: 'asc' } } },
    });

    if (!assignment) {
      throw new AppError('Fee assignment not found.', 404, 'ASSIGNMENT_NOT_FOUND');
    }

    let discountValue = 0;
    if (data.type === DiscountTypeEnum.PERCENTAGE) {
      if (!data.percentage || data.percentage <= 0 || data.percentage > 100) {
        throw new AppError('Valid percentage (1-100) is required for percentage discount.', 400, 'INVALID_PERCENT');
      }
      discountValue = Math.round(((assignment.totalAssignedAmount * data.percentage) / 100) * 100) / 100;
    } else {
      if (!data.amount || data.amount <= 0) {
        throw new AppError('Positive discount amount is required.', 400, 'INVALID_AMOUNT');
      }
      discountValue = Number(data.amount);
    }

    const newNetPayable = Math.max(0, assignment.totalAssignedAmount - (assignment.totalDiscountAmount + discountValue));

    const updated = await prisma.$transaction(async (tx) => {
      const discount = await tx.feeDiscount.create({
        data: {
          feeAssignmentId: data.feeAssignmentId,
          studentId: assignment.studentId,
          type: data.type,
          amount: discountValue,
          percentage: data.percentage || null,
          reason: data.reason.trim(),
          approvedByUserId: data.approvedByUserId,
        },
      });

      // Recalculate remaining installments
      const remainingUnpaidInstallments = assignment.installments.filter(
        (inst) => inst.status !== InstallmentStatusEnum.PAID
      );

      if (remainingUnpaidInstallments.length > 0) {
        const discountPerInstallment =
          Math.round((discountValue / remainingUnpaidInstallments.length) * 100) / 100;

        for (let i = 0; i < remainingUnpaidInstallments.length; i++) {
          const inst = remainingUnpaidInstallments[i];
          const newAmount = Math.max(0, inst.amount - discountPerInstallment);
          await tx.feeInstallment.update({
            where: { id: inst.id },
            data: { amount: newAmount },
          });
        }
      }

      await tx.studentFeeAssignment.update({
        where: { id: data.feeAssignmentId },
        data: {
          totalDiscountAmount: assignment.totalDiscountAmount + discountValue,
          netPayableAmount: newNetPayable,
          status:
            assignment.totalPaidAmount >= newNetPayable && newNetPayable > 0
              ? FeeAssignmentStatusEnum.PAID
              : assignment.status,
        },
      });

      return discount;
    });

    await AuditService.log({
      userId: data.approvedByUserId,
      action: 'FEE_DISCOUNT_APPLIED',
      entityType: 'FeeDiscount',
      entityId: updated.id,
      afterState: JSON.stringify({
        feeAssignmentId: data.feeAssignmentId,
        type: data.type,
        amount: discountValue,
        reason: data.reason,
      }),
    });

    return updated;
  }

  // ----------------------------------------------------
  // 5. PAYMENT COLLECTION & RECEIPT ISSUANCE
  // ----------------------------------------------------
  static async collectPayment(data: {
    studentId: string;
    feeAssignmentId: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    notes?: string;
    receivedByUserId: string;
  }) {
    const payAmount = Number(data.amount);
    if (!payAmount || payAmount <= 0) {
      throw new AppError('Payment amount must be greater than zero.', 400, 'INVALID_AMOUNT');
    }

    // Idempotency: Check duplicate transaction reference if supplied
    if (data.transactionReference && data.transactionReference.trim()) {
      const existingRef = await prisma.payment.findUnique({
        where: { transactionReference: data.transactionReference.trim() },
      });
      if (existingRef) {
        throw new AppError(
          `Payment with transaction reference '${data.transactionReference}' has already been processed.`,
          409,
          'DUPLICATE_TRANSACTION_REF'
        );
      }
    }

    const assignment = await prisma.studentFeeAssignment.findUnique({
      where: { id: data.feeAssignmentId },
      include: {
        student: { include: { user: true, section: { include: { class: true } }, department: true } },
        academicYear: true,
        installments: { orderBy: { installmentNumber: 'asc' } },
        items: true,
      },
    });

    if (!assignment) {
      throw new AppError('Fee assignment record not found.', 404, 'ASSIGNMENT_NOT_FOUND');
    }

    const totalOutstanding = Math.max(
      0,
      assignment.netPayableAmount - (assignment.totalPaidAmount - assignment.totalRefundedAmount)
    );

    if (payAmount > totalOutstanding + 0.01) {
      throw new AppError(
        `Payment amount ($${payAmount}) exceeds student's current outstanding balance ($${totalOutstanding}).`,
        400,
        'EXCEEDS_BALANCE'
      );
    }

    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          studentId: data.studentId,
          feeAssignmentId: data.feeAssignmentId,
          academicYearId: assignment.academicYearId,
          amount: payAmount,
          paymentMethod: data.paymentMethod,
          transactionReference: data.transactionReference?.trim() || null,
          status: PaymentStatusEnum.SUCCESS,
          receivedByUserId: data.receivedByUserId,
          notes: data.notes,
        },
      });

      // 2. Allocate payment chronologically to installments
      let remainingToAllocate = payAmount;
      for (const inst of assignment.installments) {
        if (remainingToAllocate <= 0) break;
        const unpaidOnInst = Math.max(0, inst.amount - inst.paidAmount);
        if (unpaidOnInst > 0) {
          const allocation = Math.min(unpaidOnInst, remainingToAllocate);
          const newPaidOnInst = inst.paidAmount + allocation;
          const newStatus =
            newPaidOnInst >= inst.amount
              ? InstallmentStatusEnum.PAID
              : InstallmentStatusEnum.PARTIALLY_PAID;

          await tx.feeInstallment.update({
            where: { id: inst.id },
            data: {
              paidAmount: newPaidOnInst,
              status: newStatus,
            },
          });
          remainingToAllocate -= allocation;
        }
      }

      // 3. Update Assignment totals & status
      const newTotalPaid = assignment.totalPaidAmount + payAmount;
      const newRemaining = Math.max(0, assignment.netPayableAmount - (newTotalPaid - assignment.totalRefundedAmount));
      const newAssignmentStatus =
        newRemaining <= 0 ? FeeAssignmentStatusEnum.PAID : FeeAssignmentStatusEnum.PARTIALLY_PAID;

      await tx.studentFeeAssignment.update({
        where: { id: data.feeAssignmentId },
        data: {
          totalPaidAmount: newTotalPaid,
          status: newAssignmentStatus,
        },
      });

      // 4. Generate Unique Official Receipt
      const receipt = await tx.receipt.create({
        data: {
          receiptNumber,
          paymentId: payment.id,
          studentId: data.studentId,
          amountPaid: payAmount,
          totalAssigned: assignment.netPayableAmount,
          totalRemainingBalance: newRemaining,
          issuedByUserId: data.receivedByUserId,
          notes: data.notes,
        },
      });

      return { payment, receipt, newRemaining };
    });

    await AuditService.log({
      userId: data.receivedByUserId,
      action: 'FEE_PAYMENT_COLLECTED',
      entityType: 'Payment',
      entityId: result.payment.id,
      afterState: JSON.stringify({
        paymentNumber,
        receiptNumber,
        studentId: data.studentId,
        amount: payAmount,
        paymentMethod: data.paymentMethod,
        remainingBalance: result.newRemaining,
      }),
    });

    return result;
  }

  // ----------------------------------------------------
  // 6. REFUNDS & REVERSALS
  // ----------------------------------------------------
  static async processRefund(data: {
    paymentId: string;
    amount: number;
    reason: string;
    requestedByUserId: string;
    approvedByUserId?: string;
  }) {
    const refundAmount = Number(data.amount);
    if (!refundAmount || refundAmount <= 0) {
      throw new AppError('Refund amount must be greater than zero.', 400, 'INVALID_AMOUNT');
    }

    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: {
        refunds: true,
        feeAssignment: {
          include: {
            installments: { orderBy: { installmentNumber: 'desc' } },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError('Original payment record not found.', 404, 'PAYMENT_NOT_FOUND');
    }

    if (payment.status === PaymentStatusEnum.REFUNDED) {
      throw new AppError('This payment has already been completely refunded.', 400, 'ALREADY_REFUNDED');
    }

    const alreadyRefunded = payment.refunds.reduce((sum, r) => sum + r.amount, 0);
    const maxRefundable = payment.amount - alreadyRefunded;

    if (refundAmount > maxRefundable + 0.01) {
      throw new AppError(
        `Refund amount ($${refundAmount}) exceeds maximum refundable balance ($${maxRefundable}).`,
        400,
        'EXCEEDS_REFUNDABLE'
      );
    }

    const refundNumber = `REF-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Refund Record
      const refund = await tx.refund.create({
        data: {
          refundNumber,
          paymentId: data.paymentId,
          studentId: payment.studentId,
          amount: refundAmount,
          reason: data.reason.trim(),
          requestedByUserId: data.requestedByUserId,
          approvedByUserId: data.approvedByUserId || data.requestedByUserId,
        },
      });

      // 2. Update Payment Status
      const totalRefundedNow = alreadyRefunded + refundAmount;
      const newPaymentStatus =
        totalRefundedNow >= payment.amount
          ? PaymentStatusEnum.REFUNDED
          : PaymentStatusEnum.PARTIALLY_REFUNDED;

      await tx.payment.update({
        where: { id: data.paymentId },
        data: { status: newPaymentStatus },
      });

      // 3. Reopen Installments (from latest paid back)
      let refundToReopen = refundAmount;
      for (const inst of payment.feeAssignment.installments) {
        if (refundToReopen <= 0) break;
        if (inst.paidAmount > 0) {
          const reduction = Math.min(inst.paidAmount, refundToReopen);
          const newPaidAmount = inst.paidAmount - reduction;
          const newStatus =
            newPaidAmount <= 0
              ? InstallmentStatusEnum.DUE
              : InstallmentStatusEnum.PARTIALLY_PAID;

          await tx.feeInstallment.update({
            where: { id: inst.id },
            data: {
              paidAmount: newPaidAmount,
              status: newStatus,
            },
          });
          refundToReopen -= reduction;
        }
      }

      // 4. Update Assignment Refunded Total
      const newTotalRefunded = payment.feeAssignment.totalRefundedAmount + refundAmount;
      const netCollected = payment.feeAssignment.totalPaidAmount - newTotalRefunded;
      const newAssignmentStatus =
        netCollected < payment.feeAssignment.netPayableAmount
          ? netCollected <= 0
            ? FeeAssignmentStatusEnum.UNPAID
            : FeeAssignmentStatusEnum.PARTIALLY_PAID
          : FeeAssignmentStatusEnum.PAID;

      await tx.studentFeeAssignment.update({
        where: { id: payment.feeAssignmentId },
        data: {
          totalRefundedAmount: newTotalRefunded,
          status: newAssignmentStatus,
        },
      });

      return refund;
    });

    await AuditService.log({
      userId: data.requestedByUserId,
      action: 'FEE_REFUND_PROCESSED',
      entityType: 'Refund',
      entityId: result.id,
      afterState: JSON.stringify({
        refundNumber,
        paymentId: data.paymentId,
        amount: refundAmount,
        reason: data.reason,
      }),
    });

    return result;
  }

  // ----------------------------------------------------
  // 7. COMPREHENSIVE STUDENT FINANCIAL PROFILE
  // ----------------------------------------------------
  static async getStudentFinancialProfile(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        section: { include: { class: true } },
        department: true,
        academicYear: true,
      },
    });

    if (!student) {
      throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const assignments = await prisma.studentFeeAssignment.findMany({
      where: { studentId },
      include: {
        feeStructure: {
          include: {
            items: { include: { feeCategory: true } },
          },
        },
        academicYear: true,
        installments: { orderBy: { installmentNumber: 'asc' } },
        discounts: {
          include: { approvedBy: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          include: {
            receipt: true,
            refunds: true,
            receivedBy: true,
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute aggregate metrics
    let totalAssigned = 0;
    let totalDiscount = 0;
    let totalNetPayable = 0;
    let totalPaid = 0;
    let totalRefunded = 0;
    let overdueAmount = 0;
    let upcomingAmount = 0;

    const now = new Date();

    for (const a of assignments) {
      totalAssigned += a.totalAssignedAmount;
      totalDiscount += a.totalDiscountAmount;
      totalNetPayable += a.netPayableAmount;
      totalPaid += a.totalPaidAmount;
      totalRefunded += a.totalRefundedAmount;

      for (const inst of a.installments) {
        const unpaid = Math.max(0, inst.amount - inst.paidAmount);
        if (unpaid > 0) {
          if (new Date(inst.dueDate) < now) {
            overdueAmount += unpaid;
          } else {
            upcomingAmount += unpaid;
          }
        }
      }
    }

    const totalOutstanding = Math.max(0, totalNetPayable - (totalPaid - totalRefunded));

    return {
      student,
      summary: {
        totalAssigned,
        totalDiscount,
        totalNetPayable,
        totalPaid,
        totalRefunded,
        totalOutstanding,
        overdueAmount,
        upcomingAmount,
      },
      assignments,
    };
  }

  // ----------------------------------------------------
  // 8. FINANCIAL REPORTS & ANALYTICS
  // ----------------------------------------------------
  static async getFinancialDashboard() {
    const [assignments, payments, refunds] = await Promise.all([
      prisma.studentFeeAssignment.findMany({
        include: {
          installments: true,
        },
      }),
      prisma.payment.findMany({
        where: { status: { in: [PaymentStatusEnum.SUCCESS, PaymentStatusEnum.PARTIALLY_REFUNDED] } },
        include: {
          student: { include: { user: true } },
          receipt: true,
        },
        orderBy: { paymentDate: 'desc' },
        take: 10,
      }),
      prisma.refund.findMany({
        orderBy: { refundDate: 'desc' },
        take: 10,
      }),
    ]);

    let totalAssigned = 0;
    let totalDiscount = 0;
    let totalNetPayable = 0;
    let totalCollected = 0;
    let totalRefunded = 0;
    let overdueAmount = 0;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = now.toISOString().slice(0, 7);

    let todayCollected = 0;
    let monthCollected = 0;

    for (const a of assignments) {
      totalAssigned += a.totalAssignedAmount;
      totalDiscount += a.totalDiscountAmount;
      totalNetPayable += a.netPayableAmount;
      totalCollected += a.totalPaidAmount;
      totalRefunded += a.totalRefundedAmount;

      for (const inst of a.installments) {
        const unpaid = Math.max(0, inst.amount - inst.paidAmount);
        if (unpaid > 0 && new Date(inst.dueDate) < now) {
          overdueAmount += unpaid;
        }
      }
    }

    // Today & Month Collections
    const allPayments = await prisma.payment.findMany({
      where: { status: { in: [PaymentStatusEnum.SUCCESS, PaymentStatusEnum.PARTIALLY_REFUNDED] } },
    });

    for (const p of allPayments) {
      const pDateStr = p.paymentDate.toISOString().slice(0, 10);
      if (pDateStr === todayStr) {
        todayCollected += p.amount;
      }
      if (pDateStr.startsWith(monthStr)) {
        monthCollected += p.amount;
      }
    }

    const totalOutstanding = Math.max(0, totalNetPayable - (totalCollected - totalRefunded));

    return {
      kpi: {
        totalAssigned,
        totalDiscount,
        totalNetPayable,
        totalCollected,
        totalRefunded,
        totalOutstanding,
        overdueAmount,
        todayCollected,
        monthCollected,
      },
      recentTransactions: payments,
      recentRefunds: refunds,
    };
  }

  static async getOutstandingReport(filters?: {
    classId?: string;
    departmentId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters?.page || 1);
    const limit = Math.min(200, Math.max(1, filters?.limit || 25));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.classId || filters?.departmentId) {
      where.student = {};
      if (filters.classId) where.student.section = { classId: filters.classId };
      if (filters.departmentId) where.student.departmentId = filters.departmentId;
    }

    const [total, assignments] = await Promise.all([
      prisma.studentFeeAssignment.count({ where }),
      prisma.studentFeeAssignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              user: true,
              section: { include: { class: true } },
              department: true,
            },
          },
          feeStructure: true,
          installments: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const now = new Date();
    const rows = assignments.map((a) => {
      const remainingBalance = Math.max(
        0,
        a.netPayableAmount - (a.totalPaidAmount - a.totalRefundedAmount)
      );

      let overdue = 0;
      for (const inst of a.installments) {
        const unp = Math.max(0, inst.amount - inst.paidAmount);
        if (unp > 0 && new Date(inst.dueDate) < now) {
          overdue += unp;
        }
      }

      return {
        id: a.id,
        studentId: a.studentId,
        admissionNumber: a.student.admissionNumber,
        studentName: `${a.student.user.firstName} ${a.student.user.lastName}`,
        email: a.student.user.email,
        phone: a.student.user.whatsAppNumber || a.student.user.phone || '',
        className: a.student.section?.class?.name || 'Unassigned',
        sectionName: a.student.section?.name || 'Unassigned',
        departmentName: a.student.department?.name || 'General',
        feeStructureName: a.feeStructure.name,
        netPayable: a.netPayableAmount,
        totalPaid: a.totalPaidAmount,
        totalRefunded: a.totalRefundedAmount,
        outstandingBalance: remainingBalance,
        overdueAmount: overdue,
        status: a.status,
      };
    });

    return {
      rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
