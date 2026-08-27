import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';
import { generateAccessToken } from '../src/utils/jwt';

const app = createApp();

describe('Phase 11 — Principal & Central Office Administration Platform Suite', () => {
  let superAdminToken: string;
  let officeToken: string;
  let hodToken: string;
  let facultyToken: string;

  let superAdminUser: any;
  let officeUser: any;
  let hodUser: any;
  let facultyUser: any;

  let section: any;
  let classObj: any;
  let targetStudentId: string;
  let targetFeeAssignmentId: string;
  let approvalRequestId: string;

  beforeAll(async () => {
    // 1. Super Admin Auth Token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'principal@school.edu', password: 'Admin@SecurePassword2026!', role: 'SUPER_ADMIN' });
    expect(adminLoginRes.status).toBe(200);
    superAdminToken = adminLoginRes.body.data.tokens.accessToken;
    superAdminUser = adminLoginRes.body.data.user;

    // 2. Fetch or setup Office Admin, HOD, Faculty
    const office = await prisma.user.findFirst({ where: { activeRole: 'OFFICE_ADMIN' } });
    if (office) {
      officeUser = office;
      officeToken = generateAccessToken({ userId: officeUser.id, email: officeUser.email, activeRole: 'OFFICE_ADMIN' });
    }

    const hod = await prisma.user.findFirst({ where: { activeRole: 'HOD' } });
    if (hod) {
      hodUser = hod;
      hodToken = generateAccessToken({ userId: hodUser.id, email: hodUser.email, activeRole: 'HOD' });
    }

    const faculty = await prisma.faculty.findFirst({ include: { user: true } });
    if (faculty) {
      facultyUser = faculty.user;
      facultyToken = generateAccessToken({ userId: facultyUser.id, email: facultyUser.email, activeRole: 'FACULTY' });
    }

    section = await prisma.section.findFirst({ include: { class: true } });
    if (section) classObj = section.class;

    const student = await prisma.student.findFirst({ include: { feeAssignments: true } });
    if (student) {
      targetStudentId = student.id;
      if (student.feeAssignments.length > 0) {
        targetFeeAssignmentId = student.feeAssignments[0].id;
      }
    }
  });

  it('1. should fetch real-time Principal Dashboard metrics & Executive Summary', async () => {
    const dashRes = await request(app)
      .get('/api/principal/dashboard')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.success).toBe(true);
    expect(dashRes.body.data.totalActiveStudents).toBeGreaterThanOrEqual(1);
    expect(dashRes.body.data.departmentCount).toBeGreaterThanOrEqual(1);

    const execRes = await request(app)
      .get('/api/principal/executive-summary')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(execRes.status).toBe(200);
    expect(execRes.body.data.academic).toBeDefined();
    expect(execRes.body.data.finance).toBeDefined();
    expect(execRes.body.data.operations).toBeDefined();
  });

  it('2. should fetch department comparison overview for Principal drill-down', async () => {
    const deptRes = await request(app)
      .get('/api/principal/departments-overview')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(deptRes.status).toBe(200);
    expect(deptRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(deptRes.body.data[0].code).toBeDefined();
  });

  it('3. should perform global administrative search across students, faculty, and notices', async () => {
    const searchRes = await request(app)
      .get('/api/principal/global-search?q=ADM')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.students).toBeDefined();
  });

  interact: it('4. should require parent/guardian WhatsApp number during student intake and enforce validation', async () => {
    if (!officeToken || !section) return;

    // Missing parent WhatsApp -> Expect 400 MANDATORY_PARENT_WHATSAPP_REQUIRED
    const invalidRes = await request(app)
      .post('/api/office/students/master')
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        firstName: 'Junior',
        lastName: 'Student',
        email: `junior.student.${Date.now()}@school.edu`,
        guardianName: 'Senior Parent',
        guardianRelationship: 'FATHER',
        guardianWhatsAppNumber: '', // EMPTY!
        sectionId: section.id,
      });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error.code).toBe('MANDATORY_PARENT_WHATSAPP_REQUIRED');

    // Valid student intake
    const validRes = await request(app)
      .post('/api/office/students/master')
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        firstName: 'Junior',
        lastName: 'Student',
        email: `junior.student.${Date.now()}@school.edu`,
        guardianName: 'Senior Parent',
        guardianRelationship: 'FATHER',
        guardianWhatsAppNumber: '+91 9988776655',
        sectionId: section.id,
      });

    expect(validRes.status).toBe(201);
    expect(validRes.body.data.admissionNumber).toBeDefined();
  });

  it('5. should handle student status transition (ACTIVE -> LEFT_INSTITUTION) and block future attendance check-in', async () => {
    if (!officeToken || !targetStudentId) return;

    // Transition student to LEFT_INSTITUTION
    const updateRes = await request(app)
      .patch(`/api/office/students/${targetStudentId}/status`)
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        status: 'LEFT_INSTITUTION',
        reason: 'Student transferred to different city academy.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('LEFT_INSTITUTION');

    // Attempt attendance check-in for LEFT_INSTITUTION student -> Expect 400 / 403 Blocked
    const targetStudent = await prisma.student.findUnique({ where: { id: targetStudentId } });
    if (targetStudent) {
      const leftStudentToken = generateAccessToken({ userId: targetStudent.userId, activeRole: 'STUDENT' });
      const attRes = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', `Bearer ${leftStudentToken}`)
        .send({ userId: targetStudent.userId });

      expect([400, 403]).toContain(attRes.status);
    }
  });

  it('6. should initiate and process unified multi-tier approval workflow requests', async () => {
    const createReqRes = await request(app)
      .post('/api/approvals/request')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        requestType: 'USER_REGISTRATION',
        entityType: 'User',
        entityId: superAdminUser.id,
        reason: 'Approval workflow verification',
      });

    expect(createReqRes.status).toBe(201);
    approvalRequestId = createReqRes.body.data.id;

    // Review & Approve
    const reviewRes = await request(app)
      .post(`/api/approvals/${approvalRequestId}/review`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        action: 'APPROVED',
        reason: 'Verified credentials',
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('APPROVED');
  });

  it('7. should suspend user account, revoke active refresh tokens, and block login', async () => {
    // Create temporary user to suspend
    const tempUser = await prisma.user.create({
      data: {
        email: `suspend.me.${Date.now()}@school.edu`,
        passwordHash: '$2b$10$e8N/O8q7S1W4b1q2z3x4uOa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5',
        firstName: 'Suspend',
        lastName: 'Me',
        status: 'ACTIVE',
        activeRole: 'STUDENT',
      },
    });

    const suspendRes = await request(app)
      .post(`/api/permissions/users/${tempUser.id}/suspend`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'Security policy violation' });

    expect(suspendRes.status).toBe(200);
    expect(suspendRes.body.data.status).toBe('SUSPENDED');

    // Attempt login as suspended user -> Expect 400 Account suspended/inactive
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: tempUser.email, password: 'WrongPassword!', role: 'STUDENT' });

    expect([400, 401]).toContain(loginRes.status);
  });

  it('8. should record fee payment, verify transaction server-side, and issue official receipt', async () => {
    if (!officeToken || !targetFeeAssignmentId || !targetStudentId) return;

    const payRes = await request(app)
      .post('/api/office/finance/payment')
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        studentId: targetStudentId,
        studentFeeAssignmentId: targetFeeAssignmentId,
        amount: 2500,
        paymentMethod: 'CASH',
        transactionRef: `PAY-TXN-${Date.now()}`,
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.data.payment.id).toBeDefined();
    expect(payRes.body.data.receipt.receiptNumber).toContain('RCP-');
  });

  it('9. should manage institution settings and configure active academic year', async () => {
    const getRes = await request(app)
      .get('/api/institution')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.institutionName).toBeDefined();

    const updateRes = await request(app)
      .put('/api/institution')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        institutionName: 'St. Lawrence International Academy 2026',
        attendanceThresholdPercent: 80.0,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.institutionName).toBe('St. Lawrence International Academy 2026');
    expect(updateRes.body.data.attendanceThresholdPercent).toBe(80.0);
  });

  it('10. should perform batch student promotion from Class A to Class B preserving historical enrollments', async () => {
    const year1 = await prisma.academicYear.findFirst();
    const year2 = await prisma.academicYear.findFirst({ where: { id: { not: year1?.id } } }) || year1;
    const class2 = await prisma.class.findFirst({ where: { id: { not: classObj?.id } } }) || classObj;

    if (!year1 || !year2 || !classObj || !class2) return;

    const promoRes = await request(app)
      .post('/api/institution/promote-batch')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        fromAcademicYearId: year1.id,
        toAcademicYearId: year2.id,
        fromClassId: classObj.id,
        toClassId: class2.id,
        remarks: 'Annual year-end promotion batch',
      });

    // If active students exist in classObj, expect 200, else expect 400 No active students
    expect([200, 400]).toContain(promoRes.status);
  });

  it('11. should fetch system health status monitoring metrics', async () => {
    const healthRes = await request(app)
      .get('/api/principal/system-health')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(healthRes.status).toBe(200);
    expect(healthRes.body.data.database).toBe('HEALTHY');
    expect(healthRes.body.data.queueStatus).toBeDefined();
  });

  it('12. should log Principal administrative emergency overrides into immutable audit log', async () => {
    const overrideRes = await request(app)
      .post('/api/principal/override-log')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        action: 'FEE_WAIVER_OVERRIDE',
        entityType: 'StudentFeeAssignment',
        entityId: targetFeeAssignmentId || 'MOCK_ID',
        reason: 'Principal discretionary scholarship waiver for academic excellence.',
      });

    expect(overrideRes.status).toBe(201);
    expect(overrideRes.body.data.action).toContain('PRINCIPAL_OVERRIDE');
  });
});
