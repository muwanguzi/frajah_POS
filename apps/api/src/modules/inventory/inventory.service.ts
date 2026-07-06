import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { StockAdjustment } from '../../database/entities/stock-adjustment.entity';
import { StockTransfer } from '../../database/entities/stock-transfer.entity';
import { StockCount } from '../../database/entities/stock-count.entity';

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
      const [branch] = await this.stockLevelRepository.manager.query(
        `SELECT id FROM branches WHERE is_main = true LIMIT 1`,
      );
      resolvedBranchId = branch?.id;
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

  async createStockCount(data: Partial<StockCount>): Promise<StockCount> {
    const count = this.stockCountRepository.create(data);
    return this.stockCountRepository.save(count);
  }

  async findStockCounts(
    page = 1,
    limit = 20,
  ): Promise<{ data: StockCount[]; total: number }> {
    const [data, total] = await this.stockCountRepository.findAndCount({
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
