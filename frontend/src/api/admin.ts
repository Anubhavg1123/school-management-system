import { apiClient } from './client';

export interface GoLiveCheck {
  name: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  message: string;
  required: boolean;
}

export interface GoLiveResult {
  overallStatus: 'READY' | 'READY_WITH_WARNINGS' | 'NOT_READY';
  checks: GoLiveCheck[];
  summary: { pass: number; warning: number; fail: number; total: number };
}

export interface ConfigCheckResult {
  nodeEnv: string;
  apiPrefix: string;
  corsOrigin: string;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  whatsapp: string;
  email: string;
  paymentGateway: string;
  mfaAvailable: boolean;
  rateLimitingEnabled: boolean;
  helmetEnabled: boolean;
  requestCorrelationIdsEnabled: boolean;
}

export interface FinanceReconciliationResult {
  summary: {
    totalAssignments: number;
    totalOk: number;
    totalDiscrepant: number;
    status: string;
  };
  discrepancies: Array<{
    feeAssignmentId: string;
    studentName: string;
    admissionNumber: string;
    feeTitle: string;
    recordedPaidAmount: number;
    actualVerifiedPayments: number;
    discrepancy: number;
    severity: 'OK' | 'MINOR' | 'CRITICAL';
  }>;
  generatedAt: string;
}

export interface EnrollmentReconciliationResult {
  summary: {
    totalActiveStudents: number;
    enrolledOk: number;
    enrollmentIssues: number;
    activeAcademicYear: string;
    status: string;
  };
  issues: Array<{
    studentId: string;
    admissionNumber: string;
    studentName: string;
    issue: string;
  }>;
  generatedAt: string;
}

export interface AttendanceReconciliationResult {
  summary: {
    finalizedSlotsWithNoRecords: number;
    staleScheduledSlots: number;
    status: string;
  };
  finalizedSlotsWithNoRecords: any[];
  staleScheduledSlots: any[];
  generatedAt: string;
}

export const adminApi = {
  getGoLiveCheck: (): Promise<GoLiveResult> =>
    apiClient.get('/admin/go-live-check').then((r) => r.data.data),

  getConfigCheck: (): Promise<ConfigCheckResult> =>
    apiClient.get('/admin/config-check').then((r) => r.data.data),

  getFinanceReconciliation: (): Promise<FinanceReconciliationResult> =>
    apiClient.get('/admin/reconciliation/finance').then((r) => r.data.data),

  getEnrollmentReconciliation: (): Promise<EnrollmentReconciliationResult> =>
    apiClient.get('/admin/reconciliation/enrollment').then((r) => r.data.data),

  getAttendanceReconciliation: (): Promise<AttendanceReconciliationResult> =>
    apiClient.get('/admin/reconciliation/attendance').then((r) => r.data.data),
};
