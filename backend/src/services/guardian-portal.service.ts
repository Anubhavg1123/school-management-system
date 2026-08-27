import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class GuardianPortalService {
  /**
   * Get all linked children / wards for a logged-in parent user
   */
  static async getLinkedWards(parentUserId: string) {
    const parentUser = await prisma.user.findUnique({
      where: { id: parentUserId },
      select: { id: true, email: true, phone: true },
    });

    if (!parentUser) {
      throw new AppError('Parent user not found.', 404, 'USER_NOT_FOUND');
    }

    // 1. Explicit relationships in GuardianStudentRelationship table
    const explicitRels = await prisma.guardianStudentRelationship.findMany({
      where: {
        guardianUserId: parentUserId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: true,
            section: {
              include: {
                class: true,
              },
            },
            department: true,
            academicYear: true,
          },
        },
      },
    });

    // 2. Legacy / implicit relationships in Guardian table by phone or email
    const implicitGuardians = await prisma.guardian.findMany({
      where: {
        OR: [
          parentUser.email ? { email: parentUser.email } : {},
          parentUser.phone ? { phone: parentUser.phone } : {},
        ].filter((c) => Object.keys(c).length > 0),
      },
      include: {
        student: {
          include: {
            user: true,
            section: {
              include: {
                class: true,
              },
            },
            department: true,
            academicYear: true,
          },
        },
      },
    });

    // Combine & deduplicate linked students
    const studentMap = new Map<string, any>();

    explicitRels.forEach((rel: any) => {
      if (rel.student && rel.student.status !== 'LEFT_INSTITUTION') {
        studentMap.set(rel.student.id, {
          id: rel.student.id,
          fullName: `${rel.student.user.firstName} ${rel.student.user.lastName}`,
          admissionNumber: rel.student.admissionNumber,
          enrollmentNumber: rel.student.enrollmentNumber,
          className: rel.student.section?.class?.name || 'Unassigned',
          sectionName: rel.student.section?.name || 'Unassigned',
          relationship: rel.relationship,
          isPrimary: rel.isPrimary,
        });
      }
    });

    implicitGuardians.forEach((g: any) => {
      if (g.student && g.student.status !== 'LEFT_INSTITUTION' && !studentMap.has(g.student.id)) {
        studentMap.set(g.student.id, {
          id: g.student.id,
          fullName: `${g.student.user.firstName} ${g.student.user.lastName}`,
          admissionNumber: g.student.admissionNumber,
          enrollmentNumber: g.student.enrollmentNumber,
          className: g.student.section?.class?.name || 'Unassigned',
          sectionName: g.student.section?.name || 'Unassigned',
          relationship: g.relationship,
          isPrimary: g.isPrimary,
        });
      }
    });

    return Array.from(studentMap.values());
  }

  /**
   * Verify Server-Side Ownership: Parent MUST be authorized for targetStudentId
   */
  static async verifyGuardianWardOwnership(parentUserId: string, targetStudentId: string) {
    const wards = await this.getLinkedWards(parentUserId);
    const isLinked = wards.some((w) => w.id === targetStudentId);

    if (!isLinked) {
      throw new AppError(
        'Access Denied: You are not authorized to view or manage records for this student.',
        403,
        'GUARDIAN_WARD_ACCESS_DENIED'
      );
    }
    return true;
  }

  /**
   * Guardian Dashboard Overview
   */
  static async getDashboard(parentUserId: string, selectedStudentId?: string) {
    const wards = await this.getLinkedWards(parentUserId);

    if (wards.length === 0) {
      return {
        wards: [],
        activeWard: null,
        message: 'No linked student accounts found for your guardian profile.',
      };
    }

    let activeStudentId = selectedStudentId;
    if (activeStudentId) {
      await this.verifyGuardianWardOwnership(parentUserId, activeStudentId);
    } else {
      activeStudentId = wards[0].id;
    }

    const student = await prisma.student.findUnique({
      where: { id: activeStudentId },
      include: {
        user: true,
        section: {
          include: {
            class: true,
          },
        },
        department: true,
        academicYear: true,
      },
    });

    if (!student) {
      throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');
    }

    // Attendance
    const attendances = await prisma.studentAttendance.findMany({
      where: { studentId: activeStudentId },
    });
    const totalSessions = attendances.length;
    const presentSessions = attendances.filter((a: any) => a.status === 'PRESENT' || a.status === 'BYPASS_APPROVED').length;
    const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;

    const institutionSettings = await prisma.institutionSettings.findFirst();
    const requiredThreshold = institutionSettings?.attendanceThresholdPercent || 75;
    const isLowAttendance = attendancePercentage < requiredThreshold;

    // Published Results ONLY!
    const publishedResults = await prisma.studentResultSnapshot.findMany({
      where: {
        studentId: activeStudentId,
        status: 'PUBLISHED',
      },
      include: {
        examination: true,
        subjectDetails: true,
      },
      orderBy: { publishedDate: 'desc' },
    });

    // Fee Invoices (from StudentFeeAssignment or Payment)
    const feeAssignments = await prisma.studentFeeAssignment.findMany({
      where: { studentId: activeStudentId },
      include: { feeStructure: true },
    });
    const totalFeePayable = feeAssignments.reduce((acc: number, f: any) => acc + f.finalAmount, 0);
    const totalFeePaid = feeAssignments.reduce((acc: number, f: any) => acc + f.paidAmount, 0);
    const totalFeeOutstanding = feeAssignments.reduce((acc: number, f: any) => acc + f.dueAmount, 0);

    return {
      wards,
      activeWard: {
        id: student.id,
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        admissionNumber: student.admissionNumber,
        enrollmentNumber: student.enrollmentNumber,
        class: student.section?.class?.name || 'Unassigned',
        section: student.section?.name || 'Unassigned',
        department: student.department?.name || 'General',
        attendance: {
          totalSessions,
          presentSessions,
          attendancePercentage,
          requiredThreshold,
          isLowAttendance,
        },
        results: publishedResults.map((r: any) => ({
          id: r.id,
          examName: r.examination?.name,
          overallPercentage: r.overallPercentage,
          grade: r.grade,
          overallResult: r.overallResult,
          verificationToken: r.verificationToken,
          publishedDate: r.publishedDate,
        })),
        finance: {
          totalFeePayable,
          totalFeePaid,
          totalFeeOutstanding,
        },
      },
    };
  }

  /**
   * Get Ward Published Results
   */
  static async getWardResults(parentUserId: string, targetStudentId: string) {
    await this.verifyGuardianWardOwnership(parentUserId, targetStudentId);

    const publishedResults = await prisma.studentResultSnapshot.findMany({
      where: {
        studentId: targetStudentId,
        status: 'PUBLISHED',
      },
      include: {
        examination: true,
        subjectDetails: true,
      },
      orderBy: { publishedDate: 'desc' },
    });

    return publishedResults;
  }

  /**
   * Get Ward Fees & Payment History
   */
  static async getWardFees(parentUserId: string, targetStudentId: string) {
    await this.verifyGuardianWardOwnership(parentUserId, targetStudentId);

    const feeAssignments = await prisma.studentFeeAssignment.findMany({
      where: { studentId: targetStudentId },
      include: {
        feeStructure: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const payments = await prisma.payment.findMany({
      where: { studentId: targetStudentId },
      include: { receipt: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      feeAssignments,
      payments,
    };
  }

  /**
   * Save Guardian Communication Preferences
   */
  static async updatePreferences(parentUserId: string, preferences: { whatsAppEnabled?: boolean; emailEnabled?: boolean; inAppEnabled?: boolean; smsEnabled?: boolean }) {
    const pref = await prisma.guardianCommunicationPreference.upsert({
      where: { guardianUserId: parentUserId },
      update: { ...preferences },
      create: {
        guardianUserId: parentUserId,
        whatsAppEnabled: preferences.whatsAppEnabled ?? true,
        emailEnabled: preferences.emailEnabled ?? true,
        inAppEnabled: preferences.inAppEnabled ?? true,
        smsEnabled: preferences.smsEnabled ?? false,
      },
    });

    return pref;
  }
}
