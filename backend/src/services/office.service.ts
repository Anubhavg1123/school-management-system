import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateStudentMasterPayload {
  firstName: string;
  lastName: string;
  email: string;
  dob?: string;
  gender?: string;
  address?: string;
  guardianName: string;
  guardianRelationship: string;
  guardianWhatsAppNumber: string; // MANDATORY parent/guardian WhatsApp
  guardianAltPhone?: string;
  guardianEmail?: string;
  admissionNumber?: string;
  enrollmentNumber?: string;
  sectionId: string;
  departmentId?: string;
  academicYearId?: string;
}

export class OfficeService {
  /**
   * 1. Real-Time Central Office Dashboard KPIs
   */
  static async getOfficeDashboardMetrics() {
    const totalStudents = await prisma.student.count();
    const activeStudents = await prisma.student.count({ where: { status: 'ACTIVE' } });
    const leftStudents = await prisma.student.count({ where: { status: 'LEFT_INSTITUTION' } });
    const pendingAdmissions = await prisma.student.count({ where: { status: 'PENDING_ADMISSION' } });

    const pendingUserApprovals = await prisma.registrationRequest.count({
      where: { status: 'PENDING' },
    });

    const feeAssignments = await prisma.studentFeeAssignment.findMany({
      select: { netPayableAmount: true, totalPaidAmount: true },
    });
    let feesDue = 0;
    let feesCollected = 0;
    for (const f of feeAssignments) {
      feesDue += f.netPayableAmount;
      feesCollected += f.totalPaidAmount;
    }
    const outstandingFees = Math.max(0, feesDue - feesCollected);

    return {
      totalStudents,
      activeStudents,
      leftStudents,
      pendingAdmissions,
      pendingUserApprovals,
      feesDue,
      feesCollected,
      outstandingFees,
    };
  }

  /**
   * 2. Student Admission Intake & Master Registration (Mandatory Parent WhatsApp Verification)
   */
  static async createStudentMaster(creatorUserId: string, payload: CreateStudentMasterPayload) {
    // Parent WhatsApp number is MANDATORY according to requirements
    if (!payload.guardianWhatsAppNumber || payload.guardianWhatsAppNumber.trim().length < 5) {
      throw new AppError(
        'Parent/Guardian WhatsApp number is mandatory for student admission intake.',
        400,
        'MANDATORY_PARENT_WHATSAPP_REQUIRED'
      );
    }

    // Resolve or create user account for student
    const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existingUser) {
      throw new AppError(`User with email '${payload.email}' already exists.`, 409);
    }

