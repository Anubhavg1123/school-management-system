import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Phase 4 — Financial & Student Fee Management Suite', () => {
  let adminToken: string;
  let officeToken: string;
  let hodToken: string;
  let facultyToken: string;

  let academicYearId: string;
  let classId: string;
  let sectionId: string;
  let studentId: string;
  let feeStructureId: string;
  let feeAssignmentId: string;
  let paymentId: string;

  beforeAll(async () => {
    // 1. Authenticate Principal (Super Admin)
    const adminRes = await request(app).post('/api/auth/login').send({
      identifier: 'principal@school.edu',
      password: 'Admin@SecurePassword2026!',
      role: 'SUPER_ADMIN',
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.tokens.accessToken;

    // 2. Setup Academic Hierarchy & Department
    const deptRes = await request(app)
      .post('/api/academic/departments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: `FD${Date.now().toString().slice(-4)}`,
        name: 'Finance Faculty Department',
        description: 'Finance test department',
      });
    expect(deptRes.status).toBe(201);
    const departmentId = deptRes.body.data.id;

    // 3. Create Office Admin User & Token
    const officeEmail = `office.finance.${Date.now()}@school.edu`;
    const officeUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: officeEmail,
        username: `office_fin_${Date.now().toString().slice(-4)}`,
        password: 'Password@123!',
        firstName: 'Clara',
        lastName: 'Oswald',
        userCategory: 'ADMINISTRATIVE',
        role: 'OFFICE_ADMIN',
        whatsAppNumber: '+1-555-0300',
      });
    expect(officeUserRes.status).toBe(201);

    const officeLogin = await request(app).post('/api/auth/login').send({
      identifier: officeEmail,
      password: 'Password@123!',
      role: 'OFFICE_ADMIN',
    });
    expect(officeLogin.status).toBe(200);
    officeToken = officeLogin.body.data.tokens.accessToken;

    // 4. Create HOD User & Token
    const hodEmail = `hod.finance.${Date.now()}@school.edu`;
    const hodUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: hodEmail,
        username: `hod_fin_${Date.now().toString().slice(-4)}`,
        password: 'Password@123!',
        firstName: 'Gregory',
        lastName: 'House',
        userCategory: 'TEACHING_STAFF',
        role: 'HOD',
        departmentId,
        whatsAppNumber: '+1-555-0301',
      });
    expect(hodUserRes.status).toBe(201);

    const hodLogin = await request(app).post('/api/auth/login').send({
      identifier: hodEmail,
      password: 'Password@123!',
      role: 'HOD',
    });
    expect(hodLogin.status).toBe(200);
    hodToken = hodLogin.body.data.tokens.accessToken;

    // 5. Create Faculty User & Token
    const facultyEmail = `faculty.finance.${Date.now()}@school.edu`;
    const facultyUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: facultyEmail,
        username: `fac_fin_${Date.now().toString().slice(-4)}`,
        password: 'Password@123!',
        firstName: 'John',
        lastName: 'Keating',
        userCategory: 'TEACHING_STAFF',
        role: 'FACULTY',
        departmentId,
        whatsAppNumber: '+1-555-0302',
      });
    expect(facultyUserRes.status).toBe(201);

    const facultyLogin = await request(app).post('/api/auth/login').send({
      identifier: facultyEmail,
      password: 'Password@123!',
      role: 'FACULTY',
    });
    expect(facultyLogin.status).toBe(200);
    facultyToken = facultyLogin.body.data.tokens.accessToken;

    // 6. Setup Academic Year, Class, Section
    const yrRes = await request(app)
      .post('/api/academic/years')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `AY-${Date.now()}`,
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2027-05-31T00:00:00.000Z',
        isCurrent: true,
      });
    academicYearId = yrRes.body.data.id;

    const classRes = await request(app)
      .post('/api/academic/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Finance Test Grade-${Date.now().toString().slice(-3)}`,
        code: `FTG-${Date.now().toString().slice(-4)}`,
        academicYearId,
      });
    classId = classRes.body.data.id;

    const secRes = await request(app)
      .post('/api/academic/sections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classId,
        name: 'Section A',
        capacity: 40,
      });
    sectionId = secRes.body.data.id;

    // 6. Admit a student
    const admNum = `ADM-FIN-${Date.now().toString().slice(-4)}`;
    const admitRes = await request(app)
      .post('/api/academic/students/admit')
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        firstName: 'David',
        lastName: 'Copperfield',
        email: `david.fin.${Date.now()}@student.school.edu`,
        whatsAppNumber: '+1-555-0922',
        admissionNumber: admNum,
        enrollmentNumber: `ENR-FIN-${Date.now().toString().slice(-4)}`,
        academicYearId,
        classId,
        sectionId,
        guardian: {
          fullName: 'Betsey Trotwood',
          relationship: 'LEGAL_GUARDIAN',
          phone: '+1-555-0923',
        },
      });
    expect(admitRes.status).toBe(201);
    studentId = admitRes.body.data.student.id;
  });

  it('1. should create configurable fee categories and fee structure with itemized breakdown', async () => {
    // Fetch seeded categories
    const catRes = await request(app)
      .get('/api/fees/categories')
      .set('Authorization', `Bearer ${officeToken}`);
    expect(catRes.status).toBe(200);
    expect(catRes.body.data.length).toBeGreaterThanOrEqual(3);

    const tuitionCat = catRes.body.data.find((c: any) => c.code === 'TUITION');
    const labCat = catRes.body.data.find((c: any) => c.code === 'LAB');
    const libCat = catRes.body.data.find((c: any) => c.code === 'LIBRARY');

    expect(tuitionCat).toBeDefined();
    expect(labCat).toBeDefined();

    // Create Fee Structure
    const structRes = await request(app)
      .post('/api/fees/structures')
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        code: `FS-${Date.now().toString().slice(-6)}`,
        name: 'Annual Standard Fee Package 2026-27',
        academicYearId,
        classId,
        description: 'Comprehensive tuition, laboratory, and library fees',
        items: [
          { feeCategoryId: tuitionCat.id, amount: 5000, installmentCount: 3 },
          { feeCategoryId: labCat.id, amount: 1000, installmentCount: 2 },
          { feeCategoryId: libCat.id, amount: 500, installmentCount: 1 },
        ],
      });

    expect(structRes.status).toBe(201);
    expect(structRes.body.data.id).toBeDefined();
    expect(structRes.body.data.items.length).toBe(3);
    feeStructureId = structRes.body.data.id;
  });

  it('2. should assign fee structure to student and generate installment schedules', async () => {
    const assignRes = await request(app)
      .post('/api/fees/assign')
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        studentId,
        feeStructureId,
        academicYearId,
        notes: 'Standard enrollment allocation for academic year',
        customInstallments: 3,
      });

    expect(assignRes.status).toBe(201);
    expect(assignRes.body.data.totalAssignedAmount).toBe(6500); // 5000 + 1000 + 500
    expect(assignRes.body.data.netPayableAmount).toBe(6500);
    expect(assignRes.body.data.status).toBe('UNPAID');
    expect(assignRes.body.data.installments.length).toBe(3);
    expect(assignRes.body.data.installments[0].status).toBe('DUE');
    expect(assignRes.body.data.installments[1].status).toBe('UPCOMING');

    feeAssignmentId = assignRes.body.data.id;
  });

  it('3. should apply scholarship / concession and recalculate installment balances', async () => {
    const discountRes = await request(app)
      .post('/api/fees/discount')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        feeAssignmentId,
        type: 'SCHOLARSHIP',
        amount: 1500,
        reason: 'Merit scholarship awarded by Principal',
      });

    expect(discountRes.status).toBe(201);
    expect(discountRes.body.data.amount).toBe(1500);

    // Verify updated profile
    const profileRes = await request(app)
      .get(`/api/fees/student/${studentId}`)
      .set('Authorization', `Bearer ${officeToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.summary.totalDiscount).toBe(1500);
    expect(profileRes.body.data.summary.totalNetPayable).toBe(5000); // 6500 - 1500
    expect(profileRes.body.data.summary.totalOutstanding).toBe(5000);
  });

  it('4. should process fee payment, allocate to installments, and generate unique receipt', async () => {
    const payRes = await request(app)
      .post('/api/fees/pay')
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        studentId,
        feeAssignmentId,
        amount: 2000,
        paymentMethod: 'UPI',
        transactionReference: `UPI-TXN-${Date.now()}`,
        notes: 'Term 1 fee installment paid via GPay',
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.data.payment.amount).toBe(2000);
    expect(payRes.body.data.payment.status).toBe('SUCCESS');
    expect(payRes.body.data.receipt.receiptNumber).toMatch(/^RCP-/);
    expect(payRes.body.data.receipt.totalRemainingBalance).toBe(3000); // 5000 - 2000

    paymentId = payRes.body.data.payment.id;
  });

  it('5. should reject duplicate transaction reference with 409 Conflict (Idempotency Protection)', async () => {
    const duplicateTxnRef = `UPI-TXN-DUP-${Date.now()}`;

    // First payment succeeds
    const firstPay = await request(app)
      .post('/api/fees/pay')
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        studentId,
        feeAssignmentId,
        amount: 500,
        paymentMethod: 'UPI',
        transactionReference: duplicateTxnRef,
      });
    expect(firstPay.status).toBe(201);

    // Duplicate payment must fail
    const secondPay = await request(app)
      .post('/api/fees/pay')
      .set('Authorization', `Bearer ${officeToken}`)
      .send({
        studentId,
        feeAssignmentId,
        amount: 500,
        paymentMethod: 'UPI',
        transactionReference: duplicateTxnRef,
      });
    expect(secondPay.status).toBe(409);
    expect(secondPay.body.error.code).toBe('DUPLICATE_TRANSACTION_REF');
  });

  it('6. should process refund against payment, update payment status and reopen installment balance', async () => {
    const refundRes = await request(app)
      .post('/api/fees/refund')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        paymentId,
        amount: 500,
        reason: 'Overpayment adjustment approved by administration',
      });

    expect(refundRes.status).toBe(201);
    expect(refundRes.body.data.refundNumber).toMatch(/^REF-/);
    expect(refundRes.body.data.amount).toBe(500);

    // Verify updated student financial profile
    const profileRes = await request(app)
      .get(`/api/fees/student/${studentId}`)
      .set('Authorization', `Bearer ${officeToken}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.summary.totalRefunded).toBe(500);
    expect(profileRes.body.data.summary.totalOutstanding).toBe(3000); // (5000 net - (2500 paid - 500 refunded)) = 3000
  });

  it('7. should strictly block HOD, Faculty, and Non-Faculty from accessing financial endpoints (403 Forbidden)', async () => {
    // HOD Attempt
    const hodRes = await request(app)
      .get('/api/fees/dashboard')
      .set('Authorization', `Bearer ${hodToken}`);
    expect(hodRes.status).toBe(403);
    expect(hodRes.body.error.code).toBe('FORBIDDEN_ROLE');

    // Faculty Attempt
    const facultyRes = await request(app)
      .get(`/api/fees/student/${studentId}`)
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(facultyRes.status).toBe(403);
    expect(facultyRes.body.error.code).toBe('FORBIDDEN_ROLE');
  });

  it('8. should query financial dashboard KPIs and export outstanding fees report as CSV', async () => {
    // Dashboard KPI
    const dashRes = await request(app)
      .get('/api/fees/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.kpi.totalAssigned).toBeGreaterThan(0);
    expect(dashRes.body.data.kpi.totalCollected).toBeGreaterThan(0);

    // CSV Outstanding Report
    const csvRes = await request(app)
      .get('/api/fees/reports/outstanding?format=csv')
      .set('Authorization', `Bearer ${officeToken}`);

    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toContain('text/csv');
    expect(csvRes.text).toContain('Admission No');
    expect(csvRes.text).toContain('Outstanding Balance');
    expect(csvRes.text).toContain('David Copperfield');
  });
});
