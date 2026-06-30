import { BatchCostingMethod } from '../enums/batch-costing-method.enum';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  brand: string | null;
  categoryId: string;
  unitOfMeasure: string;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice: number | null;
  minSellingPrice: number | null;
  vatRate: number;
  reorderLevel: number;
  reorderQuantity: number;
  maxStock: number | null;
  safetyStock: number | null;
  currentStock: number;
  isActive: boolean;
  isService: boolean;
  costingMethod: BatchCostingMethod;
  serialTracking: boolean;
  batchTracking: boolean;
  warrantyPeriod: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  createdAt: string;
}

export interface ProductWithCategory extends Product {
  category: ProductCategory;
}
