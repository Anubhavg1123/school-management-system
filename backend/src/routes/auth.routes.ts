import { Router } from 'express';
import { AuthController, registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes with rate limiting
router.post('/register', authRateLimiter, validateRequest({ body: registerSchema }), AuthController.register);
router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), AuthController.login);
router.post('/refresh', authRateLimiter, validateRequest({ body: refreshTokenSchema }), AuthController.refresh);

import mfaRoutes from './mfa.routes';

// Authenticated session routes
router.get('/me', requireAuth, AuthController.me);
router.post('/logout', requireAuth, AuthController.logout);
router.post('/logout-all', requireAuth, AuthController.logoutAll);
router.post('/change-password', requireAuth, validateRequest({ body: changePasswordSchema }), AuthController.changePassword);
router.use('/mfa', mfaRoutes);

export default router;
