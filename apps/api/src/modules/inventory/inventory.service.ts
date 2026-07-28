import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { StockAdjustment } from '../../database/entities/stock-adjustment.entity';
import { StockTransfer } from '../../database/entities/stock-transfer.entity';
import { StockCount } from '../../database/entities/stock-count.entity';
import { StockCountItem } from '../../database/entities/stock-count-item.entity';

const INCREASE_TYPES = ['INCREASE', 'OPENING_STOCK', 'CORRECTION'];

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(StockLevel)
    private stockLevelRepository: Repository<StockLevel>,
    @InjectRepository(StockAdjustment)
    private adjustmentRepository: Repository<StockAdjustment>,
    @InjectRepository(StockTransfer)
    private transferRepository: Repository<StockTransfer>,
    @InjectRepository(StockCount)
    private stockCountRepository: Repository<StockCount>,
    @InjectRepository(StockCountItem)
    private stockCountItemRepository: Repository<StockCountItem>,
  ) {}

  async getStockLevels(
    branchId?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: StockLevel[]; total: number }> {
    const where = branchId ? { branchId } : {};
    const [data, total] = await this.stockLevelRepository.findAndCount({
      where,
      relations: ['product', 'branch'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async getStockLevel(
    productId: string,
    branchId: string,
  ): Promise<StockLevel | null> {
    return this.stockLevelRepository.findOne({
      where: { productId, branchId },
      relations: ['product', 'branch'],
    });
  }

  async createAdjustment(data: Record<string, unknown>): Promise<StockAdjustment> {
    const type = (data.type || data.adjustmentType || 'INCREASE') as string;
    const qty = Math.abs(Number(data.quantity));
    const productId = data.productId as string;
    const branchId = data.branchId as string;

    // Resolve branch — fall back to main branch if branchId missing/invalid
    let resolvedBranchId = branchId;
    if (!resolvedBranchId || resolvedBranchId === 'main') {
      const rows = await this.stockLevelRepository.manager.query(
        `SELECT id FROM branches WHERE is_main = true LIMIT 1`,
      );
      resolvedBranchId = rows[0]?.id;
    }
    if (!resolvedBranchId) {
      const rows = await this.stockLevelRepository.manager.query(
        `SELECT id FROM branches ORDER BY created_at LIMIT 1`,
      );
      resolvedBranchId = rows[0]?.id;
    }

    const isIncrease = INCREASE_TYPES.includes(type);
    const delta = isIncrease ? qty : -qty;

    // Upsert stock_level
    let stockLevel = await this.stockLevelRepository.findOne({
      where: { productId, branchId: resolvedBranchId },
    });

    if (stockLevel) {
      const newQty = Math.max(0, Number(stockLevel.quantityOnHand) + delta);
      stockLevel.quantityOnHand = String(newQty);
      await this.stockLevelRepository.save(stockLevel);
    } else {
      stockLevel = this.stockLevelRepository.create({
        productId,
        branchId: resolvedBranchId,
        quantityOnHand: String(Math.max(0, delta)),
      });
      await this.stockLevelRepository.save(stockLevel);
    }

    // Sync product.current_stock from sum of all stock_levels
    const [{ total }] = await this.stockLevelRepository.manager.query(
      `SELECT COALESCE(SUM(quantity_on_hand), 0) AS total FROM stock_levels WHERE product_id = $1`,
      [productId],
    );
    await this.stockLevelRepository.manager.query(
      `UPDATE products SET current_stock = $1 WHERE id = $2`,
      [total, productId],
    );

    const adjustmentNumber = `ADJ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const adjustment = this.adjustmentRepository.create({
      adjustmentNumber,
      productId,
      branchId: resolvedBranchId,
      type,
      quantity: String(qty),
      reason: data.reason as string,
      adjustedById: (data.adjustedById || data.createdById || null) as string | null,
    });
    const saved = await this.adjustmentRepository.save(adjustment);

    return this.adjustmentRepository.findOne({
      where: { id: saved.id },
      relations: ['product'],
    }) as Promise<StockAdjustment>;
  }

  async findAdjustments(
    page = 1,
    limit = 20,
  ): Promise<{ data: StockAdjustment[]; total: number }> {
    const [data, total] = await this.adjustmentRepository.findAndCount({
      relations: ['product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async createTransfer(data: Partial<StockTransfer>): Promise<StockTransfer> {
    const transfer = this.transferRepository.create(data);
    return this.transferRepository.save(transfer);
  }

  async findTransfers(
    page = 1,
    limit = 20,
  ): Promise<{ data: StockTransfer[]; total: number }> {
    const [data, total] = await this.transferRepository.findAndCount({
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findTransferById(id: string): Promise<StockTransfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!transfer) throw new NotFoundException('Transfer not found');
    return transfer;
  }

  async createStockCount(
    data: Partial<StockCount> & { branchId: string },
    userId?: string,
  ): Promise<StockCount> {
    const count = await this.stockCountRepository.count();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countNumber = `CNT-${today}-${String(count + 1).padStart(4, '0')}`;

    const saved = await this.stockCountRepository.save(
      this.stockCountRepository.create({
        ...data,
        countNumber,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        countedById: userId ?? null,
      }),
    );

    // Populate one item per product that has a stock level for this branch
    const levels = await this.stockLevelRepository.find({
      where: { branchId: data.branchId },
      relations: ['product'],
    });

    if (levels.length > 0) {
      const items = levels.map((sl) =>
        this.stockCountItemRepository.create({
          stockCountId: saved.id,
          productId: sl.productId,
          systemQuantity: sl.quantityOnHand,
          countedQuantity: '0',
          variance: '0',
        }),
      );
      await this.stockCountItemRepository.save(items);
    }

    return this.findStockCountById(saved.id);
  }

  async findStockCounts(
    page = 1,
    limit = 20,
  ): Promise<{ data: StockCount[]; total: number }> {
    const [data, total] = await this.stockCountRepository.findAndCount({
      relations: ['branch', 'items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findStockCountById(id: string): Promise<StockCount> {
    const count = await this.stockCountRepository.findOne({
      where: { id },
      relations: ['branch', 'items', 'items.product'],
    });
    if (!count) throw new NotFoundException('Stock count not found');
    return count;
  }

  async updateCountItem(
    countId: string,
    itemId: string,
    countedQuantity: number,
  ): Promise<StockCountItem> {
    const item = await this.stockCountItemRepository.findOne({
      where: { id: itemId, stockCountId: countId },
    });
    if (!item) throw new NotFoundException('Count item not found');

    const variance = countedQuantity - Number(item.systemQuantity);
    item.countedQuantity = String(countedQuantity);
    item.variance = String(variance);
    return this.stockCountItemRepository.save(item);
  }

  async completeStockCount(id: string): Promise<StockCount> {
    const count = await this.findStockCountById(id);

    // Apply counted quantities → update stock_levels and create adjustments
    for (const item of count.items) {
      const counted = Number(item.countedQuantity);
      const system = Number(item.systemQuantity);
      if (counted === system) continue;

      // Update stock_level directly to the counted quantity
      await this.stockLevelRepository.manager.query(
        `UPDATE stock_levels SET quantity_on_hand = $1, updated_at = NOW()
         WHERE product_id = $2 AND branch_id = $3`,
        [counted, item.productId, count.branchId],
      );

      // Keep product.current_stock in sync
      const [{ total }] = await this.stockLevelRepository.manager.query(
        `SELECT COALESCE(SUM(quantity_on_hand), 0) AS total FROM stock_levels WHERE product_id = $1`,
        [item.productId],
      );
      await this.stockLevelRepository.manager.query(
        `UPDATE products SET current_stock = $1 WHERE id = $2`,
        [total, item.productId],
      );

      // Log adjustment record for audit trail
      const adjNumber = `ADJ-CNT-${Date.now()}-${item.productId.slice(0, 4)}`;
      const type = counted > system ? 'INCREASE' : 'DECREASE';
      const qty = Math.abs(counted - system);
      await this.adjustmentRepository.save(
        this.adjustmentRepository.create({
          adjustmentNumber: adjNumber,
          productId: item.productId,
          branchId: count.branchId,
          type,
          quantity: String(qty),
          reason: `Stock count ${count.countNumber}`,
          adjustedById: count.countedById,
        }),
      );
    }

    count.status = 'COMPLETED';
    count.completedAt = new Date();
    await this.stockCountRepository.save(count);
    return this.findStockCountById(id);
  }
}
