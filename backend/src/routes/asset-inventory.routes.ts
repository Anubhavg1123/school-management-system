import { Router } from 'express';
import { assetInventoryController } from '../controllers/asset-inventory.controller';
import { requireAuth } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { UserRoleEnum } from '../types';

const router = Router();

router.use(requireAuth);

// Assets
router.post('/', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => assetInventoryController.createAsset(req, res, next));
router.get('/', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => assetInventoryController.getAssets(req, res, next));
router.post('/:assetId/assign', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => assetInventoryController.assignAsset(req, res, next));
router.post('/:assetId/return', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => assetInventoryController.returnAsset(req, res, next));
router.post('/:assetId/maintenance', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => assetInventoryController.logMaintenance(req, res, next));

// Inventory Items & Transactions
router.post('/inventory/items', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN]), (req, res, next) => assetInventoryController.createInventoryItem(req, res, next));
router.get('/inventory/items', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => assetInventoryController.getInventoryItems(req, res, next));
router.post('/inventory/transactions', requireRoles([UserRoleEnum.SUPER_ADMIN, UserRoleEnum.OFFICE_ADMIN, UserRoleEnum.HOD]), (req, res, next) => assetInventoryController.recordInventoryTransaction(req, res, next));

export default router;
