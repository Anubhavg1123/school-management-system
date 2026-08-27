import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export interface UpdateInstitutionSettingsPayload {
  institutionName?: string;
  logoUrl?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  activeAcademicYearId?: string;
  attendanceThresholdPercent?: number;
  attendanceSubmissionWindowMins?: number;
  visitorMaxHoursAlert?: number;
  currencySymbol?: string;
  dateFormat?: string;
  timezone?: string;
}

export class InstitutionSettingsService {
  /**
   * 1. Get Institution Settings Singleton
   */
  static async getSettings() {
    let settings = await prisma.institutionSettings.findFirst({
      include: { activeAcademicYear: true },
    });

    if (!settings) {
      settings = await prisma.institutionSettings.create({
        data: {
          institutionName: 'St. Lawrence Educational Academy',
          address: '100 Campus Avenue, Knowledge City',
          contactPhone: '+91 98765 43210',
          contactEmail: 'principal@school.edu',
        },
        include: { activeAcademicYear: true },
      });
    }

    return settings;
  }

  /**
   * 2. Update Institution Settings
   */
  static async updateSettings(operatorUserId: string, payload: UpdateInstitutionSettingsPayload) {
    const existing = await this.getSettings();

    const updated = await prisma.institutionSettings.update({
      where: { id: existing.id },
      data: {
        ...payload,
        updatedAt: new Date(),
      },
      include: { activeAcademicYear: true },
    });

    // If activeAcademicYearId was updated, update isCurrent flag on AcademicYear
    if (payload.activeAcademicYearId) {
      await prisma.academicYear.updateMany({ data: { isCurrent: false } });
      await prisma.academicYear.update({
        where: { id: payload.activeAcademicYearId },
        data: { isCurrent: true },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: operatorUserId,
        action: 'INSTITUTION_SETTINGS_UPDATED',
        entityType: 'InstitutionSettings',
        entityId: updated.id,
        afterState: JSON.stringify(payload),
      },
    });

    return updated;
  }

  /**
   * 3. Year-End Student Batch Promotion (Class A -> Class B for New Academic Year)
   * Preserves historical class/attendance/fee records and creates new enrollment context.
   */
  static async promoteStudentsBatch(
    operatorUserId: string,
    payload: {
      fromAcademicYearId: string;
      toAcademicYearId: string;
      fromClassId: string;
      toClassId: string;
      remarks?: string;
    }
  ) {
    const fromClass = await prisma.class.findUnique({ where: { id: payload.fromClassId } });
    const toClass = await prisma.class.findUnique({ where: { id: payload.toClassId } });

    if (!fromClass || !toClass) {
      throw new AppError('From-Class or To-Class not found.', 404);
    }

    // Fetch active students in fromClass
    const studentsToPromote = await prisma.student.findMany({
      where: { section: { classId: payload.fromClassId }, status: 'ACTIVE' },
      include: { section: true },
    });

    if (studentsToPromote.length === 0) {
      throw new AppError(`No active students found in Class '${fromClass.name}' to promote.`, 400);
    }

    // Find default section in target class
    const targetSection = await prisma.section.findFirst({
      where: { classId: payload.toClassId },
    });

    if (!targetSection) {
      throw new AppError(`No target section configured in Class '${toClass.name}'.`, 400);
    }

    const promotion = await prisma.$transaction(async (tx) => {
      // 1. Batch update student class/section and academic year
      await tx.student.updateMany({
        where: { section: { classId: payload.fromClassId }, status: 'ACTIVE' },
        data: {
          sectionId: targetSection.id,
          academicYearId: payload.toAcademicYearId,
        },
      });

      // 2. Log Promotion History
      const promo = await tx.academicYearPromotion.create({
        data: {
          fromAcademicYearId: payload.fromAcademicYearId,
          toAcademicYearId: payload.toAcademicYearId,
          fromClassId: payload.fromClassId,
          toClassId: payload.toClassId,
          promotedByUserId: operatorUserId,
          studentCount: studentsToPromote.length,
          remarks: payload.remarks || `Batch promoted from ${fromClass.name} to ${toClass.name}`,
        },
      });

      return promo;
    });

    await prisma.auditLog.create({
      data: {
        userId: operatorUserId,
        action: 'BATCH_STUDENT_PROMOTION',
        entityType: 'AcademicYearPromotion',
        entityId: promotion.id,
        afterState: JSON.stringify({
          promotedCount: studentsToPromote.length,
          fromClass: fromClass.name,
          toClass: toClass.name,
        }),
      },
    });

    return {
      promotion,
      promotedStudentCount: studentsToPromote.length,
      fromClassName: fromClass.name,
      toClassName: toClass.name,
    };
  }
}
