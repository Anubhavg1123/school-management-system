import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class StudentPortalService {
  /**
   * Resolve Student record linked to logged-in user
   */
  static async resolveStudentForUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, activeRole: true, status: true },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (user.status === 'SUSPENDED' || user.status === 'INACTIVE') {
      throw new AppError('Student account is suspended or inactive.', 403, 'ACCOUNT_DISABLED');
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { userId },
          { user: { email: user.email } },
        ],
      },
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
      throw new AppError('No student record found linked to your account.', 404, 'STUDENT_NOT_FOUND');
    }

    if (student.status === 'LEFT_INSTITUTION') {
      throw new AppError('Student account status is LEFT INSTITUTION. Login disabled.', 403, 'STUDENT_LEFT_INSTITUTION');
    }

    return student;
  }

  /**
   * Verify Student Access Ownership
   */
  static async verifyStudentOwnership(userId: string, targetStudentId: string) {
    const student = await this.resolveStudentForUser(userId);
    if (student.id !== targetStudentId) {
      throw new AppError('Access Denied: You cannot view or modify another student\'s records.', 403, 'STUDENT_ACCESS_DENIED');
    }
    return student;
  }

  /**
   * Student Dashboard KPIs & Aggregation
   */
  static async getDashboard(userId: string) {
    const student = await this.resolveStudentForUser(userId);

    // 1. Timetable for Today
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const todayEntries = await prisma.timetableEntry.findMany({
      where: {
        sectionId: student.sectionId || undefined,
        dayOfWeek: todayDayName,
        status: 'ACTIVE',
      },
      include: {
        subject: true,
        room: true,
        timeSlot: true,
        faculty: {
          include: { user: true },
        },
      },
      orderBy: { timeSlot: { startTime: 'asc' } },
    });

    // 2. Attendance Summary
    const attendances = await prisma.studentAttendance.findMany({
      where: { studentId: student.id },
    });
    const totalSessions = attendances.length;
    const presentSessions = attendances.filter((a: any) => a.status === 'PRESENT' || a.status === 'BYPASS_APPROVED').length;
    const absentSessions = attendances.filter((a: any) => a.status === 'ABSENT').length;
    const lateSessions = attendances.filter((a: any) => a.status === 'LATE').length;
    const excusedSessions = attendances.filter((a: any) => a.status === 'EXCUSED').length;
    const attendancePercentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;

    // Threshold Check
    const institutionSettings = await prisma.institutionSettings.findFirst();
    const requiredThreshold = institutionSettings?.attendanceThresholdPercent || 75;
    const isLowAttendance = attendancePercentage < requiredThreshold;

    // 3. Pending Assignments
    const assignmentTargets = await prisma.assignmentTarget.findMany({
      where: {
        studentId: student.id,
        assignment: { status: 'PUBLISHED' },
      },
      include: {
        assignment: {
          include: {
            subject: true,
            faculty: {
              include: { user: true },
            },
          },
        },
      },
    });

    // 4. Upcoming Examinations
    const upcomingExams = await prisma.examinationSubject.findMany({
      where: {
        classId: student.section?.classId || undefined,
        examDate: { gte: new Date().toISOString().split('T')[0] },
        examination: { status: { in: ['PLANNED', 'SCHEDULED', 'ONGOING'] } },
      },
      include: {
        examination: true,
        subject: true,
        room: true,
      },
      take: 5,
      orderBy: { examDate: 'asc' },
    });

    // 5. Latest Published Result Snapshot
    const latestResult = await prisma.studentResultSnapshot.findFirst({
      where: {
        studentId: student.id,
        status: 'PUBLISHED',
      },
      include: {
        examination: true,
        subjectDetails: true,
      },
      orderBy: { publishedDate: 'desc' },
    });

    // 6. Notices
    const notices = await prisma.notice.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { targetAudience: 'STUDENTS' },
          { targetAudience: 'ALL' },
          { targetStudentId: student.id },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // 7. Unread Notifications Count
    const unreadNotificationsCount = await prisma.notificationDelivery.count({
      where: {
        userId,
        status: 'DELIVERED',
      },
    });

    return {
      student: {
        id: student.id,
        fullName: `${student.user.firstName} ${student.user.lastName}`,
        admissionNumber: student.admissionNumber,
        enrollmentNumber: student.enrollmentNumber,
        class: student.section?.class?.name || 'Unassigned',
        section: student.section?.name || 'Unassigned',
        department: student.department?.name || 'General',
        academicYear: student.academicYear?.name || 'Current',
      },
      todaySchedule: todayEntries.map((s: any) => ({
        id: s.id,
        subjectName: s.subject?.name || 'Subject',
        facultyName: s.faculty?.user ? `${s.faculty.user.firstName} ${s.faculty.user.lastName}` : 'Unassigned',
        room: s.room?.roomNumber || 'TBD',
        startTime: s.timeSlot?.startTime,
        endTime: s.timeSlot?.endTime,
      })),
      attendance: {
        totalSessions,
        presentSessions,
        absentSessions,
        lateSessions,
        excusedSessions,
        attendancePercentage,
        requiredThreshold,
        isLowAttendance,
        warningMessage: isLowAttendance
          ? `Your attendance (${attendancePercentage}%) is below the required threshold of ${requiredThreshold}%.`
          : null,
      },
      pendingAssignmentsCount: assignmentTargets.length,
      upcomingExamsCount: upcomingExams.length,
      latestResult: latestResult
        ? {
            examName: latestResult.examination?.name,
            overallPercentage: latestResult.overallPercentage,
            grade: latestResult.grade,
            overallResult: latestResult.overallResult,
            publishedDate: latestResult.publishedDate,
          }
        : null,
      noticesCount: notices.length,
      unreadNotificationsCount,
    };
  }

  /**
   * Student Timetable Schedule
   */
  static async getTimetable(userId: string, targetStudentId: string, dayOfWeek?: string) {
    await this.verifyStudentOwnership(userId, targetStudentId);
    const student = await this.resolveStudentForUser(userId);

    const whereClause: any = {
      sectionId: student.sectionId || undefined,
      status: 'ACTIVE',
    };

    if (dayOfWeek) {
      whereClause.dayOfWeek = dayOfWeek.toUpperCase();
    }

    const periods = await prisma.timetableEntry.findMany({
      where: whereClause,
      include: {
        subject: true,
        room: true,
        timeSlot: true,
        faculty: {
          include: { user: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { timeSlot: { startTime: 'asc' } }],
    });

    return periods;
  }

  /**
   * Student Detailed Attendance
   */
  static async getAttendance(userId: string, targetStudentId: string) {
    await this.verifyStudentOwnership(userId, targetStudentId);

    const attendances = await prisma.studentAttendance.findMany({
      where: { studentId: targetStudentId },
      include: {
        attendanceSlot: {
          include: {
            subject: true,
            faculty: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = attendances.length;
    const present = attendances.filter((a: any) => a.status === 'PRESENT' || a.status === 'BYPASS_APPROVED').length;
    const absent = attendances.filter((a: any) => a.status === 'ABSENT').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

    return {
      summary: {
        totalSessions: total,
        present,
        absent,
        percentage,
      },
      records: attendances,
    };
  }

  /**
   * Create Profile Update Request
   */
  static async createProfileUpdateRequest(userId: string, targetStudentId: string, payload: { fieldChanges: object; reason?: string }) {
    await this.verifyStudentOwnership(userId, targetStudentId);

    const request = await prisma.studentProfileUpdateRequest.create({
      data: {
        studentId: targetStudentId,
        requestedByUserId: userId,
        fieldChanges: JSON.stringify(payload.fieldChanges),
        reason: payload.reason,
        status: 'PENDING',
      },
    });

    return request;
  }

  /**
   * Create Student Leave Request
   */
  static async createLeaveRequest(userId: string, targetStudentId: string, payload: { startDate: string; endDate: string; reason: string }) {
    await this.verifyStudentOwnership(userId, targetStudentId);

    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await prisma.studentLeaveRequest.create({
      data: {
        studentId: targetStudentId,
        requestedByUserId: userId,
        startDate: start,
        endDate: end,
        totalDays,
        reason: payload.reason,
        status: 'PENDING',
      },
    });

    return leave;
  }
}
