import { Request, Response, NextFunction } from 'express';
import { assetInventoryService } from '../services/asset-inventory.service';
import { sendSuccess } from '../utils/response';

export class AssetInventoryController {
  // Assets
  async createAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assetInventoryService.createAsset(req.body);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assetInventoryService.getAssets({
        category: req.query.category as string,
        status: req.query.status as string,
        search: req.query.search as string,
      });
      return sendSuccess(res, { assets: result });
    } catch (err) {
      next(err);
    }
  }

  async assignAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const assetId = Array.isArray(req.params.assetId) ? req.params.assetId[0] : req.params.assetId;
      const result = await assetInventoryService.assignAsset({
        assetId,
        assignedToUserId: req.body.assignedToUserId,
        assignedByUserId: user.id,
        conditionNotes: req.body.conditionNotes,
      });
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async returnAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const assetId = Array.isArray(req.params.assetId) ? req.params.assetId[0] : req.params.assetId;
      const result = await assetInventoryService.returnAsset(
        assetId,
        req.body.conditionNotes
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async logMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const assetId = Array.isArray(req.params.assetId) ? req.params.assetId[0] : req.params.assetId;
      const result = await assetInventoryService.logMaintenance({
        assetId,
        ...req.body,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  // Inventory
  async createInventoryItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assetInventoryService.createInventoryItem(req.body);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getInventoryItems(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assetInventoryService.getInventoryItems();
      return sendSuccess(res, { items: result });
    } catch (err) {
      next(err);
    }
  }

  async recordInventoryTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const result = await assetInventoryService.recordInventoryTransaction({
        ...req.body,
        requestedByUserId: user?.id,
      });
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
}

export const assetInventoryController = new AssetInventoryController();
