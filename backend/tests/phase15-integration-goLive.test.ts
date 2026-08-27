import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';
import { generateAccessToken } from '../src/utils/jwt';
import { NotificationService } from '../src/services/notification.service';

const app = createApp();

let adminToken: string;
let officeToken: string;
let studentToken: string;
let studentUser: any;
let studentRecord: any;
let academicYear: any;

describe('Phase 15 — Complete Institutional Integration, Reporting, Data Migration & Go-Live Readiness', () => {
  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Roles
    let superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({ data: { name: 'SUPER_ADMIN', displayName: 'Super Admin' } });
    }

    let officeAdminRole = await prisma.role.findUnique({ where: { name: 'OFFICE_ADMIN' } });
    if (!officeAdminRole) {
      officeAdminRole = await prisma.role.create({ data: { name: 'OFFICE_ADMIN', displayName: 'Office Admin' } });
    }

    let studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
    if (!studentRole) {
      studentRole = await prisma.role.create({ data: { name: 'STUDENT', displayName: 'Student' } });
    }

    // 2. Academic Year
    academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
      academicYear = await prisma.academicYear.create({
        data: {
          name: `2026-2027 Phase 15 Go-Live Year ${timestamp}`,
          startDate: new Date('2026-06-01'),
          endDate: new Date('2027-05-31'),
          isCurrent: true,
        },
      });

    // 3. Super Admin User & UserRole
    const adminUser = await prisma.user.create({
      data: {
        email: `admin.p15.${timestamp}@institution.edu`,
        username: `admin_p15_${timestamp}`,
        passwordHash: '$2b$12$e8Y4V...dummy',
        firstName: 'Principal',
        lastName: 'Director',
        activeRole: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: superAdminRole.id, isPrimary: true },
    });
    adminToken = generateAccessToken({ userId: adminUser.id, activeRole: 'SUPER_ADMIN' });

    // 4. Office Admin User & UserRole
    const officeUser = await prisma.user.create({
      data: {
        email: `office.p15.${timestamp}@institution.edu`,
        username: `office_p15_${timestamp}`,
        passwordHash: '$2b$12$e8Y4V...dummy',
        firstName: 'Registrar',
        lastName: 'Office',
        activeRole: 'OFFICE_ADMIN',
        status: 'ACTIVE',
      },
    });
    await prisma.userRole.create({
      data: { userId: officeUser.id, roleId: officeAdminRole.id, isPrimary: true },
    });
    officeToken = generateAccessToken({ userId: officeUser.id, activeRole: 'OFFICE_ADMIN' });

    // 5. Student User & Student Record
    studentUser = await prisma.user.create({
      data: {
        email: `student.p15.${timestamp}@institution.edu`,
        username: `student_p15_${timestamp}`,
        passwordHash: '$2b$12$e8Y4V...dummy',
        firstName: 'Alex',
        lastName: 'Phase15',
        activeRole: 'STUDENT',
        status: 'ACTIVE',
        userCategory: 'STUDENT',
      },
    });
    await prisma.userRole.create({
      data: { userId: studentUser.id, roleId: studentRole.id, isPrimary: true },
    });
    studentToken = generateAccessToken({ userId: studentUser.id, activeRole: 'STUDENT' });

    studentRecord = await prisma.student.create({
      data: {
        userId: studentUser.id,
        admissionNumber: `ADM-P15-${timestamp}`,
        academicYearId: academicYear.id,
        gender: 'MALE',
        dateOfBirth: new Date('2008-04-15'),
        admissionDate: new Date('2026-06-15'),
        status: 'ACTIVE',
      },
    });
  });

  // TEST 1: Go-Live Readiness Verification
  it('1. GET /api/admin/go-live-check should return subsystem evaluation', async () => {
    const res = await request(app)
      .get('/api/admin/go-live-check')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('overallStatus');
    expect(res.body.data).toHaveProperty('checks');
    expect(Array.isArray(res.body.data.checks)).toBe(true);
    expect(res.body.data.summary.total).toBeGreaterThan(5);

    const checkNames = res.body.data.checks.map((c: any) => c.name);
    expect(checkNames).toContain('Database Connectivity');
    expect(checkNames).toContain('Active Academic Year');
  });

  // TEST 2: Configuration & Posture Inspection
  it('2. GET /api/admin/config-check should expose safe runtime settings', async () => {
    const res = await request(app)
      .get('/api/admin/config-check')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.mfaAvailable).toBe(true);
    expect(res.body.data.helmetEnabled).toBe(true);
    expect(res.body.data.requestCorrelationIdsEnabled).toBe(true);
  });

  // TEST 3: RBAC Protection on Admin Endpoint
  it('3. GET /api/admin/go-live-check should reject student requests with 403', async () => {
    const res = await request(app)
      .get('/api/admin/go-live-check')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  // TEST 4: Student Creates Support Ticket
  let createdTicketId: string;
  it('4. POST /api/support should create a valid support ticket', async () => {
    const res = await request(app)
      .post('/api/support')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        category: 'ATTENDANCE',
        description: 'My attendance was marked absent on Monday despite being present.',
        priority: 'NORMAL',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('ticketNumber');
    expect(res.body.data.status).toBe('OPEN');
    expect(res.body.data.category).toBe('ATTENDANCE');
    createdTicketId = res.body.data.id;
  });

  // TEST 5: Student Sees Own Tickets Only
  it('5. GET /api/support should return only the requesting student tickets', async () => {
    const res = await request(app)
      .get('/api/support')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tickets.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.tickets.every((t: any) => t.userId === studentUser.id)).toBe(true);
  });

  // TEST 6: Office Admin Views All Tickets & Updates Status
  it('6. PATCH /api/support/:id should allow staff to transition ticket status', async () => {
    const res = await request(app)
      .patch(`/api/support/${createdTicketId}`)
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        status: 'IN_PROGRESS',
        resolution: 'Office is cross-referencing biometric gate logs.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  // TEST 7: Comment Thread on Support Ticket
  it('7. POST /api/support/:id/comments should add communication note', async () => {
    const res = await request(app)
      .post(`/api/support/${createdTicketId}/comments`)
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        comment: 'Faculty confirmed roll-call oversight. Updating attendance ledger.',
        isInternal: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.comment).toContain('Faculty confirmed');
  });

  // TEST 8: Ticket Statistics Summary
  it('8. GET /api/support/stats should return ticket distribution counts', async () => {
    const res = await request(app)
      .get('/api/support/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('statusSummary');
    expect(res.body.data.statusSummary.total).toBeGreaterThanOrEqual(1);
  });

  // TEST 9: CSV Student Import Validation Preview (Detecting Errors)
  it('9. POST /api/import/students/preview should detect missing fields and invalid emails', async () => {
    const invalidCsv = `first_name,last_name,email,admission_number,gender,date_of_birth
John,Doe,not-an-email,,MALE,2008-01-01
Jane,Smith,valid.jane.${Date.now()}@test.edu,ADM-VAL-${Date.now()},FEMALE,2008-02-02`;

    const res = await request(app)
      .post('/api/import/students/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csvContent: invalidCsv, filename: 'test_students.csv' });

    expect(res.status).toBe(200);
    expect(res.body.data.totalRows).toBe(2);
    expect(res.body.data.validRows).toBe(1);
    expect(res.body.data.invalidRows).toBe(1);
  });

  // TEST 10: CSV Student Import Execution (Transactional Creation)
  it('10. POST /api/import/students/confirm should atomically ingest valid students', async () => {
    const uniqueAdm = `ADM-IMP-${Date.now()}`;
    const uniqueEmail = `import.student.${Date.now()}@school.edu`;
    const validCsv = `first_name,last_name,email,admission_number,gender,date_of_birth
Imported,User,${uniqueEmail},${uniqueAdm},FEMALE,2009-03-10`;

    const previewRes = await request(app)
      .post('/api/import/students/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csvContent: validCsv, filename: 'valid_batch.csv' });

    expect(previewRes.status).toBe(200);
    const importLogId = previewRes.body.data.importLogId;

    const confirmRes = await request(app)
      .post('/api/import/students/confirm')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ importLogId });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.successRows).toBe(1);

    // Verify student exists in DB
    const dbStudent = await prisma.student.findUnique({ where: { admissionNumber: uniqueAdm } });
    expect(dbStudent).not.toBeNull();
  });

  // TEST 11: Import Audit Logs
  it('11. GET /api/import/logs should list import history', async () => {
    const res = await request(app)
      .get('/api/import/logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.logs)).toBe(true);
    expect(res.body.data.logs.length).toBeGreaterThanOrEqual(1);
  });

  // TEST 12: Finance Reconciliation
  it('12. GET /api/admin/reconciliation/finance should report ledger consistency', async () => {
    const res = await request(app)
      .get('/api/admin/reconciliation/finance')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data.summary).toHaveProperty('status');
  });

  // TEST 13: Enrollment Reconciliation
  it('13. GET /api/admin/reconciliation/enrollment should report student allocation gaps', async () => {
    const res = await request(app)
      .get('/api/admin/reconciliation/enrollment')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data.summary.totalActiveStudents).toBeGreaterThanOrEqual(1);
  });

  // TEST 14: Attendance Reconciliation
  it('14. GET /api/admin/reconciliation/attendance should inspect finalized empty slots', async () => {
    const res = await request(app)
      .get('/api/admin/reconciliation/attendance')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
  });

  // TEST 15: Attendance Reporting API
  it('15. GET /api/reports/attendance should return slot attendance aggregations', async () => {
    const res = await request(app)
      .get('/api/reports/attendance')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data).toHaveProperty('rows');
  });

  // TEST 16: Finance Reporting API
  it('16. GET /api/reports/finance should return fee collection breakdown', async () => {
    const res = await request(app)
      .get('/api/reports/finance')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('summary');
    expect(res.body.data.summary).toHaveProperty('totalCollected');
  });

  // TEST 17: Staff & Visitor Reporting APIs
  it('17. GET /api/reports/staff and /api/reports/visitors should return rosters', async () => {
    const staffRes = await request(app)
      .get('/api/reports/staff')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(staffRes.status).toBe(200);
    expect(staffRes.body.data).toHaveProperty('summary');

    const visitorRes = await request(app)
      .get('/api/reports/visitors')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(visitorRes.status).toBe(200);
    expect(visitorRes.body.data).toHaveProperty('summary');
  });

  // TEST 18: CSV Export from Reports
  it('18. GET /api/reports/students/roster?format=csv should return text/csv data', async () => {
    const res = await request(app)
      .get('/api/reports/students/roster?format=csv')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Admission No');
  });

  // TEST 19: Notification Event Dispatch for RESULT_PUBLISHED
  it('19. NotificationService should dispatch RESULT_PUBLISHED to student user', async () => {
    const result = await NotificationService.dispatchNotificationEvent({
      eventType: 'RESULT_PUBLISHED',
      sourceModule: 'RESULT',
      payload: {
        studentId: studentRecord.id,
        examinationName: 'Mid-Term 2026',
        percentage: 88.5,
      },
    });

    expect(result.status).toBe('DISPATCHED');
    expect(result.recipientCount).toBeGreaterThanOrEqual(1);

    const notifs = await NotificationService.getUserNotifications(studentUser.id);
    expect(notifs.notifications.some((n: any) => n.title.includes('Result Published'))).toBe(true);
  });

  // TEST 20: Notification Event Dispatch for PAYMENT_RECEIVED
  it('20. NotificationService should dispatch PAYMENT_RECEIVED event seamlessly', async () => {
    const result = await NotificationService.dispatchNotificationEvent({
      eventType: 'PAYMENT_RECEIVED',
      sourceModule: 'PAYMENT',
      payload: {
        studentId: studentRecord.id,
        amount: 15000,
        receiptNumber: 'REC-P15-001',
      },
    });

    expect(result.status).toBe('DISPATCHED');
    expect(result.recipientCount).toBeGreaterThanOrEqual(1);

    const notifs = await NotificationService.getUserNotifications(studentUser.id);
    expect(notifs.notifications.some((n: any) => n.title.includes('Payment Received'))).toBe(true);
  });
});
