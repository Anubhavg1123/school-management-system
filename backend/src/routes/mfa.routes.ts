import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { initiateMfaSetup, verifyAndEnableMfa, disableMfa } from '../controllers/mfa.controller';

const router = Router();

router.use(requireAuth);

router.post('/setup', initiateMfaSetup);
router.post('/verify', verifyAndEnableMfa);
router.post('/disable', disableMfa);

export default router;
