import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { NotificationService } from './notification.service';
import crypto from 'crypto';

export class ResultEngineService {
  /**
   * 1. Seed Institutional Grade Scale Rules (if not existing)
   */
  static async seedGradeScale() {
    const defaultScales = [
      { gradeName: 'A+', minPercentage: 90.0, maxPercentage: 100.0, gradePoint: 10.0, passFailStatus: 'PASS', displayLabel: 'Outstanding' },
      { gradeName: 'A', minPercentage: 80.0, maxPercentage: 89.9, gradePoint: 9.0, passFailStatus: 'PASS', displayLabel: 'Excellent' },
      { gradeName: 'B+', minPercentage: 70.0, maxPercentage: 79.9, gradePoint: 8.0, passFailStatus: 'PASS', displayLabel: 'Very Good' },
      { gradeName: 'B', minPercentage: 60.0, maxPercentage: 69.9, gradePoint: 7.0, passFailStatus: 'PASS', displayLabel: 'Good' },
      { gradeName: 'C', minPercentage: 50.0, maxPercentage: 59.9, gradePoint: 6.0, passFailStatus: 'PASS', displayLabel: 'Above Average' },
      { gradeName: 'D', minPercentage: 40.0, maxPercentage: 49.9, gradePoint: 5.0, passFailStatus: 'PASS', displayLabel: 'Average / Pass' },
      { gradeName: 'F', minPercentage: 0.0, maxPercentage: 39.9, gradePoint: 0.0, passFailStatus: 'FAIL', displayLabel: 'Fail' },
    ];

    for (const scale of defaultScales) {
      await prisma.gradeScaleRule.upsert({
        where: { gradeName: scale.gradeName },
        update: scale,
        create: scale,
      });
    }
  }

  /**
   * 2. Grade Lookup Engine
   */
  static async calculateGrade(percentage: number) {
    await this.seedGradeScale();
    const rules = await prisma.gradeScaleRule.findMany({ orderBy: { minPercentage: 'desc' } });

    for (const r of rules) {
      if (percentage >= r.minPercentage) {
        return r;
      }
    }

    return { gradeName: 'F', gradePoint: 0.0, passFailStatus: 'FAIL', displayLabel: 'Fail' };
  }

