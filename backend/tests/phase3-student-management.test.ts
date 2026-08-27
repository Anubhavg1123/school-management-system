import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

const app = createApp();

describe('Phase 3 — Student Admission & Complete Student Management Suite', () => {
  let superAdminToken: string;
  let officeAdminToken: string;
  let academicYearId: string;
  let departmentId: string;
  let classId: string;
  let sectionAId: string;
  let sectionBId: string;

  beforeAll(async () => {
    // 1. Authenticate Principal (Super Admin)
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'principal@school.edu',
        password: 'Admin@SecurePassword2026!',
        role: 'SUPER_ADMIN',
      });
    superAdminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Authenticate or Create Office Admin
    const officeLogin = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'office@school.edu',
        password: 'Admin@SecurePassword2026!',
        role: 'OFFICE_ADMIN',
      });

    if (officeLogin.status === 200) {
      officeAdminToken = officeLogin.body.data.tokens.accessToken;
    } else {
      // Use superAdmin token if separate office admin is not seeded
      officeAdminToken = superAdminToken;
    }

    // 3. Setup Academic Year, Department, Class & Sections
    const yearRes = await request(app)
      .post('/api/academic/years')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: `AY-${Date.now()}`,
        startDate: '2026-06-01',
        endDate: '2027-04-30',
        isCurrent: true,
      });
    academicYearId = yearRes.body.data.id;

    const deptRes = await request(app)
      .post('/api/academic/departments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        code: `P3D${Date.now().toString().slice(-4)}`,
        name: 'Computer Science & Engineering',
        description: 'Phase 3 Department',
      });
    departmentId = deptRes.body.data.id;

    const classRes = await request(app)
      .post('/api/academic/classes')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Grade 10 - Advanced Computer Science',
        code: `CLS-P3-${Date.now().toString().slice(-4)}`,
        departmentId,
        academicYearId,
      });
    classId = classRes.body.data.id;

    const secARes = await request(app)
      .post('/api/academic/sections')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        classId,
        name: 'Section A',
        capacity: 40,
      });
    sectionAId = secARes.body.data.id;

    const secBRes = await request(app)
      .post('/api/academic/sections')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        classId,
        name: 'Section B',
        capacity: 40,
      });
    sectionBId = secBRes.body.data.id;
  });

  let createdStudentId: string;
  let createdStudentUserId: string;
  const uniqueAdmNo = `ADM-2026-${Date.now().toString().slice(-5)}`;
  const uniqueEnrNo = `ENR-2026-${Date.now().toString().slice(-5)}`;
  const uniqueStudentEmail = `std.phase3.${Date.now()}@school.edu`;
  const uniqueWhatsApp = `+1-555-${Date.now().toString().slice(-4)}`;

  it('1. should process complete student admission intake with full demographic and academic details', async () => {
    const admissionPayload = {
      firstName: 'Samantha',
      lastName: 'Miller',
      email: uniqueStudentEmail,
      phone: '+1-555-0111',
      whatsAppNumber: uniqueWhatsApp,
      altPhone: '+1-555-0222',
      dateOfBirth: '2010-05-15',
      gender: 'FEMALE',
      bloodGroup: 'O_POSITIVE',
      address: '742 Evergreen Terrace, Springfield',
      emergencyContact: 'Robert Miller (+1-555-0999)',
      admissionNumber: uniqueAdmNo,
      enrollmentNumber: uniqueEnrNo,
      rollNumber: '10A-01',
      academicYearId,
      departmentId,
      sectionId: sectionAId,
      previousSchool: 'Springfield Middle School',
      previousGrade: 'Grade 9',
      previousScore: '94.5%',
      photoUrl: 'https://storage.school.edu/photos/std_sm.jpg',
      guardian: {
        fullName: 'Robert Miller',
        relationship: 'FATHER',
        phone: '+1-555-0999',
        email: 'robert.miller@example.com',
        occupation: 'Software Engineer',
        address: '742 Evergreen Terrace, Springfield',
      },
    };

    const res = await request(app)
      .post('/api/academic/students/admit')
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send(admissionPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student.admissionNumber).toBe(uniqueAdmNo);
    expect(res.body.data.student.enrollmentNumber).toBe(uniqueEnrNo);
    expect(res.body.data.student.status).toBe('ACTIVE');

    createdStudentId = res.body.data.student.id;
    createdStudentUserId = res.body.data.user.id;

    // Verify database integrity
    const dbStudent = await prisma.student.findUnique({
      where: { id: createdStudentId },
      include: { guardians: true, transferHistory: true },
    });
    expect(dbStudent).toBeDefined();
    expect(dbStudent?.guardians.length).toBe(1);
    expect(dbStudent?.guardians[0].fullName).toBe('Robert Miller');
    expect(dbStudent?.transferHistory.length).toBe(1);
    expect(dbStudent?.transferHistory[0].reason).toContain('Initial enrollment');
  });

  it('2. should search students by multiple criteria (name, admission no, whatsapp, section) with pagination', async () => {
    // Search by Admission Number
    const searchAdm = await request(app)
      .get(`/api/academic/students?search=${uniqueAdmNo}`)
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(searchAdm.status).toBe(200);
    expect(searchAdm.body.data.length).toBe(1);
    expect(searchAdm.body.data[0].admissionNumber).toBe(uniqueAdmNo);
    expect(searchAdm.body.meta.total).toBeGreaterThanOrEqual(1);

    // Search by WhatsApp Number
    const searchWA = await request(app)
      .get(`/api/academic/students?search=${encodeURIComponent(uniqueWhatsApp)}`)
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(searchWA.status).toBe(200);
    expect(searchWA.body.data.length).toBe(1);
    expect(searchWA.body.data[0].user.whatsAppNumber).toBe(uniqueWhatsApp);

    // Filter by Section
    const filterSec = await request(app)
      .get(`/api/academic/students?sectionId=${sectionAId}`)
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(filterSec.status).toBe(200);
    expect(filterSec.body.data.some((s: any) => s.id === createdStudentId)).toBe(true);
  });

  it('3. should retrieve complete multi-tab student profile including guardians, history, and documents', async () => {
    const res = await request(app)
      .get(`/api/academic/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.admissionNumber).toBe(uniqueAdmNo);
    expect(res.body.data.guardians.length).toBe(1);
    expect(res.body.data.section.id).toBe(sectionAId);
    expect(res.body.data.section.class.name).toContain('Grade 10');
    expect(res.body.data.transferHistory.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.attendanceSummary).toBeDefined();
    expect(res.body.data.attendanceSummary.present).toBe(0);
  });

  it('4. should execute section transfer and record immutable transfer log in history', async () => {
    const transferRes = await request(app)
      .post(`/api/academic/students/${createdStudentId}/transfer`)
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        toSectionId: sectionBId,
        transferType: 'SECTION_TRANSFER',
        reason: 'Class section rebalance approved by Academic Office.',
      });

    expect(transferRes.status).toBe(200);
    expect(transferRes.body.data.sectionId).toBe(sectionBId);

    // Verify profile history includes the transfer log
    const profileRes = await request(app)
      .get(`/api/academic/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(profileRes.body.data.sectionId).toBe(sectionBId);
    expect(profileRes.body.data.transferHistory.length).toBe(2);
    expect(profileRes.body.data.transferHistory[0].transferType).toBe('SECTION_TRANSFER');
    expect(profileRes.body.data.transferHistory[0].reason).toContain('Class section rebalance');
  });

  it('5. should attach documents to student record with metadata', async () => {
    const docRes = await request(app)
      .post(`/api/academic/students/${createdStudentId}/documents`)
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        docType: 'BIRTH_CERTIFICATE',
        title: 'Original Birth Certificate Scan',
        fileUrl: 'https://secure.school.edu/docs/std_bc_001.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
      });

    expect(docRes.status).toBe(201);
    expect(docRes.body.data.docType).toBe('BIRTH_CERTIFICATE');

    // Verify document in profile
    const profile = await request(app)
      .get(`/api/academic/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(profile.body.data.documents.length).toBe(1);
    expect(profile.body.data.documents[0].title).toBe('Original Birth Certificate Scan');
  });

  it('6. should transition student status to LEFT_INSTITUTION and block future attendance check-in', async () => {
    // 1. Punch attendance while student is active
    const activePunch = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        targetUserId: createdStudentUserId,
        source: 'KIOSK',
      });
    expect(activePunch.status).toBe(200);

    // 2. Change student status to LEFT_INSTITUTION
    const statusRes = await request(app)
      .patch(`/api/academic/students/${createdStudentId}/status`)
      .set('Authorization', `Bearer ${officeAdminToken}`)
      .send({
        status: 'LEFT_INSTITUTION',
        reason: 'Transfer certificate issued due to parent interstate relocation.',
      });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('LEFT_INSTITUTION');

    // Verify student and user status in database
    const dbStudent = await prisma.student.findUnique({ where: { id: createdStudentId } });
    expect(dbStudent?.status).toBe('LEFT_INSTITUTION');
    expect(dbStudent?.sectionId).toBeNull(); // Current section unassigned on leaving

    // 3. Attempt future check-in -> must be rejected with 403 STUDENT_INACTIVE
    const inactivePunch = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        targetUserId: createdStudentUserId,
        source: 'KIOSK',
      });

    expect(inactivePunch.status).toBe(403);
    expect(inactivePunch.body.error.code).toBe('STUDENT_INACTIVE');

    // 4. Verify historical attendance record is preserved immutably
    const historicalAttendance = await prisma.attendance.findMany({
      where: { userId: createdStudentUserId },
    });
    expect(historicalAttendance.length).toBe(1);
  });

  it('7. should generate institutional reports (Roster, Class-wise, Dept-wise, Transfers, and CSV)', async () => {
    // Student Roster Report
    const rosterRes = await request(app)
      .get('/api/reports/students/roster')
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(rosterRes.status).toBe(200);
    expect(rosterRes.body.data.summary.total).toBeGreaterThanOrEqual(1);
    expect(rosterRes.body.data.rows.length).toBeGreaterThanOrEqual(1);

    // CSV Roster Export
    const csvRes = await request(app)
      .get('/api/reports/students/roster?format=csv')
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toContain('text/csv');
    expect(csvRes.text).toContain('Admission No');
    expect(csvRes.text).toContain(uniqueAdmNo);

    // Class-wise Capacity Report
    const classReport = await request(app)
      .get('/api/reports/classes')
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(classReport.status).toBe(200);
    expect(classReport.body.data.classes.length).toBeGreaterThanOrEqual(1);
    expect(classReport.body.data.summary.totalCapacity).toBeGreaterThan(0);

    // Department-wise Report
    const deptReport = await request(app)
      .get('/api/reports/departments')
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(deptReport.status).toBe(200);
    expect(deptReport.body.data.length).toBeGreaterThanOrEqual(1);

    // Transfer Audit Report
    const transferReport = await request(app)
      .get('/api/reports/transfers')
      .set('Authorization', `Bearer ${officeAdminToken}`);

    expect(transferReport.status).toBe(200);
    expect(transferReport.body.data.length).toBeGreaterThanOrEqual(2);
    expect(transferReport.body.data.some((l: any) => l.admissionNumber === uniqueAdmNo)).toBe(true);
  });
});
