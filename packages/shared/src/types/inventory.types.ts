import { AdjustmentType } from '../enums/adjustment-type.enum';
import { TransferStatus } from '../enums/transfer-status.enum';
import { StockCountStatus } from '../enums/stock-count-status.enum';

export interface StockLevel {
  id: string;
  productId: string;
  branchId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  lastCountedAt: string | null;
  updatedAt: string;
}

export interface StockAdjustment {
  id: string;
  referenceNumber: string;
  productId: string;
  branchId: string;
  type: AdjustmentType;
  quantityBefore: number;
  quantityAdjusted: number;
  quantityAfter: number;
  unitCost: number | null;
  reason: string;
  approvedById: string | null;
  approvedAt: string | null;
  createdById: string;
  createdAt: string;
}

export interface StockTransferItem {
  id: string;
  transferId: string;
  productId: string;
  productName: string;
  quantityRequested: number;
  quantityShipped: number;
  quantityReceived: number;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromBranchId: string;
  toBranchId: string;
  status: TransferStatus;
  requestedById: string;
  shippedById: string | null;
  receivedById: string | null;
  notes: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  items: StockTransferItem[];
  createdAt: string;
}

export interface StockCountItem {
  id: string;
  stockCountId: string;
  productId: string;
  productName: string;
  systemQuantity: number;
  countedQuantity: number | null;
  variance: number | null;
}

export interface StockCount {
  id: string;
  referenceNumber: string;
  branchId: string;
  status: StockCountStatus;
  countedById: string;
  approvedById: string | null;
  notes: string | null;
  startedAt: string;
  completedAt: string | null;
  approvedAt: string | null;
  items: StockCountItem[];
  createdAt: string;
}
