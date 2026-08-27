import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';
import { hashPassword } from '../utils/password';
import {
  StudentStatusEnum,
  StudentTransferTypeEnum,
  UserRoleEnum,
  UserStatusEnum,
  DayOfWeekEnum,
  ExtraClassStatusEnum,
  SubstituteStatusEnum,
} from '../types';

export class AcademicService {
  // ----------------------------------------------------
  // 1. DEPARTMENTS & HOD MANAGEMENT
  // ----------------------------------------------------
  static async getDepartments() {
    return prisma.department.findMany({
      include: {
        hod: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            facultyMembers: true,
            classes: true,
            students: true,
            subjects: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getDepartmentById(id: string) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        hod: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            whatsAppNumber: true,
          },
        },
        facultyMembers: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                status: true,
              },
            },
          },
        },
        classes: {
          include: {
            sections: true,
            academicYear: true,
          },
        },
        subjects: true,
        hodHistory: {
          include: {
            hod: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            assignedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
        _count: {
          select: {
            students: true,
            facultyMembers: true,
            classes: true,
            subjects: true,
          },
        },
      },
    });

    if (!dept) {
      throw new AppError('Department not found.', 404, 'DEPT_NOT_FOUND');
    }

    return dept;
  }

  static async createDepartment(
    data: { code: string; name: string; description?: string; hodUserId?: string },
    actorId: string,
    ipAddress?: string
  ) {
    const existing = await prisma.department.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) {
      throw new AppError(`Department with code '${data.code}' already exists.`, 409, 'DEPT_CODE_EXISTS');
    }

    const dept = await prisma.$transaction(async (tx) => {
      const d = await tx.department.create({
        data: {
          code: data.code.toUpperCase(),
          name: data.name,
          description: data.description || null,
          hodUserId: data.hodUserId || null,
        },
      });

      if (data.hodUserId) {
        await tx.departmentHodHistory.create({
          data: {
            departmentId: d.id,
            hodUserId: data.hodUserId,
            assignedByUserId: actorId,
            status: 'ACTIVE',
            reason: 'Initial HOD assignment during department establishment.',
          },
        });
      }

      return d;
    });

    await AuditService.log({
      userId: actorId,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: dept.id,
      afterState: dept,
      ipAddress,
    });

    return dept;
  }

  static async updateDepartment(
    id: string,
    data: { name?: string; description?: string; status?: string },
    actorId: string,
    ipAddress?: string
  ) {
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Department not found.', 404, 'DEPT_NOT_FOUND');
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        status: data.status ?? existing.status,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'Department',
      entityId: id,
      beforeState: existing,
      afterState: updated,
      ipAddress,
    });

    return updated;
  }

  static async assignDepartmentHod(
    departmentId: string,
    hodUserId: string,
    reason: string,
    actorId: string,
    ipAddress?: string
  ) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) {
      throw new AppError('Department not found.', 404, 'DEPT_NOT_FOUND');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: hodUserId },
      include: { userRoles: { include: { role: true } }, facultyProfile: true },
    });

    if (!targetUser || targetUser.status !== UserStatusEnum.ACTIVE) {
      throw new AppError('The selected HOD must be an active user.', 400, 'INVALID_HOD_USER');
    }

    // Check if faculty is already HOD of another active department
    const existingOtherDept = await prisma.department.findFirst({
      where: {
        hodUserId,
        id: { not: departmentId },
        status: 'ACTIVE',
      },
    });
    if (existingOtherDept) {
      throw new AppError(
        `Faculty is already assigned as HOD of ${existingOtherDept.name} (${existingOtherDept.code}). Multiple active HOD roles are restricted.`,
        400,
        'HOD_ALREADY_ASSIGNED'
      );
    }

    const hodRole = await prisma.role.findUnique({ where: { name: UserRoleEnum.HOD } });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Close current active HOD history for this department
      await tx.departmentHodHistory.updateMany({
        where: { departmentId, status: 'ACTIVE' },
        data: {
          endDate: new Date(),
          status: 'PAST',
        },
      });

      // 2. Create new HOD history
      const history = await tx.departmentHodHistory.create({
        data: {
          departmentId,
          hodUserId,
          assignedByUserId: actorId,
          status: 'ACTIVE',
          reason: reason || 'Department HOD appointment.',
        },
      });

      // 3. Update department hodUserId
      const updatedDept = await tx.department.update({
        where: { id: departmentId },
        data: { hodUserId },
      });

      // 4. Assign HOD role to user scoped to this department
      if (hodRole) {
        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId: hodUserId,
              roleId: hodRole.id,
            },
          },
          update: { departmentId },
          create: {
            userId: hodUserId,
            roleId: hodRole.id,
            departmentId,
            assignedBy: actorId,
          },
        });
      }

      return { department: updatedDept, history };
    });

    await AuditService.log({
      userId: actorId,
      action: 'HOD_ASSIGNED',
      entityType: 'Department',
      entityId: departmentId,
      afterState: { hodUserId, reason },
      ipAddress,
    });

    return result;
  }

  // ----------------------------------------------------
  // 2. ACADEMIC YEARS
  // ----------------------------------------------------
  static async getAcademicYears() {
    return prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: {
            classes: true,
            students: true,
            timetableEntries: true,
          },
        },
      },
    });
  }

  static async createAcademicYear(
    data: {
      name: string;
      startDate: string;
      endDate: string;
      isCurrent?: boolean;
      enrollmentPrefix?: string;
      enrollmentSeqLength?: number;
      status?: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start >= end) {
      throw new AppError('Start date must be before end date.', 400, 'INVALID_DATE_RANGE');
    }

    if (data.isCurrent) {
      if (!data.enrollmentPrefix || data.enrollmentPrefix.trim() === '') {
        throw new AppError(
          'Enrollment prefix is required before activating this academic year.',
          400,
          'ENROLLMENT_PREFIX_REQUIRED'
        );
      }
      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false, status: 'UPCOMING' },
      });
    }

    const year = await prisma.academicYear.create({
      data: {
        name: data.name,
        startDate: start,
        endDate: end,
        isCurrent: data.isCurrent ?? false,
        status: data.isCurrent ? 'ACTIVE' : data.status || 'UPCOMING',
        enrollmentPrefix: data.enrollmentPrefix ? data.enrollmentPrefix.trim() : null,
        enrollmentSeqLength: data.enrollmentSeqLength || 4,
        nextEnrollmentSeq: 1,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'ACADEMIC_YEAR_CREATED',
      entityType: 'AcademicYear',
      entityId: year.id,
      afterState: year,
      ipAddress,
    });

    return year;
  }

  static async setAcademicYearStatus(
    id: string,
    isCurrent: boolean,
    actorId: string,
    ipAddress?: string
  ) {
    const year = await prisma.academicYear.findUnique({ where: { id } });
    if (!year) {
      throw new AppError('Academic year not found.', 404, 'ACADEMIC_YEAR_NOT_FOUND');
    }

    if (isCurrent) {
      if (!year.enrollmentPrefix || year.enrollmentPrefix.trim() === '') {
        throw new AppError(
          'Enrollment prefix is required before activating this academic year.',
          400,
          'ENROLLMENT_PREFIX_REQUIRED'
        );
      }

      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false, status: 'UPCOMING' },
      });
    }

    const updated = await prisma.academicYear.update({
      where: { id },
      data: {
        isCurrent,
        status: isCurrent ? 'ACTIVE' : 'UPCOMING',
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'ACADEMIC_YEAR_STATUS_CHANGED',
      entityType: 'AcademicYear',
      entityId: id,
      afterState: updated,
      ipAddress,
    });

    return updated;
  }

  // ----------------------------------------------------
  // 3. CLASSES, SECTIONS & COORDINATORS
  // ----------------------------------------------------
  static async getClasses(departmentId?: string, academicYearId?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (academicYearId) where.academicYearId = academicYearId;

    return prisma.class.findMany({
      where,
      include: {
        department: true,
        academicYear: true,
        sections: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
        classSubjects: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  static async createClass(
    data: {
      name: string;
      code: string;
      departmentId?: string;
      academicYearId: string;
      order?: number;
      educationLevel?: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    const existingCode = await prisma.class.findUnique({ where: { code: data.code } });
    if (existingCode) {
      throw new AppError(`Class code '${data.code}' is already in use.`, 409, 'CLASS_CODE_EXISTS');
    }

    const existingName = await prisma.class.findFirst({
      where: {
        academicYearId: data.academicYearId,
        name: data.name,
      },
    });
    if (existingName) {
      throw new AppError(
        `Class '${data.name}' already exists in this academic year.`,
        409,
        'CLASS_EXISTS'
      );
    }

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        code: data.code,
        order: data.order !== undefined ? Number(data.order) : 1,
        educationLevel: data.educationLevel || 'PRIMARY',
        departmentId: data.departmentId || null,
        academicYearId: data.academicYearId,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'CLASS_CREATED',
      entityType: 'Class',
      entityId: newClass.id,
      afterState: newClass,
      ipAddress,
    });

    return newClass;
  }

  static async getSections(classId?: string) {
    const where: any = {};
    if (classId) where.classId = classId;

    return prisma.section.findMany({
      where,
      include: {
        class: {
          include: {
            department: true,
            academicYear: true,
          },
        },
        coordinatorHistories: {
          where: { status: 'ACTIVE' },
          include: {
            faculty: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createSection(
    data: { classId: string; name: string; capacity?: number; coordinatorFacultyId?: string },
    actorId: string,
    ipAddress?: string
  ) {
    const existing = await prisma.section.findUnique({
      where: {
        classId_name: {
          classId: data.classId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new AppError(`Section '${data.name}' already exists in this class.`, 409, 'SECTION_EXISTS');
    }

    const section = await prisma.section.create({
      data: {
        classId: data.classId,
        name: data.name,
        capacity: data.capacity || 60,
        coordinatorFacultyId: data.coordinatorFacultyId || null,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'SECTION_CREATED',
      entityType: 'Section',
      entityId: section.id,
      afterState: section,
      ipAddress,
    });

    return section;
  }

  static async assignClassCoordinator(
    sectionId: string,
    facultyId: string,
    academicYearId: string,
    reason: string,
    actorId: string,
    ipAddress?: string
  ) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });
    if (!section) {
      throw new AppError('Section not found.', 404, 'SECTION_NOT_FOUND');
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { user: true },
    });
    if (!faculty || faculty.status !== 'ACTIVE') {
      throw new AppError('The selected faculty member is invalid or inactive.', 400, 'INVALID_FACULTY');
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Close current coordinator history
      await tx.classCoordinatorHistory.updateMany({
        where: { sectionId, status: 'ACTIVE' },
        data: {
          endDate: new Date(),
          status: 'PAST',
        },
      });

      // 2. Create new coordinator history
      const history = await tx.classCoordinatorHistory.create({
        data: {
          sectionId,
          facultyId,
          academicYearId,
          assignedByUserId: actorId,
          status: 'ACTIVE',
          reason: reason || 'Class coordinator appointment.',
        },
      });

      // 3. Update section
      const updatedSection = await tx.section.update({
        where: { id: sectionId },
        data: { coordinatorFacultyId: facultyId },
      });

      return { section: updatedSection, history };
    });

    await AuditService.log({
      userId: actorId,
      action: 'CLASS_COORDINATOR_ASSIGNED',
      entityType: 'Section',
      entityId: sectionId,
      afterState: { facultyId, reason },
      ipAddress,
    });

    return result;
  }

  static async unassignClassCoordinator(
    sectionId: string,
    actorId: string,
    reason?: string,
    ipAddress?: string
  ) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) {
      throw new AppError('Section not found.', 404, 'SECTION_NOT_FOUND');
    }

    const previousFacultyId = section.coordinatorFacultyId;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Close current coordinator history
      await tx.classCoordinatorHistory.updateMany({
        where: { sectionId, status: 'ACTIVE' },
        data: {
          endDate: new Date(),
          status: 'PAST',
          reason: reason || 'Coordinator unassigned by administrator.',
        },
      });

      // 2. Clear section coordinator
      const updatedSection = await tx.section.update({
        where: { id: sectionId },
        data: { coordinatorFacultyId: null },
      });

      return { section: updatedSection, previousFacultyId };
    });

    await AuditService.log({
      userId: actorId,
      action: 'CLASS_COORDINATOR_REMOVED',
      entityType: 'Section',
      entityId: sectionId,
      afterState: { previousFacultyId, reason },
      ipAddress,
    });

    return result;
  }

  static async getClassCoordinatorHistory(sectionId: string) {
    return prisma.classCoordinatorHistory.findMany({
      where: { sectionId },
      include: {
        faculty: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        academicYear: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  // ----------------------------------------------------
  // 4. SUBJECTS & CLASS-SUBJECT ALLOCATIONS
  // ----------------------------------------------------
  static async getSubjects(departmentId?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;

    return prisma.subject.findMany({
      where,
      include: {
        department: true,
        _count: {
          select: {
            classSubjects: true,
            facultySubjectAssignments: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  static async createSubject(
    data: {
      code: string;
      name: string;
      type?: string;
      credits?: number;
      departmentId?: string;
      description?: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    const existing = await prisma.subject.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) {
      throw new AppError(`Subject with code '${data.code}' already exists.`, 409, 'SUBJECT_CODE_EXISTS');
    }

    const subject = await prisma.subject.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        type: data.type || 'THEORY',
        credits: data.credits !== undefined ? data.credits : 3.0,
        departmentId: data.departmentId || null,
        description: data.description || null,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'SUBJECT_CREATED',
      entityType: 'Subject',
      entityId: subject.id,
      afterState: subject,
      ipAddress,
    });

    return subject;
  }

  static async updateSubject(
    id: string,
    data: { name?: string; type?: string; credits?: number; departmentId?: string; description?: string; status?: string },
    actorId: string,
    ipAddress?: string
  ) {
    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Subject not found.', 404, 'SUBJECT_NOT_FOUND');
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        type: data.type ?? existing.type,
        credits: data.credits !== undefined ? data.credits : existing.credits,
        departmentId: data.departmentId !== undefined ? data.departmentId : existing.departmentId,
        description: data.description !== undefined ? data.description : existing.description,
        status: data.status ?? existing.status,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'SUBJECT_UPDATED',
      entityType: 'Subject',
      entityId: id,
      beforeState: existing,
      afterState: updated,
      ipAddress,
    });

    return updated;
  }

  static async assignSubjectsToClass(
    academicYearId: string,
    classId: string,
    subjectIds: string[],
    actorId: string,
    ipAddress?: string
  ) {
    const targetClass = await prisma.class.findUnique({ where: { id: classId } });
    if (!targetClass) {
      throw new AppError('Class not found.', 404, 'CLASS_NOT_FOUND');
    }

    const assignments = await prisma.$transaction(async (tx) => {
      const records = [];
      for (const subjectId of subjectIds) {
        const item = await tx.classSubject.upsert({
          where: {
            academicYearId_classId_subjectId: {
              academicYearId,
              classId,
              subjectId,
            },
          },
          update: {},
          create: {
            academicYearId,
            classId,
            subjectId,
            isCompulsory: true,
          },
        });
        records.push(item);
      }
      return records;
    });

    await AuditService.log({
      userId: actorId,
      action: 'CLASS_SUBJECTS_ASSIGNED',
      entityType: 'Class',
      entityId: classId,
      afterState: { academicYearId, count: subjectIds.length },
      ipAddress,
    });

    return assignments;
  }

  static async getClassSubjects(classId: string, academicYearId?: string) {
    const where: any = { classId };
    if (academicYearId) where.academicYearId = academicYearId;

    return prisma.classSubject.findMany({
      where,
      include: {
        subject: true,
        class: true,
        academicYear: true,
      },
      orderBy: { subject: { code: 'asc' } },
    });
  }

  // ----------------------------------------------------
  // 5. FACULTY SUBJECT ASSIGNMENT & WORKLOAD
  // ----------------------------------------------------
  static async assignFacultyToSubject(
    data: {
      academicYearId: string;
      facultyId: string;
      classId: string;
      sectionId?: string;
      subjectId: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    const faculty = await prisma.faculty.findUnique({
      where: { id: data.facultyId },
      include: { user: true, department: true },
    });
    if (!faculty || faculty.status !== 'ACTIVE') {
      throw new AppError('Faculty member not found or inactive.', 400, 'INVALID_FACULTY');
    }

    const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) {
      throw new AppError('Subject not found.', 404, 'SUBJECT_NOT_FOUND');
    }

    const assignment = await prisma.facultySubjectAssignment.create({
      data: {
        academicYearId: data.academicYearId,
        facultyId: data.facultyId,
        classId: data.classId,
        sectionId: data.sectionId || null,
        subjectId: data.subjectId,
        assignedByUserId: actorId,
      },
      include: {
        faculty: { include: { user: true } },
        class: true,
        section: true,
        subject: true,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'FACULTY_SUBJECT_ASSIGNED',
      entityType: 'FacultySubjectAssignment',
      entityId: assignment.id,
      afterState: assignment,
      ipAddress,
    });

    return assignment;
  }

  static async getFacultyAssignments(filters: {
    academicYearId?: string;
    facultyId?: string;
    departmentId?: string;
    classId?: string;
  }) {
    const where: any = {};
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.facultyId) where.facultyId = filters.facultyId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.departmentId) {
      where.faculty = { departmentId: filters.departmentId };
    }

    return prisma.facultySubjectAssignment.findMany({
      where,
      include: {
        faculty: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            department: true,
          },
        },
        class: true,
        section: true,
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async deleteFacultyAssignment(id: string, actorId: string, ipAddress?: string) {
    const existing = await prisma.facultySubjectAssignment.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Faculty assignment not found.', 404, 'ASSIGNMENT_NOT_FOUND');
    }

    await prisma.facultySubjectAssignment.delete({ where: { id } });

    await AuditService.log({
      userId: actorId,
      action: 'FACULTY_SUBJECT_UNASSIGNED',
      entityType: 'FacultySubjectAssignment',
      entityId: id,
      beforeState: existing,
      ipAddress,
    });

    return { message: 'Faculty assignment successfully removed.' };
  }

  // ----------------------------------------------------
  // 6. ROOMS & TIME SLOTS
  // ----------------------------------------------------
  static async getRooms(type?: string, status?: string) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    return prisma.room.findMany({
      where,
      orderBy: { roomNumber: 'asc' },
    });
  }

  static async createRoom(
    data: {
      roomNumber: string;
      name: string;
      building: string;
      floor?: number;
      capacity?: number;
      type?: string;
      equipment?: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    const existing = await prisma.room.findUnique({ where: { roomNumber: data.roomNumber } });
    if (existing) {
      throw new AppError(`Room '${data.roomNumber}' already exists.`, 409, 'ROOM_EXISTS');
    }

    const room = await prisma.room.create({
      data: {
        roomNumber: data.roomNumber,
        name: data.name,
        building: data.building,
        floor: data.floor || 1,
        capacity: data.capacity || 60,
        type: data.type || 'CLASSROOM',
        equipment: data.equipment || null,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'ROOM_CREATED',
      entityType: 'Room',
      entityId: room.id,
      afterState: room,
      ipAddress,
    });

    return room;
  }

  static async updateRoom(
    id: string,
    data: { name?: string; building?: string; floor?: number; capacity?: number; type?: string; equipment?: string; status?: string },
    actorId: string,
    ipAddress?: string
  ) {
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Room not found.', 404, 'ROOM_NOT_FOUND');
    }

    const updated = await prisma.room.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        building: data.building ?? existing.building,
        floor: data.floor ?? existing.floor,
        capacity: data.capacity ?? existing.capacity,
        type: data.type ?? existing.type,
        equipment: data.equipment !== undefined ? data.equipment : existing.equipment,
        status: data.status ?? existing.status,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'ROOM_UPDATED',
      entityType: 'Room',
      entityId: id,
      beforeState: existing,
      afterState: updated,
      ipAddress,
    });

    return updated;
  }

  static async getTimeSlots(academicYearId: string, dayOfWeek?: string) {
    const where: any = { academicYearId };
    if (dayOfWeek) where.dayOfWeek = dayOfWeek;

    return prisma.timeSlot.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });
  }

  static async createTimeSlot(
    data: {
      academicYearId: string;
      dayOfWeek: string;
      periodNumber: number;
      name: string;
      startTime: string;
      endTime: string;
      isBreak?: boolean;
    },
    actorId: string,
    ipAddress?: string
  ) {
    const existing = await prisma.timeSlot.findUnique({
      where: {
        academicYearId_dayOfWeek_periodNumber: {
          academicYearId: data.academicYearId,
          dayOfWeek: data.dayOfWeek,
          periodNumber: data.periodNumber,
        },
      },
    });

    if (existing) {
      throw new AppError(
        `Time slot Period ${data.periodNumber} for ${data.dayOfWeek} already exists in this academic year.`,
        409,
        'TIMESLOT_EXISTS'
      );
    }

    const timeSlot = await prisma.timeSlot.create({
      data: {
        academicYearId: data.academicYearId,
        dayOfWeek: data.dayOfWeek,
        periodNumber: data.periodNumber,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        isBreak: data.isBreak || false,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'TIME_SLOT_CREATED',
      entityType: 'TimeSlot',
      entityId: timeSlot.id,
      afterState: timeSlot,
      ipAddress,
    });

    return timeSlot;
  }

  static async generateDefaultTimeSlots(
    academicYearId: string,
    days: string[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
    actorId?: string
  ) {
    const defaultPeriods = [
      { periodNumber: 1, name: 'Period 1', startTime: '08:00', endTime: '08:45', isBreak: false },
      { periodNumber: 2, name: 'Period 2', startTime: '08:45', endTime: '09:30', isBreak: false },
      { periodNumber: 3, name: 'Period 3', startTime: '09:30', endTime: '10:15', isBreak: false },
      { periodNumber: 4, name: 'Period 4', startTime: '10:30', endTime: '11:15', isBreak: false },
      { periodNumber: 5, name: 'Period 5', startTime: '11:15', endTime: '12:00', isBreak: false },
      { periodNumber: 6, name: 'Period 6', startTime: '12:45', endTime: '13:30', isBreak: false },
      { periodNumber: 7, name: 'Period 7', startTime: '13:30', endTime: '14:15', isBreak: false },
      { periodNumber: 8, name: 'Period 8', startTime: '14:15', endTime: '15:00', isBreak: false },
    ];

    const results = [];
    for (const day of days) {
      for (const p of defaultPeriods) {
        const slot = await prisma.timeSlot.upsert({
          where: {
            academicYearId_dayOfWeek_periodNumber: {
              academicYearId,
              dayOfWeek: day,
              periodNumber: p.periodNumber,
            },
          },
          update: {
            name: p.name,
            startTime: p.startTime,
            endTime: p.endTime,
            isBreak: p.isBreak,
          },
          create: {
            academicYearId,
            dayOfWeek: day,
            periodNumber: p.periodNumber,
            name: p.name,
            startTime: p.startTime,
            endTime: p.endTime,
            isBreak: p.isBreak,
          },
        });
        results.push(slot);
      }
    }

    if (actorId) {
      await AuditService.log({
        userId: actorId,
        action: 'TIME_SLOTS_INITIALIZED',
        entityType: 'AcademicYear',
        entityId: academicYearId,
        afterState: { generatedSlotsCount: results.length },
      });
    }

    return results;
  }

  static async generateTimetableGrid(
    data: {
      academicYearId: string;
      classId: string;
      sectionId: string;
      days?: string[];
      periods?: Array<{ periodNumber: number; name: string; startTime: string; endTime: string; isBreak?: boolean }>;
      forceRegenerate?: boolean;
    },
    actorId: string,
    ipAddress?: string
  ) {
    // 1. Validate Academic Year exists
    const year = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
    if (!year) {
      throw new AppError('Cannot generate timetable. Academic year not found.', 404, 'ACADEMIC_YEAR_NOT_FOUND');
    }

    // 2. Validate Class exists and belongs to year
    const classItem = await prisma.class.findFirst({
      where: { id: data.classId, academicYearId: data.academicYearId },
    });
    if (!classItem) {
      throw new AppError('Cannot generate timetable. Selected class was not found in the academic year.', 404, 'CLASS_NOT_FOUND');
    }

    // 3. Validate Section exists and belongs to class
    const section = await prisma.section.findFirst({
      where: { id: data.sectionId, classId: data.classId },
    });
    if (!section) {
      throw new AppError(`Cannot generate timetable. No active section is configured for Class ${classItem.name}.`, 404, 'SECTION_NOT_FOUND');
    }

    // 4. Default 8 periods with configurable timings
    const defaultPeriods = data.periods && data.periods.length > 0 ? data.periods : [
      { periodNumber: 1, name: 'Period 1', startTime: '08:00', endTime: '08:45', isBreak: false },
      { periodNumber: 2, name: 'Period 2', startTime: '08:45', endTime: '09:30', isBreak: false },
      { periodNumber: 3, name: 'Period 3', startTime: '09:30', endTime: '10:15', isBreak: false },
      { periodNumber: 4, name: 'Period 4', startTime: '10:30', endTime: '11:15', isBreak: false },
      { periodNumber: 5, name: 'Period 5', startTime: '11:15', endTime: '12:00', isBreak: false },
      { periodNumber: 6, name: 'Period 6', startTime: '12:45', endTime: '13:30', isBreak: false },
      { periodNumber: 7, name: 'Period 7', startTime: '13:30', endTime: '14:15', isBreak: false },
      { periodNumber: 8, name: 'Period 8', startTime: '14:15', endTime: '15:00', isBreak: false },
    ];

    // 5. Configurable working days (default Mon-Sat)
    const workingDays = data.days && data.days.length > 0
      ? data.days
      : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    // 6. Check existing timetable entries for this section
    const existingEntries = await prisma.timetableEntry.findMany({
      where: {
        academicYearId: data.academicYearId,
        classId: data.classId,
        sectionId: data.sectionId,
        status: 'ACTIVE',
      },
      include: {
        subject: true,
        faculty: { include: { user: true } },
        room: true,
        timeSlot: true,
      },
    });

    if (existingEntries.length > 0 && !data.forceRegenerate) {
      return {
        message: 'Timetable grid already exists for this class section. Existing schedule loaded.',
        alreadyExists: true,
        totalSlots: existingEntries.length,
        entries: existingEntries,
      };
    }

    // 7. Transactional Grid Generation
    const result = await prisma.$transaction(async (tx) => {
      // If forceRegenerate, clear existing entries
      if (data.forceRegenerate && existingEntries.length > 0) {
        await tx.timetableEntry.deleteMany({
          where: {
            academicYearId: data.academicYearId,
            classId: data.classId,
            sectionId: data.sectionId,
          },
        });
      }

      // Upsert TimeSlots
      const timeSlotMap = new Map<string, string>();
      for (const day of workingDays) {
        for (const p of defaultPeriods) {
          const slot = await tx.timeSlot.upsert({
            where: {
              academicYearId_dayOfWeek_periodNumber: {
                academicYearId: data.academicYearId,
                dayOfWeek: day,
                periodNumber: p.periodNumber,
              },
            },
            update: {
              name: p.name,
              startTime: p.startTime,
              endTime: p.endTime,
              isBreak: p.isBreak ?? false,
            },
            create: {
              academicYearId: data.academicYearId,
              dayOfWeek: day,
              periodNumber: p.periodNumber,
              name: p.name,
              startTime: p.startTime,
              endTime: p.endTime,
              isBreak: p.isBreak ?? false,
            },
          });
          timeSlotMap.set(`${day}_${p.periodNumber}`, slot.id);
        }
      }

      // Check if actorId corresponds to a real user in the DB
      const validActor = actorId ? await tx.user.findUnique({ where: { id: actorId }, select: { id: true } }) : null;

      // Generate empty period slots in timetable
      const createdEntries = [];
      for (const day of workingDays) {
        for (const p of defaultPeriods) {
          const slotId = timeSlotMap.get(`${day}_${p.periodNumber}`);
          if (!slotId) continue;

          const entry = await tx.timetableEntry.create({
            data: {
              academicYearId: data.academicYearId,
              departmentId: classItem.departmentId || null,
              classId: data.classId,
              sectionId: data.sectionId,
              timeSlotId: slotId,
              dayOfWeek: day,
              status: 'ACTIVE',
              createdByUserId: validActor ? validActor.id : null,
            },
            include: {
              timeSlot: true,
              class: true,
              section: true,
            },
          });
          createdEntries.push(entry);
        }
      }

      return createdEntries;
    });

    await AuditService.log({
      userId: actorId,
      action: 'TIMETABLE_GRID_GENERATED',
      entityType: 'TimetableEntry',
      entityId: data.sectionId,
      afterState: {
        academicYearId: data.academicYearId,
        classId: data.classId,
        sectionId: data.sectionId,
        slotsCount: result.length,
      },
      ipAddress,
    });

    return {
      message: `Successfully generated ${result.length} daily timetable period slots for Class ${classItem.name} (${section.name}).`,
      alreadyExists: false,
      totalSlots: result.length,
      entries: result,
    };
  }

  // ----------------------------------------------------
  // 7. FACULTY AVAILABILITY
  // ----------------------------------------------------
  static async getFacultyAvailability(facultyId: string, academicYearId: string) {
    return prisma.facultyAvailability.findMany({
      where: { facultyId, academicYearId },
      include: { timeSlot: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  static async setFacultyAvailability(
    data: {
      facultyId: string;
      academicYearId: string;
      dayOfWeek: string;
      timeSlotId?: string;
      startTime?: string;
      endTime?: string;
      isAvailable: boolean;
      reason?: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    const record = await prisma.facultyAvailability.create({
      data: {
        facultyId: data.facultyId,
        academicYearId: data.academicYearId,
        dayOfWeek: data.dayOfWeek,
        timeSlotId: data.timeSlotId || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        isAvailable: data.isAvailable,
        reason: data.reason || null,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'FACULTY_AVAILABILITY_SET',
      entityType: 'FacultyAvailability',
      entityId: record.id,
      afterState: record,
      ipAddress,
    });

    return record;
  }

  // ----------------------------------------------------
  // 8. TIMETABLE ENGINE WITH 5-WAY CONFLICT DETECTION
  // ----------------------------------------------------
  static async checkTimetableConflicts(data: {
    academicYearId: string;
    classId?: string;
    sectionId?: string;
    subjectId?: string;
    facultyId?: string;
    roomId?: string;
    timeSlotId: string;
    dayOfWeek: string;
    excludeEntryId?: string;
  }) {
    const slot = await prisma.timeSlot.findUnique({ where: { id: data.timeSlotId } });
    if (!slot) {
      return { hasConflict: true, type: 'INVALID_SLOT', message: 'Selected time slot does not exist.' };
    }

    if (slot.isBreak) {
      return { hasConflict: true, type: 'BREAK_SLOT', message: `Cannot schedule classes during '${slot.name}'.` };
    }

    const whereBase: any = {
      academicYearId: data.academicYearId,
      timeSlotId: data.timeSlotId,
      status: 'ACTIVE',
    };
    if (data.excludeEntryId) {
      whereBase.id = { not: data.excludeEntryId };
    }

    // 1. Faculty Overlap Collision
    if (data.facultyId) {
      const facultyConflict = await prisma.timetableEntry.findFirst({
        where: {
          ...whereBase,
          facultyId: data.facultyId,
        },
        include: {
          class: true,
          section: true,
          subject: true,
          faculty: { include: { user: true } },
        },
      });
      if (facultyConflict) {
        return {
          hasConflict: true,
          type: 'FACULTY_CONFLICT',
          message: 'Faculty is already assigned to another class during this period.',
          conflictingEntry: facultyConflict,
        };
      }
    }

    // 2. Room Collision
    if (data.roomId) {
      const roomConflict = await prisma.timetableEntry.findFirst({
        where: {
          ...whereBase,
          roomId: data.roomId,
        },
        include: {
          class: true,
          section: true,
          room: true,
        },
      });
      if (roomConflict) {
        return {
          hasConflict: true,
          type: 'ROOM_CONFLICT',
          message: `Room is already occupied by another class during this period.`,
          conflictingEntry: roomConflict,
        };
      }
    }

    // 3. Section Collision
    if (data.sectionId) {
      const sectionConflict = await prisma.timetableEntry.findFirst({
        where: {
          ...whereBase,
          sectionId: data.sectionId,
          subjectId: { not: null },
        },
        include: {
          subject: true,
          section: true,
        },
      });
      if (sectionConflict) {
        return {
          hasConflict: true,
          type: 'SECTION_CONFLICT',
          message: `This class section already has a subject scheduled for this period.`,
          conflictingEntry: sectionConflict,
        };
      }
    }

    // 4. Faculty Leave Collision (Active Approved Leaves)
    if (data.facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: data.facultyId },
        include: { user: true },
      });

      if (faculty) {
        const activeLeave = await prisma.facultyLeave.findFirst({
          where: {
            userId: faculty.userId,
            status: 'APPROVED',
          },
        });
        if (activeLeave && activeLeave.totalDays > 30) {
          return {
            hasConflict: true,
            type: 'FACULTY_LEAVE_CONFLICT',
            message: `Faculty ${faculty.user.firstName} ${faculty.user.lastName} is currently on approved long-term leave (${activeLeave.leaveType}).`,
          };
        }
      }

      // 5. Faculty Availability Violation
      const unavailableSlot = await prisma.facultyAvailability.findFirst({
        where: {
          facultyId: data.facultyId,
          academicYearId: data.academicYearId,
          dayOfWeek: data.dayOfWeek,
          isAvailable: false,
          OR: [
            { timeSlotId: data.timeSlotId },
            { timeSlotId: null },
          ],
        },
      });
      if (unavailableSlot) {
        return {
          hasConflict: true,
          type: 'AVAILABILITY_CONFLICT',
          message: `Faculty is marked unavailable on ${data.dayOfWeek}${unavailableSlot.reason ? ` (${unavailableSlot.reason})` : ''}.`,
        };
      }

      // 6. Faculty Subject Assignment Eligibility (if assignments exist for this class)
      if (data.classId && data.subjectId) {
        const classSubjectAssignments = await prisma.facultySubjectAssignment.findMany({
          where: {
            academicYearId: data.academicYearId,
            classId: data.classId,
            subjectId: data.subjectId,
            status: 'ACTIVE',
          },
        });
        if (classSubjectAssignments.length > 0) {
          const isAssigned = classSubjectAssignments.some((a) => a.facultyId === data.facultyId);
          if (!isAssigned) {
            return {
              hasConflict: true,
              type: 'FACULTY_ELIGIBILITY_CONFLICT',
              message: 'Selected faculty is not authorized/assigned to teach this subject for this class.',
            };
          }
        }
      }
    }

    return { hasConflict: false };
  }

  static async getTimetable(filters: {
    academicYearId: string;
    departmentId?: string;
    classId?: string;
    sectionId?: string;
    facultyId?: string;
    roomId?: string;
    dayOfWeek?: string;
  }) {
    const where: any = {
      academicYearId: filters.academicYearId,
      status: 'ACTIVE',
    };

    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.classId) where.classId = filters.classId;
    if (filters.sectionId) where.sectionId = filters.sectionId;
    if (filters.facultyId) where.facultyId = filters.facultyId;
    if (filters.roomId) where.roomId = filters.roomId;
    if (filters.dayOfWeek) where.dayOfWeek = filters.dayOfWeek;

    return prisma.timetableEntry.findMany({
      where,
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
        timeSlot: true,
        faculty: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            department: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { timeSlot: { periodNumber: 'asc' } },
      ],
    });
  }

  static async createTimetableEntry(
    data: {
      academicYearId: string;
      departmentId?: string;
      classId: string;
      sectionId: string;
      subjectId: string;
      facultyId: string;
      roomId: string;
      timeSlotId: string;
      dayOfWeek: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    // Run 5-way backend conflict detection
    const conflict = await this.checkTimetableConflicts(data);
    if (conflict.hasConflict) {
      throw new AppError(conflict.message || 'Timetable scheduling conflict detected.', 409, conflict.type || 'TIMETABLE_CONFLICT');
    }

    const section = await prisma.section.findUnique({
      where: { id: data.sectionId },
      include: { class: true },
    });
    const departmentId = data.departmentId || section?.class.departmentId || null;

    const validActor = actorId ? await prisma.user.findUnique({ where: { id: actorId }, select: { id: true } }) : null;

    const entry = await prisma.timetableEntry.create({
      data: {
        academicYearId: data.academicYearId,
        departmentId: departmentId,
        classId: data.classId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        facultyId: data.facultyId,
        roomId: data.roomId,
        timeSlotId: data.timeSlotId,
        dayOfWeek: data.dayOfWeek,
        createdByUserId: validActor ? validActor.id : null,
      },
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
        timeSlot: true,
        faculty: { include: { user: true } },
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'TIMETABLE_ENTRY_CREATED',
      entityType: 'TimetableEntry',
      entityId: entry.id,
      afterState: entry,
      ipAddress,
    });

    return entry;
  }

  static async updateTimetableEntry(
    id: string,
    data: {
      subjectId?: string;
      facultyId?: string;
      roomId?: string;
      timeSlotId?: string;
      dayOfWeek?: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    const existing = await prisma.timetableEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Timetable entry not found.', 404, 'TIMETABLE_ENTRY_NOT_FOUND');
    }

    const checkData = {
      academicYearId: existing.academicYearId,
      classId: existing.classId,
      sectionId: existing.sectionId,
      subjectId: (data.subjectId || existing.subjectId) || undefined,
      facultyId: (data.facultyId || existing.facultyId) || undefined,
      roomId: (data.roomId || existing.roomId) || undefined,
      timeSlotId: data.timeSlotId || existing.timeSlotId,
      dayOfWeek: data.dayOfWeek || existing.dayOfWeek,
      excludeEntryId: id,
    };

    const conflict = await this.checkTimetableConflicts(checkData);
    if (conflict.hasConflict) {
      throw new AppError(conflict.message || 'Timetable conflict detected.', 409, conflict.type || 'TIMETABLE_CONFLICT');
    }

    const updated = await prisma.timetableEntry.update({
      where: { id },
      data: {
        subjectId: data.subjectId ?? existing.subjectId,
        facultyId: data.facultyId ?? existing.facultyId,
        roomId: data.roomId ?? existing.roomId,
        timeSlotId: data.timeSlotId ?? existing.timeSlotId,
        dayOfWeek: data.dayOfWeek ?? existing.dayOfWeek,
      },
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
        timeSlot: true,
        faculty: { include: { user: true } },
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'TIMETABLE_ENTRY_UPDATED',
      entityType: 'TimetableEntry',
      entityId: id,
      beforeState: existing,
      afterState: updated,
      ipAddress,
    });

    return updated;
  }

  static async deleteTimetableEntry(id: string, actorId: string, ipAddress?: string) {
    const existing = await prisma.timetableEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Timetable entry not found.', 404, 'TIMETABLE_ENTRY_NOT_FOUND');
    }

    await prisma.timetableEntry.delete({ where: { id } });

    await AuditService.log({
      userId: actorId,
      action: 'TIMETABLE_ENTRY_DELETED',
      entityType: 'TimetableEntry',
      entityId: id,
      beforeState: existing,
      ipAddress,
    });

    return { message: 'Timetable entry successfully removed.' };
  }

  // ----------------------------------------------------
  // 9. EXTRA / SPECIAL CLASSES
  // ----------------------------------------------------
  static async requestExtraClass(
    data: {
      academicYearId: string;
      classId: string;
      sectionId: string;
      subjectId: string;
      facultyId: string;
      roomId: string;
      date: string;
      timeSlotId?: string;
      startTime: string;
      endTime: string;
      reason: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    // Check room collision on that date & time
    const existingRoom = await prisma.extraClassRequest.findFirst({
      where: {
        roomId: data.roomId,
        date: data.date,
        startTime: data.startTime,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (existingRoom) {
      throw new AppError('The selected room is already scheduled for an extra session at this time.', 409, 'ROOM_EXTRA_CLASS_CONFLICT');
    }

    const request = await prisma.extraClassRequest.create({
      data: {
        academicYearId: data.academicYearId,
        classId: data.classId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        facultyId: data.facultyId,
        roomId: data.roomId,
        date: data.date,
        timeSlotId: data.timeSlotId || null,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
        status: ExtraClassStatusEnum.PENDING,
        requestedByUserId: actorId,
      },
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
        faculty: { include: { user: true } },
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'EXTRA_CLASS_REQUESTED',
      entityType: 'ExtraClassRequest',
      entityId: request.id,
      afterState: request,
      ipAddress,
    });

    return request;
  }

  static async getExtraClassRequests(filters: {
    academicYearId?: string;
    departmentId?: string;
    status?: string;
    facultyId?: string;
  }) {
    const where: any = {};
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.status) where.status = filters.status;
    if (filters.facultyId) where.facultyId = filters.facultyId;
    if (filters.departmentId) {
      where.faculty = { departmentId: filters.departmentId };
    }

    return prisma.extraClassRequest.findMany({
      where,
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
        timeSlot: true,
        faculty: { include: { user: true } },
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async reviewExtraClassRequest(
    id: string,
    action: 'APPROVED' | 'REJECTED',
    reviewNotes?: string,
    actorId?: string,
    ipAddress?: string
  ) {
    const req = await prisma.extraClassRequest.findUnique({ where: { id } });
    if (!req) {
      throw new AppError('Extra class request not found.', 404, 'EXTRA_CLASS_NOT_FOUND');
    }

    const updated = await prisma.extraClassRequest.update({
      where: { id },
      data: {
        status: action,
        reviewedByUserId: actorId || null,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date(),
      },
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
        faculty: { include: { user: true } },
      },
    });

    await AuditService.log({
      userId: actorId || 'SYSTEM',
      action: `EXTRA_CLASS_${action}`,
      entityType: 'ExtraClassRequest',
      entityId: id,
      beforeState: req,
      afterState: updated,
      ipAddress,
    });

    return updated;
  }

  // ----------------------------------------------------
  // 10. SUBSTITUTE FACULTY ASSIGNMENT
  // ----------------------------------------------------
  static async assignSubstituteFaculty(
    data: {
      timetableEntryId?: string;
      originalFacultyId: string;
      substituteFacultyId: string;
      date: string;
      classId: string;
      sectionId: string;
      subjectId: string;
      timeSlotId: string;
      roomId?: string;
      reason: string;
    },
    actorId: string,
    ipAddress?: string
  ) {
    if (data.originalFacultyId === data.substituteFacultyId) {
      throw new AppError('Original faculty and substitute faculty cannot be the same person.', 400, 'SAME_FACULTY');
    }

    const substitute = await prisma.faculty.findUnique({
      where: { id: data.substituteFacultyId },
      include: { user: true },
    });
    if (!substitute || substitute.status !== 'ACTIVE') {
      throw new AppError('Substitute faculty is invalid or inactive.', 400, 'INVALID_SUBSTITUTE');
    }

    // Check if substitute faculty is teaching another class at that time slot
    const regularTeachingClash = await prisma.timetableEntry.findFirst({
      where: {
        facultyId: data.substituteFacultyId,
        timeSlotId: data.timeSlotId,
        status: 'ACTIVE',
      },
    });
    if (regularTeachingClash) {
      throw new AppError(
        `Substitute faculty is already scheduled to teach another regular lecture at this period.`,
        409,
        'SUBSTITUTE_TEACHING_CLASH'
      );
    }

    // Check if substitute is already assigned to another substitute lecture on that date & slot
    const existingSub = await prisma.substituteFacultyAssignment.findFirst({
      where: {
        substituteFacultyId: data.substituteFacultyId,
        date: data.date,
        timeSlotId: data.timeSlotId,
        status: 'CONFIRMED',
      },
    });
    if (existingSub) {
      throw new AppError(
        'Substitute faculty is already allocated as a substitute for another class at this period.',
        409,
        'SUBSTITUTE_ALREADY_BOOKED'
      );
    }

    const assignment = await prisma.substituteFacultyAssignment.create({
      data: {
        timetableEntryId: data.timetableEntryId || null,
        originalFacultyId: data.originalFacultyId,
        substituteFacultyId: data.substituteFacultyId,
        date: data.date,
        classId: data.classId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        timeSlotId: data.timeSlotId,
        roomId: data.roomId || null,
        reason: data.reason,
        assignedByUserId: actorId,
        status: SubstituteStatusEnum.CONFIRMED,
      },
      include: {
        originalFaculty: { include: { user: true } },
        substituteFaculty: { include: { user: true } },
        class: true,
        section: true,
        subject: true,
        timeSlot: true,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'SUBSTITUTE_FACULTY_ASSIGNED',
      entityType: 'SubstituteFacultyAssignment',
      entityId: assignment.id,
      afterState: assignment,
      ipAddress,
    });

    return assignment;
  }

  static async getSubstituteAssignments(filters: {
    date?: string;
    classId?: string;
    facultyId?: string;
  }) {
    const where: any = {};
    if (filters.date) where.date = filters.date;
    if (filters.classId) where.classId = filters.classId;
    if (filters.facultyId) {
      where.OR = [
        { originalFacultyId: filters.facultyId },
        { substituteFacultyId: filters.facultyId },
      ];
    }

    return prisma.substituteFacultyAssignment.findMany({
      where,
      include: {
        originalFaculty: { include: { user: true } },
        substituteFaculty: { include: { user: true } },
        class: true,
        section: true,
        subject: true,
        timeSlot: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  // ----------------------------------------------------
  // 11. DASHBOARDS
  // ----------------------------------------------------
  static async getHodDashboard(departmentId: string, academicYearId?: string) {
    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        hod: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!dept) {
      throw new AppError('Department not found.', 404, 'DEPT_NOT_FOUND');
    }

    // Counts
    const [facultyCount, studentCount, classesCount, subjectsCount] = await Promise.all([
      prisma.faculty.count({ where: { departmentId, status: 'ACTIVE' } }),
      prisma.student.count({ where: { departmentId, status: 'ACTIVE' } }),
      prisma.class.count({ where: { departmentId } }),
      prisma.subject.count({ where: { departmentId, status: 'ACTIVE' } }),
    ]);

    // Faculty members and their leave status
    const facultyMembers = await prisma.faculty.findMany({
      where: { departmentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    const activeLeaves = await prisma.facultyLeave.findMany({
      where: {
        status: 'APPROVED',
        user: { facultyProfile: { departmentId } },
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const pendingExtraClasses = await prisma.extraClassRequest.findMany({
      where: {
        status: 'PENDING',
        faculty: { departmentId },
      },
      include: {
        class: true,
        section: true,
        subject: true,
        room: true,
        faculty: { include: { user: true } },
      },
    });

    return {
      department: dept,
      stats: {
        facultyCount,
        studentCount,
        classesCount,
        subjectsCount,
        activeLeavesCount: activeLeaves.length,
        pendingExtraClassesCount: pendingExtraClasses.length,
      },
      facultyMembers,
      activeLeaves,
      pendingExtraClasses,
    };
  }

  static async getFacultyAcademicDashboard(userId: string, academicYearId?: string) {
    const faculty = await prisma.faculty.findUnique({
      where: { userId },
      include: {
        department: true,
        coordinatorHistories: {
          where: { status: 'ACTIVE' },
          include: {
            section: { include: { class: true } },
          },
        },
      },
    });

    if (!faculty) {
      throw new AppError('Faculty profile not found for authenticated user.', 404, 'FACULTY_NOT_FOUND');
    }

    const whereTimetable: any = {
      facultyId: faculty.id,
      status: 'ACTIVE',
    };
    if (academicYearId) whereTimetable.academicYearId = academicYearId;

    const [timetableEntries, subjectAssignments, extraClasses, substituteLectures] = await Promise.all([
      prisma.timetableEntry.findMany({
        where: whereTimetable,
        include: {
          class: true,
          section: true,
          subject: true,
          room: true,
          timeSlot: true,
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { timeSlot: { periodNumber: 'asc' } },
        ],
      }),
      prisma.facultySubjectAssignment.findMany({
        where: { facultyId: faculty.id },
        include: {
          class: true,
          section: true,
          subject: true,
        },
      }),
      prisma.extraClassRequest.findMany({
        where: { facultyId: faculty.id },
        include: {
          class: true,
          section: true,
          subject: true,
          room: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.substituteFacultyAssignment.findMany({
        where: { substituteFacultyId: faculty.id },
        include: {
          originalFaculty: { include: { user: true } },
          class: true,
          section: true,
          subject: true,
          timeSlot: true,
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    return {
      faculty,
      isCoordinator: faculty.coordinatorHistories.length > 0,
      coordinatedSections: faculty.coordinatorHistories.map((c) => ({
        sectionId: c.sectionId,
        sectionName: c.section.name,
        className: c.section.class.name,
      })),
      subjectAssignments,
      timetableEntries,
      extraClasses,
      substituteLectures,
    };
  }

  // ----------------------------------------------------
  // 12. STUDENTS ADMISSION INTAKE & MANAGEMENT (RETAINED FROM PHASE 3)
  // ----------------------------------------------------
  static async admitStudent(
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      whatsAppNumber: string;
      altPhone?: string;
      dateOfBirth?: string;
      gender?: string;
      bloodGroup?: string;
      address?: string;
      emergencyContact?: string;
      admissionNumber?: string;
      enrollmentNumber?: string;
      rollNumber?: string;
      academicYearId?: string;
      departmentId?: string;
      sectionId: string;
      previousSchool?: string;
      previousGrade?: string;
      previousScore?: string;
      photoUrl?: string;
      guardian: {
        fullName: string;
        relationship: string;
        phone: string;
        email?: string;
        occupation?: string;
        address?: string;
      };
    },
    actorId: string,
    ipAddress?: string
  ) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existingEmail) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }

    const section = await prisma.section.findUnique({
      where: { id: data.sectionId },
      include: { class: { include: { academicYear: true } } },
    });
    if (!section) {
      throw new AppError('Invalid section ID provided.', 404, 'SECTION_NOT_FOUND');
    }

    const departmentId = data.departmentId || section.class.departmentId || null;
    const academicYearId = data.academicYearId || section.class.academicYearId;

    const initialPassword = 'Student@Secure2026!';
    const passwordHash = await hashPassword(initialPassword);

    const studentRole =
      (await prisma.role.findUnique({ where: { name: UserRoleEnum.STUDENT } })) ||
      (await prisma.role.findUnique({ where: { name: 'STUDENT' } }));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Permanent 5-digit Campus ID Sequential Generation (00001, 00002...)
      let campusSeqSetting = await tx.systemSetting.findUnique({
        where: { key: 'STUDENT_CAMPUS_ID_SEQUENCE' },
      });
      if (!campusSeqSetting) {
        campusSeqSetting = await tx.systemSetting.create({
          data: {
            key: 'STUDENT_CAMPUS_ID_SEQUENCE',
            value: '1',
            category: 'SYSTEM',
            description: 'Global atomic sequential counter for permanent 5-digit Student Campus IDs',
          },
        });
      }
      const currentCampusSeq = parseInt(campusSeqSetting.value, 10) || 1;
      const campusId = String(currentCampusSeq).padStart(5, '0');

      // Increment sequence atomically for the next student
      await tx.systemSetting.update({
        where: { key: 'STUDENT_CAMPUS_ID_SEQUENCE' },
        data: { value: String(currentCampusSeq + 1) },
      });

      // 2. Academic Year Enrollment Number Generation (<Prefix><Sequence>)
      const targetYear = await tx.academicYear.findUnique({ where: { id: academicYearId } });
      let finalEnrollmentNumber = data.enrollmentNumber;

      if (!finalEnrollmentNumber) {
        const prefix = targetYear?.enrollmentPrefix || '26';
        const seqLen = targetYear?.enrollmentSeqLength || 4;
        const currentYearSeq = targetYear?.nextEnrollmentSeq || 1;

        finalEnrollmentNumber = `${prefix}${String(currentYearSeq).padStart(seqLen, '0')}`;

        if (targetYear) {
          await tx.academicYear.update({
            where: { id: academicYearId },
            data: { nextEnrollmentSeq: currentYearSeq + 1 },
          });
        }
      }

      // Check enrollment number uniqueness
      const existingEnr = await tx.student.findUnique({ where: { enrollmentNumber: finalEnrollmentNumber } });
      if (existingEnr) {
        throw new AppError(`Enrollment number '${finalEnrollmentNumber}' is already in use.`, 409, 'ENROLLMENT_NUM_EXISTS');
      }

      // 3. Admission Number (ADM-YYYY-XXXX or user provided)
      const finalAdmissionNumber = data.admissionNumber || `ADM-${targetYear?.name?.slice(0, 4) || '2026'}-${campusId}`;
      const existingAdm = await tx.student.findUnique({ where: { admissionNumber: finalAdmissionNumber } });
      if (existingAdm) {
        throw new AppError(`Student with admission number '${finalAdmissionNumber}' already exists.`, 409, 'ADMISSION_NUM_EXISTS');
      }

      const username = `std_${finalAdmissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      // 4. Create User
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          username,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          whatsAppNumber: data.whatsAppNumber,
          altPhone: data.altPhone || null,
          dob: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          address: data.address || null,
          userCategory: 'STUDENT',
          status: UserStatusEnum.ACTIVE,
          activeRole: 'STUDENT',
        },
      });

      if (studentRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: studentRole.id,
            departmentId,
            isPrimary: true,
            assignedBy: actorId,
          },
        });
      }

      // 5. Create Student record with permanent campusId and academic enrollmentNumber
      const student = await tx.student.create({
        data: {
          userId: user.id,
          campusId,
          admissionNumber: finalAdmissionNumber,
          enrollmentNumber: finalEnrollmentNumber,
          rollNumber: data.rollNumber || null,
          academicYearId,
          departmentId,
          sectionId: data.sectionId,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          bloodGroup: data.bloodGroup || null,
          emergencyContact: data.emergencyContact || null,
          previousSchool: data.previousSchool || null,
          previousGrade: data.previousGrade || null,
          previousScore: data.previousScore || null,
          photoUrl: data.photoUrl || null,
          status: StudentStatusEnum.ACTIVE,
        },
      });

      // 6. Create Primary Guardian if provided
      if (data.guardian && data.guardian.fullName) {
        await tx.guardian.create({
          data: {
            studentId: student.id,
            fullName: data.guardian.fullName,
            relationship: data.guardian.relationship || 'GUARDIAN',
            phone: data.guardian.phone || '—',
            email: data.guardian.email || null,
            occupation: data.guardian.occupation || null,
            address: data.guardian.address || null,
            isPrimary: true,
          },
        });
      }

      // Check if actorId exists in user table
      const validActor = actorId ? await tx.user.findUnique({ where: { id: actorId }, select: { id: true } }) : null;

      // 7. Initial Enrollment Log
      await tx.studentTransferLog.create({
        data: {
          studentId: student.id,
          toAcademicYearId: academicYearId,
          toDepartmentId: departmentId,
          toClassId: section.classId,
          toSectionId: section.id,
          toStatus: StudentStatusEnum.ACTIVE,
          transferType: 'PROMOTION',
          reason: 'Initial intake enrollment & section allocation.',
          transferredByUserId: validActor ? validActor.id : null,
        },
      });

      return { user, student };
    });

    await AuditService.log({
      userId: actorId,
      action: 'STUDENT_ADMITTED',
      entityType: 'Student',
      entityId: result.student.id,
      afterState: {
        campusId: result.student.campusId,
        admissionNumber: result.student.admissionNumber,
        enrollmentNumber: result.student.enrollmentNumber,
        sectionId: data.sectionId,
        classId: section.classId,
      },
      ipAddress,
    });

    return result;
  }

  static async getStudents(query: {
    page?: number;
    limit?: number;
    search?: string;
    sectionId?: string;
    classId?: string;
    departmentId?: string;
    academicYearId?: string;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.classId) where.section = { classId: query.classId };
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.academicYearId) where.academicYearId = query.academicYearId;

    if (query.search) {
      const s = query.search.trim();
      const sDigits = s.replace(/[^0-9a-zA-Z]/g, '');
      where.OR = [
        { campusId: { contains: s } },
        { admissionNumber: { contains: s } },
        { enrollmentNumber: { contains: s } },
        { rollNumber: { contains: s } },
        { user: { firstName: { contains: s } } },
        { user: { lastName: { contains: s } } },
        { user: { email: { contains: s } } },
        { user: { whatsAppNumber: { contains: s } } },
        { user: { phone: { contains: s } } },
        ...(sDigits.length >= 3
          ? [
              { user: { whatsAppNumber: { contains: sDigits } } },
              { user: { phone: { contains: sDigits } } },
            ]
          : []),
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              whatsAppNumber: true,
              address: true,
            },
          },
          academicYear: true,
          department: true,
          section: {
            include: {
              class: true,
            },
          },
          guardians: true,
        },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      students,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getStudentById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            whatsAppNumber: true,
            altPhone: true,
            address: true,
            dob: true,
            gender: true,
          },
        },
        academicYear: true,
        department: true,
        section: {
          include: {
            class: true,
          },
        },
        guardians: true,
        transferHistory: {
          orderBy: { effectiveDate: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const [presentCount, lateCount, absentCount] = await Promise.all([
      prisma.attendance.count({ where: { userId: student.userId, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { userId: student.userId, status: 'LATE' } }),
      prisma.attendance.count({ where: { userId: student.userId, status: 'ABSENT' } }),
    ]);

    return {
      ...student,
      attendanceSummary: {
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        totalMarked: presentCount + lateCount + absentCount,
      },
    };
  }

  static async transferStudent(params: {
    studentId: string;
    toAcademicYearId?: string;
    toDepartmentId?: string;
    toClassId?: string;
    toSectionId: string;
    transferType: string;
    reason: string;
    actorId: string;
    ipAddress?: string;
  }) {
    const student = await prisma.student.findUnique({
      where: { id: params.studentId },
      include: { section: true },
    });

    if (!student) {
      throw new AppError('Student record not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const newSection = await prisma.section.findUnique({
      where: { id: params.toSectionId },
      include: { class: true },
    });

    if (!newSection) {
      throw new AppError('Destination section not found.', 404, 'SECTION_NOT_FOUND');
    }

    const fromSectionId = student.sectionId;
    const fromClassId = student.section?.classId;
    const fromDeptId = student.departmentId;
    const fromYearId = student.academicYearId;

    const toDeptId = params.toDepartmentId || newSection.class.departmentId || null;
    const toYearId = params.toAcademicYearId || newSection.class.academicYearId;

    const updated = await prisma.$transaction(async (tx) => {
      let newEnrollmentNumber = student.enrollmentNumber;

      // If moving to a new academic year (Promotion/Year transfer), issue new academic year enrollment number
      if (toYearId && toYearId !== fromYearId) {
        const destYear = await tx.academicYear.findUnique({ where: { id: toYearId } });
        if (destYear) {
          const prefix = destYear.enrollmentPrefix || '27';
          const seqLen = destYear.enrollmentSeqLength || 4;
          const currentSeq = destYear.nextEnrollmentSeq || 1;
          newEnrollmentNumber = `${prefix}${String(currentSeq).padStart(seqLen, '0')}`;

          await tx.academicYear.update({
            where: { id: toYearId },
            data: { nextEnrollmentSeq: currentSeq + 1 },
          });
        }
      }

      const s = await tx.student.update({
        where: { id: student.id },
        data: {
          sectionId: newSection.id,
          departmentId: toDeptId,
          academicYearId: toYearId,
          enrollmentNumber: newEnrollmentNumber,
          status: StudentStatusEnum.ACTIVE,
        },
      });

      const validActor = params.actorId ? await tx.user.findUnique({ where: { id: params.actorId }, select: { id: true } }) : null;

      await tx.studentTransferLog.create({
        data: {
          studentId: student.id,
          fromAcademicYearId: fromYearId,
          toAcademicYearId: toYearId,
          fromDepartmentId: fromDeptId,
          toDepartmentId: toDeptId,
          fromClassId: fromClassId,
          toClassId: newSection.classId,
          fromSectionId,
          toSectionId: newSection.id,
          fromStatus: student.status,
          toStatus: StudentStatusEnum.ACTIVE,
          transferType: params.transferType || StudentTransferTypeEnum.SECTION_TRANSFER,
          reason: params.reason,
          transferredByUserId: validActor ? validActor.id : null,
        },
      });

      return s;
    });

    await AuditService.log({
      userId: params.actorId,
      action: `STUDENT_${params.transferType || 'TRANSFER'}`,
      entityType: 'Student',
      entityId: student.id,
      beforeState: { sectionId: fromSectionId, classId: fromClassId },
      afterState: { sectionId: newSection.id, classId: newSection.classId },
      ipAddress: params.ipAddress,
    });

    return updated;
  }

  static async updateStudentStatus(params: {
    studentId: string;
    status: string;
    reason: string;
    actorId: string;
    ipAddress?: string;
  }) {
    const validStatuses = Object.values(StudentStatusEnum);
    if (!validStatuses.includes(params.status as any)) {
      throw new AppError(`Invalid student status: ${params.status}`, 400, 'INVALID_STATUS');
    }

    const student = await prisma.student.findUnique({
      where: { id: params.studentId },
      include: { section: true },
    });

    if (!student) {
      throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const oldStatus = student.status;
    const newStatus = params.status;

    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: student.id },
        data: {
          status: newStatus,
          sectionId:
            newStatus === StudentStatusEnum.LEFT_INSTITUTION || newStatus === StudentStatusEnum.GRADUATED
              ? null
              : student.sectionId,
        },
      });

      if (
        newStatus === StudentStatusEnum.LEFT_INSTITUTION ||
        newStatus === StudentStatusEnum.INACTIVE ||
        newStatus === StudentStatusEnum.SUSPENDED
      ) {
        await tx.user.update({
          where: { id: student.userId },
          data: { status: UserStatusEnum.INACTIVE },
        });
      } else if (newStatus === StudentStatusEnum.ACTIVE) {
        await tx.user.update({
          where: { id: student.userId },
          data: { status: UserStatusEnum.ACTIVE },
        });
      }

      await tx.studentTransferLog.create({
        data: {
          studentId: student.id,
          fromAcademicYearId: student.academicYearId,
          toAcademicYearId: student.academicYearId,
          fromDepartmentId: student.departmentId,
          toDepartmentId: student.departmentId,
          fromClassId: student.section?.classId,
          toClassId: student.section?.classId,
          fromSectionId: student.sectionId,
          toSectionId: student.sectionId,
          fromStatus: oldStatus,
          toStatus: newStatus,
          transferType: StudentTransferTypeEnum.STATUS_CHANGE,
          reason: params.reason || `Status updated from ${oldStatus} to ${newStatus}`,
          transferredByUserId: params.actorId,
        },
      });
    });

    await AuditService.log({
      userId: params.actorId,
      action: 'STUDENT_STATUS_CHANGED',
      entityType: 'Student',
      entityId: student.id,
      beforeState: { status: oldStatus },
      afterState: { status: newStatus, reason: params.reason },
      ipAddress: params.ipAddress,
    });

    return { message: `Student status successfully updated to ${newStatus}.`, status: newStatus };
  }

  static async uploadDocument(params: {
    studentId: string;
    docType: string;
    title: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    actorId: string;
    ipAddress?: string;
  }) {
    const student = await prisma.student.findUnique({ where: { id: params.studentId } });
    if (!student) {
      throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
    }

    const doc = await prisma.studentDocument.create({
      data: {
        studentId: params.studentId,
        docType: params.docType,
        title: params.title,
        fileUrl: params.fileUrl,
        fileSize: params.fileSize || null,
        mimeType: params.mimeType || 'application/pdf',
        uploadedByUserId: params.actorId,
      },
    });

    await AuditService.log({
      userId: params.actorId,
      action: 'STUDENT_DOCUMENT_UPLOADED',
      entityType: 'StudentDocument',
      entityId: doc.id,
      afterState: { docType: params.docType, title: params.title },
      ipAddress: params.ipAddress,
    });

    return doc;
  }
}
