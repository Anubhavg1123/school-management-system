import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';
import { RegistrationStatusEnum, UserRoleEnum, UserStatusEnum } from '../types';

export class RegistrationService {
  static async getPendingRegistrations(query: {
    page?: number;
    limit?: number;
    roleId?: string;
    departmentId?: string;
    includeUnderReview?: boolean;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      status: query.includeUnderReview !== false
        ? { in: [RegistrationStatusEnum.PENDING, RegistrationStatusEnum.UNDER_REVIEW, RegistrationStatusEnum.APPROVED_PENDING_ROLE] }
        : RegistrationStatusEnum.PENDING,
    };

    if (query.roleId) where.requestedRoleId = query.roleId;
    if (query.departmentId) where.departmentId = query.departmentId;

    const [requests, total] = await Promise.all([
      prisma.registrationRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              phone: true,
              whatsAppNumber: true,
              altPhone: true,
              dob: true,
              gender: true,
              address: true,
              emergencyContactName: true,
              emergencyContactPhone: true,
              userCategory: true,
              status: true,
              activeRole: true,
              createdAt: true,
              userRoles: {
                include: {
                  role: true,
                },
              },
            },
          },
          requestedRole: true,
          department: true,
        },
      }),
      prisma.registrationRequest.count({ where }),
    ]);

    return {
      requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getRegistrationById(id: string) {
    const registration = await prisma.registrationRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            phone: true,
            whatsAppNumber: true,
            altPhone: true,
            dob: true,
            gender: true,
            address: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            userCategory: true,
            status: true,
            activeRole: true,
            idProofType: true,
            idProofNumber: true,
            createdAt: true,
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
        requestedRole: true,
        department: true,
        approvalRecords: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { reviewedAt: 'desc' },
        },
      },
    });

    if (!registration) {
      throw new AppError('Registration request not found.', 404, 'REGISTRATION_NOT_FOUND');
    }

    return registration;
  }

  static async markUnderReview(params: {
    id: string;
    reviewerId: string;
    reviewerNotes?: string;
    ipAddress?: string;
  }) {
    const reg = await prisma.registrationRequest.findUnique({
      where: { id: params.id },
    });

    if (!reg) {
      throw new AppError('Registration request not found.', 404, 'REGISTRATION_NOT_FOUND');
    }

    if (reg.status === RegistrationStatusEnum.APPROVED || reg.status === RegistrationStatusEnum.REJECTED) {
      throw new AppError(`Cannot mark as under review. Request is already ${reg.status.toLowerCase()}.`, 400, 'ALREADY_PROCESSED');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.registrationRequest.update({
        where: { id: reg.id },
        data: {
          status: RegistrationStatusEnum.UNDER_REVIEW,
          reviewerNotes: params.reviewerNotes || reg.reviewerNotes,
          reviewedByUserId: params.reviewerId,
          reviewedAt: new Date(),
        },
      });

      await tx.approvalRecord.create({
        data: {
          registrationId: reg.id,
          reviewerId: params.reviewerId,
          action: 'UNDER_REVIEW',
          reason: params.reviewerNotes || 'Application moved to Under Review stage by administrator.',
        },
      });

      return r;
    });

    await AuditService.log({
      userId: params.reviewerId,
      action: 'REGISTRATION_MARKED_UNDER_REVIEW',
      entityType: 'RegistrationRequest',
      entityId: reg.id,
      ipAddress: params.ipAddress,
    });

    return updated;
  }

  static async approveRegistration(params: {
    id: string;
    reviewerId: string;
    role?: string;
    departmentId?: string;
    employeeOrAdmissionCode?: string;
    designation?: string;
    reviewerNotes?: string;
    ipAddress?: string;
  }) {
    const reg = await prisma.registrationRequest.findUnique({
      where: { id: params.id },
      include: { user: true, requestedRole: true },
    });

    if (!reg) {
      throw new AppError('Registration request not found.', 404, 'REGISTRATION_NOT_FOUND');
    }

    if (reg.status === RegistrationStatusEnum.REJECTED) {
      throw new AppError('Cannot approve a rejected registration request.', 400, 'ALREADY_PROCESSED');
    }

    const deptId = params.departmentId || reg.departmentId || null;
    const targetRoleName = params.role || reg.requestedRole?.name || null;

    // CASE A: Role is provided -> Approve & Activate Account immediately
    if (targetRoleName) {
      const targetRole = await prisma.role.findUnique({ where: { name: targetRoleName } });
      if (!targetRole) {
        throw new AppError(`Operational role '${targetRoleName}' is invalid.`, 400, 'INVALID_ROLE');
      }

      await prisma.$transaction(async (tx) => {
        // 1. Update Registration Request
        await tx.registrationRequest.update({
          where: { id: reg.id },
          data: {
            status: RegistrationStatusEnum.APPROVED,
            departmentId: deptId,
            reviewerNotes: params.reviewerNotes || 'Application verified and operational role assigned.',
            reviewedByUserId: params.reviewerId,
            reviewedAt: new Date(),
          },
        });

        // 2. Create Approval Record
        await tx.approvalRecord.create({
          data: {
            registrationId: reg.id,
            reviewerId: params.reviewerId,
            action: 'APPROVED',
            reason: params.reviewerNotes || `Application approved and assigned role '${targetRole.displayName}'.`,
          },
        });

        // 3. Activate User Account & set activeRole
        await tx.user.update({
          where: { id: reg.userId },
          data: {
            status: UserStatusEnum.ACTIVE,
            activeRole: targetRoleName,
          },
        });

        // 4. Create User Role mapping
        await tx.userRole.deleteMany({ where: { userId: reg.userId } });
        await tx.userRole.create({
          data: {
            userId: reg.userId,
            roleId: targetRole.id,
            departmentId: deptId,
            isPrimary: true,
            assignedBy: params.reviewerId,
          },
        });

        // 5. Create specific profile records
        const code = params.employeeOrAdmissionCode || `ID-${Date.now().toString().slice(-6)}`;

        if (targetRoleName === UserRoleEnum.FACULTY || targetRoleName === UserRoleEnum.HOD) {
          let finalDeptId = deptId;
          if (!finalDeptId) {
            const firstDept = await tx.department.findFirst({ where: { status: 'ACTIVE' } });
            if (firstDept) {
              finalDeptId = firstDept.id;
            } else {
              const genDept = await tx.department.create({
                data: {
                  code: 'GEN',
                  name: 'General Academics',
                  description: 'Default institutional academic division.',
                  status: 'ACTIVE',
                },
              });
              finalDeptId = genDept.id;
            }
          }
          await tx.faculty.upsert({
            where: { userId: reg.userId },
            update: {
              departmentId: finalDeptId,
              designation: params.designation || (targetRoleName === UserRoleEnum.HOD ? 'HEAD_OF_DEPARTMENT' : 'ASST_PROFESSOR'),
              isHod: targetRoleName === UserRoleEnum.HOD,
              status: 'ACTIVE',
            },
            create: {
              userId: reg.userId,
              employeeCode: code,
              departmentId: finalDeptId,
              designation: params.designation || (targetRoleName === UserRoleEnum.HOD ? 'HEAD_OF_DEPARTMENT' : 'ASST_PROFESSOR'),
              isHod: targetRoleName === UserRoleEnum.HOD,
              status: 'ACTIVE',
            },
          });

          if (targetRoleName === UserRoleEnum.HOD && finalDeptId) {
            await tx.department.update({
              where: { id: finalDeptId },
              data: { hodUserId: reg.userId },
            });
          }
        } else if (targetRoleName === UserRoleEnum.NON_FACULTY || targetRoleName === UserRoleEnum.OFFICE_ADMIN) {
          await tx.nonFacultyStaff.upsert({
            where: { userId: reg.userId },
            update: {
              jobTitle: params.designation || (targetRoleName === UserRoleEnum.OFFICE_ADMIN ? 'ACADEMIC_OFFICE_ADMIN' : 'STAFF'),
              departmentOrUnit: deptId || (targetRoleName === UserRoleEnum.OFFICE_ADMIN ? 'ACADEMIC_OFFICE' : 'OPERATIONS'),
              status: 'ACTIVE',
            },
            create: {
              userId: reg.userId,
              employeeCode: code,
              jobTitle: params.designation || (targetRoleName === UserRoleEnum.OFFICE_ADMIN ? 'ACADEMIC_OFFICE_ADMIN' : 'STAFF'),
              departmentOrUnit: deptId || (targetRoleName === UserRoleEnum.OFFICE_ADMIN ? 'ACADEMIC_OFFICE' : 'OPERATIONS'),
              status: 'ACTIVE',
            },
          });
        } else if (targetRoleName === UserRoleEnum.STUDENT) {
          await tx.student.upsert({
            where: { userId: reg.userId },
            update: { status: 'ACTIVE' },
            create: {
              userId: reg.userId,
              admissionNumber: code,
              status: 'ACTIVE',
            },
          });
        }

        // 6. Create welcome notification
        await tx.notification.create({
          data: {
            userId: reg.userId,
            title: 'Account Approved & Activated',
            message: `Your registration for role '${targetRole.displayName}' has been approved and activated. You may now log in to your portal.`,
            type: 'APPROVAL',
          },
        });
      });

      // Audit log
      await AuditService.log({
        userId: params.reviewerId,
        action: 'USER_ROLE_ASSIGNED',
        entityType: 'UserRole',
        entityId: reg.userId,
        beforeState: { previousRole: null, previousStatus: reg.user.status },
        afterState: { targetUserId: reg.userId, assignedRole: targetRoleName, status: 'ACTIVE', reason: params.reviewerNotes || 'Assigned during approval' },
        ipAddress: params.ipAddress,
      });

      return {
        message: 'Registration approved and operational role assigned successfully. User account is now active.',
        userId: reg.userId,
        status: 'ACTIVE',
        role: targetRoleName,
      };
    }

    // CASE B: Role is NOT provided -> Set Account to APPROVED — ROLE ASSIGNMENT REQUIRED
    await prisma.$transaction(async (tx) => {
      await tx.registrationRequest.update({
        where: { id: reg.id },
        data: {
          status: RegistrationStatusEnum.APPROVED_PENDING_ROLE,
          departmentId: deptId,
          reviewerNotes: params.reviewerNotes || 'Application verified; operational role assignment required.',
          reviewedByUserId: params.reviewerId,
          reviewedAt: new Date(),
        },
      });

      await tx.approvalRecord.create({
        data: {
          registrationId: reg.id,
          reviewerId: params.reviewerId,
          action: 'APPROVED_PENDING_ROLE',
          reason: params.reviewerNotes || 'Application approved by Principal. Operational role assignment required.',
        },
      });

      await tx.user.update({
        where: { id: reg.userId },
        data: {
          status: UserStatusEnum.APPROVED_PENDING_ROLE,
        },
      });

      await tx.notification.create({
        data: {
          userId: reg.userId,
          title: 'Application Approved — Role Assignment Pending',
          message: 'Your registration has been approved. An operational role must be assigned by the administrator before you can log in.',
          type: 'APPROVAL',
        },
      });
    });

    await AuditService.log({
      userId: params.reviewerId,
      action: 'REGISTRATION_APPROVED_PENDING_ROLE',
      entityType: 'RegistrationRequest',
      entityId: reg.id,
      afterState: { targetUserId: reg.userId, status: UserStatusEnum.APPROVED_PENDING_ROLE },
      ipAddress: params.ipAddress,
    });

    return {
      message: 'Registration approved. User account is set to APPROVED — ROLE ASSIGNMENT REQUIRED. Please assign an operational role to activate the account.',
      userId: reg.userId,
      status: UserStatusEnum.APPROVED_PENDING_ROLE,
      roleAssigned: false,
    };
  }

  static async rejectRegistration(params: {
    id: string;
    reviewerId: string;
    reason: string;
    ipAddress?: string;
  }) {
    if (!params.reason || params.reason.trim().length === 0) {
      throw new AppError('A rejection reason must be provided.', 400, 'REASON_REQUIRED');
    }

    const reg = await prisma.registrationRequest.findUnique({
      where: { id: params.id },
      include: { user: true, requestedRole: true },
    });

    if (!reg) {
      throw new AppError('Registration request not found.', 404, 'REGISTRATION_NOT_FOUND');
    }

    if (reg.status === RegistrationStatusEnum.APPROVED || reg.status === RegistrationStatusEnum.REJECTED) {
      throw new AppError(`Registration request is already ${reg.status.toLowerCase()}.`, 400, 'ALREADY_PROCESSED');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Registration Request
      await tx.registrationRequest.update({
        where: { id: reg.id },
        data: {
          status: RegistrationStatusEnum.REJECTED,
          rejectionReason: params.reason,
          reviewedByUserId: params.reviewerId,
          reviewedAt: new Date(),
        },
      });

      // 2. Create Approval Record
      await tx.approvalRecord.create({
        data: {
          registrationId: reg.id,
          reviewerId: params.reviewerId,
          action: 'REJECTED',
          reason: params.reason,
        },
      });

      // 3. Keep user status INACTIVE
      await tx.user.update({
        where: { id: reg.userId },
        data: {
          status: UserStatusEnum.INACTIVE,
        },
      });

      // 4. Create Notification
      await tx.notification.create({
        data: {
          userId: reg.userId,
          title: 'Registration Rejected',
          message: `Your registration request was not approved. Reason: ${params.reason}`,
          type: 'APPROVAL',
        },
      });
    });

    // Audit log
    await AuditService.log({
      userId: params.reviewerId,
      action: 'REGISTRATION_REJECTED',
      entityType: 'RegistrationRequest',
      entityId: reg.id,
      afterState: { reason: params.reason },
      ipAddress: params.ipAddress,
    });

    return {
      message: 'Registration request rejected.',
      status: 'REJECTED',
    };
  }

  static async getRecentlyReviewed(limit = 10) {
    const [approved, rejected] = await Promise.all([
      prisma.registrationRequest.findMany({
        where: { status: RegistrationStatusEnum.APPROVED },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              userCategory: true,
            },
          },
          requestedRole: true,
          department: true,
        },
      }),
      prisma.registrationRequest.findMany({
        where: { status: RegistrationStatusEnum.REJECTED },
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          requestedRole: true,
          department: true,
        },
      }),
    ]);

    return { approved, rejected };
  }
}
