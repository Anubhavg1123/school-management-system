import apiClient from './client';

export interface InstitutionalAsset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  serialNumber?: string;
  location: string;
  assignedToUserId?: string;
  status: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  purchaseCost?: number;
  notes?: string;
  assignedToUser?: { id: string; firstName: string; lastName: string; email: string };
  maintenances?: Array<{ id: string; maintenanceDate: string; vendorName: string; cost: number; issueDescription: string; status: string }>;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  unit: string;
  currentQuantity: number;
  minThresholdQuantity: number;
  unitCost: number;
  location?: string;
  isLowStock?: boolean;
}

export const assetApi = {
  getAssets: async (params?: { category?: string; status?: string; search?: string }) => {
    const res = await apiClient.get('/assets', { params });
    return res.data.data.assets as InstitutionalAsset[];
  },
  createAsset: async (data: Partial<InstitutionalAsset>) => {
    const res = await apiClient.post('/assets', data);
    return res.data.data as InstitutionalAsset;
  },
  assignAsset: async (assetId: string, assignedToUserId: string, conditionNotes?: string) => {
    const res = await apiClient.post(`/assets/${assetId}/assign`, { assignedToUserId, conditionNotes });
    return res.data.data;
  },
  returnAsset: async (assetId: string, conditionNotes?: string) => {
    const res = await apiClient.post(`/assets/${assetId}/return`, { conditionNotes });
    return res.data.data;
  },
  logMaintenance: async (assetId: string, data: any) => {
    const res = await apiClient.post(`/assets/${assetId}/maintenance`, data);
    return res.data.data;
  },
  getInventoryItems: async () => {
    const res = await apiClient.get('/assets/inventory/items');
    return res.data.data.items as InventoryItem[];
  },
  createInventoryItem: async (data: Partial<InventoryItem>) => {
    const res = await apiClient.post('/assets/inventory/items', data);
    return res.data.data as InventoryItem;
  },
  recordTransaction: async (data: {
    inventoryItemId: string;
    transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
    quantity: number;
    reason: string;
    unitCost?: number;
  }) => {
    const res = await apiClient.post('/assets/inventory/transactions', data);
    return res.data.data;
  },
};
