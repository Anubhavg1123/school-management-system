import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

const app = createApp();

describe('Security, Lockout & RBAC Advanced Suite', () => {
  const lockoutEmail = `lockout_target_${Date.now()}@school.edu`;
  const lockoutUser = `lockout_user_${Date.now()}`;
  const correctPassword = 'Target@SecurePassword2026!';
  let userId: string;

  beforeAll(async () => {
    // Create an active user for lockout testing
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: lockoutEmail,
        username: lockoutUser,
        password: correctPassword,
        firstName: 'Lockout',
        lastName: 'TestUser',
        whatsAppNumber: '+1-555-0166',
        requestedRole: 'FACULTY',
      });

    const regId = regRes.body.data.registrationId;

    // Login as Super Admin to approve
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'principal@school.edu',
        password: 'Admin@SecurePassword2026!',
      });
    const adminToken = adminLogin.body.data.tokens.accessToken;

    // Create a dept
    const dept = await prisma.department.upsert({
      where: { code: 'SEC_DEPT' },
      update: {},
      create: { code: 'SEC_DEPT', name: 'Security Department' },
    });

    await request(app)
      .post(`/api/registrations/${regId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ departmentId: dept.id });

    const u = await prisma.user.findUnique({ where: { email: lockoutEmail } });
    userId = u!.id;
  });

  it('should lock out account after 5 consecutive failed login attempts', async () => {
    // Attempts 1 to 4 should return 401
    for (let i = 1; i <= 4; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: lockoutEmail,
          password: 'IncorrectPassword!',
        });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    }

    // 5th attempt triggers lockout and returns 403
    const fifthRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: lockoutEmail,
        password: 'IncorrectPassword!',
      });
    expect(fifthRes.status).toBe(403);
    expect(fifthRes.body.error.code).toBe('ACCOUNT_LOCKED');

    // 6th attempt with CORRECT password is also rejected because account is locked
    const correctWhileLocked = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: lockoutEmail,
        password: correctPassword,
      });
    expect(correctWhileLocked.status).toBe(403);
    expect(correctWhileLocked.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  it('should allow Super Admin to unlock account and restore login access', async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'principal@school.edu',
        password: 'Admin@SecurePassword2026!',
      });
    const adminToken = adminLogin.body.data.tokens.accessToken;

    // Unlock user
    const unlockRes = await request(app)
      .patch(`/api/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(unlockRes.status).toBe(200);
    expect(unlockRes.body.data.status).toBe('ACTIVE');

    // User can now log in with correct credentials
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: lockoutEmail,
        password: correctPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  it('should support authenticated password change and invalidate prior refresh tokens', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: lockoutEmail,
        password: correctPassword,
      });

    const userToken = loginRes.body.data.tokens.accessToken;
    const oldRefreshToken = loginRes.body.data.tokens.refreshToken;
    const newPassword = 'New@PasswordSecure2026!';

    // Change password
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        currentPassword: correctPassword,
        newPassword,
      });

    expect(changeRes.status).toBe(200);

    // Old refresh token should now be revoked
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefreshToken });

    expect(refreshRes.status).toBe(401);

    // Login with new password
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: lockoutEmail,
        password: newPassword,
      });

    expect(newLoginRes.status).toBe(200);
  });
});
