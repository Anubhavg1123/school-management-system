import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class StudentAttendanceService {
  // ----------------------------------------------------
  // 1. AUTOMATIC ATTENDANCE SLOT GENERATION FROM TIMETABLE
  // ----------------------------------------------------
  static async generateSlotsFromTimetable(dateStr?: string, academicYearId?: string, actorId?: string) {
    const targetDateStr = dateStr || new Date().toISOString().split('T')[0];
    const dateObj = new Date(targetDateStr);
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = dayNames[dateObj.getDay()];

    // Find active academic year
    let activeYearId = academicYearId;
    if (!activeYearId) {
      const currentYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
      if (!currentYear) {
        throw new AppError('No active academic year found for attendance slot generation.', 400, 'NO_ACTIVE_ACADEMIC_YEAR');
      }
      activeYearId = currentYear.id;
    }

    // Fetch all active timetable entries for this day of week
    const entries = await prisma.timetableEntry.findMany({
      where: {
        academicYearId: activeYearId,
        dayOfWeek,
        status: 'ACTIVE',
        subjectId: { not: null },
      },
      include: {
        timeSlot: true,
        class: true,
        section: true,
        subject: true,
        faculty: { include: { user: true } },
      },
    });

    const generatedSlots = [];

    for (const entry of entries) {
      if (!entry.subjectId) continue;

      // Check if substitute faculty assignment exists for this date and time slot
      let assignedFacultyId = entry.facultyId;
      const substitute = await prisma.substituteFacultyAssignment.findFirst({
        where: {
          date: targetDateStr,
          timeSlotId: entry.timeSlotId,
          classId: entry.classId,
          sectionId: entry.sectionId,
          status: 'CONFIRMED',
        },
      });
      if (substitute) {
        assignedFacultyId = substitute.substituteFacultyId;
      }
      if (!assignedFacultyId) continue;

      // Idempotent creation/upsert
      const slot = await prisma.attendanceSlot.upsert({
        where: {
          academicYearId_classId_sectionId_subjectId_date_timeSlotId: {
            academicYearId: activeYearId,
            classId: entry.classId,
            sectionId: entry.sectionId,
            subjectId: entry.subjectId,
            date: targetDateStr,
            timeSlotId: entry.timeSlotId,
          },
        },
        update: {
          facultyId: assignedFacultyId,
        },
        create: {
          academicYearId: activeYearId,
          date: targetDateStr,
          classId: entry.classId,
          sectionId: entry.sectionId,
          subjectId: entry.subjectId,
          facultyId: assignedFacultyId,
          timeSlotId: entry.timeSlotId,
          startTime: entry.timeSlot.startTime,
          endTime: entry.timeSlot.endTime,
          timetableEntryId: entry.id,
          status: 'OPEN',
          source: 'AUTOMATIC',
          createdByUserId: actorId || null,
        },
      });

      generatedSlots.push(slot);
    }

    if (actorId && generatedSlots.length > 0) {
      await AuditService.log({
        userId: actorId,
        action: 'ATTENDANCE_SLOTS_GENERATED',
        entityType: 'AttendanceSlot',
        afterState: { date: targetDateStr, dayOfWeek, count: generatedSlots.length },
      });
    }

    return { date: targetDateStr, dayOfWeek, generatedCount: generatedSlots.length, slots: generatedSlots };
  }

  // ----------------------------------------------------
  // 2. EXTRA-CLASS ATTENDANCE SLOT CREATION
  // ----------------------------------------------------
  static async createExtraClassSlot(extraClassRequestId: string, actorId: string) {
    const request = await prisma.extraClassRequest.findUnique({
      where: { id: extraClassRequestId },
      include: {
        class: true,
        section: true,
        subject: true,
        faculty: true,
        timeSlot: true,
      },
    });

    if (!request) {
      throw new AppError('Extra class request not found.', 404, 'EXTRA_CLASS_NOT_FOUND');
    }

    // Check system setting for unapproved extra classes
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'allow_extra_class_unapproved_attendance' },
    });
    const allowUnapproved = setting?.value === 'true';

    if (request.status !== 'APPROVED' && !allowUnapproved) {
      throw new AppError('Cannot create attendance slot for an unapproved extra class.', 400, 'UNAPPROVED_EXTRA_CLASS');
    }

    // Idempotent slot creation
    const slot = await prisma.attendanceSlot.create({
      data: {
        academicYearId: request.academicYearId,
        date: request.date,
        classId: request.classId,
        sectionId: request.sectionId,
        subjectId: request.subjectId,
        facultyId: request.facultyId,
        timeSlotId: request.timeSlotId || null,
        startTime: request.startTime,
        endTime: request.endTime,
        extraClassRequestId: request.id,
        status: 'OPEN',
        source: 'EXTRA_CLASS',
        createdByUserId: actorId,
      },
      include: {
        class: true,
        section: true,
        subject: true,
        faculty: { include: { user: true } },
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'EXTRA_CLASS_ATTENDANCE_SLOT_CREATED',
      entityType: 'AttendanceSlot',
      entityId: slot.id,
      afterState: slot,
    });

    return slot;
  }

  // ----------------------------------------------------
  // 3. GET ATTENDANCE SLOTS (WITH SCOPING)
  // ----------------------------------------------------
  static async getAttendanceSlots(filters: {
    date?: string;
    classId?: string;
    sectionId?: string;
    facultyId?: string;
    departmentId?: string;
    academicYearId?: string;
    status?: string;
  }) {
    const where: any = {};
    if (filters.date) where.date = filters.date;
    if (filters.classId) where.classId = filters.classId;
    if (filters.sectionId) where.sectionId = filters.sectionId;
    if (filters.facultyId) where.facultyId = filters.facultyId;
    if (filters.status) where.status = filters.status;
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.departmentId) {
      where.class = { departmentId: filters.departmentId };
    }

    return prisma.attendanceSlot.findMany({
      where,
      include: {
        class: true,
        section: true,
        subject: true,
        faculty: { include: { user: true } },
        timeSlot: true,
        _count: { select: { studentAttendances: true } },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    });
  }

  // ----------------------------------------------------
  // 4. GET SLOT DETAILS & ENROLLED STUDENT ROSTER
  // ----------------------------------------------------
  static async getSlotDetails(slotId: string, userCtx: { id: string; activeRole: string; departmentId?: string }) {
    const slot = await prisma.attendanceSlot.findUnique({
      where: { id: slotId },
      include: {
        class: { include: { department: true } },
        section: true,
        subject: true,
        faculty: { include: { user: true } },
        timeSlot: true,
        timetableEntry: true,
        extraClassRequest: true,
      },
    });

    if (!slot) {
      throw new AppError('Attendance slot not found.', 404, 'SLOT_NOT_FOUND');
    }

    // Role-based authorization check
    if (userCtx.activeRole === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({ where: { userId: userCtx.id } });
      if (faculty && slot.facultyId !== faculty.id) {
        // Check if user is a substitute faculty for this slot
        const substitute = await prisma.substituteFacultyAssignment.findFirst({
          where: {
            date: slot.date,
            timeSlotId: slot.timeSlotId || undefined,
            classId: slot.classId,
            sectionId: slot.sectionId,
            substituteFacultyId: faculty.id,
            status: 'CONFIRMED',
          },
        });
        if (!substitute) {
          throw new AppError('Authorization violation: You are not assigned to teach or substitute this class session.', 403, 'UNAUTHORIZED_SESSION');
        }
      }
    } else if (userCtx.activeRole === 'HOD' && userCtx.departmentId) {
      if (slot.class.departmentId && slot.class.departmentId !== userCtx.departmentId) {
        throw new AppError('Department authorization violation: Cannot access attendance sessions outside your department.', 403, 'DEPARTMENT_AUTHORIZATION_VIOLATION');
      }
    }

    // Fetch active students belonging to this class section
    const students = await prisma.student.findMany({
      where: {
        sectionId: slot.sectionId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            whatsAppNumber: true,
          },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    // Fetch recorded student attendances for this slot
    const existingAttendances = await prisma.studentAttendance.findMany({
      where: { attendanceSlotId: slotId },
      include: { corrections: { orderBy: { createdAt: 'desc' } } },
    });

    // Fetch active approved bypass requests for this date
    const bypasses = await prisma.academicBypassRequest.findMany({
      where: {
        date: slot.date,
        status: 'APPROVED',
      },
    });

    const attendanceMap = new Map(existingAttendances.map((a) => [a.studentId, a]));
    const bypassMap = new Map(bypasses.map((b) => [b.studentId, b]));

    const roster = students.map((std) => {
      const record = attendanceMap.get(std.id);
      const bypass = bypassMap.get(std.id);

      return {
        studentId: std.id,
        userId: std.userId,
        admissionNumber: std.admissionNumber,
        enrollmentNumber: std.enrollmentNumber,
        rollNumber: std.rollNumber,
        firstName: std.user.firstName,
        lastName: std.user.lastName,
        email: std.user.email,
        whatsAppNumber: std.user.whatsAppNumber,
        photoUrl: std.photoUrl,
        status: record ? record.status : (bypass ? 'ACADEMIC_BYPASS' : 'PRESENT'),
        remarks: record ? record.remarks : (bypass ? `Academic Bypass: ${bypass.activityName}` : null),
        hasBypass: !!bypass,
        bypassActivity: bypass ? bypass.activityName : null,
        recordId: record ? record.id : null,
        corrections: record ? record.corrections : [],
      };
    });

    return {
      slot,
      totalStudents: roster.length,
      isFinalized: slot.status === 'FINALIZED',
      isSubmitted: slot.status === 'SUBMITTED' || slot.status === 'FINALIZED',
      roster,
    };
  }

  // ----------------------------------------------------
  // 5. TRANSACTIONAL STUDENT ATTENDANCE SUBMISSION
  // ----------------------------------------------------
  static async submitStudentAttendance(
    data: {
      slotId: string;
      studentRecords: Array<{ studentId: string; status: string; remarks?: string }>;
      isFinalize?: boolean;
    },
    userCtx: { id: string; activeRole: string; departmentId?: string },
    ipAddress?: string
  ) {
    const slot = await prisma.attendanceSlot.findUnique({
      where: { id: data.slotId },
      include: { class: true, section: true, subject: true, faculty: true },
    });

    if (!slot) {
      throw new AppError('Attendance slot not found.', 404, 'SLOT_NOT_FOUND');
    }

    if (slot.status === 'FINALIZED') {
      throw new AppError('Attendance session is already finalized and locked. Edits must use the correction workflow.', 400, 'SLOT_FINALIZED');
    }

    // Role-based authorization check
    if (userCtx.activeRole === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({ where: { userId: userCtx.id } });
      if (!faculty) {
        throw new AppError('Faculty profile not found.', 403, 'FACULTY_NOT_FOUND');
      }
      if (slot.facultyId !== faculty.id) {
        const substitute = await prisma.substituteFacultyAssignment.findFirst({
          where: {
            date: slot.date,
            timeSlotId: slot.timeSlotId || undefined,
            classId: slot.classId,
            sectionId: slot.sectionId,
            substituteFacultyId: faculty.id,
            status: 'CONFIRMED',
          },
        });
        if (!substitute) {
          throw new AppError('Unauthorized: You are not assigned to take attendance for this session.', 403, 'UNAUTHORIZED_FACULTY');
        }
      }
    } else if (userCtx.activeRole === 'HOD' && userCtx.departmentId) {
      if (slot.class.departmentId && slot.class.departmentId !== userCtx.departmentId) {
        throw new AppError('Department authorization violation: Cannot submit attendance for another department.', 403, 'DEPARTMENT_AUTHORIZATION_VIOLATION');
      }
    }

    // Check submission window setting
    const windowSetting = await prisma.systemSetting.findUnique({
      where: { key: 'attendance_submission_window_minutes' },
    });
    const windowMinutes = windowSetting ? parseInt(windowSetting.value, 10) : 120;

    // Check for submission delay anomaly
    const now = new Date();
    const slotEndTimeStr = `${slot.date}T${slot.endTime}:00`;
    const slotEndTime = new Date(slotEndTimeStr);

    if (!isNaN(slotEndTime.getTime())) {
      const diffMinutes = (now.getTime() - slotEndTime.getTime()) / (1000 * 60);
      if (diffMinutes > windowMinutes) {
        // Record attendance anomaly
        await prisma.attendanceAnomaly.create({
          data: {
            type: 'DELAYED_SUBMISSION',
            description: `Attendance submitted ${Math.round(diffMinutes)} minutes after class end time (Window: ${windowMinutes} mins).`,
            entityType: 'AttendanceSlot',
            entityId: slot.id,
            userId: userCtx.id,
          },
        });
      }
    }

    // Execute in database transaction to ensure atomicity
    const newStatus = data.isFinalize ? 'FINALIZED' : 'SUBMITTED';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update slot status
      await tx.attendanceSlot.update({
        where: { id: data.slotId },
        data: {
          status: newStatus,
          submissionDeadline: new Date(Date.now() + windowMinutes * 60 * 1000),
        },
      });

      const records = [];
      const absentEvents = [];

      for (const stdRec of data.studentRecords) {
        if (stdRec.status !== 'PRESENT' && stdRec.status !== 'ABSENT') {
          throw new AppError(
            `Invalid attendance status '${stdRec.status}'. Normal faculty roll call only allows PRESENT or ABSENT.`,
            400,
            'INVALID_ATTENDANCE_STATUS'
          );
        }

        // Upsert student attendance
        const item = await tx.studentAttendance.upsert({
          where: {
            attendanceSlotId_studentId: {
              attendanceSlotId: data.slotId,
              studentId: stdRec.studentId,
            },
          },
          update: {
            status: stdRec.status,
            remarks: stdRec.remarks || null,
            markedByUserId: userCtx.id,
          },
          create: {
            attendanceSlotId: data.slotId,
            studentId: stdRec.studentId,
            status: stdRec.status,
            remarks: stdRec.remarks || null,
            markedByUserId: userCtx.id,
          },
        });

        records.push(item);

        if (stdRec.status === 'ABSENT') {
          absentEvents.push(stdRec.studentId);
        }
      }

      return { slotStatus: newStatus, savedCount: records.length, absentCount: absentEvents.length };
    });

    await AuditService.log({
      userId: userCtx.id,
      action: data.isFinalize ? 'STUDENT_ATTENDANCE_FINALIZED' : 'STUDENT_ATTENDANCE_SUBMITTED',
      entityType: 'AttendanceSlot',
      entityId: slot.id,
      afterState: { status: newStatus, count: result.savedCount },
      ipAddress,
    });

    return {
      message: `Attendance successfully ${data.isFinalize ? 'finalized' : 'submitted'}.`,
      result,
    };
  }

  // ----------------------------------------------------
  // 6. STUDENT ATTENDANCE CORRECTION WORKFLOW
  // ----------------------------------------------------
  static async requestStudentAttendanceCorrection(
    data: {
      studentAttendanceId: string;
      proposedStatus: string;
      reason: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    const stdAtt = await prisma.studentAttendance.findUnique({
      where: { id: data.studentAttendanceId },
      include: { attendanceSlot: true, student: { include: { user: true } } },
    });

    if (!stdAtt) {
      throw new AppError('Student attendance record not found.', 404, 'RECORD_NOT_FOUND');
    }

    const correction = await prisma.studentAttendanceCorrection.create({
      data: {
        studentAttendanceId: data.studentAttendanceId,
        requestedByUserId: actorId,
        originalStatus: stdAtt.status,
        proposedStatus: data.proposedStatus,
        reason: data.reason,
        status: 'PENDING',
      },
      include: {
        studentAttendance: { include: { student: { include: { user: true } } } },
        requestedBy: true,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'STUDENT_ATTENDANCE_CORRECTION_REQUESTED',
      entityType: 'StudentAttendanceCorrection',
      entityId: correction.id,
      afterState: correction,
      ipAddress,
    });

    return correction;
  }

  static async reviewStudentAttendanceCorrection(
    data: {
      correctionId: string;
      action: 'APPROVED' | 'REJECTED';
      reviewNotes?: string;
    },
    reviewerId: string,
    reviewerRole: string,
    reviewerDeptId?: string,
    ipAddress?: string
  ) {
    const correction = await prisma.studentAttendanceCorrection.findUnique({
      where: { id: data.correctionId },
      include: {
        studentAttendance: {
          include: {
            attendanceSlot: {
              include: { class: true },
            },
          },
        },
      },
    });

    if (!correction) {
      throw new AppError('Correction request not found.', 404, 'CORRECTION_NOT_FOUND');
    }

    if (correction.status !== 'PENDING') {
      throw new AppError(`Correction request is already ${correction.status.toLowerCase()}.`, 400, 'ALREADY_REVIEWED');
    }

    // Scoped authorization
    if (reviewerRole === 'HOD' && reviewerDeptId) {
      if (correction.studentAttendance.attendanceSlot.class.departmentId && correction.studentAttendance.attendanceSlot.class.departmentId !== reviewerDeptId) {
        throw new AppError('Department authorization violation: Cannot review corrections outside your department.', 403, 'DEPARTMENT_AUTHORIZATION_VIOLATION');
      }
    }

    const updatedCorrection = await prisma.$transaction(async (tx) => {
      const reviewed = await tx.studentAttendanceCorrection.update({
        where: { id: data.correctionId },
        data: {
          status: data.action,
          reviewedByUserId: reviewerId,
          reviewedAt: new Date(),
          reviewNotes: data.reviewNotes || null,
        },
      });

      if (data.action === 'APPROVED') {
        // Update authoritative attendance record
        await tx.studentAttendance.update({
          where: { id: correction.studentAttendanceId },
          data: {
            status: correction.proposedStatus,
            remarks: `Corrected via Petition ${correction.id} (Reason: ${correction.reason})`,
          },
        });
      }

      return reviewed;
    });

    await AuditService.log({
      userId: reviewerId,
      action: `STUDENT_ATTENDANCE_CORRECTION_${data.action}`,
      entityType: 'StudentAttendanceCorrection',
      entityId: data.correctionId,
      beforeState: { status: correction.originalStatus },
      afterState: { status: data.action, proposedStatus: correction.proposedStatus },
      ipAddress,
    });

    return updatedCorrection;
  }

  // ----------------------------------------------------
  // 7. CLASS COORDINATOR SCHOOL ACTIVITY / ACADEMIC BYPASS WORKFLOW
  // ----------------------------------------------------
  static async applySchoolActivityBypass(
    data: {
      studentId: string;
      attendanceSlotId?: string;
      date: string;
      activityType: string;
      reason: string;
    },
    userCtx: { id: string; activeRole: string; departmentId?: string },
    ipAddress?: string
  ) {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { section: { include: { class: true } } },
    });

    if (!student) {
      throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const validActivities = [
      'SPORTS',
      'ACADEMIC_EVENT',
      'SCHOOL_EVENT',
      'COMPETITION',
      'OFFICIAL_SCHOOL_ACTIVITY',
      'OTHER_SCHOOL_APPROVED_ACTIVITY',
    ];

    if (!validActivities.includes(data.activityType)) {
      throw new AppError(
        `Invalid activity type '${data.activityType}'. Allowed: ${validActivities.join(', ')}`,
        400,
        'INVALID_ACTIVITY_TYPE'
      );
    }

    const trimmedReason = (data.reason || '').trim();
    if (trimmedReason.length < 5) {
      throw new AppError(
        'A mandatory explanation (at least 5 characters) must be provided for school activity bypass.',
        400,
        'EMPTY_BYPASS_REASON'
      );
    }

    // Disallow casual or personal excuses
    const forbiddenCasualRegex = /^\s*(personal|casual|unknown|personal\s+work|casual\s+leave|personal\s+reason)\s*$/i;
    if (forbiddenCasualRegex.test(trimmedReason)) {
      throw new AppError(
        'Bypass requires a legitimate institution-approved academic/school activity reason. Personal or casual reasons are not permitted.',
        400,
        'INVALID_BYPASS_REASON'
      );
    }

    // Role & Assignment Authorization Check
    if (userCtx.activeRole === 'SUPER_ADMIN' || userCtx.activeRole === 'OFFICE_ADMIN') {
      // Super Admin and Office Admin have institutional administrative authority
    } else if (userCtx.activeRole === 'HOD') {
      if (student.departmentId && userCtx.departmentId && student.departmentId !== userCtx.departmentId) {
        throw new AppError(
          'Department authorization violation: Cannot apply bypass for students outside your department.',
          403,
          'DEPARTMENT_AUTHORIZATION_VIOLATION'
        );
      }
    } else if (userCtx.activeRole === 'FACULTY') {
      const faculty = await prisma.faculty.findUnique({ where: { userId: userCtx.id } });
      if (!faculty) {
        throw new AppError('Faculty profile not found for authenticated user.', 403, 'FACULTY_NOT_FOUND');
      }

      if (!student.sectionId) {
        throw new AppError('Student is not enrolled in any class section.', 400, 'NO_STUDENT_SECTION');
      }

      const section = await prisma.section.findUnique({ where: { id: student.sectionId } });
      if (!section || section.coordinatorFacultyId !== faculty.id) {
        throw new AppError(
          'Authorization violation: Only the assigned Class Coordinator of this section or higher administrator can apply school activity bypass.',
          403,
          'COORDINATOR_AUTHORIZATION_REQUIRED'
        );
      }
    } else {
      throw new AppError(
        'Access Denied: You do not have permission to apply school activity attendance bypass.',
        403,
        'FORBIDDEN'
      );
    }

    // Apply bypass in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create approved bypass record
      const bypassRecord = await tx.academicBypassRequest.create({
        data: {
          studentId: data.studentId,
          attendanceSlotId: data.attendanceSlotId || null,
          date: data.date,
          activityName: data.activityType,
          reason: trimmedReason,
          status: 'APPROVED',
          requestedByUserId: userCtx.id,
          approvedByUserId: userCtx.id,
        },
        include: {
          student: { include: { user: true } },
        },
      });

      // 2. If attendanceSlotId is provided, mark/update student attendance
      let attendanceRecord = null;
      if (data.attendanceSlotId) {
        attendanceRecord = await tx.studentAttendance.upsert({
          where: {
            attendanceSlotId_studentId: {
              attendanceSlotId: data.attendanceSlotId,
              studentId: data.studentId,
            },
          },
          update: {
            status: 'PRESENT',
            remarks: `[School Activity Bypass: ${data.activityType}] ${trimmedReason}`,
            markedByUserId: userCtx.id,
          },
          create: {
            attendanceSlotId: data.attendanceSlotId,
            studentId: data.studentId,
            status: 'PRESENT',
            remarks: `[School Activity Bypass: ${data.activityType}] ${trimmedReason}`,
            markedByUserId: userCtx.id,
          },
        });
      }

      return { bypassRecord, attendanceRecord };
    });

    await AuditService.log({
      userId: userCtx.id,
      action: 'CLASS_COORDINATOR_SCHOOL_ACTIVITY_BYPASS',
      entityType: 'AcademicBypassRequest',
      entityId: result.bypassRecord.id,
      afterState: {
        studentId: data.studentId,
        activityType: data.activityType,
        reason: trimmedReason,
        attendanceSlotId: data.attendanceSlotId,
        date: data.date,
      },
      ipAddress,
    });

    return {
      message: 'School activity attendance bypass applied successfully.',
      bypass: result.bypassRecord,
      attendance: result.attendanceRecord,
    };
  }

  // ----------------------------------------------------
  // 8. ACADEMIC BYPASS REQUEST WORKFLOW
  // ----------------------------------------------------
  static async requestAcademicBypass(
    data: {
      studentId: string;
      attendanceSlotId?: string;
      date: string;
      activityName: string;
      reason: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    const student = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) {
      throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const bypass = await prisma.academicBypassRequest.create({
      data: {
        studentId: data.studentId,
        attendanceSlotId: data.attendanceSlotId || null,
        date: data.date,
        activityName: data.activityName,
        reason: data.reason,
        status: 'PENDING',
        requestedByUserId: actorId,
      },
      include: {
        student: { include: { user: true } },
        requestedBy: true,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'ACADEMIC_BYPASS_REQUESTED',
      entityType: 'AcademicBypassRequest',
      entityId: bypass.id,
      afterState: bypass,
      ipAddress,
    });

    return bypass;
  }

  static async reviewAcademicBypass(
    data: {
      bypassId: string;
      action: 'APPROVED' | 'REJECTED';
    },
    reviewerId: string,
    ipAddress?: string
  ) {
    const bypass = await prisma.academicBypassRequest.findUnique({ where: { id: data.bypassId } });
    if (!bypass) {
      throw new AppError('Academic bypass request not found.', 404, 'BYPASS_NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.academicBypassRequest.update({
        where: { id: data.bypassId },
        data: {
          status: data.action,
          approvedByUserId: reviewerId,
        },
      });

      if (data.action === 'APPROVED' && bypass.attendanceSlotId) {
        // Automatically mark/update student attendance as ACADEMIC_BYPASS
        await tx.studentAttendance.upsert({
          where: {
            attendanceSlotId_studentId: {
              attendanceSlotId: bypass.attendanceSlotId,
              studentId: bypass.studentId,
            },
          },
          update: {
            status: 'ACADEMIC_BYPASS',
            remarks: `Approved Academic Bypass: ${bypass.activityName}`,
            markedByUserId: reviewerId,
          },
          create: {
            attendanceSlotId: bypass.attendanceSlotId,
            studentId: bypass.studentId,
            status: 'ACADEMIC_BYPASS',
            remarks: `Approved Academic Bypass: ${bypass.activityName}`,
            markedByUserId: reviewerId,
          },
        });
      }

      return record;
    });

    await AuditService.log({
      userId: reviewerId,
      action: `ACADEMIC_BYPASS_${data.action}`,
      entityType: 'AcademicBypassRequest',
      entityId: data.bypassId,
      afterState: updated,
      ipAddress,
    });

    return updated;
  }

  // ----------------------------------------------------
  // 8. STUDENT ATTENDANCE HISTORY & LOW ATTENDANCE CALCULATION
  // ----------------------------------------------------
  static async getStudentAttendanceHistory(studentId: string, academicYearId?: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        section: { include: { class: true } },
        department: true,
      },
    });

    if (!student) {
      throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const whereSlot: any = {};
    if (academicYearId) whereSlot.academicYearId = academicYearId;

    const attendances = await prisma.studentAttendance.findMany({
      where: {
        studentId,
        attendanceSlot: whereSlot,
      },
      include: {
        attendanceSlot: {
          include: {
            subject: true,
            class: true,
            section: true,
            faculty: { include: { user: true } },
            timeSlot: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let present = 0;
    let late = 0;
    let excused = 0;
    let bypass = 0;
    let absent = 0;

    const subjectMap = new Map<string, { subject: any; total: number; present: number; percentage: number }>();

    for (const a of attendances) {
      const subId = a.attendanceSlot.subjectId;
      if (!subjectMap.has(subId)) {
        subjectMap.set(subId, {
          subject: a.attendanceSlot.subject,
          total: 0,
          present: 0,
          percentage: 0,
        });
      }

      const subStats = subjectMap.get(subId)!;
      subStats.total += 1;

      if (a.status === 'PRESENT') {
        present += 1;
        subStats.present += 1;
      } else if (a.status === 'LATE') {
        late += 1;
        subStats.present += 1;
      } else if (a.status === 'EXCUSED') {
        excused += 1;
        subStats.present += 1;
      } else if (a.status === 'ACADEMIC_BYPASS') {
        bypass += 1;
        subStats.present += 1;
      } else if (a.status === 'ABSENT') {
        absent += 1;
      }
    }

    const totalEligible = attendances.length;
    const totalPresentEligible = present + late + excused + bypass;
    const overallPercentage = totalEligible > 0 ? Number(((totalPresentEligible / totalEligible) * 100).toFixed(2)) : 100;

    // Fetch minimum required percentage from system setting
    const thresholdSetting = await prisma.systemSetting.findUnique({
      where: { key: 'minimum_required_attendance_percentage' },
    });
    const minimumThreshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 75.0;

    // Calculate subject-wise percentages
    const subjectBreakdown = Array.from(subjectMap.values()).map((s) => ({
      ...s,
      percentage: s.total > 0 ? Number(((s.present / s.total) * 100).toFixed(2)) : 100,
      isLow: s.total > 0 && (s.present / s.total) * 100 < minimumThreshold,
    }));

    return {
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        class: student.section?.class.name,
        section: student.section?.name,
        department: student.department?.name,
      },
      stats: {
        totalSessions: totalEligible,
        presentCount: present,
        lateCount: late,
        excusedCount: excused,
        academicBypassCount: bypass,
        absentCount: absent,
        overallPercentage,
        minimumThreshold,
        isLowAttendance: overallPercentage < minimumThreshold,
      },
      subjectBreakdown,
      records: attendances,
    };
  }

  // ----------------------------------------------------
  // 9. DAILY USER ATTENDANCE BREAKDOWN (FACULTY & STAFF)
  // ----------------------------------------------------
  static async getDailyUserAttendanceSummary(filters: { date?: string; departmentId?: string; role?: string }) {
    const targetDate = filters.date || new Date().toISOString().split('T')[0];

    const whereUser: any = { status: 'ACTIVE' };
    if (filters.departmentId) {
      whereUser.userRoles = { some: { departmentId: filters.departmentId } };
    }
    if (filters.role) {
      whereUser.activeRole = filters.role;
    }

    const totalUsers = await prisma.user.count({ where: whereUser });

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: targetDate,
        user: whereUser,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, activeRole: true } },
      },
    });

    let present = 0;
    let late = 0;
    let missingCheckout = 0;
    let halfDay = 0;
    let onLeave = 0;

    for (const att of attendanceRecords) {
      if (att.status === 'PRESENT') present += 1;
      else if (att.status === 'LATE') late += 1;
      else if (att.status === 'HALF_DAY') halfDay += 1;
      else if (att.status === 'ON_LEAVE') onLeave += 1;

      if (att.checkInTime && !att.checkOutTime) {
        missingCheckout += 1;
      }
    }

    const checkedInCount = attendanceRecords.length;
    const absent = Math.max(0, totalUsers - checkedInCount);

    return {
      date: targetDate,
      totalUsers,
      checkedInCount,
      present,
      late,
      missingCheckout,
      halfDay,
      onLeave,
      absent,
      records: attendanceRecords,
    };
  }

  // ----------------------------------------------------
  // 10. ATTENDANCE ANOMALIES & AUDIT LOGS
  // ----------------------------------------------------
  static async getAttendanceAnomalies(filters: { type?: string; limit?: number }) {
    const where: any = {};
    if (filters.type) where.type = filters.type;

    return prisma.attendanceAnomaly.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
    });
  }
}
