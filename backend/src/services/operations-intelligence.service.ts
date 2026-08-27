import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class OperationsIntelligenceService {
  /**
   * Generate daily operational briefing with real verified database statistics
   */
  async getDailyOperationsSummary() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const [
      totalStudents,
      activeStudents,
      totalFaculty,
      activeFaculty,
      todayAttendances,
      pendingApprovals,
      todayVisitors,
      activeEmergencyAlerts,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.faculty.count(),
      prisma.faculty.count({ where: { status: 'ACTIVE' } }),
      prisma.attendance.count({ where: { date: todayStr } }),
      prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
      prisma.visitorEntryExit.count({ where: { entryTime: { gte: new Date(`${todayStr}T00:00:00.000Z`) } } }),
      prisma.emergencyAlert.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      date: todayStr,
      generatedAt: new Date().toISOString(),
      metrics: {
        totalStudents,
        activeStudents,
        totalFaculty,
        activeFaculty,
        todayStaffAttendanceCheckIns: todayAttendances,
        pendingUserRegistrations: pendingApprovals,
        todayVisitorsInside: todayVisitors,
        activeEmergencyAlerts,
      },
      healthSummary: {
        status: activeEmergencyAlerts > 0 ? 'WARNING' : 'HEALTHY',
        notes: activeEmergencyAlerts > 0 ? 'Active emergency alert in effect.' : 'All operational parameters normal.',
      },
    };
  }

  /**
   * Generate explainable operational recommendations (Human approval mandatory)
   */
  async generateOperationalRecommendations() {
    const recommendations = [];

    // 1. Check for unassigned classes
    const classesWithoutCoordinators = await prisma.section.count({
      where: { coordinatorFacultyId: null },
    });
    if (classesWithoutCoordinators > 0) {
      recommendations.push({
        observation: `${classesWithoutCoordinators} academic section(s) currently lack an assigned Class Coordinator.`,
        evidenceJson: JSON.stringify({ unassignedSectionsCount: classesWithoutCoordinators }),
        suggestedAction: 'Assign faculty members as Class Coordinators to ensure roll-call accountability.',
        priority: 'HIGH' as const,
      });
    }

    // 2. Check for low inventory stock
    const lowStockCount = await prisma.inventoryItem.count({
      where: { currentQuantity: { lte: 10 } },
    });
    if (lowStockCount > 0) {
      recommendations.push({
        observation: `${lowStockCount} inventory consumable item(s) are below the minimum threshold.`,
        evidenceJson: JSON.stringify({ lowStockItems: lowStockCount, threshold: 10 }),
        suggestedAction: 'Initiate purchase requisition for stationery and lab consumable refills.',
        priority: 'MEDIUM' as const,
      });
    }

    // 3. Check for pending approval SLA backlog
    const pendingRegs = await prisma.registrationRequest.count({ where: { status: 'PENDING' } });
    if (pendingRegs > 5) {
      recommendations.push({
        observation: `${pendingRegs} user registration applications are pending administrative review.`,
        evidenceJson: JSON.stringify({ pendingRegistrations: pendingRegs }),
        suggestedAction: 'Review pending applicant registrations to prevent onboarding delays.',
        priority: 'MEDIUM' as const,
      });
    }

    // Save recommendations if not already existing
    for (const rec of recommendations) {
      const existing = await prisma.operationalRecommendation.findFirst({
        where: { observation: rec.observation, status: { in: ['NEW', 'ACKNOWLEDGED'] } },
      });
      if (!existing) {
        await prisma.operationalRecommendation.create({
          data: {
            observation: rec.observation,
            evidenceJson: rec.evidenceJson,
            suggestedAction: rec.suggestedAction,
            priority: rec.priority,
            status: 'NEW',
          },
        });
      }
    }

    return prisma.operationalRecommendation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Update recommendation status with audit
   */
  async updateRecommendationStatus(
    id: string,
    data: { status: string; reasonForDismissal?: string; reviewedByUserId: string }
  ) {
    return prisma.operationalRecommendation.update({
      where: { id },
      data: {
        status: data.status,
        reasonForDismissal: data.reasonForDismissal,
        reviewedByUserId: data.reviewedByUserId,
        reviewedAt: new Date(),
      },
    });
  }

  /**
   * Student 360° Comprehensive Profile
   */
  async getStudent360Profile(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        department: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true, class: { select: { name: true } } } },
        guardians: true,
        feeAssignments: { include: { feeStructure: true } },
        payments: { take: 5, orderBy: { createdAt: 'desc' } },
        studentAttendances: { take: 10, orderBy: { createdAt: 'desc' } },
        studentMarks: { include: { subject: true } },
        studentCases: { take: 5, orderBy: { createdAt: 'desc' } },
        exitChecklist: true,
        alumniProfile: true,
      },
    });

    if (!student) {
      throw new AppError('Student not found.', 404);
    }

    return student;
  }

  /**
   * Staff 360° Comprehensive Profile
   */
  async getStaff360Profile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        facultyProfile: {
          include: {
            department: true,
            subjectAssignments: { include: { subject: true, class: true } },
            timetableEntries: { include: { subject: true, class: true, room: true } },
          },
        },
        nonFacultyProfile: { include: { assignedVehicles: true } },
        assignedInstitutionalAssets: true,
        staffOnboardingChecklists: true,
        staffExitHandovers: true,
      },
    });

    if (!user) {
      throw new AppError('Staff user not found.', 404);
    }

    return user;
  }

  /**
   * Create an institutional incident
   */
  async createIncident(data: {
    severity: string;
    category: string;
    title: string;
    description: string;
    ownerUserId?: string;
  }) {
    const count = await prisma.institutionalIncident.count();
    const incidentCode = `INC-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    return prisma.institutionalIncident.create({
      data: {
        incidentCode,
        severity: data.severity,
        category: data.category,
        title: data.title,
        description: data.description,
        ownerUserId: data.ownerUserId,
        status: 'DETECTED',
      },
    });
  }

  /**
   * Get all incidents
   */
  async getIncidents() {
    return prisma.institutionalIncident.findMany({
      include: {
        ownerUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update incident progress and record Root Cause Analysis (RCA)
   */
  async updateIncident(
    id: string,
    data: {
      status: string;
      rootCauseAnalysis?: string;
      correctiveActions?: string;
      preventiveActions?: string;
    }
  ) {
    const incident = await prisma.institutionalIncident.findUnique({ where: { id } });
    if (!incident) {
      throw new AppError('Incident not found.', 404);
    }

    const updates: any = {
      status: data.status,
      rootCauseAnalysis: data.rootCauseAnalysis,
      correctiveActions: data.correctiveActions,
      preventiveActions: data.preventiveActions,
    };

    if (data.status === 'ACKNOWLEDGED' && !incident.acknowledgedAt) updates.acknowledgedAt = new Date();
    if (data.status === 'MITIGATED' && !incident.mitigatedAt) updates.mitigatedAt = new Date();
    if (data.status === 'RESOLVED' && !incident.resolvedAt) updates.resolvedAt = new Date();
    if (data.status === 'CLOSED' && !incident.closedAt) updates.closedAt = new Date();

    return prisma.institutionalIncident.update({
      where: { id },
      data: updates,
    });
  }

  /**
   * Create a sensitive data correction request
   */
  async createDataCorrectionRequest(data: {
    entityType: string;
    entityId: string;
    fieldName: string;
    oldValue?: string;
    newValue: string;
    reason: string;
    requestedByUserId: string;
  }) {
    return prisma.dataCorrectionRequest.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        fieldName: data.fieldName,
        oldValue: data.oldValue,
        newValue: data.newValue,
        reason: data.reason,
        requestedByUserId: data.requestedByUserId,
        status: 'PENDING',
      },
      include: {
        requestedByUser: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  /**
   * Review, approve, and execute a data correction request
   */
  async processDataCorrectionRequest(
    id: string,
    data: {
      status: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
      approvedByUserId: string;
    }
  ) {
    const req = await prisma.dataCorrectionRequest.findUnique({ where: { id } });
    if (!req) {
      throw new AppError('Data correction request not found.', 404);
    }

    if (req.status !== 'PENDING') {
      throw new AppError(`Cannot process request that is already '${req.status}'.`, 400);
    }

    if (data.status === 'REJECTED') {
      return prisma.dataCorrectionRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: data.rejectionReason,
          approvedByUserId: data.approvedByUserId,
        },
      });
    }

    // Execute actual entity update if APPROVED
    if (req.entityType === 'STUDENT_DOB') {
      await prisma.student.update({
        where: { id: req.entityId },
        data: { dateOfBirth: new Date(req.newValue) },
      });
    } else if (req.entityType === 'STUDENT_NAME') {
      const student = await prisma.student.findUnique({ where: { id: req.entityId } });
      if (student) {
        const [firstName, ...rest] = req.newValue.split(' ');
        await prisma.user.update({
          where: { id: student.userId },
          data: { firstName, lastName: rest.join(' ') || '' },
        });
      }
    }

    return prisma.dataCorrectionRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedByUserId: data.approvedByUserId,
        executedAt: new Date(),
      },
    });
  }

  /**
   * Get all data correction requests
   */
  async getDataCorrectionRequests() {
    return prisma.dataCorrectionRequest.findMany({
      include: {
        requestedByUser: { select: { firstName: true, lastName: true, email: true } },
        approvedByUser: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const operationsIntelligenceService = new OperationsIntelligenceService();
