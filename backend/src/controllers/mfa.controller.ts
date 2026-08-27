import { Request, Response, NextFunction } from 'express';
import { MfaService } from '../services/mfa.service';

export const initiateMfaSetup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const data = await MfaService.initiateMfaSetup(userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const verifyAndEnableMfa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;
    const data = await MfaService.confirmAndEnableMfa(userId, token);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const disableMfa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const data = await MfaService.disableMfa(userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
