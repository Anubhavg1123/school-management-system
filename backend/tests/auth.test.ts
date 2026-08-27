import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/prisma';

const app = createApp();

describe('Authentication & Security API', () => {
  beforeAll(async () => {
    // Reset admin login attempts
    await prisma.user.updateMany({
      where: { email: 'principal@school.edu' },
      data: { failedLoginAttempts: 0, lockoutUntil: null, status: 'ACTIVE' },
    });
  });

  it('should successfully log in the seeded Super Administrator (Principal)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'principal@school.edu',
        password: 'Admin@SecurePassword2026!',
        selectedRole: 'SUPER_ADMIN',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
    expect(res.body.data.user.roles).toContain('SUPER_ADMIN');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'principal@school.edu',
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');

    // Reset attempts so other tests succeed
    await prisma.user.updateMany({
      where: { email: 'principal@school.edu' },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    });
  });

  it('should reject login when user attempts role spoofing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'principal@school.edu',
        password: 'Admin@SecurePassword2026!',
        selectedRole: 'NON_FACULTY', // Principal does not have NON_FACULTY role
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROLE_NOT_ASSIGNED');
  });

  it('should allow public user registration with PENDING_APPROVAL status', async () => {
    const testUsername = `faculty_${Date.now()}`;
    const testEmail = `${testUsername}@school.edu`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        username: testUsername,
        password: 'Password@Secure2026!',
        firstName: 'John',
        lastName: 'Doe',
        whatsAppNumber: '+1-555-0199',
        requestedRole: 'FACULTY',
        applicationNotes: 'Applying for Mathematics Faculty',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING_APPROVAL');

    // Attempt to log in with newly registered account before approval
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: testEmail,
        password: 'Password@Secure2026!',
      });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.error.code).toBe('ACCOUNT_PENDING_APPROVAL');
  });

  it('should rotate tokens with refresh endpoint', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'principal@school.edu',
        password: 'Admin@SecurePassword2026!',
      });

    const refreshToken = loginRes.body.data.tokens.refreshToken;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();
  });
});
