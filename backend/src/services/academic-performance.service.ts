import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class AcademicPerformanceService {
  /**
   * 1. Student Academic Performance Trend Analytics
   */
  static async getStudentPerformanceTrend(studentId: string) {
    const snapshots = await prisma.studentResultSnapshot.findMany({
      where: { studentId, status: 'PUBLISHED' },
      include: { examination: true, subjectDetails: true },
      orderBy: { publishedDate: 'asc' },
    });

    if (snapshots.length === 0) {
      return { hasEnoughData: false, message: 'Not enough examination data to generate performance trend.' };
    }

    const examTrends = snapshots.map((s) => ({
      examName: s.examination.name,
      percentage: s.overallPercentage,
      grade: s.grade,
      result: s.overallResult,
      publishedDate: s.publishedDate,
    }));

    // Calculate strong and weak subjects across all published exams
    const subjectScores = new Map<string, { subjectName: string; totalPct: number; count: number }>();

    for (const s of snapshots) {
      for (const d of s.subjectDetails) {
        const pct = (d.obtainedMarks / (d.maxMarks || 100)) * 100;
        if (!subjectScores.has(d.subjectId)) {
          subjectScores.set(d.subjectId, { subjectName: d.subjectName, totalPct: 0, count: 0 });
        }
        const entry = subjectScores.get(d.subjectId)!;
        entry.totalPct += pct;
        entry.count += 1;
      }
    }

    const subjectAverages = Array.from(subjectScores.values()).map((s) => ({
      subjectName: s.subjectName,
      averagePercentage: Math.round((s.totalPct / s.count) * 10) / 10,
    }));

    subjectAverages.sort((a, b) => b.averagePercentage - a.averagePercentage);

    const strongSubjects = subjectAverages.filter((s) => s.averagePercentage >= 75);
    const weakSubjects = subjectAverages.filter((s) => s.averagePercentage < 60);

    return {
      hasEnoughData: true,
      examTrends,
      subjectAverages,
      strongSubjects,
      weakSubjects,
    };
  }

  /**
   * 2. Class-Level Performance Analytics
   */
  static async getClassPerformance(classId: string, examinationId?: string) {
    const where: any = {
      student: { section: { classId } },
      status: 'PUBLISHED',
    };
    if (examinationId) where.examinationId = examinationId;

    const snapshots = await prisma.studentResultSnapshot.findMany({
      where,
      include: { student: { include: { user: true } }, subjectDetails: true },
    });

    if (snapshots.length === 0) {
      return { totalStudents: 0, classAverage: 0, passPercentage: 0, gradeDistribution: {} };
    }

    const totalStudents = snapshots.length;
    const passedCount = snapshots.filter((s) => s.overallResult === 'PASS').length;
    const sumPercentage = snapshots.reduce((acc, s) => acc + s.overallPercentage, 0);

    const classAverage = Math.round((sumPercentage / totalStudents) * 10) / 10;
    const passPercentage = Math.round((passedCount / totalStudents) * 100);

    const gradeDistribution: Record<string, number> = {};
    for (const s of snapshots) {
      gradeDistribution[s.grade] = (gradeDistribution[s.grade] || 0) + 1;
    }

    return {
      totalStudents,
      classAverage,
      passPercentage,
      passedCount,
      failedCount: totalStudents - passedCount,
      gradeDistribution,
    };
  }
}