    // Create user & student in database transaction
    const student = await prisma.$transaction(async (tx) => {
      // 1. Generate permanent 5-digit sequential Campus ID (e.g. 00001, 00002, 00003...)
      const allStudents = await tx.student.findMany({
        select: { campusId: true },
      });
      let maxCampusSeq = 0;
      for (const s of allStudents) {
        if (s.campusId) {
          const num = parseInt(s.campusId, 10);
          if (!isNaN(num) && num > maxCampusSeq) {
            maxCampusSeq = num;
          }
        }
      }
      const nextCampusSeq = maxCampusSeq + 1;
      const campusId = String(nextCampusSeq).padStart(5, '0');

      // 2. Resolve Academic Year and generate Academic Enrollment Number
      let academicYearId = payload.academicYearId;
      if (!academicYearId && payload.sectionId) {
        const sec = await tx.section.findUnique({
          where: { id: payload.sectionId },
          include: { class: true },
        });
        if (sec?.class?.academicYearId) {
          academicYearId = sec.class.academicYearId;
        }
      }

      let enrollmentNumber = payload.enrollmentNumber;
      if (!enrollmentNumber && academicYearId) {
        const ay = await tx.academicYear.findUnique({ where: { id: academicYearId } });
        if (ay) {
          const prefix = ay.enrollmentPrefix || '26';
          const seqLen = ay.enrollmentSeqLength || 4;
          const seq = ay.nextEnrollmentSeq || 1;
          enrollmentNumber = `${prefix}${String(seq).padStart(seqLen, '0')}`;
          await tx.academicYear.update({
            where: { id: academicYearId },
            data: { nextEnrollmentSeq: seq + 1 },
          });
        }
      }
      if (!enrollmentNumber) {
        enrollmentNumber = `ENR-${campusId}`;
      }

      let finalAdmissionNumber = payload.admissionNumber || `ADM-${campusId}`;
      let admExisting = await tx.student.findUnique({ where: { admissionNumber: finalAdmissionNumber } });
      let admSuffix = 1;
      while (admExisting) {
        finalAdmissionNumber = `ADM-${campusId}-${admSuffix++}`;
        admExisting = await tx.student.findUnique({ where: { admissionNumber: finalAdmissionNumber } });
      }

      let finalEnrollmentNumber = enrollmentNumber;
      let enrExisting = await tx.student.findUnique({ where: { enrollmentNumber: finalEnrollmentNumber } });
      let enrSuffix = 1;
      while (enrExisting) {
        finalEnrollmentNumber = `${enrollmentNumber}-${enrSuffix++}`;
        enrExisting = await tx.student.findUnique({ where: { enrollmentNumber: finalEnrollmentNumber } });
      }

      const user = await tx.user.create({
        data: {
          email: payload.email,
          passwordHash: '$2b$10$e8N/O8q7S1W4b1q2z3x4uOa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5', // default temp hash
          firstName: payload.firstName,
          lastName: payload.lastName,
          whatsAppNumber: payload.guardianWhatsAppNumber,
          userCategory: 'STUDENT',
          status: 'ACTIVE',
          activeRole: 'STUDENT',
        },
      });

      const std = await tx.student.create({
        data: {
          userId: user.id,
          campusId,
          admissionNumber: finalAdmissionNumber,
          enrollmentNumber: finalEnrollmentNumber,
          sectionId: payload.sectionId,
          departmentId: payload.departmentId || null,
          academicYearId: academicYearId || null,
          status: 'ACTIVE',
          guardians: {
            create: [
              {
                fullName: payload.guardianName,
                relationship: payload.guardianRelationship,
                phone: payload.guardianWhatsAppNumber,
                email: payload.guardianEmail || null,
                isPrimary: true,
              },
            ],
          },
        },
        include: {
          user: true,
          guardians: true,
          section: { include: { class: true } },
        },
      });

      return std;
    });

    await prisma.auditLog.create({
      data: {
        userId: creatorUserId,
        action: 'STUDENT_MASTER_CREATED',
        entityType: 'Student',
        entityId: student.id,
        afterState: JSON.stringify({ campusId: student.campusId, admissionNumber: student.admissionNumber, enrollmentNumber: student.enrollmentNumber, email: payload.email }),
      },
    });

