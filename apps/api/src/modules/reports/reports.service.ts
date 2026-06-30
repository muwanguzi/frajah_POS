import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, IsNull, Not } from 'typeorm';
import { POSTransaction } from '../../database/entities/pos-transaction.entity';
import { POSTransactionItem } from '../../database/entities/pos-transaction-item.entity';
import { Expense } from '../../database/entities/expense.entity';
import { ExpenseCategory } from '../../database/entities/expense-category.entity';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { ProductBatch } from '../../database/entities/product-batch.entity';
import { PurchaseOrder } from '../../database/entities/purchase-order.entity';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(POSTransaction)
    private transactionRepository: Repository<POSTransaction>,
    @InjectRepository(POSTransactionItem)
    private txItemRepository: Repository<POSTransactionItem>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private expenseCategoryRepository: Repository<ExpenseCategory>,
    @InjectRepository(StockLevel)
    private stockLevelRepository: Repository<StockLevel>,
    @InjectRepository(ProductBatch)
    private batchRepository: Repository<ProductBatch>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    private dataSource: DataSource,
  ) {}

  private dateRange(filter: ReportFilter): { start: Date; end: Date } {
    const end = filter.endDate ? new Date(filter.endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = filter.startDate
      ? new Date(filter.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  async getSalesSummary(filter: ReportFilter): Promise<Record<string, unknown>> {
    const { start, end } = this.dateRange(filter);

    const qb = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoin('tx.session', 'session')
      .where('tx.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere("tx.status != 'VOIDED'");

    if (filter.branchId) {
      qb.andWhere('session.branchId = :branchId', { branchId: filter.branchId });
    }

    const [transactions, totalTransactions] = await qb.getManyAndCount();

    const totalSales = transactions.reduce((s, t) => s + Number(t.total), 0);
    const totalTax = transactions.reduce((s, t) => s + Number(t.taxAmount), 0);
    const totalDiscount = transactions.reduce(
      (s, t) => s + Number(t.discountAmount),
      0,
    );
    const avgOrderValue =
      totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Top products by revenue
    const topProducts = await this.dataSource
      .createQueryBuilder()
      .select([
        'item.product_id AS "productId"',
        'p.name AS "productName"',
        'SUM(item.quantity::numeric) AS "totalQty"',
        'SUM(item.line_total::numeric) AS "totalRevenue"',
      ])
      .from('pos_transaction_items', 'item')
      .innerJoin('pos_transactions', 'tx', 'tx.id = item.transaction_id')
      .innerJoin('products', 'p', 'p.id = item.product_id')
      .where('tx.created_at BETWEEN :start AND :end', { start, end })
      .andWhere("tx.status != 'VOIDED'")
      .groupBy('item.product_id, p.name')
      .orderBy('"totalRevenue"', 'DESC')
      .limit(10)
      .getRawMany();

    // COGS for gross profit
    const cogsResult = await this.dataSource
      .createQueryBuilder()
      .select('COALESCE(SUM(item.quantity::numeric * p.cost_price::numeric), 0)', 'cogs')
      .from('pos_transaction_items', 'item')
      .innerJoin('pos_transactions', 'tx', 'tx.id = item.transaction_id')
      .innerJoin('products', 'p', 'p.id = item.product_id')
      .where('tx.created_at BETWEEN :start AND :end', { start, end })
      .andWhere("tx.status != 'VOIDED'")
      .getRawOne();

    const cogs = Number(cogsResult?.cogs ?? 0);
    const grossProfit = totalSales - cogs;

    return {
      totalSales,
      totalTransactions,
      totalTax,
      totalDiscount,
      averageOrderValue: avgOrderValue,
      grossProfit,
      topProducts,
      filter,
    };
  }

  async getInventoryReport(filter: ReportFilter): Promise<Record<string, unknown>> {
    const where: Record<string, unknown> = {};
    if (filter.branchId) where.branchId = filter.branchId;

    const stockLevels = await this.stockLevelRepository.find({
      where,
      relations: ['product'],
    });

    const enriched = stockLevels.map((sl) => ({
      productId: sl.productId,
      productName: (sl as any).product?.name || sl.productId,
      branchId: sl.branchId,
      quantityOnHand: Number(sl.quantityOnHand),
      quantityReserved: Number(sl.quantityReserved),
      totalValue:
        Number(sl.quantityOnHand) *
        Number((sl as any).product?.costPrice ?? 0),
    }));

    const totalValue = enriched.reduce((s, e) => s + e.totalValue, 0);

    return {
      stockLevels: enriched,
      totalItems: enriched.length,
      totalValue,
      filter,
    };
  }

  async getProfitLossReport(filter: ReportFilter): Promise<Record<string, unknown>> {
    const { start, end } = this.dateRange(filter);

    // Revenue from POS transactions
    const revenueResult = await this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoin('tx.session', 'session')
      .select('COALESCE(SUM(tx.total::numeric), 0)', 'revenue')
      .addSelect('COALESCE(SUM(tx.tax_amount::numeric), 0)', 'taxCollected')
      .addSelect('COALESCE(SUM(tx.discount_amount::numeric), 0)', 'discounts')
      .where('tx.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere("tx.status != 'VOIDED'")
      .andWhere(filter.branchId ? 'session.branchId = :branchId' : '1=1', {
        branchId: filter.branchId,
      })
      .getRawOne();

    const revenue = Number(revenueResult?.revenue ?? 0);
    const taxCollected = Number(revenueResult?.taxCollected ?? 0);
    const discounts = Number(revenueResult?.discounts ?? 0);

    // COGS from transaction items (cost price * quantity)
    const cogsResult = await this.dataSource
      .createQueryBuilder()
      .select(
        'COALESCE(SUM(item.quantity::numeric * p.cost_price::numeric), 0)',
        'cogs',
      )
      .from('pos_transaction_items', 'item')
      .innerJoin('pos_transactions', 'tx', 'tx.id = item.transaction_id')
      .innerJoin('products', 'p', 'p.id = item.product_id')
      .where('tx.created_at BETWEEN :start AND :end', { start, end })
      .andWhere("tx.status != 'VOIDED'")
      .getRawOne();

    const cogs = Number(cogsResult?.cogs ?? 0);
    const grossProfit = revenue - cogs;

    // Operating expenses
    const expenseResult = await this.expenseRepository
      .createQueryBuilder('exp')
      .select('COALESCE(SUM(exp.amount::numeric), 0)', 'totalExpenses')
      .where('exp.expenseDate BETWEEN :start AND :end', { start, end })
      .andWhere("exp.status IN ('APPROVED', 'PAID')")
      .andWhere(filter.branchId ? 'exp.branchId = :branchId' : '1=1', {
        branchId: filter.branchId,
      })
      .getRawOne();

    const expenses = Number(expenseResult?.totalExpenses ?? 0);
    const netProfit = grossProfit - expenses;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      taxCollected,
      discounts,
      netRevenue: revenue - taxCollected,
      costOfGoodsSold: cogs,
      grossProfit,
      grossMarginPct: Number(grossMargin.toFixed(2)),
      operatingExpenses: expenses,
      netProfit,
      netMarginPct: Number(netMargin.toFixed(2)),
      filter,
    };
  }

  async getExpensesReport(filter: ReportFilter): Promise<Record<string, unknown>> {
    const { start, end } = this.dateRange(filter);

    const qb = this.expenseRepository
      .createQueryBuilder('exp')
      .leftJoin('exp.category', 'cat')
      .select('cat.name', 'name')
      .addSelect('COALESCE(SUM(exp.amount::numeric), 0)', 'total')
      .addSelect('COUNT(exp.id)', 'count')
      .where('exp.expenseDate BETWEEN :start AND :end', { start, end })
      .groupBy('cat.id, cat.name')
      .orderBy('"total"', 'DESC');

    if (filter.branchId) {
      qb.andWhere('exp.branchId = :branchId', { branchId: filter.branchId });
    }

    const byCategory = await qb.getRawMany();

    const totalExpenses = byCategory.reduce(
      (s: number, c: any) => s + Number(c.total),
      0,
    );

    return {
      totalExpenses,
      byCategory: byCategory.map((c) => ({
        name: c.name ?? 'Uncategorised',
        total: Number(c.total),
        count: Number(c.count),
      })),
      filter,
    };
  }

  async getCashFlowReport(filter: ReportFilter): Promise<Record<string, unknown>> {
    const { start, end } = this.dateRange(filter);

    // Cash inflows: POS sales
    const inflowResult = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.total::numeric), 0)', 'inflow')
      .where('tx.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere("tx.status != 'VOIDED'")
      .getRawOne();

    const cashInflows = Number(inflowResult?.inflow ?? 0);

    // Cash outflows: paid expenses + purchase orders total
    const expOutResult = await this.expenseRepository
      .createQueryBuilder('exp')
      .select('COALESCE(SUM(exp.amount::numeric), 0)', 'outflow')
      .where('exp.expenseDate BETWEEN :start AND :end', { start, end })
      .andWhere("exp.status = 'PAID'")
      .getRawOne();

    const expOutflows = Number(expOutResult?.outflow ?? 0);

    const poOutResult = await this.purchaseOrderRepository
      .createQueryBuilder('po')
      .select('COALESCE(SUM(po.total::numeric), 0)', 'outflow')
      .where('po.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere("po.status IN ('RECEIVED', 'PARTIALLY_RECEIVED')")
      .getRawOne();

    const poOutflows = Number(poOutResult?.outflow ?? 0);

    const cashOutflows = expOutflows + poOutflows;

    return {
      cashInflows,
      cashOutflows,
      netCashFlow: cashInflows - cashOutflows,
      breakdown: {
        salesRevenue: cashInflows,
        expensePayments: expOutflows,
        purchasePayments: poOutflows,
      },
      filter,
    };
  }

  async getVATReport(filter: ReportFilter): Promise<Record<string, unknown>> {
    const { start, end } = this.dateRange(filter);

    // VAT collected on sales
    const salesVatResult = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.tax_amount::numeric), 0)', 'vatCollected')
      .addSelect('COALESCE(SUM(tx.total::numeric), 0)', 'standardRatedSales')
      .where('tx.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere("tx.status != 'VOIDED'")
      .getRawOne();

    const vatCollected = Number(salesVatResult?.vatCollected ?? 0);
    const standardRatedSales = Number(salesVatResult?.standardRatedSales ?? 0);

    // VAT paid on purchases
    const poVatResult = await this.purchaseOrderRepository
      .createQueryBuilder('po')
      .select('COALESCE(SUM(po.tax_amount::numeric), 0)', 'vatPaid')
      .where('po.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere("po.status NOT IN ('DRAFT', 'CANCELLED')")
      .getRawOne();

    const vatPaid = Number(poVatResult?.vatPaid ?? 0);
    const netVat = vatCollected - vatPaid;

    return {
      vatCollected,
      vatPaid,
      netVat,
      vatRate: 0.18,
      standardRatedSales,
      exemptSales: 0,
      period: `${filter.startDate || 'month-start'} to ${filter.endDate || 'today'}`,
      filter,
    };
  }
}
