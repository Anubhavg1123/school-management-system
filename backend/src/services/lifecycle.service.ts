import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class LifecycleService {
  /**
   * Update student lifecycle status with historical tracking
   */
  async updateStudentStatus(studentId: string, newStatus: string, reason?: string) {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'LEFT_INSTITUTION', 'GRADUATED', 'SUSPENDED'];
    if (!validStatuses.includes(newStatus)) {
      throw new AppError(`Invalid student status '${newStatus}'. Allowed: ${validStatuses.join(', ')}`, 400);
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new AppError('Student not found.', 404);
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { status: newStatus },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });

    return updated;
  }

  /**
   * Manage student exit clearance checklist
   */
  async processStudentExitChecklist(data: {
    studentId: string;
    feeClearance?: boolean;
    libraryClearance?: boolean;
    assetClearance?: boolean;
    documentClearance?: boolean;
    idCardReturned?: boolean;
    remarks?: string;
    approvedByUserId?: string;
  }) {
    const student = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) {
      throw new AppError('Student not found.', 404);
    }

    const feeClearance = data.feeClearance ?? false;
    const libraryClearance = data.libraryClearance ?? false;
    const assetClearance = data.assetClearance ?? false;
    const documentClearance = data.documentClearance ?? false;
    const idCardReturned = data.idCardReturned ?? false;

    const allCleared = feeClearance && libraryClearance && assetClearance && documentClearance && idCardReturned;

    const checklist = await prisma.studentExitChecklist.upsert({
      where: { studentId: data.studentId },
      update: {
        feeClearance,
        libraryClearance,
        assetClearance,
        documentClearance,
        idCardReturned,
        status: allCleared ? 'APPROVED' : 'PENDING',
        remarks: data.remarks,
        approvedByUserId: data.approvedByUserId,
        exitDate: allCleared ? new Date() : null,
      },
      create: {
        studentId: data.studentId,
        feeClearance,
        libraryClearance,
        assetClearance,
        documentClearance,
        idCardReturned,
        status: allCleared ? 'APPROVED' : 'PENDING',
        remarks: data.remarks,
        approvedByUserId: data.approvedByUserId,
        exitDate: allCleared ? new Date() : null,
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });

    if (allCleared) {
      await prisma.student.update({
        where: { id: data.studentId },
        data: { status: 'LEFT_INSTITUTION' },
      });
    }

    return checklist;
  }

  /**
   * Create or update an alumni profile
   */
  async createAlumniProfile(data: {
    studentId: string;
    graduationYear: number;
    programName: string;
    currentCompany?: string;
    currentRole?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
  }) {
    const student = await prisma.student.findUnique({ where: { id: data.studentId } });
    if (!student) {
      throw new AppError('Student not found.', 404);
    }

    const alumni = await prisma.alumniProfile.upsert({
      where: { studentId: data.studentId },
      update: {
        graduationYear: data.graduationYear,
        programName: data.programName,
        currentCompany: data.currentCompany,
        currentRole: data.currentRole,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        notes: data.notes,
      },
      create: {
        studentId: data.studentId,
        graduationYear: data.graduationYear,
        programName: data.programName,
        currentCompany: data.currentCompany,
        currentRole: data.currentRole,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        notes: data.notes,
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });

    await prisma.student.update({
      where: { id: data.studentId },
      data: { status: 'GRADUATED' },
    });

    return alumni;
  }

  /**
   * Get all alumni profiles
   */
  async getAlumniProfiles(graduationYear?: number) {
    const where: any = {};
    if (graduationYear) where.graduationYear = graduationYear;

    return prisma.alumniProfile.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            department: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: { graduationYear: 'desc' },
    });
  }

  /**
   * Staff onboarding checklist
   */
  async processStaffOnboarding(data: {
    userId: string;
    documentsVerified?: boolean;
    roleAssigned?: boolean;
    departmentAssigned?: boolean;
    reportingManagerAssigned?: boolean;
    emergencyContactRecorded?: boolean;
    verifiedByUserId?: string;
  }) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const docs = data.documentsVerified ?? false;
    const role = data.roleAssigned ?? false;
    const dept = data.departmentAssigned ?? false;
    const mgr = data.reportingManagerAssigned ?? false;
    const emerg = data.emergencyContactRecorded ?? false;

    const allComplete = docs && role && dept && mgr && emerg;

    const checklist = await prisma.staffOnboardingChecklist.upsert({
      where: { userId: data.userId },
      update: {
        documentsVerified: docs,
        roleAssigned: role,
        departmentAssigned: dept,
        reportingManagerAssigned: mgr,
        emergencyContactRecorded: emerg,
        status: allComplete ? 'COMPLETED' : 'PENDING',
        verifiedByUserId: data.verifiedByUserId,
      },
      create: {
        userId: data.userId,
        documentsVerified: docs,
        roleAssigned: role,
        departmentAssigned: dept,
        reportingManagerAssigned: mgr,
        emergencyContactRecorded: emerg,
        status: allComplete ? 'COMPLETED' : 'PENDING',
        verifiedByUserId: data.verifiedByUserId,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return checklist;
  }

  /**
   * Automatic responsibility handover detection for departing staff
   */
  async getStaffHandoverResponsibilities(userId: string) {
    const faculty = await prisma.faculty.findUnique({
      where: { userId },
      include: {
        subjectAssignments: { include: { subject: true, class: true, section: true } },
        timetableEntries: { include: { subject: true, class: true, room: true } },
      },
    });

    const pendingMarks = await prisma.studentMarks.findMany({
      where: { enteredByUserId: userId, status: { in: ['DRAFT', 'RETURNED_FOR_CORRECTION'] } },
      select: { id: true, subject: { select: { name: true } }, student: { select: { admissionNumber: true } } },
    });

    const assignedAssets = await prisma.institutionalAsset.findMany({
      where: { assignedToUserId: userId, status: 'ASSIGNED' },
      select: { id: true, assetCode: true, name: true, location: true },
    });

    return {
      classesCount: faculty?.subjectAssignments.length || 0,
      classes: faculty?.subjectAssignments || [],
      timetableEntriesCount: faculty?.timetableEntries.length || 0,
      pendingMarksCount: pendingMarks.length,
      pendingMarks,
      assignedAssetsCount: assignedAssets.length,
      assignedAssets,
    };
  }

  /**
   * Record and finalize staff exit handover
   */
  async processStaffExitHandover(data: {
    userId: string;
    handoverToUserId?: string;
    exitDate: string | Date;
    classesReassigned?: boolean;
    pendingMarksReassigned?: boolean;
    approvalsReassigned?: boolean;
    assetsReturned?: boolean;
    verifiedByUserId?: string;
  }) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new AppError('Staff user not found.', 404);
    }

    const cls = data.classesReassigned ?? false;
    const mrk = data.pendingMarksReassigned ?? false;
    const app = data.approvalsReassigned ?? false;
    const ast = data.assetsReturned ?? false;

    const allComplete = cls && mrk && app && ast;

    const handover = await prisma.staffExitHandover.upsert({
      where: { userId: data.userId },
      update: {
        handoverToUserId: data.handoverToUserId,
        exitDate: new Date(data.exitDate),
        classesReassigned: cls,
        pendingMarksReassigned: mrk,
        approvalsReassigned: app,
        assetsReturned: ast,
        status: allComplete ? 'COMPLETED' : 'PENDING',
        verifiedByUserId: data.verifiedByUserId,
      },
      create: {
        userId: data.userId,
        handoverToUserId: data.handoverToUserId,
        exitDate: new Date(data.exitDate),
        classesReassigned: cls,
        pendingMarksReassigned: mrk,
        approvalsReassigned: app,
        assetsReturned: ast,
        status: allComplete ? 'COMPLETED' : 'PENDING',
        verifiedByUserId: data.verifiedByUserId,
      },
    });

    if (allComplete) {
      await prisma.user.update({
        where: { id: data.userId },
        data: { status: 'DEACTIVATED' },
      });
    }

    return handover;
  }
}

export const lifecycleService = new LifecycleService();
