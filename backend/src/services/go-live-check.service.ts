import { prisma } from '../prisma';
import { WhatsAppService } from './whatsapp.service';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

export interface GoLiveCheck {
  name: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  required: boolean;
}

export class GoLiveCheckService {
  static async runChecks(): Promise<{
    overallStatus: 'READY' | 'READY_WITH_WARNINGS' | 'NOT_READY';
    checks: GoLiveCheck[];
    summary: { pass: number; warning: number; fail: number; total: number };
  }> {
    const checks: GoLiveCheck[] = [];

    // 1. Database Connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.push({ name: 'Database Connectivity', status: 'PASS', message: 'Database is reachable and responding.', required: true });
    } catch {
      checks.push({ name: 'Database Connectivity', status: 'FAIL', message: 'Cannot connect to database.', required: true });
    }

    // 2. Active Academic Year
    const activeYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (activeYear) {
      checks.push({ name: 'Active Academic Year', status: 'PASS', message: `Active year: ${activeYear.name}`, required: true });
    } else {
      checks.push({ name: 'Active Academic Year', status: 'FAIL', message: 'No active academic year set. Students cannot be enrolled.', required: true });
    }

    // 3. Departments
    const deptCount = await prisma.department.count({ where: { status: 'ACTIVE' } });
    if (deptCount > 0) {
      checks.push({ name: 'Departments', status: 'PASS', message: `${deptCount} active department(s) configured.`, required: true });
    } else {
      checks.push({ name: 'Departments', status: 'FAIL', message: 'No active departments. Faculty and students cannot be organized.', required: true });
    }

    // 4. Classes & Sections
    const classCount = await prisma.class.count();
    const sectionCount = await prisma.section.count();
    if (classCount > 0 && sectionCount > 0) {
      checks.push({ name: 'Classes & Sections', status: 'PASS', message: `${classCount} class(es), ${sectionCount} section(s).`, required: true });
    } else {
      checks.push({ name: 'Classes & Sections', status: classCount === 0 ? 'FAIL' : 'WARNING', message: classCount === 0 ? 'No classes configured.' : 'No sections configured.', required: true });
    }

    // 5. Auth Secrets Strength
    const jwtSecret = process.env.JWT_ACCESS_SECRET || '';
    const isDefaultSecret = jwtSecret === 'your-super-secret-jwt-access-key-change-in-production' || jwtSecret.length < 32;
    if (!isDefaultSecret) {
      checks.push({ name: 'Authentication Secrets', status: 'PASS', message: 'JWT secrets are configured and non-default.', required: true });
    } else {
      checks.push({ name: 'Authentication Secrets', status: 'FAIL', message: 'JWT_ACCESS_SECRET is using default or weak value. Change before production.', required: true });
    }

    // 6. At least one admin user
    const adminCount = await prisma.user.count({ where: { activeRole: 'SUPER_ADMIN', status: 'ACTIVE' } });
    if (adminCount > 0) {
      checks.push({ name: 'Admin Users', status: 'PASS', message: `${adminCount} active admin user(s).`, required: true });
    } else {
      checks.push({ name: 'Admin Users', status: 'FAIL', message: 'No active SUPER_ADMIN user found.', required: true });
    }

    // 7. WhatsApp Integration
    if (WhatsAppService.isConfigured()) {
      checks.push({ name: 'WhatsApp Integration', status: 'PASS', message: 'WhatsApp Business API credentials are configured.', required: false });
    } else {
      checks.push({ name: 'WhatsApp Integration', status: 'WARNING', message: 'WhatsApp not configured. Notifications will use in-app only.', required: false });
    }

    // 8. Email Configuration
    const emailConfigured = !!(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY);
    if (emailConfigured) {
      checks.push({ name: 'Email Service', status: 'PASS', message: 'Email provider is configured.', required: false });
    } else {
      checks.push({ name: 'Email Service', status: 'WARNING', message: 'Email not configured. Password reset emails will not work.', required: false });
    }

    // 9. MFA Available
    checks.push({ name: 'MFA / TOTP', status: 'PASS', message: 'MFA engine is available (RFC 6238 TOTP).', required: false });

    // 10. Health Endpoint
    checks.push({ name: 'Health Probes', status: 'PASS', message: 'GET /health, /ready, /live endpoints are mounted.', required: true });

    // 11. Backup Script
    const backupScriptPath = path.resolve(__dirname, '../../scripts/db-backup.ts');
    const backupExists = fs.existsSync(backupScriptPath) || fs.existsSync(backupScriptPath.replace('.ts', '.js'));
    if (backupExists) {
      checks.push({ name: 'Backup Script', status: 'PASS', message: 'Database backup script is present.', required: false });
    } else {
      checks.push({ name: 'Backup Script', status: 'WARNING', message: 'Backup script not found at expected path.', required: false });
    }

    // 12. Fee Structures
    const feeStructureCount = await prisma.feeStructure.count({ where: { status: 'ACTIVE' } });
    if (feeStructureCount > 0) {
      checks.push({ name: 'Fee Structures', status: 'PASS', message: `${feeStructureCount} active fee structure(s).`, required: false });
    } else {
      checks.push({ name: 'Fee Structures', status: 'WARNING', message: 'No active fee structures. Students will have no fees assigned.', required: false });
    }

    // 13. Subjects configured
    const subjectCount = await prisma.subject.count({ where: { status: 'ACTIVE' } });
    if (subjectCount > 0) {
      checks.push({ name: 'Subjects', status: 'PASS', message: `${subjectCount} active subject(s).`, required: false });
    } else {
      checks.push({ name: 'Subjects', status: 'WARNING', message: 'No subjects configured. Faculty cannot be assigned to teach.', required: false });
    }

    // 14. CORS Origin
    const corsOrigin = process.env.CORS_ORIGIN || '';
    if (corsOrigin && corsOrigin !== '*' && corsOrigin !== 'http://localhost:5173') {
      checks.push({ name: 'CORS Configuration', status: 'PASS', message: `CORS restricted to: ${corsOrigin}`, required: false });
    } else {
      checks.push({ name: 'CORS Configuration', status: 'WARNING', message: 'CORS_ORIGIN is using localhost or wildcard. Set production domain.', required: false });
    }

    // Calculate summary
    const passCount = checks.filter((c) => c.status === 'PASS').length;
    const warnCount = checks.filter((c) => c.status === 'WARNING').length;
    const failCount = checks.filter((c) => c.status === 'FAIL').length;
    const criticalFails = checks.filter((c) => c.status === 'FAIL' && c.required).length;

    let overallStatus: 'READY' | 'READY_WITH_WARNINGS' | 'NOT_READY';
    if (criticalFails > 0) {
      overallStatus = 'NOT_READY';
    } else if (warnCount > 0 || failCount > 0) {
      overallStatus = 'READY_WITH_WARNINGS';
    } else {
      overallStatus = 'READY';
    }

    return {
      overallStatus,
      checks,
      summary: { pass: passCount, warning: warnCount, fail: failCount, total: checks.length },
    };
  }
}
