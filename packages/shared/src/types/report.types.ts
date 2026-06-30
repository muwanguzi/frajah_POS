export interface DashboardMetrics {
  salesToday: number;
  salesWeekly: number;
  salesMonthly: number;
  salesAnnual: number;
  grossProfit: number;
  netProfit: number;
  cashAvailable: number;
  bankBalance: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingOrders: number;
  pendingSupplierPayments: number;
  customerOutstandingBalance: number;
}

export interface SalesReport {
  period: string;
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  grossProfit: number;
  grossMargin: number;
  topProducts: TopProductEntry[];
  topCategories: TopCategoryEntry[];
  salesByPaymentMethod: PaymentMethodBreakdown[];
  salesByHour?: HourlySales[];
}

export interface TopProductEntry {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
  grossProfit: number;
}

export interface TopCategoryEntry {
  categoryId: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  transactionCount: number;
}

export interface HourlySales {
  hour: number;
  sales: number;
  transactionCount: number;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockItems: LowStockItem[];
  outOfStockItems: OutOfStockItem[];
  fastMovingItems: MovingItem[];
  slowMovingItems: MovingItem[];
}

export interface LowStockItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  branchId: string;
}

export interface OutOfStockItem {
  productId: string;
  productName: string;
  sku: string;
  branchId: string;
  lastSaleDate: string | null;
}

export interface MovingItem {
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  revenue: number;
}

export interface ProfitLossReport {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
}
