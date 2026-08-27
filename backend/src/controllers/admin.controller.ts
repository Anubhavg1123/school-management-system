import { Request, Response, NextFunction } from 'express';
import { GoLiveCheckService } from '../services/go-live-check.service';
import { ReconciliationService } from '../services/reconciliation.service';
import { sendSuccess } from '../utils/response';

export class AdminController {
  /**
   * GET /api/admin/go-live-check
   * Returns full go-live readiness status (PASS/WARNING/FAIL per subsystem)
   */
  static async getGoLiveCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await GoLiveCheckService.runChecks();
      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/config-check
   * Returns non-secret configuration summary
   */
  static async getConfigCheck(req: Request, res: Response, next: NextFunction) {
    try {
      const configStatus = {
        nodeEnv: process.env.NODE_ENV || 'development',
        apiPrefix: process.env.API_PREFIX || '/api',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        databaseUrl: process.env.DATABASE_URL ? 'CONFIGURED' : 'NOT_SET',
        jwtAccessSecret: process.env.JWT_ACCESS_SECRET
          ? process.env.JWT_ACCESS_SECRET.length >= 32 ? 'STRONG' : 'WEAK'
          : 'NOT_SET',
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET
          ? process.env.JWT_REFRESH_SECRET.length >= 32 ? 'STRONG' : 'WEAK'
          : 'NOT_SET',
        whatsapp: process.env.WHATSAPP_ACCESS_TOKEN ? 'CONFIGURED' : 'NOT_SET',
        email: (process.env.SMTP_HOST || process.env.SENDGRID_API_KEY) ? 'CONFIGURED' : 'NOT_SET',
        paymentGateway: process.env.PAYMENT_GATEWAY_KEY ? 'CONFIGURED' : 'NOT_SET',
        mfaAvailable: true,
        rateLimitingEnabled: true,
        helmetEnabled: true,
        requestCorrelationIdsEnabled: true,
      };

      return sendSuccess(res, configStatus, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/reconciliation/finance
   */
  static async getFinanceReconciliation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReconciliationService.getFinanceReconciliation();
      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/reconciliation/enrollment
   */
  static async getEnrollmentReconciliation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReconciliationService.getEnrollmentReconciliation();
      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/admin/reconciliation/attendance
   */
  static async getAttendanceReconciliation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReconciliationService.getAttendanceReconciliation();
      return sendSuccess(res, result, 200);
    } catch (err) {
      next(err);
    }
  }
}
