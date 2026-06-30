import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { POSSession } from '../../database/entities/pos-session.entity';
import { POSTransaction } from '../../database/entities/pos-transaction.entity';
import { POSTransactionItem } from '../../database/entities/pos-transaction-item.entity';
import { POSPayment } from '../../database/entities/pos-payment.entity';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { Product } from '../../database/entities/product.entity';
import { ProductBatch } from '../../database/entities/product-batch.entity';
import { BatchesService } from '../batches/batches.service';

interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
}

interface PaymentInput {
  method: string;
  amount: number;
  reference?: string;
}

interface CreateSaleInput {
  sessionId: string;
  customerId?: string;
  branchId: string;
  cashierId: string;
  items: SaleItemInput[];
  payments: PaymentInput[];
  discountAmount?: number;
  notes?: string;
  taxRate?: number;
}

@Injectable()
export class POSService {
  constructor(
    @InjectRepository(POSSession)
    private sessionRepository: Repository<POSSession>,
    @InjectRepository(POSTransaction)
    private transactionRepository: Repository<POSTransaction>,
    @InjectRepository(POSTransactionItem)
    private itemRepository: Repository<POSTransactionItem>,
    @InjectRepository(POSPayment)
    private paymentRepository: Repository<POSPayment>,
    @InjectRepository(StockLevel)
    private stockLevelRepository: Repository<StockLevel>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private batchesService: BatchesService,
    private dataSource: DataSource,
  ) {}

  /** Recomputes product.currentStock as the sum of stock_levels across all branches. */
  private async syncProductCurrentStock(
    manager: EntityManager,
    productId: string,
  ): Promise<void> {
    const result = await manager
      .createQueryBuilder()
      .select('COALESCE(SUM(sl.quantity_on_hand::numeric), 0)', 'total')
      .from(StockLevel, 'sl')
      .where('sl.product_id = :productId', { productId })
      .getRawOne();

    await manager
      .createQueryBuilder()
      .update(Product)
      .set({ currentStock: result.total })
      .where('id = :id', { id: productId })
      .execute();
  }

  async openSession(data: {
    branchId: string;
    cashierId: string;
    openingCash: number;
  }): Promise<POSSession> {
    const existing = await this.sessionRepository.findOne({
      where: { cashierId: data.cashierId, status: 'OPEN' },
    });
    if (existing) return existing;

    const session = this.sessionRepository.create({
      ...data,
      openingCash: data.openingCash.toString(),
      status: 'OPEN',
      openedAt: new Date(),
    });
    return this.sessionRepository.save(session);
  }

  async closeSession(id: string, closingCash: number): Promise<POSSession> {
    const session = await this.sessionRepository.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status === 'CLOSED') throw new BadRequestException('Session is already closed');

