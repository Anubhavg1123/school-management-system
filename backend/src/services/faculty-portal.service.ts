import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class FacultyPortalService {
  /**
   * Helper to retrieve Faculty record from User ID or throw 404
   */
  private static async getFacultyByUserId(userId: string) {
    const faculty = await prisma.faculty.findUnique({
      where: { userId },
      include: {
        department: true,
        user: true,
      },
    });

    if (!faculty) {
      throw new AppError('Faculty profile not found for authenticated user.', 404);
    }
    return faculty;
  }

  /**
   * Helper to check if faculty teaches a given class/section/subject or is class coordinator
   */
  private static async verifyFacultySectionAccess(facultyId: string, sectionId: string) {
    // 1. Check direct subject assignment
    const subjectAssignment = await prisma.facultySubjectAssignment.findFirst({
      where: {
        facultyId,
        sectionId,
        status: 'ACTIVE',
      },
    });
    if (subjectAssignment) return true;

    // 2. Check if active Class Coordinator
    const coordinator = await prisma.classCoordinatorHistory.findFirst({
      where: {
        facultyId,
        sectionId,
        status: 'ACTIVE',
      },
    });
    if (coordinator) return true;

    // 3. Check substitute assignment for today/active
    const substitute = await prisma.substituteFacultyAssignment.findFirst({
      where: {
        substituteFacultyId: facultyId,
        sectionId,
        status: 'CONFIRMED',
      },
    });
    if (substitute) return true;

    return false;
  }

  /**
   * 1. FACULTY DASHBOARD - Aggregates real metrics from database
   */
  static async getFacultyDashboard(userId: string) {
    const faculty = await this.getFacultyByUserId(userId);
    const todayStr = new Date().toISOString().split('T')[0];
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const currentDay = dayNames[new Date().getDay()];

    // Active Academic Year
    const activeAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });
    const academicYearId = activeAcademicYear?.id;

    // Class Coordinator status
    const coordinatorSection = await prisma.section.findFirst({
      where: { coordinatorFacultyId: faculty.id },
      include: { class: true },
    });

    // Today's regular timetable classes
    const todayTimetable = await prisma.timetableEntry.findMany({
      where: {
        facultyId: faculty.id,
        dayOfWeek: currentDay,
        status: 'ACTIVE',
        ...(academicYearId ? { academicYearId } : {}),
      },
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
        timeSlot: true,
      },
      orderBy: { timeSlot: { periodNumber: 'asc' } },
    });

    // Substitute classes assigned to this faculty for today
    const todaySubstitutes = await prisma.substituteFacultyAssignment.findMany({
      where: {
        substituteFacultyId: faculty.id,
        date: todayStr,
        status: 'CONFIRMED',
      },
      include: {
        class: true,
        section: true,
        subject: true,
        timeSlot: true,
      },
    });

    // Today's generated attendance slots
    const todayAttendanceSlots = await prisma.attendanceSlot.findMany({
      where: {
        facultyId: faculty.id,
        date: todayStr,
      },
    });

    // Pending attendance sessions count
    const pendingAttendanceCount = todayAttendanceSlots.filter(
      (s) => s.status === 'OPEN' || s.status === 'SCHEDULED'
    ).length;

    const completedAttendanceCount = todayAttendanceSlots.filter(
      (s) => s.status === 'SUBMITTED' || s.status === 'FINALIZED'
    ).length;

    // Assigned Subjects & Classes count
    const subjectAssignments = await prisma.facultySubjectAssignment.findMany({
      where: { facultyId: faculty.id, status: 'ACTIVE' },
      include: { class: true, section: true, subject: true },
    });

    // Faculty Check-In status for today
    const todayFacultyCheckIn = await prisma.attendance.findFirst({
      where: { userId, date: todayStr },
    });

    // Pending leave requests
    const pendingLeaves = await prisma.facultyLeave.findMany({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    // Pending correction requests
    const pendingCorrections = await prisma.studentAttendanceCorrection.findMany({
      where: {
        requestedByUserId: userId,
        status: 'PENDING',
      },
      include: {
        studentAttendance: {
          include: { student: { include: { user: true } } },
        },
      },
    });

    // Pending extra class requests
    const extraClassRequests = await prisma.extraClassRequest.findMany({
      where: { facultyId: faculty.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Recent notifications & notices
    const recentNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const classAnnouncements = await prisma.classAnnouncement.findMany({
      where: { facultyId: faculty.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      faculty: {
        id: faculty.id,
        userId: faculty.userId,
        employeeCode: faculty.employeeCode,
        firstName: faculty.user.firstName,
        lastName: faculty.user.lastName,
        email: faculty.user.email,
        department: faculty.department.name,
        departmentCode: faculty.department.code,
        designation: faculty.designation,
        joiningDate: faculty.joiningDate,
        isHod: faculty.isHod,
        isCoordinator: !!coordinatorSection,
        coordinatedSection: coordinatorSection
          ? {
              sectionId: coordinatorSection.id,
              sectionName: coordinatorSection.name,
              className: coordinatorSection.class.name,
            }
          : null,
      },
      today: {
        date: todayStr,
        dayOfWeek: currentDay,
        checkInStatus: todayFacultyCheckIn
          ? {
              status: todayFacultyCheckIn.status,
              checkInTime: todayFacultyCheckIn.checkInTime,
              checkOutTime: todayFacultyCheckIn.checkOutTime,
              lateMinutes: todayFacultyCheckIn.lateMinutes,
            }
          : null,
        classesCount: todayTimetable.length + todaySubstitutes.length,
        pendingAttendanceCount,
        completedAttendanceCount,
      },
      todayClasses: todayTimetable.map((t) => {
        const slot = todayAttendanceSlots.find((s) => s.timetableEntryId === t.id);
        return {
          id: t.id,
          timeSlot: t.timeSlot.name,
          startTime: t.timeSlot.startTime,
          endTime: t.timeSlot.endTime,
          className: t.class.name,
          sectionName: t.section.name,
          subjectName: t.subject?.name || 'Unassigned',
          subjectCode: t.subject?.code || 'N/A',
          room: t.room?.roomNumber || 'N/A',
          isSubstitute: false,
          attendanceStatus: slot ? slot.status : 'NOT_STARTED',
          slotId: slot?.id || null,
        };
      }),
      todaySubstitutes: todaySubstitutes.map((sub) => ({
        id: sub.id,
        timeSlot: sub.timeSlot.name,
        startTime: sub.timeSlot.startTime,
        endTime: sub.timeSlot.endTime,
        className: sub.class.name,
        sectionName: sub.section.name,
        subjectName: sub.subject.name,
        isSubstitute: true,
        reason: sub.reason,
      })),
      assignedSubjectsCount: subjectAssignments.length,
      pendingLeavesCount: pendingLeaves.length,
      pendingCorrectionsCount: pendingCorrections.length,
      extraClassRequests,
      recentNotifications,
      classAnnouncements,
    };
  }

  /**
   * 2. FACULTY PROFILE - Get faculty profile details
   */
  static async getFacultyProfile(userId: string) {
    const faculty = await this.getFacultyByUserId(userId);
    const user = faculty.user;

    const coordinatorSection = await prisma.section.findFirst({
      where: { coordinatorFacultyId: faculty.id },
      include: { class: true },
    });

    const subjectAssignments = await prisma.facultySubjectAssignment.findMany({
      where: { facultyId: faculty.id, status: 'ACTIVE' },
      include: { class: true, section: true, subject: true },
    });

    return {
      facultyId: faculty.id,
      employeeCode: faculty.employeeCode,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      whatsAppNumber: user.whatsAppNumber,
      altPhone: user.altPhone,
      address: user.address,
      dob: user.dob,
      gender: user.gender,
      emergencyContactName: user.emergencyContactName,
      emergencyContactPhone: user.emergencyContactPhone,
      department: faculty.department.name,
      departmentCode: faculty.department.code,
      designation: faculty.designation,
      joiningDate: faculty.joiningDate,
      isHod: faculty.isHod,
      status: faculty.status,
      coordinatorSection: coordinatorSection
        ? `${coordinatorSection.class.name} - ${coordinatorSection.name}`
        : null,
      assignedSubjects: subjectAssignments.map((sa) => ({
        id: sa.id,
        className: sa.class.name,
        sectionName: sa.section?.name || 'All Sections',
        subjectName: sa.subject.name,
        subjectCode: sa.subject.code,
      })),
    };
  }

  /**
   * 3. UPDATE FACULTY PROFILE - Allows updating self-editable contact fields only
   */
  static async updateFacultyProfile(
    userId: string,
    payload: {
      phone?: string;
      whatsAppNumber?: string;
      altPhone?: string;
      address?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    }
  ) {
    const faculty = await this.getFacultyByUserId(userId);

    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: payload.phone ?? undefined,
        whatsAppNumber: payload.whatsAppNumber ?? undefined,
        altPhone: payload.altPhone ?? undefined,
        address: payload.address ?? undefined,
        emergencyContactName: payload.emergencyContactName ?? undefined,
        emergencyContactPhone: payload.emergencyContactPhone ?? undefined,
      },
    });

    await AuditService.log({
      userId,
      action: 'FACULTY_PROFILE_UPDATED',
      entityType: 'Faculty',
      entityId: faculty.id,
      afterState: payload,
    });

    return this.getFacultyProfile(userId);
  }

  /**
   * 4. ASSIGNED CLASSES - Get classes assigned to faculty with section & coordinator info
   */
  static async getAssignedClasses(userId: string) {
    const faculty = await this.getFacultyByUserId(userId);

    const subjectAssignments = await prisma.facultySubjectAssignment.findMany({
      where: { facultyId: faculty.id, status: 'ACTIVE' },
      include: {
        class: { include: { academicYear: true } },
        section: { include: { _count: { select: { students: true } } } },
        subject: true,
      },
    });

    const coordinatorSections = await prisma.section.findMany({
      where: { coordinatorFacultyId: faculty.id },
      include: {
        class: { include: { academicYear: true } },
        _count: { select: { students: true } },
      },
    });

    return {
      subjectAssignments: subjectAssignments.map((sa) => ({
        id: sa.id,
        classId: sa.classId,
        className: sa.class.name,
        classCode: sa.class.code,
        sectionId: sa.sectionId,
        sectionName: sa.section?.name || 'All Sections',
        studentCount: sa.section?._count.students || 0,
        subjectId: sa.subjectId,
        subjectName: sa.subject.name,
        subjectCode: sa.subject.code,
        academicYear: sa.class.academicYear.name,
        isCoordinator: sa.sectionId
          ? coordinatorSections.some((c) => c.id === sa.sectionId)
          : false,
      })),
      coordinatorSections: coordinatorSections.map((cs) => ({
        sectionId: cs.id,
        sectionName: cs.name,
        classId: cs.classId,
        className: cs.class.name,
        studentCount: cs._count.students,
        academicYear: cs.class.academicYear.name,
      })),
    };
  }

  /**
   * 5. ASSIGNED STUDENTS - Get student roster for assigned section
   */
  static async getAssignedStudents(userId: string, sectionId: string) {
    const faculty = await this.getFacultyByUserId(userId);

    // Verify ownership
    const hasAccess = await this.verifyFacultySectionAccess(faculty.id, sectionId);
    if (!hasAccess) {
      throw new AppError('Access Denied: You are not assigned to teach or coordinate this class section.', 403);
    }

    const students = await prisma.student.findMany({
      where: { sectionId, status: 'ACTIVE' },
      include: {
        user: true,
        section: { include: { class: true } },
        department: true,
        studentAttendances: {
          select: { status: true },
        },
      },
      orderBy: { rollNumber: 'asc' },
    });

    return students.map((std) => {
      const totalAttendances = std.studentAttendances.length;
      const presentCount = std.studentAttendances.filter(
        (a) => a.status === 'PRESENT' || a.status === 'ACADEMIC_BYPASS'
      ).length;
      const attendancePercentage =
        totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 100;

      return {
        id: std.id,
        userId: std.userId,
        admissionNumber: std.admissionNumber,
        enrollmentNumber: std.enrollmentNumber,
        rollNumber: std.rollNumber,
        firstName: std.user.firstName,
        lastName: std.user.lastName,
        email: std.user.email,
        phone: std.user.phone,
        className: std.section?.class.name,
        sectionName: std.section?.name,
        department: std.department?.name || 'General',
        attendancePercentage,
        isLowAttendance: attendancePercentage < 75,
        status: std.status,
      };
    });
  }

  /**
   * 6. RESTRICTED STUDENT PROFILE - Get student details for authorized faculty
   */
  static async getStudentProfileForFaculty(userId: string, studentId: string) {
    const faculty = await this.getFacultyByUserId(userId);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        section: { include: { class: true } },
        department: true,
        guardians: { where: { isPrimary: true } },
        studentAttendances: {
          include: {
            attendanceSlot: {
              include: { subject: true },
            },
          },
        },
      },
    });

    if (!student) {
      throw new AppError('Student record not found.', 404);
    }

    // Verify faculty ownership
    if (student.sectionId) {
      const hasAccess = await this.verifyFacultySectionAccess(faculty.id, student.sectionId);
      if (!hasAccess) {
        throw new AppError('Access Denied: You do not have authorization to view this student profile.', 403);
      }
    }

    const totalMarked = student.studentAttendances.length;
    const presentMarked = student.studentAttendances.filter(
      (a) => a.status === 'PRESENT' || a.status === 'ACADEMIC_BYPASS'
    ).length;
    const overallPercentage = totalMarked > 0 ? Math.round((presentMarked / totalMarked) * 100) : 100;

    return {
      studentId: student.id,
      admissionNumber: student.admissionNumber,
      enrollmentNumber: student.enrollmentNumber,
      rollNumber: student.rollNumber,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      phone: student.user.phone,
      dob: student.dateOfBirth,
      gender: student.gender,
      bloodGroup: student.bloodGroup,
      className: student.section?.class.name,
      sectionName: student.section?.name,
      department: student.department?.name || 'General',
      primaryGuardian: student.guardians[0]
        ? {
            fullName: student.guardians[0].fullName,
            relationship: student.guardians[0].relationship,
            phone: student.guardians[0].phone,
          }
        : null,
      attendanceStats: {
        totalSessions: totalMarked,
        presentSessions: presentMarked,
        overallPercentage,
        isLowAttendance: overallPercentage < 75,
      },
    };
  }

  /**
   * 7. FACULTY TIMETABLE - Get weekly/daily timetable grid
   */
  static async getFacultyTimetable(userId: string, dayOfWeek?: string) {
    const faculty = await this.getFacultyByUserId(userId);

    const timetableEntries = await prisma.timetableEntry.findMany({
      where: {
        facultyId: faculty.id,
        status: 'ACTIVE',
        ...(dayOfWeek ? { dayOfWeek } : {}),
      },
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
        timeSlot: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { timeSlot: { periodNumber: 'asc' } }],
    });

    const substituteAssignments = await prisma.substituteFacultyAssignment.findMany({
      where: {
        substituteFacultyId: faculty.id,
        status: 'CONFIRMED',
      },
      include: {
        class: true,
        section: true,
        subject: true,
        timeSlot: true,
      },
    });

    return {
      regularTimetable: timetableEntries.map((t) => ({
        id: t.id,
        dayOfWeek: t.dayOfWeek,
        periodNumber: t.timeSlot.periodNumber,
        periodName: t.timeSlot.name,
        startTime: t.timeSlot.startTime,
        endTime: t.timeSlot.endTime,
        className: t.class.name,
        sectionName: t.section.name,
        subjectName: t.subject?.name || 'Unassigned',
        subjectCode: t.subject?.code || 'N/A',
        room: t.room?.roomNumber || 'N/A',
        isSubstitute: false,
      })),
      substituteClasses: substituteAssignments.map((sub) => ({
        id: sub.id,
        date: sub.date,
        periodNumber: sub.timeSlot.periodNumber,
        periodName: sub.timeSlot.name,
        startTime: sub.timeSlot.startTime,
        endTime: sub.timeSlot.endTime,
        className: sub.class.name,
        sectionName: sub.section.name,
        subjectName: sub.subject.name,
        reason: sub.reason,
        isSubstitute: true,
      })),
    };
  }

  /**
   * 8. CREATE ASSIGNMENT - Form submission with backend ownership validation
   */
  static async createAssignment(
    userId: string,
    payload: {
      academicYearId?: string;
      classId: string;
      sectionId: string;
      subjectId: string;
      title: string;
      description: string;
      dueDate: string;
      attachments?: Array<{ title: string; fileUrl: string; fileSize?: number; mimeType?: string }>;
    }
  ) {
    const faculty = await this.getFacultyByUserId(userId);

    // Backend ownership verification: Faculty must teach subject in this section
    const hasAccess = await this.verifyFacultySectionAccess(faculty.id, payload.sectionId);
    if (!hasAccess) {
      throw new AppError('Access Denied: You can only assign tasks to class sections assigned to you.', 403);
    }

    let academicYearId = payload.academicYearId;
    if (!academicYearId) {
      const activeYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
      if (!activeYear) throw new AppError('No active academic year configured.', 400);
      academicYearId = activeYear.id;
    }

    const assignment = await prisma.assignment.create({
      data: {
        academicYearId,
        classId: payload.classId,
        sectionId: payload.sectionId,
        subjectId: payload.subjectId,
        facultyId: faculty.id,
        createdByUserId: userId,
        title: payload.title,
        description: payload.description,
        dueDate: new Date(payload.dueDate),
        status: 'DRAFT',
        attachments: payload.attachments
          ? {
              create: payload.attachments.map((att) => ({
                title: att.title,
                fileUrl: att.fileUrl,
                fileSize: att.fileSize,
                mimeType: att.mimeType,
              })),
            }
          : undefined,
      },
      include: {
        class: true,
        section: true,
        subject: true,
        attachments: true,
      },
    });

    await AuditService.log({
      userId,
      action: 'ASSIGNMENT_CREATED',
      entityType: 'Assignment',
      entityId: assignment.id,
      afterState: { title: assignment.title, sectionId: assignment.sectionId },
    });

    return assignment;
  }

  /**
   * 9. PUBLISH ASSIGNMENT - Transition DRAFT -> PUBLISHED and populate student targets & notification queue
   */
  static async publishAssignment(userId: string, assignmentId: string) {
    const faculty = await this.getFacultyByUserId(userId);

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { section: true, subject: true, class: true },
    });

    if (!assignment) {
      throw new AppError('Assignment not found.', 404);
    }

    if (assignment.facultyId !== faculty.id) {
      throw new AppError('Access Denied: You do not own this assignment.', 403);
    }

    // Fetch enrolled students in section
    const enrolledStudents = await prisma.student.findMany({
      where: { sectionId: assignment.sectionId, status: 'ACTIVE' },
    });

    const updatedAssignment = await prisma.$transaction(async (tx) => {
      // 1. Update assignment status
      const updated = await tx.assignment.update({
        where: { id: assignmentId },
        data: { status: 'PUBLISHED' },
      });

      // 2. Create student assignment targets
      if (enrolledStudents.length > 0) {
        await tx.assignmentTarget.createMany({
          data: enrolledStudents.map((std) => ({
            assignmentId,
            studentId: std.id,
            status: 'PENDING',
          })),
        });
      }

      // 3. Queue Notification Event for WhatsApp / Parent dispatch
      await tx.notificationEvent.create({
        data: {
          eventType: 'ASSIGNMENT_PUBLISHED',
          payload: JSON.stringify({
            assignmentId,
            title: assignment.title,
            subject: assignment.subject.name,
            className: assignment.class.name,
            sectionName: assignment.section.name,
            dueDate: assignment.dueDate,
          }),
          targetType: 'STUDENT',
          status: 'PENDING',
        },
      });

      return updated;
    });

    await AuditService.log({
      userId,
      action: 'ASSIGNMENT_PUBLISHED',
      entityType: 'Assignment',
      entityId: assignmentId,
      afterState: { targetCount: enrolledStudents.length },
    });

    return updatedAssignment;
  }

  /**
   * 10. GET ASSIGNMENTS - Query faculty's assignments
   */
  static async getFacultyAssignments(
    userId: string,
    filters?: { status?: string; classId?: string; sectionId?: string; subjectId?: string }
  ) {
    const faculty = await this.getFacultyByUserId(userId);

    return prisma.assignment.findMany({
      where: {
        facultyId: faculty.id,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.classId ? { classId: filters.classId } : {}),
        ...(filters?.sectionId ? { sectionId: filters.sectionId } : {}),
        ...(filters?.subjectId ? { subjectId: filters.subjectId } : {}),
      },
      include: {
        class: true,
        section: true,
        subject: true,
        attachments: true,
        _count: { select: { targets: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 11. FACULTY LEAVE REQUEST - Apply for leave
   */
  static async requestFacultyLeave(
    userId: string,
    payload: { leaveType: string; startDate: string; endDate: string; reason: string }
  ) {
    const faculty = await this.getFacultyByUserId(userId);

    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = await prisma.facultyLeave.create({
      data: {
        userId,
        facultyId: faculty.id,
        leaveType: payload.leaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason: payload.reason,
        status: 'PENDING',
      },
    });

    await AuditService.log({
      userId,
      action: 'FACULTY_LEAVE_REQUESTED',
      entityType: 'FacultyLeave',
      entityId: leave.id,
      afterState: { leaveType: leave.leaveType, totalDays },
    });

    return leave;
  }

  /**
   * 12. GET FACULTY LEAVES
   */
  static async getFacultyLeaves(userId: string) {
    return prisma.facultyLeave.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 13. REQUEST EXTRA CLASS - Submit remedial/extra class request with conflict validation
   */
  static async requestExtraClass(
    userId: string,
    payload: {
      classId: string;
      sectionId: string;
      subjectId: string;
      roomId: string;
      date: string;
      timeSlotId?: string;
      startTime: string;
      endTime: string;
      reason: string;
    }
  ) {
    const faculty = await this.getFacultyByUserId(userId);

    // Verify ownership
    const hasAccess = await this.verifyFacultySectionAccess(faculty.id, payload.sectionId);
    if (!hasAccess) {
      throw new AppError('Access Denied: You do not teach this class section.', 403);
    }

    const activeYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!activeYear) throw new AppError('No active academic year configured.', 400);

    // Conflict Check: Faculty availability
    const facultyConflict = await prisma.extraClassRequest.findFirst({
      where: {
        facultyId: faculty.id,
        date: payload.date,
        startTime: payload.startTime,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (facultyConflict) {
      throw new AppError('Conflict: You already have another extra class scheduled at this time.', 409);
    }

    const extraClass = await prisma.extraClassRequest.create({
      data: {
        academicYearId: activeYear.id,
        classId: payload.classId,
        sectionId: payload.sectionId,
        subjectId: payload.subjectId,
        facultyId: faculty.id,
        roomId: payload.roomId,
        date: payload.date,
        timeSlotId: payload.timeSlotId || undefined,
        startTime: payload.startTime,
        endTime: payload.endTime,
        reason: payload.reason,
        status: 'PENDING',
        requestedByUserId: userId,
      },
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
      },
    });

    await AuditService.log({
      userId,
      action: 'EXTRA_CLASS_REQUESTED',
      entityType: 'ExtraClassRequest',
      entityId: extraClass.id,
      afterState: { date: payload.date, startTime: payload.startTime },
    });

    return extraClass;
  }

  /**
   * 14. GET FACULTY EXTRA CLASSES
   */
  static async getFacultyExtraClasses(userId: string) {
    const faculty = await this.getFacultyByUserId(userId);
    return prisma.extraClassRequest.findMany({
      where: { facultyId: faculty.id },
      include: { class: true, section: true, subject: true, room: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 15. REGISTER VEHICLE - Faculty vehicle registration submission
   */
  static async registerVehicle(
    userId: string,
    payload: {
      vehicleNumber: string;
      vehicleType: string;
      makeModel?: string;
      color?: string;
      registrationDetails?: string;
      documentUrl?: string;
    }
  ) {
    const faculty = await this.getFacultyByUserId(userId);

    const existing = await prisma.facultyVehicleRegistration.findUnique({
      where: { vehicleNumber: payload.vehicleNumber.toUpperCase() },
    });
    if (existing) {
      throw new AppError(`Vehicle number '${payload.vehicleNumber}' is already registered in the system.`, 409);
    }

    const registration = await prisma.facultyVehicleRegistration.create({
      data: {
        userId,
        facultyId: faculty.id,
        vehicleNumber: payload.vehicleNumber.toUpperCase(),
        vehicleType: payload.vehicleType,
        makeModel: payload.makeModel || undefined,
        color: payload.color || undefined,
        registrationDetails: payload.registrationDetails || undefined,
        documentUrl: payload.documentUrl || undefined,
        status: 'PENDING',
      },
    });

    await AuditService.log({
      userId,
      action: 'VEHICLE_REGISTERED',
      entityType: 'FacultyVehicleRegistration',
      entityId: registration.id,
      afterState: { vehicleNumber: registration.vehicleNumber },
    });

    return registration;
  }

  /**
   * 16. GET FACULTY VEHICLES
   */
  static async getFacultyVehicles(userId: string) {
    return prisma.facultyVehicleRegistration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 17. REVIEW VEHICLE REGISTRATION (ADMIN / OFFICE ADMIN ROLE)
   */
  static async reviewVehicleRegistration(
    reviewerUserId: string,
    registrationId: string,
    payload: { action: 'APPROVED' | 'REJECTED'; rejectionReason?: string }
  ) {
    const registration = await prisma.facultyVehicleRegistration.findUnique({
      where: { id: registrationId },
    });
    if (!registration) {
      throw new AppError('Vehicle registration record not found.', 404);
    }

    const status = payload.action === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    const updated = await prisma.facultyVehicleRegistration.update({
      where: { id: registrationId },
      data: {
        status,
        approvedByUserId: reviewerUserId,
        approvedAt: new Date(),
        rejectionReason: payload.rejectionReason || undefined,
      },
    });

    await AuditService.log({
      userId: reviewerUserId,
      action: `VEHICLE_REGISTRATION_${status}`,
      entityType: 'FacultyVehicleRegistration',
      entityId: registrationId,
      afterState: { status, rejectionReason: payload.rejectionReason },
    });

    return updated;
  }

  /**
   * 18. CREATE CLASS ANNOUNCEMENT - Create notice for assigned section
   */
  static async createClassAnnouncement(
    userId: string,
    payload: {
      classId: string;
      sectionId: string;
      title: string;
      content: string;
      category?: string;
    }
  ) {
    const faculty = await this.getFacultyByUserId(userId);

    const hasAccess = await this.verifyFacultySectionAccess(faculty.id, payload.sectionId);
    if (!hasAccess) {
      throw new AppError('Access Denied: You do not teach or coordinate this section.', 403);
    }

    const activeYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!activeYear) throw new AppError('No active academic year configured.', 400);

    const announcement = await prisma.classAnnouncement.create({
      data: {
        academicYearId: activeYear.id,
        classId: payload.classId,
        sectionId: payload.sectionId,
        facultyId: faculty.id,
        createdByUserId: userId,
        title: payload.title,
        content: payload.content,
        category: payload.category || 'ACADEMIC',
      },
      include: {
        class: true,
        section: true,
      },
    });

    await AuditService.log({
      userId,
      action: 'CLASS_ANNOUNCEMENT_CREATED',
      entityType: 'ClassAnnouncement',
      entityId: announcement.id,
      afterState: { title: announcement.title, sectionId: announcement.sectionId },
    });

    return announcement;
  }

  /**
   * 19. GET CLASS ANNOUNCEMENTS
   */
  static async getFacultyAnnouncements(userId: string, filters?: { classId?: string; sectionId?: string }) {
    const faculty = await this.getFacultyByUserId(userId);

    return prisma.classAnnouncement.findMany({
      where: {
        facultyId: faculty.id,
        ...(filters?.classId ? { classId: filters.classId } : {}),
        ...(filters?.sectionId ? { sectionId: filters.sectionId } : {}),
      },
      include: { class: true, section: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 20. GET NOTIFICATIONS
   */
  static async getFacultyNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * 21. MARK NOTIFICATION READ
   */
  static async markNotificationRead(userId: string, notificationId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) throw new AppError('Notification not found.', 404);

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * 22. GET WORKLOAD SUMMARY - Calculate actual workload statistics
   */
  static async getFacultyWorkload(userId: string) {
    const faculty = await this.getFacultyByUserId(userId);

    const subjectAssignments = await prisma.facultySubjectAssignment.findMany({
      where: { facultyId: faculty.id, status: 'ACTIVE' },
      include: { class: true, section: true, subject: true },
    });

    const regularTimetableEntries = await prisma.timetableEntry.findMany({
      where: { facultyId: faculty.id, status: 'ACTIVE' },
    });

    const coordinatorSections = await prisma.section.findMany({
      where: { coordinatorFacultyId: faculty.id },
      include: { class: true },
    });

    const substituteLectures = await prisma.substituteFacultyAssignment.findMany({
      where: { substituteFacultyId: faculty.id, status: 'CONFIRMED' },
    });

    const extraClasses = await prisma.extraClassRequest.findMany({
      where: { facultyId: faculty.id, status: 'APPROVED' },
    });

    return {
      totalAssignedClasses: subjectAssignments.length,
      weeklyPeriodCount: regularTimetableEntries.length,
      coordinatorResponsibilities: coordinatorSections.map((cs) => `${cs.class.name} - ${cs.name}`),
      substituteLecturesCount: substituteLectures.length,
      approvedExtraClassesCount: extraClasses.length,
      subjectsTaught: Array.from(new Set(subjectAssignments.map((sa) => sa.subject.name))),
    };
  }
}
