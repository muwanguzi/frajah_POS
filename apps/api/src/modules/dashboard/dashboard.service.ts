import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { POSTransaction } from '../../database/entities/pos-transaction.entity';
import { Product } from '../../database/entities/product.entity';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { PurchaseOrder } from '../../database/entities/purchase-order.entity';
import { Expense } from '../../database/entities/expense.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(POSTransaction)
    private txRepo: Repository<POSTransaction>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(StockLevel)
    private stockRepo: Repository<StockLevel>,
    @InjectRepository(PurchaseOrder)
    private poRepo: Repository<PurchaseOrder>,
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
    private dataSource: DataSource,
  ) {}

  private async sumTransactions(start: Date, end: Date): Promise<number> {
    const result = await this.txRepo
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.total::numeric), 0)', 'total')
      .where('tx.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere("tx.status != 'VOIDED'")
      .getRawOne();
    return Number(result?.total ?? 0);
  }

  async getMetrics(branchId?: string): Promise<Record<string, unknown>> {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      salesToday,
      salesWeekly,
      salesMonthly,
      salesAnnual,
      totalProducts,
      pendingOrders,
      allProducts,
    ] = await Promise.all([
      this.sumTransactions(startOfDay, endOfDay),
      this.sumTransactions(startOfWeek, now),
      this.sumTransactions(startOfMonth, now),
      this.sumTransactions(startOfYear, now),
      this.productRepo.count({ where: { isActive: true } }),
      this.poRepo.count({ where: { status: 'DRAFT' } }),
      this.productRepo.find({
        where: { isActive: true },
        select: ['id', 'currentStock', 'reorderLevel', 'costPrice'],
      }),
    ]);

    const lowStockCount = allProducts.filter(
      (p) =>
        parseFloat(p.currentStock as string) > 0 &&
        parseFloat(p.currentStock as string) <=
          p.reorderLevel,
    ).length;

    const outOfStockCount = allProducts.filter(
      (p) => parseFloat(p.currentStock as string) <= 0,
    ).length;

    const inventoryValue = allProducts.reduce(
      (sum, p) =>
        sum +
        parseFloat(p.currentStock as string) *
          parseFloat(p.costPrice as string),
      0,
    );

    // COGS for this month (cost price * qty sold)
    const cogsResult = await this.dataSource
      .createQueryBuilder()
      .select(
        'COALESCE(SUM(item.quantity::numeric * p.cost_price::numeric), 0)',
        'cogs',
      )
      .from('pos_transaction_items', 'item')
      .innerJoin('pos_transactions', 'tx', 'tx.id = item.transaction_id')
      .innerJoin('products', 'p', 'p.id = item.product_id')
      .where('tx.created_at BETWEEN :start AND :end', {
        start: startOfMonth,
        end: now,
      })
      .andWhere("tx.status != 'VOIDED'")
      .getRawOne();

    const cogs = Number(cogsResult?.cogs ?? 0);
    const grossProfit = salesMonthly - cogs;

    const expenseResult = await this.expenseRepo
      .createQueryBuilder('exp')
      .select('COALESCE(SUM(exp.amount::numeric), 0)', 'total')
      .where('exp.expenseDate BETWEEN :start AND :end', {
        start: startOfMonth,
        end: now,
      })
      .andWhere("exp.status IN ('APPROVED', 'PAID')")
      .getRawOne();

    const expenses = Number(expenseResult?.total ?? 0);
    const netProfit = grossProfit - expenses;

    return {
      salesToday,
      salesWeekly,
      salesMonthly,
      salesAnnual,
      grossProfit,
      netProfit,
      cashAvailable: 0,
      bankBalance: 0,
      inventoryValue: Math.round(inventoryValue),
      totalProducts,
      lowStockCount,
      outOfStockCount,
      pendingOrders,
      pendingSupplierPayments: 0,
      customerOutstandingBalance: 0,
      branchId: branchId ?? null,
      generatedAt: new Date().toISOString(),
    };
  }

  async getSalesChart(
    period: string,
    branchId?: string,
  ): Promise<{ labels: string[]; data: number[] }> {
    const days = period === 'week' ? 7 : period === 'year' ? 12 : 30;
    const labels: string[] = [];
    const data: number[] = [];

    if (period === 'year') {
      // Monthly buckets for the past 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i, 1);
        d.setHours(0, 0, 0, 0);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const result = await this.txRepo
          .createQueryBuilder('tx')
          .select('COALESCE(SUM(tx.total::numeric), 0)', 'total')
          .where('tx.createdAt BETWEEN :start AND :end', {
            start: d,
            end: monthEnd,
          })
          .andWhere("tx.status != 'VOIDED'")
          .getRawOne();

        labels.push(
          d.toLocaleDateString('en-UG', { month: 'short', year: '2-digit' }),
        );
        data.push(Number(result?.total ?? 0));
      }
    } else {
      // Daily buckets
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        const result = await this.txRepo
          .createQueryBuilder('tx')
          .select('COALESCE(SUM(tx.total::numeric), 0)', 'total')
          .where('tx.createdAt BETWEEN :start AND :end', {
            start: dayStart,
            end: dayEnd,
          })
          .andWhere("tx.status != 'VOIDED'")
          .getRawOne();

        labels.push(
          d.toLocaleDateString('en-UG', { month: 'short', day: 'numeric' }),
        );
        data.push(Number(result?.total ?? 0));
      }
    }

    return { labels, data };
  }

  async getAlerts(branchId?: string): Promise<
    Array<{
      type: string;
      severity: string;
      message: string;
      count: number;
    }>
  > {
    const allProducts = await this.productRepo.find({
      where: { isActive: true },
      select: ['id', 'name', 'currentStock', 'reorderLevel'],
    });

    const alerts: Array<{
      type: string;
      severity: string;
      message: string;
      count: number;
    }> = [];

    const outOfStock = allProducts.filter(
      (p) => parseFloat(p.currentStock as string) <= 0,
    );
    const lowStock = allProducts.filter(
      (p) =>
        parseFloat(p.currentStock as string) > 0 &&
        parseFloat(p.currentStock as string) <=
          p.reorderLevel,
    );

    if (outOfStock.length > 0) {
      alerts.push({
        type: 'OUT_OF_STOCK',
        severity: 'critical',
        message: `${outOfStock.length} product(s) are out of stock`,
        count: outOfStock.length,
      });
    }

    if (lowStock.length > 0) {
      alerts.push({
        type: 'LOW_STOCK',
        severity: 'warning',
        message: `${lowStock.length} product(s) are running low`,
        count: lowStock.length,
      });
    }

    const pendingPOs = await this.poRepo.count({ where: { status: 'DRAFT' } });
    if (pendingPOs > 0) {
      alerts.push({
        type: 'PENDING_PO',
        severity: 'info',
        message: `${pendingPOs} purchase order(s) awaiting approval`,
        count: pendingPOs,
      });
    }

    const pendingExpenses = await this.expenseRepo.count({
      where: { status: 'SUBMITTED' },
    });
    if (pendingExpenses > 0) {
      alerts.push({
        type: 'PENDING_EXPENSE',
        severity: 'info',
        message: `${pendingExpenses} expense(s) awaiting approval`,
        count: pendingExpenses,
      });
    }

    return alerts;
  }
}
