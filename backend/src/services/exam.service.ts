import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateExamPayload {
  name: string;
  code?: string;
  examType?: string;
  academicYearId: string;
  term?: string;
  startDate: string;
  endDate: string;
  description?: string;
  classIds: string[];
}

export interface ScheduleExamSubjectPayload {
  examinationId: string;
  classId: string;
  subjectId: string;
  maxTheoryMarks?: number;
  maxPracticalMarks?: number;
  maxInternalMarks?: number;
  totalMaxMarks?: number;
  passingMarks?: number;
  weightage?: number;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  roomId?: string;
  invigilatorFacultyId?: string;
  instructions?: string;
}

export class ExamService {
  /**
   * 1. Create Examination Master
   */
  static async createExam(creatorUserId: string, payload: CreateExamPayload) {
    const code = payload.code || `EXAM-${Date.now()}`;

    const exam = await prisma.$transaction(async (tx) => {
      const ex = await tx.examination.create({
        data: {
          name: payload.name,
          code,
          examType: payload.examType || 'MID_TERM',
          academicYearId: payload.academicYearId,
          term: payload.term || 'SEM-1',
          startDate: new Date(payload.startDate),
          endDate: new Date(payload.endDate),
          description: payload.description || null,
          createdById: creatorUserId,
          status: 'DRAFT',
          classes: {
            create: payload.classIds.map((classId) => ({
              classId,
            })),
          },
        },
        include: { classes: { include: { class: true } } },
      });

      return ex;
    });

    await prisma.auditLog.create({
      data: {
        userId: creatorUserId,
        action: 'EXAM_CREATED',
        entityType: 'Examination',
        entityId: exam.id,
        afterState: JSON.stringify({ code: exam.code, name: exam.name }),
      },
    });

    return exam;
  }

