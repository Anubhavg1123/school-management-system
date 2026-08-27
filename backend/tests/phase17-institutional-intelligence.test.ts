import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';
import { generateAccessToken } from '../src/utils/jwt';

const app = createApp();

describe('Phase 17 — Institutional Intelligence, Advanced Workflows, Compliance & Operations Suite', () => {
  let adminToken: string;
  let adminUserId: string;
  let facultyToken: string;
  let facultyUserId: string;
  let facultyId: string;
  let guardianToken: string;
  let guardianUserId: string;
  let studentId: string;
  let studentUserId: string;
  let sampleEventId: string;
  let samplePtmSlotId: string;
  let sampleAssetId: string;
  let sampleInventoryItemId: string;
  let samplePolicyId: string;
  let sampleIncidentId: string;
  let sampleGrievanceId: string;

  beforeAll(async () => {
    // 1. Seed or resolve Super Admin
    let superAdmin = await prisma.user.findUnique({ where: { email: 'principal@school.edu' } });
    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          email: 'principal@school.edu',
          passwordHash: '$2b$10$e8N/O8q7S1W4b1q2z3x4uOa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5',
          firstName: 'Arthur',
          lastName: 'Pendelton',
          userCategory: 'SUPER_ADMIN',
          status: 'ACTIVE',
          activeRole: 'SUPER_ADMIN',
        },
      });
    }
    adminUserId = superAdmin.id;
    adminToken = generateAccessToken({ userId: superAdmin.id, activeRole: 'SUPER_ADMIN' });

    // 2. Resolve or create department & faculty
    let dept = await prisma.department.findFirst();
    if (!dept) {
      dept = await prisma.department.create({
        data: { name: 'Science Department', code: `SCI-${Date.now()}` },
      });
    }

    const facultyUser = await prisma.user.create({
      data: {
        email: `faculty.p17.${Date.now()}@school.edu`,
        passwordHash: '$2b$10$e8N/O8q7S1W4b1q2z3x4uOa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5',
        firstName: 'Elena',
        lastName: 'Rostova',
        userCategory: 'FACULTY',
        status: 'ACTIVE',
        activeRole: 'FACULTY',
      },
    });
    facultyUserId = facultyUser.id;
    facultyToken = generateAccessToken({ userId: facultyUser.id, activeRole: 'FACULTY' });

    const facultyRecord = await prisma.faculty.create({
      data: {
        userId: facultyUser.id,
        employeeCode: `FAC-17-${Date.now()}`,
        departmentId: dept.id,
        designation: 'PROFESSOR',
        status: 'ACTIVE',
      },
    });
    facultyId = facultyRecord.id;

    // 3. Resolve or create Student
    const studentUser = await prisma.user.create({
      data: {
        email: `student.p17.${Date.now()}@school.edu`,
        passwordHash: '$2b$10$e8N/O8q7S1W4b1q2z3x4uOa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5',
        firstName: 'Rohan',
        lastName: 'Sharma',
        userCategory: 'STUDENT',
        status: 'ACTIVE',
        activeRole: 'STUDENT',
      },
    });
    studentUserId = studentUser.id;

    const studentRecord = await prisma.student.create({
      data: {
        userId: studentUser.id,
        admissionNumber: `ADM-17-${Date.now()}`,
        status: 'ACTIVE',
      },
    });
    studentId = studentRecord.id;

    // 4. Resolve or create Guardian
    const guardianUser = await prisma.user.create({
      data: {
        email: `guardian.p17.${Date.now()}@school.edu`,
        passwordHash: '$2b$10$e8N/O8q7S1W4b1q2z3x4uOa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5',
        firstName: 'Suresh',
        lastName: 'Sharma',
        userCategory: 'PARENT',
        status: 'ACTIVE',
        activeRole: 'PARENT',
      },
    });
    guardianUserId = guardianUser.id;
    guardianToken = generateAccessToken({ userId: guardianUser.id, activeRole: 'PARENT' });
  });

  // --- 1. Workflow Delegation & SLA ---
  it('1. should create an approval delegation and verify effective status', async () => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);

    const res = await request(app)
      .post('/api/workflows/delegations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        delegateUserId: facultyUserId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        reason: 'Annual Principal Sabbatical',
        scope: 'LEAVE',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.scope).toBe('LEAVE');
    expect(res.body.data.isActive).toBe(true);
  });

  it('2. should configure SLA parameters and evaluate pending workflow SLA status', async () => {
    const cfgRes = await request(app)
      .post('/api/workflows/sla')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        workflowType: 'USER_APPROVAL',
        targetHours: 48,
        reminderHours: 24,
        escalateToRole: 'SUPER_ADMIN',
      });

    expect(cfgRes.status).toBe(200);
    expect(cfgRes.body.data.targetHours).toBe(48);

    const statusRes = await request(app)
      .get('/api/workflows/sla/status')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.summary).toBeDefined();
    expect(Array.isArray(statusRes.body.data.items)).toBe(true);
  });

  // --- 2. Institutional Calendar & Holiday Checks ---
  it('3. should create institutional calendar event and verify holiday checker', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .post('/api/calendar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'National Holiday Celebration',
        category: 'HOLIDAY',
        startDate: `${today}T00:00:00.000Z`,
        endDate: `${today}T23:59:59.000Z`,
        isHoliday: true,
        targetRoles: 'ALL',
        venue: 'Main Campus Auditorium',
        capacity: 500,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('National Holiday Celebration');
    sampleEventId = res.body.data.id;

    // Check holiday API
    const holRes = await request(app)
      .get(`/api/calendar/holiday-check?date=${today}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(holRes.status).toBe(200);
    expect(holRes.body.data.isHoliday).toBe(true);
    expect(holRes.body.data.holidayName).toBe('National Holiday Celebration');
  });

  it('4. should register user for calendar event and record attendance', async () => {
    const regRes = await request(app)
      .post(`/api/calendar/${sampleEventId}/register`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.status).toBe('REGISTERED');

    const regId = regRes.body.data.id;
    const attRes = await request(app)
      .post(`/api/calendar/registrations/${regId}/attendance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ attended: true });

    expect(attRes.status).toBe(200);
    expect(attRes.body.data.attended).toBe(true);
  });

  // --- 3. Parent-Teacher Meeting (PTM) ---
  it('5. should generate faculty PTM availability slots', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/ptm/slots')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        date: dateStr,
        startTime: '14:00',
        endTime: '14:30',
        durationMinutes: 15,
        maxBookingsPerSlot: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.slots.length).toBe(2);
    samplePtmSlotId = res.body.data.slots[0].id;
  });

  it('6. should allow guardian to book PTM slot and prevent duplicate booking', async () => {
    const res = await request(app)
      .post(`/api/ptm/slots/${samplePtmSlotId}/book`)
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ studentId });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CONFIRMED');

    // Duplicate booking attempt should fail
    const dupRes = await request(app)
      .post(`/api/ptm/slots/${samplePtmSlotId}/book`)
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ studentId });

    expect(dupRes.status).toBe(400);
  });

  it('7. should record faculty confidential meeting remarks on PTM booking', async () => {
    const bookings = await prisma.parentTeacherMeetingBooking.findMany({
      where: { slotId: samplePtmSlotId },
    });

    const res = await request(app)
      .patch(`/api/ptm/bookings/${bookings[0].id}/notes`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        meetingNotes: 'Discussed science project progress.',
        sensitiveRemarks: 'Requires extra support in mathematics problem solving.',
        status: 'COMPLETED',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.meetingNotes).toBe('Discussed science project progress.');
  });

  // --- 4. Student & Staff Lifecycle ---
  it('8. should update student status and process student exit clearance checklist', async () => {
    const res = await request(app)
      .post(`/api/lifecycle/students/${studentId}/exit-checklist`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        feeClearance: true,
        libraryClearance: true,
        assetClearance: true,
        documentClearance: true,
        idCardReturned: true,
        remarks: 'All institutional clearances verified by administration.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');

    // Verify student status transitioned to LEFT_INSTITUTION
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    expect(student?.status).toBe('LEFT_INSTITUTION');
  });

  it('9. should create and retrieve alumni profile', async () => {
    const res = await request(app)
      .post(`/api/lifecycle/students/${studentId}/alumni`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        graduationYear: 2026,
        programName: 'High School Diploma (Science)',
        currentCompany: 'Apex Innovation Labs',
        currentRole: 'Junior Software Intern',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.graduationYear).toBe(2026);
    expect(res.body.data.programName).toContain('Science');

    const getRes = await request(app)
      .get('/api/lifecycle/alumni?year=2026')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.alumni.length).toBeGreaterThan(0);
  });

  it('10. should process staff onboarding checklist and verify complete status', async () => {
    const res = await request(app)
      .post(`/api/lifecycle/staff/${facultyUserId}/onboarding`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        documentsVerified: true,
        roleAssigned: true,
        departmentAssigned: true,
        reportingManagerAssigned: true,
        emergencyContactRecorded: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('11. should detect staff handover responsibilities and record exit handover', async () => {
    const chkRes = await request(app)
      .get(`/api/lifecycle/staff/${facultyUserId}/handover-check`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(chkRes.status).toBe(200);
    expect(chkRes.body.data.classesCount).toBeDefined();

    const handoverRes = await request(app)
      .post(`/api/lifecycle/staff/${facultyUserId}/exit-handover`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        exitDate: new Date().toISOString(),
        classesReassigned: true,
        pendingMarksReassigned: true,
        approvalsReassigned: true,
        assetsReturned: true,
      });

    expect(handoverRes.status).toBe(200);
    expect(handoverRes.body.data.status).toBe('COMPLETED');
  });

  // --- 5. Asset & Inventory Management ---
  it('12. should create institutional asset, assign to user, and return to inventory', async () => {
    const assetCode = `AST-TEST-${Date.now()}`;
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assetCode,
        name: 'Dell Precision Workstation',
        category: 'IT_EQUIPMENT',
        serialNumber: 'SN-998822',
        location: 'Computer Lab #3',
        purchaseCost: 65000,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.assetCode).toBe(assetCode);
    sampleAssetId = res.body.data.id;

    // Assign to faculty
    const assignRes = await request(app)
      .post(`/api/assets/${sampleAssetId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedToUserId: facultyUserId,
        conditionNotes: 'Mint condition with power brick',
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.status).toBe('ASSIGNED');

    // Return asset
    const returnRes = await request(app)
      .post(`/api/assets/${sampleAssetId}/return`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ conditionNotes: 'Returned in good working order' });

    expect(returnRes.status).toBe(200);
    expect(returnRes.body.data.status).toBe('AVAILABLE');
  });

  it('13. should log asset maintenance event', async () => {
    const res = await request(app)
      .post(`/api/assets/${sampleAssetId}/maintenance`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        maintenanceDate: new Date().toISOString(),
        vendorName: 'Dell Enterprise Support',
        cost: 1500,
        issueDescription: 'Cooling fan cleaning and thermal paste replacement',
        status: 'COMPLETED',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.vendorName).toBe('Dell Enterprise Support');
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('14. should create consumable inventory item and record stock in/out transaction', async () => {
    const itemCode = `INV-TEST-${Date.now()}`;
    const res = await request(app)
      .post('/api/assets/inventory/items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        itemCode,
        name: 'Whiteboard Dry Erase Markers',
        category: 'STATIONERY',
        unit: 'Box',
        currentQuantity: 20,
        minThresholdQuantity: 5,
        unitCost: 120,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.itemCode).toBe(itemCode);
    sampleInventoryItemId = res.body.data.id;

    // Stock Out 5 boxes
    const stockOutRes = await request(app)
      .post('/api/assets/inventory/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        inventoryItemId: sampleInventoryItemId,
        transactionType: 'STOCK_OUT',
        quantity: 5,
        reason: 'Issued to Science Department',
      });

    expect(stockOutRes.status).toBe(201);
    expect(stockOutRes.body.data.updatedQuantity).toBe(15);
  });

  it('15. should reject inventory stock out exceeding available stock', async () => {
    const res = await request(app)
      .post('/api/assets/inventory/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        inventoryItemId: sampleInventoryItemId,
        transactionType: 'STOCK_OUT',
        quantity: 9999,
        reason: 'Excessive request',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Insufficient stock');
  });

  // --- 6. Grievances, Feedback & Policies ---
  it('16. should submit institutional grievance and verify status progression', async () => {
    const res = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({
        category: 'FACILITY',
        privacyLevel: 'NORMAL',
        title: 'Cafeteria Drinking Water Filter Maintenance',
        description: 'The drinking water cooler in Block B requires routine filter cleaning.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.trackingNumber).toBeDefined();
    sampleGrievanceId = res.body.data.id;

    // Admin updates grievance to RESOLVED
    const updateRes = await request(app)
      .patch(`/api/grievances/${sampleGrievanceId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'RESOLVED',
        resolutionNotes: 'Filter cartridge replaced by maintenance team.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('RESOLVED');
  });

  it('17. should submit course feedback and retrieve aggregated metrics', async () => {
    const res = await request(app)
      .post('/api/grievances/feedback')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        targetType: 'COURSE',
        rating: 5,
        comments: 'Outstanding instructional quality and course materials.',
      });

    expect(res.status).toBe(201);

    const metricsRes = await request(app)
      .get('/api/grievances/feedback/metrics?targetType=COURSE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.data.averageRating).toBeGreaterThanOrEqual(1);
  });

  it('18. should publish versioned policy and record user policy acknowledgement', async () => {
    const policyCode = `POL-TEST-${Date.now()}`;
    const res = await request(app)
      .post('/api/grievances/policies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        policyCode,
        title: 'Campus Digital Safety & Device Policy',
        category: 'DATA_PRIVACY',
        effectiveDate: new Date().toISOString(),
        content: 'Guidelines for secure usage of institutional computing equipment.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.version).toBe(1);
    samplePolicyId = res.body.data.id;

    // Acknowledge policy
    const ackRes = await request(app)
      .post(`/api/grievances/policies/${samplePolicyId}/acknowledge`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(ackRes.status).toBe(200);
    expect(ackRes.body.data.acknowledgedAt).toBeDefined();
  });

  it('19. should publish updated policy version and verify version increment', async () => {
    const current = await prisma.institutionalPolicy.findUnique({ where: { id: samplePolicyId } });

    const res = await request(app)
      .post('/api/grievances/policies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        policyCode: current!.policyCode,
        title: 'Campus Digital Safety & Device Policy (Rev 2)',
        category: 'DATA_PRIVACY',
        effectiveDate: new Date().toISOString(),
        content: 'Updated guidelines with cloud access policies.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.version).toBe(2);
  });

  it('20. should create and verify institutional compliance checklist item', async () => {
    const res = await request(app)
      .post('/api/grievances/compliance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        category: 'BACKUP',
        title: 'Weekly Offsite Backup Verification',
        frequency: 'WEEKLY',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    const itemId = res.body.data.id;

    const verifyRes = await request(app)
      .patch(`/api/grievances/compliance/${itemId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.status).toBe('COMPLETED');
  });

  // --- 7. Operations Intelligence, 360 Profiles & Incidents ---
  it('21. should generate daily operations briefing with real database metrics', async () => {
    const res = await request(app)
      .get('/api/intelligence/daily-summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.totalStudents).toBeGreaterThanOrEqual(0);
    expect(res.body.data.healthSummary.status).toBeDefined();
  });

  it('22. should generate explainable operational recommendations and update review status', async () => {
    const res = await request(app)
      .get('/api/intelligence/recommendations')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.recommendations)).toBe(true);

    if (res.body.data.recommendations.length > 0) {
      const recId = res.body.data.recommendations[0].id;
      const patchRes = await request(app)
        .patch(`/api/intelligence/recommendations/${recId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'ACKNOWLEDGED',
        });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.status).toBe('ACKNOWLEDGED');
    }
  });

  it('23. should retrieve Student 360° and Staff 360° comprehensive profile aggregates', async () => {
    const studentRes = await request(app)
      .get(`/api/intelligence/student-360/${studentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(studentRes.status).toBe(200);
    expect(studentRes.body.data.admissionNumber).toBeDefined();

    const staffRes = await request(app)
      .get(`/api/intelligence/staff-360/${facultyUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(staffRes.status).toBe(200);
    expect(staffRes.body.data.facultyProfile).toBeDefined();
  });

  it('24. should create institutional incident and document Root Cause Analysis (RCA)', async () => {
    const res = await request(app)
      .post('/api/intelligence/incidents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        severity: 'P2_HIGH',
        category: 'SYSTEM_OUTAGE',
        title: 'SMS Gateway Provider Latency Spike',
        description: 'Temporary timeout spike observed with third-party SMS delivery provider.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.incidentCode).toBeDefined();
    sampleIncidentId = res.body.data.id;

    // Document RCA and resolve
    const rcaRes = await request(app)
      .patch(`/api/intelligence/incidents/${sampleIncidentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'RESOLVED',
        rootCauseAnalysis: 'Upstream carrier maintenance caused message throttling for 12 minutes.',
        correctiveActions: 'Switched primary routing to fallback WhatsApp Cloud API provider.',
        preventiveActions: 'Added automated multi-provider failover threshold.',
      });

    expect(rcaRes.status).toBe(200);
    expect(rcaRes.body.data.status).toBe('RESOLVED');
    expect(rcaRes.body.data.rootCauseAnalysis).toContain('carrier maintenance');
  });

  it('25. should create data correction request and execute administrative approval', async () => {
    const res = await request(app)
      .post('/api/intelligence/data-corrections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        entityType: 'STUDENT_DOB',
        entityId: studentId,
        fieldName: 'dateOfBirth',
        oldValue: '2008-05-15',
        newValue: '2008-05-20',
        reason: 'Birth certificate verification discrepancy corrected by registrar.',
      });

    expect(res.status).toBe(201);
    const corrId = res.body.data.id;

    // Approve and execute
    const approveRes = await request(app)
      .patch(`/api/intelligence/data-corrections/${corrId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('APPROVED');
    expect(approveRes.body.data.executedAt).toBeDefined();
  });
});