    return student;
  }

  /**
   * 3. Student Status Management (Transitions e.g. ACTIVE -> LEFT_INSTITUTION)
   * Prevents future attendance and academic sessions without deleting historical data.
   */
  static async updateStudentStatus(
    operatorUserId: string,
    studentId: string,
    newStatus: string,
    reason: string
  ) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new AppError('Student not found.', 404);
    }

    const previousStatus = student.status;

    // Update status while preserving all historical records
    const updated = await prisma.$transaction(async (tx) => {
      const std = await tx.student.update({
        where: { id: studentId },
        data: { status: newStatus },
      });

      // Also update user account status if LEFT_INSTITUTION or SUSPENDED
      if (newStatus === 'LEFT_INSTITUTION' || newStatus === 'SUSPENDED') {
        await tx.user.update({
          where: { id: student.userId },
          data: { status: 'INACTIVE' },
        });
      }

      await tx.studentTransferLog.create({
        data: {
          studentId,
          fromStatus: previousStatus,
          toStatus: newStatus,
          transferType: 'STATUS_CHANGE',
          reason: reason || 'Office status update',
          transferredByUserId: operatorUserId,
        },
      });

      return std;
    });

    await prisma.auditLog.create({
      data: {
        userId: operatorUserId,
        action: 'STUDENT_STATUS_UPDATED',
        entityType: 'Student',
        entityId: studentId,
        beforeState: JSON.stringify({ status: previousStatus }),
        afterState: JSON.stringify({ status: newStatus, reason }),
      },
    });

    return updated;
  }

  /**
   * 4. Student Document Vault
   */
  static async uploadStudentDocument(
    operatorUserId: string,
    studentId: string,
    payload: { docType: string; title: string; fileUrl: string; fileSize?: number; mimeType?: string }
  ) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new AppError('Student not found.', 404);

    const doc = await prisma.studentDocument.create({
      data: {
        studentId,
        docType: payload.docType,
        title: payload.title,
        fileUrl: payload.fileUrl,
        fileSize: payload.fileSize || null,
        mimeType: payload.mimeType || null,
        uploadedByUserId: operatorUserId,
      },
    });

    return doc;
  }

  /**
   * 5. Record Payment & Generate Official Receipt
   */
  static async recordFeePayment(
    operatorUserId: string,
    payload: {
      studentId: string;
      studentFeeAssignmentId: string;
      amount: number;
      paymentMethod: string; // CASH, BANK_TRANSFER, ONLINE, CHEQUE
      transactionRef?: string;
      remarks?: string;
    }
  ) {
    const feeAssignment = await prisma.studentFeeAssignment.findUnique({
      where: { id: payload.studentFeeAssignmentId },
      include: { student: { include: { user: true } }, feeStructure: true },
    });

    if (!feeAssignment) {
      throw new AppError('Student fee assignment not found.', 404);
    }

    const newAmountPaid = feeAssignment.totalPaidAmount + payload.amount;
    const isPaidInFull = newAmountPaid >= feeAssignment.netPayableAmount;
    const newStatus = isPaidInFull ? 'PAID' : 'PARTIALLY_PAID';

    const transactionReference = payload.transactionRef || `TXN-REF-${Date.now()}`;
    const receiptNumber = `RCP-${Date.now()}`;
    const paymentNumber = `PAY-${Date.now()}`;

    const payment = await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const pm = await tx.payment.create({
        data: {
          paymentNumber,
          studentId: payload.studentId,
          feeAssignmentId: payload.studentFeeAssignmentId,
          academicYearId: feeAssignment.academicYearId,
          amount: payload.amount,
          paymentMethod: payload.paymentMethod,
          transactionReference,
          receivedByUserId: operatorUserId,
          status: 'SUCCESS',
        },
      });

      // 2. Update StudentFeeAssignment status
      await tx.studentFeeAssignment.update({
        where: { id: payload.studentFeeAssignmentId },
        data: {
          totalPaidAmount: newAmountPaid,
          status: newStatus,
        },
      });

      // 3. Issue Official Receipt
      const receipt = await tx.receipt.create({
        data: {
          receiptNumber,
          paymentId: pm.id,
          studentId: payload.studentId,
          amountPaid: payload.amount,
          totalAssigned: feeAssignment.netPayableAmount,
          totalRemainingBalance: Math.max(0, feeAssignment.netPayableAmount - newAmountPaid),
          issuedByUserId: operatorUserId,
        },
      });

      return { payment: pm, receipt };
    });

    await prisma.auditLog.create({
      data: {
        userId: operatorUserId,
        action: 'PAYMENT_RECORDED_AND_VERIFIED',
        entityType: 'Payment',
        entityId: payment.payment.id,
        afterState: JSON.stringify({ amount: payload.amount, receiptNumber, status: newStatus }),
      },
    });

    return payment;
  }
}
