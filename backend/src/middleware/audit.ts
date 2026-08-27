import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AuditService } from '../services/audit.service';

export const auditAction = (action: string, entityType: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.get('user-agent') || null;

    res.send = function (body: any): Response {
      res.send = originalSend;

      // Extract entity ID if present in request params
      const entityId = req.params.id || req.body?.id || null;
      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

      // Run asynchronously without blocking client response
      AuditService.log({
        userId: req.user?.id || null,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        beforeState: req.body ? { ...req.body, password: req.body.password ? '***' : undefined } : null,
        ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
        userAgent,
        status: isSuccess ? 'SUCCESS' : 'FAILURE',
        errorMessage: !isSuccess ? (typeof body === 'string' ? body : JSON.stringify(body)) : null,
      }).catch(() => {});

      return originalSend.call(this, body);
    };

    next();
  };
};