    session.status = 'CLOSED';
    session.closingCash = closingCash.toString();
    session.closedAt = new Date();
    return this.sessionRepository.save(session);
  }

  async getActiveSession(cashierId: string): Promise<POSSession | null> {
    return this.sessionRepository.findOne({
      where: { cashierId, status: 'OPEN' },
      relations: ['cashier'],
    });
  }

  async findSessions(page = 1, limit = 20): Promise<{ data: POSSession[]; total: number }> {
    const [data, total] = await this.sessionRepository.findAndCount({
      relations: ['cashier'],
      order: { openedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async lookupProduct(query: string): Promise<Product | null> {
    const product = await this.productRepository.findOne({
      where: [{ barcode: query }, { sku: query }],
      relations: ['category'],
    });
    return product;
  }

  /**
   * Complete a POS sale:
   * 1. Validate session and products
   * 2. Deduct stock using FIFO/LIFO/WAC via BatchesService
   * 3. Create transaction + items + payments
   * 4. Update StockLevel totals
   */
  async completeSale(input: CreateSaleInput): Promise<POSTransaction> {
    return this.dataSource.transaction(async (manager) => {
      const session = await manager.findOne(POSSession, {
        where: { id: input.sessionId, status: 'OPEN' },
      });
      if (!session) throw new NotFoundException('Active POS session not found');

      // Calculate totals
      let subtotal = 0;
      for (const item of input.items) {
        const discount = item.discountPercent || 0;
        const lineTotal = item.quantity * item.unitPrice * (1 - discount / 100);
        subtotal += lineTotal;
      }

      const discountAmount = input.discountAmount || 0;
      const afterDiscount = subtotal - discountAmount;
      const taxRate = input.taxRate ?? 0.18;
      const taxAmount = afterDiscount * taxRate;
      const total = afterDiscount + taxAmount;

      const totalPaid = input.payments.reduce((s, p) => s + p.amount, 0);
      if (totalPaid < total) {
        throw new BadRequestException(
          `Insufficient payment. Required: ${total.toFixed(0)}, Paid: ${totalPaid.toFixed(0)}`,
        );
      }

      // Generate receipt number: FRJ-YYYYMMDD-NNNN
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await manager.count(POSTransaction);
      const receiptNumber = `FRJ-${today}-${String(count + 1).padStart(4, '0')}`;

      // Create transaction header
      const tx = manager.create(POSTransaction, {
        receiptNumber,
        sessionId: input.sessionId,
        customerId: input.customerId,
        subtotal: subtotal.toString(),
        discountAmount: discountAmount.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        amountTendered: totalPaid.toString(),
        changeGiven: (totalPaid - total).toString(),
        createdAt: new Date(),
      });
      const savedTx = await manager.save(POSTransaction, tx);

      // Deduct stock and create items
      for (const item of input.items) {
        const product = await manager.findOne(Product, { where: { id: item.productId } });
        if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

        const costingMethod = (product.costingMethod as 'FIFO' | 'LIFO' | 'WAC') || 'FIFO';

        // Deduct from batches (reuse outer transaction manager to avoid nested tx)
        const deduction = await this.batchesService.deductFromBatches(
          item.productId,
          input.branchId,
          item.quantity,
          costingMethod,
          manager,
        );

        const discount = item.discountPercent || 0;
        const lineTotal = item.quantity * item.unitPrice * (1 - discount / 100);

        // Create item record — keep the full per-batch breakdown so a void can
        // restore exactly what was deducted, not just the first batch touched.
        const txItem = manager.create(POSTransactionItem, {
          transactionId: savedTx.id,
          productId: item.productId,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discountPercent: discount.toString(),
          lineTotal: lineTotal.toString(),
          batchId: deduction.batches[0]?.batchId,
          batchBreakdown: deduction.batches.map((b) => ({
            batchId: b.batchId,
            quantity: b.quantityDeducted,
            unitCost: b.unitCost,
          })),
        });
        await manager.save(POSTransactionItem, txItem);

        // Update stock level (branch-scoped)
        await manager
          .createQueryBuilder()
          .update(StockLevel)
          .set({
            quantityOnHand: () => `quantity_on_hand - ${item.quantity}`,
          })
          .where('product_id = :productId AND branch_id = :branchId', {
            productId: item.productId,
            branchId: input.branchId,
          })
          .execute();

        await this.syncProductCurrentStock(manager, item.productId);
      }

      // Save payments
      for (const payment of input.payments) {
        const pmt = manager.create(POSPayment, {
          transactionId: savedTx.id,
          method: payment.method,
          amount: payment.amount.toString(),
          reference: payment.reference,
          createdAt: new Date(),
        });
        await manager.save(POSPayment, pmt);
      }

      return manager.findOne(POSTransaction, {
        where: { id: savedTx.id },
        relations: ['items', 'items.product', 'payments', 'customer'],
      }) as Promise<POSTransaction>;
    });
  }

  async findTransactions(
    page = 1,
    limit = 20,
    sessionId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{ data: POSTransaction[]; total: number }> {
    const qb = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.items', 'items')
      .leftJoinAndSelect('tx.payments', 'payments')
      .leftJoinAndSelect('tx.customer', 'customer')
      .leftJoinAndSelect('tx.session', 'session')
      .leftJoinAndSelect('session.cashier', 'cashier')
      .orderBy('tx.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (sessionId) qb.andWhere('tx.session_id = :sessionId', { sessionId });
    if (startDate) qb.andWhere('tx.created_at >= :startDate', { startDate: new Date(startDate) });
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('tx.created_at <= :endDate', { endDate: end });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findSessionById(id: string): Promise<POSSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['cashier'],
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async findTransactionById(id: string): Promise<POSTransaction> {
    const tx = await this.transactionRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'payments', 'customer', 'session'],
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  /**
   * Void a completed sale: restores batch quantities, branch stock levels, and
   * product.currentStock to exactly what they were before the sale, and marks
   * the transaction VOIDED rather than deleting it (preserves the audit trail).
   */
  async voidTransaction(id: string, reason: string): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const tx = await manager.findOne(POSTransaction, {
        where: { id },
        relations: ['items', 'session'],
      });
      if (!tx) throw new NotFoundException('Transaction not found');
      if (tx.status === 'VOIDED') {
        throw new BadRequestException('Transaction has already been voided');
      }

      const branchId = tx.session.branchId;
      const touchedProductIds = new Set<string>();

      for (const item of tx.items) {
        touchedProductIds.add(item.productId);

        // Restore exactly the batches this item was deducted from. Older rows
        // created before batchBreakdown existed fall back to the single batchId.
        const breakdown =
          item.batchBreakdown && item.batchBreakdown.length > 0
            ? item.batchBreakdown
            : item.batchId
              ? [{ batchId: item.batchId, quantity: parseFloat(item.quantity as string), unitCost: 0 }]
              : [];

        for (const b of breakdown) {
          await manager
            .createQueryBuilder()
            .update(ProductBatch)
            .set({ quantityRemaining: () => `quantity_remaining + ${b.quantity}` })
            .where('id = :id', { id: b.batchId })
            .execute();
        }

        // Re-credit stock for the branch this sale actually happened at
        await manager
          .createQueryBuilder()
          .update(StockLevel)
          .set({
            quantityOnHand: () => `quantity_on_hand + ${item.quantity}`,
          })
          .where('product_id = :productId AND branch_id = :branchId', {
            productId: item.productId,
            branchId,
          })
          .execute();
      }

      for (const productId of touchedProductIds) {
        await this.syncProductCurrentStock(manager, productId);
      }

      tx.status = 'VOIDED';
      tx.voidedReason = reason ?? null;
      tx.voidedAt = new Date();
      await manager.save(POSTransaction, tx);
    });
  }
}
