import { Request, Response, NextFunction } from 'express';
import { GuardianPortalService } from '../services/guardian-portal.service';

export const getGuardianDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parentUserId = (req as any).user.id;
    const studentId = req.query.studentId ? String(req.query.studentId) : undefined;
    const data = await GuardianPortalService.getDashboard(parentUserId, studentId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getLinkedWards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parentUserId = (req as any).user.id;
    const data = await GuardianPortalService.getLinkedWards(parentUserId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getWardResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parentUserId = (req as any).user.id;
    const studentId = String(req.params.studentId);
    const data = await GuardianPortalService.getWardResults(parentUserId, studentId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getWardFees = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parentUserId = (req as any).user.id;
    const studentId = String(req.params.studentId);
    const data = await GuardianPortalService.getWardFees(parentUserId, studentId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parentUserId = (req as any).user.id;
    const data = await GuardianPortalService.updatePreferences(parentUserId, req.body);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
