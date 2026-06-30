import { BatchCostingMethod } from '../enums/batch-costing-method.enum';

export interface ProductBatch {
  id: string;
  batchNumber: string;
  productId: string;
  branchId: string;
  quantityReceived: number;
  quantityRemaining: number;
  unitCost: number;
  costingMethod: BatchCostingMethod;
  expiryDate: string | null;
  receivedAt: string;
  purchaseOrderItemId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SerialNumber {
  id: string;
  serialNumber: string;
  productId: string;
  branchId: string;
  batchId: string | null;
  status: 'in_stock' | 'sold' | 'returned' | 'damaged' | 'reserved';
  saleItemId: string | null;
  soldAt: string | null;
  warrantyExpiry: string | null;
  createdAt: string;
}
