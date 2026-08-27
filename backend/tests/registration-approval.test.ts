import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

const app = createApp();

describe('Registration & Multi-Tier Approval Workflow', () => {
  let adminToken: string;
  let testDeptId: string;

  beforeAll(async () => {
    await prisma.user.updateMany({
      where: { email: 'principal@school.edu' },
      data: { failedLoginAttempts: 0, lockoutUntil: null, status: 'ACTIVE' },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'principal@school.edu',
        password: 'Admin@SecurePassword2026!',
      });
    adminToken = loginRes.body.data.tokens.accessToken;

    // Ensure a test department exists
    const dept = await prisma.department.upsert({
      where: { code: 'TEST_CS' },
      update: {},
      create: {
        code: 'TEST_CS',
        name: 'Computer Science & Engineering',
        description: 'Test Department',
      },
    });
    testDeptId = dept.id;
  });

  it('should prevent unauthenticated access to pending registrations', async () => {
    const res = await request(app).get('/api/registrations/pending');
    expect(res.status).toBe(401);
  });

  it('should complete registration -> approval -> login lifecycle for a new user', async () => {
    const testUsername = `prof_alan_${Date.now()}`;
    const testEmail = `${testUsername}@school.edu`;
    const testPassword = 'Prof@SecurePassword2026!';

    // 1. Submit Registration
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        username: testUsername,
        password: testPassword,
        firstName: 'Alan',
        lastName: 'Turing',
        whatsAppNumber: '+1-555-0188',
        requestedRole: 'FACULTY',
        departmentId: testDeptId,
        applicationNotes: 'Professor of Computing',
      });

    expect(regRes.status).toBe(201);
    const registrationId = regRes.body.data.registrationId;
    expect(registrationId).toBeDefined();

    // 2. Principal inspects pending registrations
    const pendingRes = await request(app)
      .get('/api/registrations/pending?limit=100')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pendingRes.status).toBe(200);
    const targetItem = pendingRes.body.data.find((r: any) => r.id === registrationId);
    expect(targetItem).toBeDefined();

    // 3. Principal Approves Registration
    const approveRes = await request(app)
      .post(`/api/registrations/${registrationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        departmentId: testDeptId,
        designation: 'PROFESSOR',
        employeeOrAdmissionCode: `EMP-${Date.now().toString().slice(-4)}`,
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('ACTIVE');

    // 4. Newly approved faculty can now log in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testEmail,
        password: testPassword,
        selectedRole: 'FACULTY',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.roles).toContain('FACULTY');
    expect(loginRes.body.data.user.departmentId).toBe(testDeptId);
  });

  it('should reject a registration with a mandatory reason', async () => {
    const testUsername = `invalid_applicant_${Date.now()}`;
    const testEmail = `${testUsername}@school.edu`;

    // 1. Submit Registration
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        username: testUsername,
        password: 'Password@Secure2026!',
        firstName: 'Bad',
        lastName: 'Applicant',
        whatsAppNumber: '+1-555-0177',
        requestedRole: 'FACULTY',
      });

    const regId = regRes.body.data.registrationId;

    // 2. Reject
    const rejectRes = await request(app)
      .post(`/api/registrations/${regId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'Incomplete credential verification and invalid document submission.',
      });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('REJECTED');

    // 3. Rejected user cannot log in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testEmail,
        password: 'Password@Secure2026!',
      });

    expect(loginRes.status).toBe(403);
  });
});