  /**
   * 2. Schedule Exam Subject Paper with 4-Way Conflict Engine
   */
  static async scheduleExamSubject(operatorUserId: string, payload: ScheduleExamSubjectPayload) {
    const totalMaxMarks = payload.totalMaxMarks || ((payload.maxTheoryMarks || 80) + (payload.maxPracticalMarks || 0) + (payload.maxInternalMarks || 20));

    // 1. Room Double-Booking Conflict Check
    if (payload.roomId) {
      const roomConflict = await prisma.examinationSubject.findFirst({
        where: {
          roomId: payload.roomId,
          examDate: payload.examDate,
          OR: [
            {
              startTime: { lte: payload.startTime },
              endTime: { gte: payload.startTime },
            },
            {
              startTime: { lte: payload.endTime },
              endTime: { gte: payload.endTime },
            },
          ],
        },
        include: { room: true },
      });

      if (roomConflict) {
        throw new AppError(
          `Room Conflict: Room '${roomConflict.room?.name}' is already assigned to paper ID ${roomConflict.id} at ${payload.startTime}-${payload.endTime}.`,
          409,
          'ROOM_CONFLICT_DETECTED'
        );
      }
    }

    // 2. Invigilator Double-Booking Conflict Check
    if (payload.invigilatorFacultyId) {
      const invigilatorConflict = await prisma.examinationSubject.findFirst({
        where: {
          invigilatorFacultyId: payload.invigilatorFacultyId,
          examDate: payload.examDate,
          OR: [
            {
              startTime: { lte: payload.startTime },
              endTime: { gte: payload.startTime },
            },
            {
              startTime: { lte: payload.endTime },
              endTime: { gte: payload.endTime },
            },
          ],
        },
        include: { invigilatorFaculty: { include: { user: true } } },
      });

      if (invigilatorConflict) {
        const facName = `${invigilatorConflict.invigilatorFaculty?.user.firstName} ${invigilatorConflict.invigilatorFaculty?.user.lastName}`;
        throw new AppError(
          `Invigilator Conflict: Faculty '${facName}' is already invigilating an examination paper at ${payload.startTime}-${payload.endTime}.`,
          409,
          'INVIGILATOR_CONFLICT_DETECTED'
        );
      }
    }

    // 3. Class Paper Schedule Conflict Check
    const classConflict = await prisma.examinationSubject.findFirst({
      where: {
        examinationId: payload.examinationId,
        classId: payload.classId,
        examDate: payload.examDate,
        OR: [
          {
            startTime: { lte: payload.startTime },
            endTime: { gte: payload.startTime },
          },
        ],
      },
    });

    if (classConflict) {
      throw new AppError(
        `Class Schedule Conflict: Class already has an exam paper scheduled at ${payload.startTime} on ${payload.examDate}.`,
        409,
        'CLASS_SCHEDULE_CONFLICT'
      );
    }

    const scheduledPaper = await prisma.examinationSubject.upsert({
      where: {
        examinationId_classId_subjectId: {
          examinationId: payload.examinationId,
          classId: payload.classId,
          subjectId: payload.subjectId,
        },
      },
      update: {
        maxTheoryMarks: payload.maxTheoryMarks ?? 80,
        maxPracticalMarks: payload.maxPracticalMarks ?? 0,
        maxInternalMarks: payload.maxInternalMarks ?? 20,
        totalMaxMarks,
        passingMarks: payload.passingMarks ?? 40,
        weightage: payload.weightage ?? 1.0,
        examDate: payload.examDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        roomId: payload.roomId || null,
        invigilatorFacultyId: payload.invigilatorFacultyId || null,
        instructions: payload.instructions || null,
      },
      create: {
        examinationId: payload.examinationId,
        classId: payload.classId,
        subjectId: payload.subjectId,
        maxTheoryMarks: payload.maxTheoryMarks ?? 80,
        maxPracticalMarks: payload.maxPracticalMarks ?? 0,
        maxInternalMarks: payload.maxInternalMarks ?? 20,
        totalMaxMarks,
        passingMarks: payload.passingMarks ?? 40,
        weightage: payload.weightage ?? 1.0,
        examDate: payload.examDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        roomId: payload.roomId || null,
        invigilatorFacultyId: payload.invigilatorFacultyId || null,
        instructions: payload.instructions || null,
      },
      include: {
        examination: true,
        class: true,
        subject: true,
        room: true,
        invigilatorFaculty: { include: { user: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: operatorUserId,
        action: 'EXAM_SUBJECT_SCHEDULED',
        entityType: 'ExaminationSubject',
        entityId: scheduledPaper.id,
        afterState: JSON.stringify({ examDate: payload.examDate, startTime: payload.startTime }),
      },
    });

    return scheduledPaper;
  }

  /**
   * 3. Eligibility Resolution Engine (Incorporates Phase 6 Attendance %)
   */
  static async resolveExamEligibility(examinationId: string) {
    const exam = await prisma.examination.findUnique({
      where: { id: examinationId },
      include: { classes: true },
    });

    if (!exam) throw new AppError('Examination not found.', 404);

    const settings = await prisma.institutionSettings.findFirst();
    const thresholdPercent = settings?.attendanceThresholdPercent || 75.0;

    const classIds = exam.classes.map((c) => c.classId);

    // Fetch active students enrolled in target classes
    const students = await prisma.student.findMany({
      where: { section: { classId: { in: classIds } }, status: 'ACTIVE' },
      include: { studentAttendances: true },
    });

    const eligibilities = [];

    for (const std of students) {
      const totalSessions = std.studentAttendances.length;
      const attendedSessions = std.studentAttendances.filter(
        (a) => a.status === 'PRESENT' || a.status === 'ACADEMIC_BYPASS'
      ).length;

      const attendancePercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100;
      const isEligibleByAttendance = attendancePercentage >= thresholdPercent;

      const status = isEligibleByAttendance ? 'ELIGIBLE' : 'CONDITIONALLY_ELIGIBLE';

      const el = await prisma.examEligibility.upsert({
        where: {
          examinationId_studentId: {
            examinationId,
            studentId: std.id,
          },
        },
        update: {
          attendancePercentage,
          status,
        },
        create: {
          examinationId,
          studentId: std.id,
          attendancePercentage,
          status,
        },
      });

      eligibilities.push(el);
    }

    return eligibilities;
  }

  /**
   * 4. Record Paper Exam Attendance Roll-Call
   */
  static async recordExamAttendance(
    operatorUserId: string,
    examinationSubjectId: string,
    attendances: Array<{ studentId: string; status: string; seatNumber?: string }>
  ) {
    const records = [];
    for (const att of attendances) {
      const rec = await prisma.examAttendance.upsert({
        where: {
          examinationSubjectId_studentId: {
            examinationSubjectId,
            studentId: att.studentId,
          },
        },
        update: {
          status: att.status,
          seatNumber: att.seatNumber || null,
          markedByUserId: operatorUserId,
          markedAt: new Date(),
        },
        create: {
          examinationSubjectId,
          studentId: att.studentId,
          status: att.status,
          seatNumber: att.seatNumber || null,
          markedByUserId: operatorUserId,
        },
      });
      records.push(rec);
    }

    return records;
  }

  /**
   * 5. Update Examination Lifecycle Status
   */
  static async updateExamStatus(operatorUserId: string, examinationId: string, status: string) {
    const updated = await prisma.examination.update({
      where: { id: examinationId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: operatorUserId,
        action: 'EXAM_STATUS_UPDATED',
        entityType: 'Examination',
        entityId: examinationId,
        afterState: JSON.stringify({ status }),
      },
    });

    return updated;
  }
}