  /**
   * 3. Centralized Result Calculation Engine & Immutable Result Versioning (v1, v2...)
   */
  static async calculateExamResults(operatorUserId: string, examinationId: string) {
    const exam = await prisma.examination.findUnique({
      where: { id: examinationId },
      include: { subjects: { include: { subject: true } } },
    });

    if (!exam) throw new AppError('Examination not found.', 404);

    // Fetch verified student marks for exam subjects
    const subjectIds = exam.subjects.map((s) => s.id);
    const allMarks = await prisma.studentMarks.findMany({
      where: { examinationSubjectId: { in: subjectIds } },
      include: { student: { include: { user: true } }, examinationSubject: { include: { subject: true } } },
    });

    // Group marks by studentId
    const studentMarksMap = new Map<string, typeof allMarks>();
    for (const m of allMarks) {
      if (!studentMarksMap.has(m.studentId)) studentMarksMap.set(m.studentId, []);
      studentMarksMap.get(m.studentId)!.push(m);
    }

    const calculatedSnapshots = [];

    for (const [studentId, marksList] of studentMarksMap.entries()) {
      let totalObtained = 0;
      let totalMax = 0;
      let hasFailedSubject = false;

      const subjectDetails: Array<{
        subjectId: string;
        subjectName: string;
        obtainedMarks: number;
        maxMarks: number;
        grade: string;
        passFailStatus: string;
      }> = [];

      for (const m of marksList) {
        totalObtained += m.totalObtainedMarks;
        totalMax += m.examinationSubject.totalMaxMarks;

        const isPass = m.totalObtainedMarks >= m.examinationSubject.passingMarks && !m.isAbsent;
        if (!isPass) hasFailedSubject = true;

        const subjectPct = (m.totalObtainedMarks / (m.examinationSubject.totalMaxMarks || 100)) * 100;
        const subjGrade = await this.calculateGrade(subjectPct);

        subjectDetails.push({
          subjectId: m.subjectId,
          subjectName: m.examinationSubject.subject.name,
          obtainedMarks: m.totalObtainedMarks,
          maxMarks: m.examinationSubject.totalMaxMarks,
          grade: subjGrade.gradeName,
          passFailStatus: isPass ? 'PASS' : 'FAIL',
        });
      }

      const overallPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 10000) / 100 : 0;
      const overallGradeRule = await this.calculateGrade(overallPercentage);
      const overallResult = hasFailedSubject ? 'FAIL' : 'PASS';

      // Check existing version count to create next immutable version (v1, v2)
      const existingSnapshots = await prisma.studentResultSnapshot.findMany({
        where: { examinationId, studentId },
        orderBy: { version: 'desc' },
      });

      const nextVersion = existingSnapshots.length > 0 ? existingSnapshots[0].version + 1 : 1;
      const verificationToken = `VRF-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const resultNumber = `RES-${Date.now()}-${studentId.slice(-4)}`;

      const snapshot = await prisma.$transaction(async (tx) => {
        const snap = await tx.studentResultSnapshot.create({
          data: {
            resultNumber,
            version: nextVersion,
            examinationId,
            studentId,
            totalObtainedMarks: totalObtained,
            totalMaxMarks: totalMax,
            overallPercentage,
            grade: overallGradeRule.gradeName,
            gradePoint: overallGradeRule.gradePoint,
            overallResult,
            verificationToken,
            status: 'CALCULATED',
            approvedByUserId: operatorUserId,
            subjectDetails: {
              create: subjectDetails,
            },
          },
          include: { subjectDetails: true, student: { include: { user: true } } },
        });

        return snap;
      });

      calculatedSnapshots.push(snapshot);
    }

    await prisma.examination.update({
      where: { id: examinationId },
      data: { status: 'RESULT_PROCESSING' },
    });

    await prisma.auditLog.create({
      data: {
        userId: operatorUserId,
        action: 'EXAM_RESULTS_CALCULATED',
        entityType: 'Examination',
        entityId: examinationId,
        afterState: JSON.stringify({ count: calculatedSnapshots.length }),
      },
    });

    return calculatedSnapshots;
  }

  /**
   * 4. Publish Results & Trigger Phase 10 Parent WhatsApp / In-App Notifications
   */
  static async publishExamResults(operatorUserId: string, examinationId: string) {
    const exam = await prisma.examination.findUnique({ where: { id: examinationId } });
    if (!exam) throw new AppError('Examination not found.', 404);

    // Update snapshots status to PUBLISHED
    await prisma.studentResultSnapshot.updateMany({
      where: { examinationId },
      data: { status: 'PUBLISHED', publishedDate: new Date() },
    });

    await prisma.examination.update({
      where: { id: examinationId },
      data: { status: 'PUBLISHED' },
    });

    // Fetch published student snapshots to dispatch Phase 10 notifications
    const snapshots = await prisma.studentResultSnapshot.findMany({
      where: { examinationId, status: 'PUBLISHED' },
      include: { student: { include: { user: true, guardians: true } } },
    });

    for (const snap of snapshots) {
      if (snap.student?.userId) {
        // Dispatch Notification Event
        await NotificationService.dispatchNotificationEvent({
          eventType: 'RESULT_PUBLISHED',
          payload: {
            title: `Result Published: ${exam.name}`,
            message: `Your examination result for ${exam.name} has been published. Overall Score: ${snap.overallPercentage}% (${snap.grade}).`,
            recipientUserId: snap.student.userId,
            targetType: 'STUDENT',
          },
          priority: 'HIGH',
          sourceModule: 'NOTICE',
          createdByUserId: operatorUserId,
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: operatorUserId,
        action: 'EXAM_RESULTS_PUBLISHED',
        entityType: 'Examination',
        entityId: examinationId,
        afterState: JSON.stringify({ publishedCount: snapshots.length }),
      },
    });

    return { publishedCount: snapshots.length, examName: exam.name };
  }

  /**
   * 5. Secure Student / Parent Result Access (Strict Draft Isolation)
   */
  static async getStudentResults(requesterUserId: string, requesterRole: string, studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { guardians: true },
    });

    if (!student) throw new AppError('Student not found.', 404);

    // Authorization check
    if (requesterRole === 'STUDENT' && student.userId !== requesterUserId) {
      throw new AppError('Authorization violation: Cannot view another student\'s result.', 403);
    }

    // Students & Guardians can ONLY view PUBLISHED results
    const where: any = { studentId };
    if (requesterRole === 'STUDENT' || requesterRole === 'PARENT') {
      where.status = 'PUBLISHED';
    }

    const results = await prisma.studentResultSnapshot.findMany({
      where,
      include: {
        examination: true,
        subjectDetails: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return results;
  }

  /**
   * 6. Verification Token Lookup for Public/Official QR Verification
   */
  static async verifyResultToken(verificationToken: string) {
    const result = await prisma.studentResultSnapshot.findUnique({
      where: { verificationToken },
      include: {
        examination: true,
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        subjectDetails: true,
      },
    });

    if (!result) throw new AppError('Invalid or expired result verification token.', 404);

    return {
      isValid: true,
      resultNumber: result.resultNumber,
      version: result.version,
      examinationName: result.examination.name,
      studentName: `${result.student.user.firstName} ${result.student.user.lastName}`,
      overallPercentage: result.overallPercentage,
      grade: result.grade,
      overallResult: result.overallResult,
      publishedDate: result.publishedDate,
    };
  }
}
