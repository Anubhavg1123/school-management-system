import { prisma } from '../prisma';
import { AppError } from '../middleware/errorHandler';

export class AssetInventoryService {
  /**
   * Create an institutional asset
   */
  async createAsset(data: {
    assetCode: string;
    name: string;
    category: string;
    serialNumber?: string;
    location: string;
    assignedToUserId?: string;
    purchaseDate?: string | Date;
    warrantyExpiry?: string | Date;
    purchaseCost?: number;
    notes?: string;
  }) {
    const existing = await prisma.institutionalAsset.findUnique({ where: { assetCode: data.assetCode } });
    if (existing) {
      throw new AppError(`Asset code '${data.assetCode}' already exists.`, 400);
    }

    const asset = await prisma.institutionalAsset.create({
      data: {
        assetCode: data.assetCode,
        name: data.name,
        category: data.category,
        serialNumber: data.serialNumber,
        location: data.location,
        assignedToUserId: data.assignedToUserId,
        status: data.assignedToUserId ? 'ASSIGNED' : 'AVAILABLE',
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
        purchaseCost: data.purchaseCost || 0,
        notes: data.notes,
      },
      include: {
        assignedToUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return asset;
  }

  /**
   * Get all assets with filtering
   */
  async getAssets(query: { category?: string; status?: string; search?: string }) {
    const where: any = {};
    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { assetCode: { contains: query.search } },
        { location: { contains: query.search } },
      ];
    }

    return prisma.institutionalAsset.findMany({
      where,
      include: {
        assignedToUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        maintenances: { take: 3, orderBy: { maintenanceDate: 'desc' } },
      },
      orderBy: { assetCode: 'asc' },
    });
  }

  /**
   * Assign or return an asset
   */
  async assignAsset(data: {
    assetId: string;
    assignedToUserId: string;
    assignedByUserId: string;
    conditionNotes?: string;
  }) {
    const asset = await prisma.institutionalAsset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    const [updatedAsset] = await prisma.$transaction([
      prisma.institutionalAsset.update({
        where: { id: data.assetId },
        data: {
          assignedToUserId: data.assignedToUserId,
          status: 'ASSIGNED',
        },
      }),
      prisma.assetAssignmentHistory.create({
        data: {
          assetId: data.assetId,
          assignedToUserId: data.assignedToUserId,
          assignedByUserId: data.assignedByUserId,
          conditionNotes: data.conditionNotes,
        },
      }),
    ]);

    return updatedAsset;
  }

  /**
   * Return an asset back to inventory
   */
  async returnAsset(assetId: string, conditionNotes?: string) {
    const asset = await prisma.institutionalAsset.findUnique({ where: { id: assetId } });
    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    const latestAssignment = await prisma.assetAssignmentHistory.findFirst({
      where: { assetId, returnedAt: null },
      orderBy: { assignedAt: 'desc' },
    });

    if (latestAssignment) {
      await prisma.assetAssignmentHistory.update({
        where: { id: latestAssignment.id },
        data: {
          returnedAt: new Date(),
          conditionNotes: conditionNotes || latestAssignment.conditionNotes,
        },
      });
    }

    const updated = await prisma.institutionalAsset.update({
      where: { id: assetId },
      data: {
        assignedToUserId: null,
        status: 'AVAILABLE',
      },
    });

    return updated;
  }

  /**
   * Record asset maintenance
   */
  async logMaintenance(data: {
    assetId: string;
    maintenanceDate: string | Date;
    vendorName: string;
    cost?: number;
    issueDescription: string;
    resolutionDetails?: string;
    nextMaintenanceDate?: string | Date;
    status?: string;
  }) {
    const asset = await prisma.institutionalAsset.findUnique({ where: { id: data.assetId } });
    if (!asset) {
      throw new AppError('Asset not found.', 404);
    }

    const log = await prisma.assetMaintenanceLog.create({
      data: {
        assetId: data.assetId,
        maintenanceDate: new Date(data.maintenanceDate),
        vendorName: data.vendorName,
        cost: data.cost || 0,
        issueDescription: data.issueDescription,
        resolutionDetails: data.resolutionDetails,
        nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null,
        status: data.status || 'COMPLETED',
      },
    });

    if (data.status === 'IN_PROGRESS') {
      await prisma.institutionalAsset.update({
        where: { id: data.assetId },
        data: { status: 'UNDER_MAINTENANCE' },
      });
    } else if (data.status === 'COMPLETED' && asset.status === 'UNDER_MAINTENANCE') {
      await prisma.institutionalAsset.update({
        where: { id: data.assetId },
        data: { status: 'AVAILABLE' },
      });
    }

    return log;
  }

  /**
   * Create inventory item
   */
  async createInventoryItem(data: {
    itemCode: string;
    name: string;
    category: string;
    unit: string;
    currentQuantity?: number;
    minThresholdQuantity?: number;
    unitCost?: number;
    location?: string;
  }) {
    const existing = await prisma.inventoryItem.findUnique({ where: { itemCode: data.itemCode } });
    if (existing) {
      throw new AppError(`Inventory item code '${data.itemCode}' already exists.`, 400);
    }

    return prisma.inventoryItem.create({
      data: {
        itemCode: data.itemCode,
        name: data.name,
        category: data.category,
        unit: data.unit,
        currentQuantity: data.currentQuantity || 0,
        minThresholdQuantity: data.minThresholdQuantity !== undefined ? data.minThresholdQuantity : 10,
        unitCost: data.unitCost || 0,
        location: data.location,
      },
    });
  }

  /**
   * Get all inventory items with low-stock alerts
   */
  async getInventoryItems() {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' },
    });

    return items.map((item) => ({
      ...item,
      isLowStock: item.currentQuantity <= item.minThresholdQuantity,
    }));
  }

  /**
   * Record inventory transaction (Stock in, Stock out, Adjustment)
   */
  async recordInventoryTransaction(data: {
    inventoryItemId: string;
    transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
    quantity: number;
    unitCost?: number;
    reason: string;
    requestedByUserId?: string;
    approvedByUserId?: string;
  }) {
    const item = await prisma.inventoryItem.findUnique({ where: { id: data.inventoryItemId } });
    if (!item) {
      throw new AppError('Inventory item not found.', 404);
    }

    let newQuantity = item.currentQuantity;
    if (data.transactionType === 'STOCK_IN') {
      newQuantity += data.quantity;
    } else if (data.transactionType === 'STOCK_OUT') {
      if (item.currentQuantity < data.quantity) {
        throw new AppError(
          `Insufficient stock. Available: ${item.currentQuantity} ${item.unit}, Requested: ${data.quantity}`,
          400
        );
      }
      newQuantity -= data.quantity;
    } else if (data.transactionType === 'ADJUSTMENT') {
      newQuantity = data.quantity;
    }

    const [tx] = await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: {
          inventoryItemId: data.inventoryItemId,
          transactionType: data.transactionType,
          quantity: data.quantity,
          unitCost: data.unitCost,
          reason: data.reason,
          requestedByUserId: data.requestedByUserId,
          approvedByUserId: data.approvedByUserId,
        },
      }),
      prisma.inventoryItem.update({
        where: { id: data.inventoryItemId },
        data: { currentQuantity: newQuantity },
      }),
    ]);

    return { transaction: tx, updatedQuantity: newQuantity };
  }
}

export const assetInventoryService = new AssetInventoryService();
