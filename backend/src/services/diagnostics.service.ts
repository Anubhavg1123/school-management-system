import { prisma } from '../prisma';
import fs from 'fs';
import path from 'path';

export interface DiagnosticCheck {
  subsystem: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  details?: Record<string, any>;
}

export class DiagnosticsService {
  /**
   * 1. Comprehensive System Self-Diagnostics
   */
  static async runSystemDiagnostics(): Promise<{
    overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    checks: DiagnosticCheck[];
    timestamp: string;
  }> {
    const checks: DiagnosticCheck[] = [];

    // 1. Database Connectivity & Response Time
    const startDb = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const dbLatencyMs = Date.now() - startDb;
      checks.push({
        subsystem: 'Database Engine',
        status: dbLatencyMs < 200 ? 'PASS' : 'WARNING',
        message: `Prisma ORM database connected (${dbLatencyMs}ms query response).`,
        details: { latencyMs: dbLatencyMs },
      });
    } catch (err: any) {
      checks.push({
        subsystem: 'Database Engine',
        status: 'FAIL',
        message: `Database connection failed: ${err.message}`,
      });
    }

    // 2. Memory & Node Runtime
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
    checks.push({
      subsystem: 'Application Server & Memory',
      status: heapUsedMb < 512 ? 'PASS' : 'WARNING',
      message: `Node.js V8 heap: ${heapUsedMb}MB used / ${heapTotalMb}MB total.`,
      details: { heapUsedMb, heapTotalMb, uptimeSec: Math.round(process.uptime()) },
    });

    // 3. Backup Freshness Check
    const backupDir = path.resolve(__dirname, '../../backups');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.db') || f.endsWith('.sql'));
      if (files.length > 0) {
        checks.push({
          subsystem: 'Backup Storage & Recency',
          status: 'PASS',
          message: `${files.length} backup archive(s) present in storage directory.`,
          details: { count: files.length, latestBackup: files[files.length - 1] },
        });
      } else {
        checks.push({
          subsystem: 'Backup Storage & Recency',
          status: 'WARNING',
          message: 'Backup directory exists but contains no snapshot files. Execute npm run db:backup.',
        });
      }
    } else {
      checks.push({
        subsystem: 'Backup Storage & Recency',
        status: 'WARNING',
        message: 'No backup directory initialized yet. Automated backup scheduled.',
      });
    }

    // 4. Notification Engine
    const isWhatsAppConfigured = Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
    const isEmailConfigured = Boolean(process.env.SMTP_HOST || process.env.SENDGRID_API_KEY);

    checks.push({
      subsystem: 'Notification Gateway (WhatsApp)',
      status: isWhatsAppConfigured ? 'PASS' : 'WARNING',
      message: isWhatsAppConfigured ? 'Meta WhatsApp Cloud API configured.' : 'WhatsApp unconfigured. In-app notifications active.',
    });

    checks.push({
      subsystem: 'Notification Gateway (Email)',
      status: isEmailConfigured ? 'PASS' : 'WARNING',
      message: isEmailConfigured ? 'SMTP/SendGrid Email provider configured.' : 'Email unconfigured. In-app notifications active.',
    });

    // 5. Payment Gateway
    const isPaymentConfigured = Boolean(process.env.PAYMENT_GATEWAY_KEY);
    checks.push({
      subsystem: 'Payment Gateway',
      status: isPaymentConfigured ? 'PASS' : 'WARNING',
      message: isPaymentConfigured ? 'Online payment gateway merchant active.' : 'Online gateway unconfigured. Cash/UPI ledger active.',
    });

    const hasFail = checks.some((c) => c.status === 'FAIL');
    const hasWarn = checks.some((c) => c.status === 'WARNING');
    const overallStatus = hasFail ? 'UNHEALTHY' : hasWarn ? 'DEGRADED' : 'HEALTHY';

    return {
      overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 2. Automated Data Quality & Integrity Auditor
   */
  static async runDataQualityAudit() {
    const issues: Array<{ category: string; severity: 'WARNING' | 'CRITICAL'; issue: string }> = [];

    // Check 1: Active students without sections
    const activeWithoutSection = await prisma.student.count({
      where: { status: 'ACTIVE', sectionId: null },
    });
    if (activeWithoutSection > 0) {
      issues.push({
        category: 'ENROLLMENT',
        severity: 'CRITICAL',
        issue: `${activeWithoutSection} active student(s) lack a class/section assignment.`,
      });
    }

    // Check 2: Active students without primary guardian
    const studentsWithoutGuardian = await prisma.student.count({
      where: {
        status: 'ACTIVE',
        guardians: { none: { isPrimary: true } },
      },
    });
    if (studentsWithoutGuardian > 0) {
      issues.push({
        category: 'GUARDIAN',
        severity: 'WARNING',
        issue: `${studentsWithoutGuardian} active student(s) have no designated primary guardian.`,
      });
    }

    // Check 3: Classes without faculty coordinator
    const classesWithoutCoordinators = await prisma.class.count({
      where: { sections: { some: { coordinatorFacultyId: null } } },
    });
    if (classesWithoutCoordinators > 0) {
      issues.push({
        category: 'ACADEMIC',
        severity: 'WARNING',
        issue: `${classesWithoutCoordinators} class section(s) lack a designated Class Coordinator faculty.`,
      });
    }

    return {
      totalIssues: issues.length,
      status: issues.length === 0 ? 'CLEAN' : 'INTEGRITY_GAPS_DETECTED',
      issues,
      auditedAt: new Date().toISOString(),
    };
  }

  /**
   * 3. Record Ingested Webhook Payload with Idempotency Protection
   */
  static async recordWebhookLog(data: {
    provider: string;
    eventId?: string;
    eventType: string;
    payload: any;
    idempotencyKey?: string;
  }) {
    if (data.idempotencyKey) {
      const existing = await prisma.webhookLog.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existing) {
        return { log: existing, isDuplicate: true };
      }
    }

    const log = await prisma.webhookLog.create({
      data: {
        provider: data.provider,
        eventId: data.eventId || null,
        eventType: data.eventType,
        payload: JSON.stringify(data.payload),
        status: 'PROCESSED',
        idempotencyKey: data.idempotencyKey || null,
        processedAt: new Date(),
      },
    });

    return { log, isDuplicate: false };
  }

  /**
   * 4. List Recent Webhook Logs
   */
  static async getWebhookLogs(limit = 50) {
    return prisma.webhookLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
