import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

const app = createApp();

describe('Phase 2 — Complete User Management & Approval Workflow', () => {
  let adminToken: string;
  let csDeptId: string;
  let meDeptId: string;

  beforeAll(async () => {
    // 1. Login as Super Admin (Principal)
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'principal@school.edu',
        password: 'Admin@SecurePassword2026!',
      });
    adminToken = adminLogin.body.data.tokens.accessToken;

    // 2. Ensure CS and ME departments exist
    const csDept = await prisma.department.upsert({
      where: { code: 'CS_TEST_P2' },
      update: {},
      create: { code: 'CS_TEST_P2', name: 'Computer Science Dept P2' },
    });
    csDeptId = csDept.id;

    const meDept = await prisma.department.upsert({
      where: { code: 'ME_TEST_P2' },
      update: {},
      create: { code: 'ME_TEST_P2', name: 'Mechanical Dept P2' },
    });
    meDeptId = meDept.id;
  });

  it('should register applicant with full extended profile and transition PENDING -> UNDER_REVIEW -> APPROVED -> ACTIVE', async () => {
    const timestamp = Date.now();
    const applicantEmail = `applicant_p2_${timestamp}@school.edu`;
    const applicantUsername = `applicant_p2_${timestamp}`;
    const password = 'Applicant@Secure2026!';

    // 1. Submit Registration with all extended fields
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: applicantEmail,
        username: applicantUsername,
        password,
        firstName: 'Elena',
        lastName: 'Rostova',
        phone: '+1-555-4433',
        whatsAppNumber: '+1-555-4433',
        altPhone: '+1-555-9988',
        dob: '1990-05-15',
        gender: 'FEMALE',
        address: '742 Evergreen Terrace, Springfield',
        emergencyContactName: 'Dmitri Rostov',
        emergencyContactPhone: '+1-555-1122',
        userCategory: 'TEACHING_STAFF',
        requestedRole: 'FACULTY',
        departmentId: csDeptId,
        applicationNotes: 'M.Sc Computer Science with 5 years teaching experience.',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.status).toBe('PENDING_APPROVAL');
    const registrationId = regRes.body.data.registrationId;

    // Verify user cannot log in while PENDING
    const prematureLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: applicantEmail, password });
    expect(prematureLogin.status).toBe(403);
    expect(prematureLogin.body.error.code).toBe('ACCOUNT_PENDING_APPROVAL');

    // 2. Mark Under Review by Principal
    const underReviewRes = await request(app)
      .patch(`/api/registrations/${registrationId}/under-review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reviewerNotes: 'Documents received. Background check in progress.' });

    expect(underReviewRes.status).toBe(200);
    expect(underReviewRes.body.data.status).toBe('UNDER_REVIEW');

    // 3. Principal Approves Registration with Department and Employee Code
    const approveRes = await request(app)
      .post(`/api/registrations/${registrationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        departmentId: csDeptId,
        employeeOrAdmissionCode: `EMP-CS-${timestamp.toString().slice(-4)}`,
        designation: 'ASST_PROFESSOR',
        reviewerNotes: 'Verification complete. Candidate approved for CS department.',
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('ACTIVE');

    // 4. User can now successfully log in as FACULTY
    const facultyLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: applicantEmail, password, selectedRole: 'FACULTY' });

    expect(facultyLogin.status).toBe(200);
    expect(facultyLogin.body.data.user.activeRole).toBe('FACULTY');
    expect(facultyLogin.body.data.user.departmentId).toBe(csDeptId);
  });

  it('should reject registration with reason and forbid login indefinitely', async () => {
    const timestamp = Date.now();
    const rejectEmail = `rejected_user_${timestamp}@school.edu`;
    const rejectUsername = `rejected_user_${timestamp}`;
    const password = 'Rejected@Secure2026!';

    // Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: rejectEmail,
        username: rejectUsername,
        password,
        firstName: 'Marcus',
        lastName: 'Vance',
        whatsAppNumber: '+1-555-8877',
        userCategory: 'NON_TEACHING_STAFF',
        requestedRole: 'NON_FACULTY',
      });
    const registrationId = regRes.body.data.registrationId;

    // Reject with reason
    const rejectRes = await request(app)
      .post(`/api/registrations/${registrationId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Incomplete certification details provided.' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('REJECTED');

    // Attempted Login is strictly blocked
    const rejectedLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: rejectEmail, password });

    expect(rejectedLogin.status).toBe(403);
    expect(rejectedLogin.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('should allow Super Admin to create a pre-approved user, update profile, and reset credentials', async () => {
    const timestamp = Date.now();
    const newUserEmail = `direct_user_${timestamp}@school.edu`;
    const newUsername = `direct_user_${timestamp}`;

    // 1. Admin creates user
    const createRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: newUserEmail,
        username: newUsername,
        password: 'Initial@Password2026!',
        firstName: 'Sarah',
        lastName: 'Connor',
        phone: '+1-555-7766',
        whatsAppNumber: '+1-555-7766',
        dob: '1988-11-22',
        gender: 'FEMALE',
        address: '100 SkyNet Blvd',
        userCategory: 'TEACHING_STAFF',
        role: 'FACULTY',
        departmentId: csDeptId,
        designation: 'ASSOCIATE_PROFESSOR',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.status).toBe('ACTIVE');
    const createdUserId = createRes.body.data.id;

    // 2. Admin edits profile
    const updateRes = await request(app)
      .put(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        phone: '+1-555-9999',
        whatsAppNumber: '+1-555-9999',
        address: '200 Resistance Ave',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.phone).toBe('+1-555-9999');

    // 3. User logs in with initial password
    const initialLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: newUserEmail, password: 'Initial@Password2026!' });
    expect(initialLogin.status).toBe(200);
    const oldRefreshToken = initialLogin.body.data.tokens.refreshToken;

    // 4. Admin resets password
    const newResetPass = 'Reset@SecurePass2026!';
    const resetRes = await request(app)
      .post(`/api/users/${createdUserId}/reset-password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newPassword: newResetPass });

    expect(resetRes.status).toBe(200);

    // Old refresh token must be invalidated
    const refreshOld = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefreshToken });
    expect(refreshOld.status).toBe(401);

    // User logs in with new password
    const newPassLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: newUserEmail, password: newResetPass });
    expect(newPassLogin.status).toBe(200);
  });

  it('should enforce department-specific authorization and reject HOD reviewing cross-department leave', async () => {
    const timestamp = Date.now();

    // 1. Create HOD for CS Department
    const csHodUser = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `cshod_${timestamp}@school.edu`,
        username: `cshod_${timestamp}`,
        password: 'HOD@SecurePassword2026!',
        firstName: 'Alan',
        lastName: 'Turing',
        whatsAppNumber: '+1-555-2233',
        userCategory: 'TEACHING_STAFF',
        role: 'HOD',
        departmentId: csDeptId,
      });
    const csHodLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: `cshod_${timestamp}@school.edu`, password: 'HOD@SecurePassword2026!' });
    const csHodToken = csHodLogin.body.data.tokens.accessToken;

    // 2. Create Faculty for ME Department
    const meFacultyUser = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `mefaculty_${timestamp}@school.edu`,
        username: `mefaculty_${timestamp}`,
        password: 'Faculty@Secure2026!',
        firstName: 'Nikola',
        lastName: 'Tesla',
        whatsAppNumber: '+1-555-3344',
        userCategory: 'TEACHING_STAFF',
        role: 'FACULTY',
        departmentId: meDeptId,
      });
    const meFacultyLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: `mefaculty_${timestamp}@school.edu`, password: 'Faculty@Secure2026!' });
    const meFacultyToken = meFacultyLogin.body.data.tokens.accessToken;

    // 3. ME Faculty submits leave request
    const leaveRes = await request(app)
      .post('/api/leave/request')
      .set('Authorization', `Bearer ${meFacultyToken}`)
      .send({
        leaveType: 'CASUAL',
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        reason: 'Attending IEEE Mechanical Engineering Symposium',
      });
    expect(leaveRes.status).toBe(201);
    const leaveId = leaveRes.body.data.id;

    // 4. CS HOD attempts to review ME Faculty leave -> MUST BE REJECTED with 403
    const crossDeptReview = await request(app)
      .post(`/api/leave/${leaveId}/review`)
      .set('Authorization', `Bearer ${csHodToken}`)
      .send({ action: 'APPROVED' });

    expect(crossDeptReview.status).toBe(403);
    expect(crossDeptReview.body.error.code).toBe('DEPARTMENT_FORBIDDEN');

    // 5. Super Admin (Principal) reviews and approves the leave
    const principalReview = await request(app)
      .post(`/api/leave/${leaveId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVED' });

    expect(principalReview.status).toBe(200);
    expect(principalReview.body.data.status).toBe('APPROVED');
  });

  it('should support logout from all sessions revoking all active refresh tokens', async () => {
    const timestamp = Date.now();
    const userEmail = `multi_session_${timestamp}@school.edu`;
    const password = 'Session@Secure2026!';

    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: userEmail,
        username: `user_${timestamp}`,
        password,
        firstName: 'Multi',
        lastName: 'Device',
        whatsAppNumber: '+1-555-0987',
        userCategory: 'TEACHING_STAFF',
        role: 'FACULTY',
        departmentId: csDeptId,
      });

    // Session 1 (Desktop)
    const session1 = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'Desktop Browser')
      .send({ identifier: userEmail, password });
    const token1 = session1.body.data.tokens.accessToken;
    const refresh1 = session1.body.data.tokens.refreshToken;

    // Session 2 (Mobile)
    const session2 = await request(app)
      .post('/api/auth/login')
      .set('User-Agent', 'Mobile Phone')
      .send({ identifier: userEmail, password });
    const refresh2 = session2.body.data.tokens.refreshToken;

    // Trigger logout from all sessions using Session 1
    const logoutAllRes = await request(app)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${token1}`)
      .send();

    expect(logoutAllRes.status).toBe(200);

    // Both refresh tokens must now be revoked
    const refreshTry1 = await request(app).post('/api/auth/refresh').send({ refreshToken: refresh1 });
    expect(refreshTry1.status).toBe(401);

    const refreshTry2 = await request(app).post('/api/auth/refresh').send({ refreshToken: refresh2 });
    expect(refreshTry2.status).toBe(401);
  });
});
