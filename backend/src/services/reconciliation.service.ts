import { prisma } from '../prisma';

export class ReconciliationService {
  /**
   * Finance Reconciliation
   * Compares sum of verified payments vs recorded totalPaidAmount on each StudentFeeAssignment
   */
  static async getFinanceReconciliation() {
    const assignments = await prisma.studentFeeAssignment.findMany({
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        payments: {
          where: { status: 'SUCCESS' },
          select: { amount: true, paymentNumber: true, paymentDate: true },
        },
        feeStructure: { select: { name: true } },
      },
    });

    const discrepancies: Array<{
      feeAssignmentId: string;
      studentName: string;
      admissionNumber: string;
      feeTitle: string;
      recordedPaidAmount: number;
      actualVerifiedPayments: number;
      discrepancy: number;
      severity: 'OK' | 'MINOR' | 'CRITICAL';
    }> = [];

    let totalOk = 0;
    let totalDiscrepant = 0;

    for (const assignment of assignments) {
      const actualPaid = assignment.payments.reduce((sum, p) => sum + p.amount, 0);
      const recorded = assignment.totalPaidAmount;
      const diff = Math.abs(actualPaid - recorded);

      const studentName = assignment.student?.user
        ? `${assignment.student.user.firstName} ${assignment.student.user.lastName}`
        : 'Unknown';

      const severity = diff === 0 ? 'OK' : diff < 1 ? 'MINOR' : 'CRITICAL';

      if (severity !== 'OK') {
        totalDiscrepant++;
        discrepancies.push({
          feeAssignmentId: assignment.id,
          studentName,
          admissionNumber: assignment.student?.admissionNumber || '—',
          feeTitle: assignment.feeStructure?.name || 'Unknown',
          recordedPaidAmount: recorded,
          actualVerifiedPayments: actualPaid,
          discrepancy: diff,
          severity,
        });
      } else {
        totalOk++;
      }
    }

    return {
      summary: {
        totalAssignments: assignments.length,
        totalOk,
        totalDiscrepant,
        status: totalDiscrepant === 0 ? 'BALANCED' : 'DISCREPANCIES_FOUND',
      },
      discrepancies,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Enrollment Reconciliation
   * Finds active students without a current-year enrollment record
   */
  static async getEnrollmentReconciliation() {
    const activeAcademicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });

    const activeStudents = await prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        section: {
          include: { class: { include: { academicYear: true } } },
        },
      },
    });

    const unenrolled: Array<{
      studentId: string;
      admissionNumber: string;
      studentName: string;
      issue: string;
    }> = [];

    for (const student of activeStudents) {
      if (!student.sectionId || !student.section) {
        unenrolled.push({
          studentId: student.id,
          admissionNumber: student.admissionNumber,
          studentName: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown',
          issue: 'Active student has no class/section assigned.',
        });
      } else if (activeAcademicYear && student.section?.class?.academicYear?.id !== activeAcademicYear.id) {
        unenrolled.push({
          studentId: student.id,
          admissionNumber: student.admissionNumber,
          studentName: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown',
          issue: `Student enrolled in non-current academic year (${student.section?.class?.academicYear?.name || 'Unknown'}).`,
        });
      }
    }

    return {
      summary: {
        totalActiveStudents: activeStudents.length,
        enrolledOk: activeStudents.length - unenrolled.length,
        enrollmentIssues: unenrolled.length,
        activeAcademicYear: activeAcademicYear?.name || 'None',
        status: unenrolled.length === 0 ? 'ALL_ENROLLED' : 'ENROLLMENT_GAPS_FOUND',
      },
      issues: unenrolled,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Attendance Reconciliation
   * Finds attendance slots with no attendance records
   */
  static async getAttendanceReconciliation() {
    // Finalized slots with zero attendance records
    const slotsWithNoAttendance: any[] = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.date,
        s.status,
        s.sectionId,
        COUNT(a.id) as attendanceCount
      FROM AttendanceSlot s
      LEFT JOIN StudentAttendance a ON a.attendanceSlotId = s.id
      WHERE s.status = 'FINALIZED'
      GROUP BY s.id
      HAVING attendanceCount = 0
      LIMIT 50
    `;

    // Scheduled slots older than 7 days that were never submitted
    const staleScheduledSlots: any[] = await prisma.$queryRaw`
      SELECT id, date, sectionId, status
      FROM AttendanceSlot
      WHERE status = 'SCHEDULED'
        AND date < date('now', '-7 days')
      LIMIT 50
    `;

    return {
      summary: {
        finalizedSlotsWithNoRecords: slotsWithNoAttendance.length,
        staleScheduledSlots: staleScheduledSlots.length,
        status: slotsWithNoAttendance.length === 0 && staleScheduledSlots.length === 0
          ? 'ATTENDANCE_CONSISTENT'
          : 'ATTENDANCE_GAPS_FOUND',
      },
      finalizedSlotsWithNoRecords: slotsWithNoAttendance,
      staleScheduledSlots,
      generatedAt: new Date().toISOString(),
    };
  }
}
