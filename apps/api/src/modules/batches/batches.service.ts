import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ProductBatch } from '../../database/entities/product-batch.entity';
import { StockLevel } from '../../database/entities/stock-level.entity';

export interface BatchDeductionResult {
  batches: Array<{
    batchId: string;
    batchNumber: string;
    quantityDeducted: number;
    unitCost: number;
  }>;
  totalCost: number;
  averageCost: number;
}

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(ProductBatch)
    private batchRepository: Repository<ProductBatch>,
    @InjectRepository(StockLevel)
    private stockLevelRepository: Repository<StockLevel>,
    private dataSource: DataSource,
  ) {}

  async findByProduct(productId: string, branchId?: string): Promise<ProductBatch[]> {
    const qb = this.batchRepository
      .createQueryBuilder('batch')
      .where('batch.product_id = :productId', { productId })
      .andWhere('batch.quantity_remaining > 0');

    if (branchId) {
      qb.andWhere('batch.branch_id = :branchId', { branchId });
    }

    return qb.orderBy('batch.received_at', 'ASC').getMany();
  }

  async findOne(id: string): Promise<ProductBatch> {
    const batch = await this.batchRepository.findOne({ where: { id } });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async findAll(page = 1, limit = 20, branchId?: string): Promise<{ data: ProductBatch[]; total: number }> {
    const qb = this.batchRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .orderBy('batch.receivedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (branchId) {
      qb.where('batch.branch_id = :branchId', { branchId });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async create(data: Partial<ProductBatch>): Promise<ProductBatch> {
    const batch = this.batchRepository.create(data);
    return this.batchRepository.save(batch);
  }

  /**
   * Core inventory costing engine.
   * Deducts `quantity` from available batches using FIFO, LIFO, or WAC method.
   * Uses a database transaction with pessimistic locking to prevent race conditions.
   */
  async deductFromBatches(
    productId: string,
    branchId: string,
    quantity: number,
    method: 'FIFO' | 'LIFO' | 'WAC' = 'FIFO',
    existingManager?: EntityManager,
  ): Promise<BatchDeductionResult> {
    const runDeduction = async (manager: EntityManager): Promise<BatchDeductionResult> => {
      const batchRepo = manager.getRepository(ProductBatch);

      // Fetch active batches with pessimistic write lock
      let batches: ProductBatch[];

      if (method === 'FIFO') {
        batches = await batchRepo
          .createQueryBuilder('batch')
          .where('batch.product_id = :productId', { productId })
          .andWhere('batch.branch_id = :branchId', { branchId })
          .andWhere('batch.quantity_remaining > 0')
          .orderBy('batch.received_at', 'ASC')
          .setLock('pessimistic_write')
          .getMany();
      } else if (method === 'LIFO') {
        batches = await batchRepo
          .createQueryBuilder('batch')
          .where('batch.product_id = :productId', { productId })
          .andWhere('batch.branch_id = :branchId', { branchId })
          .andWhere('batch.quantity_remaining > 0')
          .orderBy('batch.received_at', 'DESC')
          .setLock('pessimistic_write')
          .getMany();
      } else {
        // WAC: all active batches
        batches = await batchRepo
          .createQueryBuilder('batch')
          .where('batch.product_id = :productId', { productId })
          .andWhere('batch.branch_id = :branchId', { branchId })
          .andWhere('batch.quantity_remaining > 0')
          .setLock('pessimistic_write')
          .getMany();
      }

      const totalAvailable = batches.reduce(
        (sum, b) => sum + parseFloat(b.quantityRemaining as string),
        0,
      );

      if (totalAvailable < quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantity}`,
        );
      }

      const result: BatchDeductionResult = {
        batches: [],
        totalCost: 0,
        averageCost: 0,
      };

      if (method === 'WAC') {
        // Weighted average: calculate WAC then deduct proportionally from all batches
        const totalValue = batches.reduce(
          (sum, b) => sum + parseFloat(b.quantityRemaining as string) * parseFloat(b.unitCost as string),
          0,
        );
        const wac = totalAvailable > 0 ? totalValue / totalAvailable : 0;

        let remaining = quantity;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const available = parseFloat(batch.quantityRemaining as string);
          const deducted = Math.min(available, remaining);
          remaining -= deducted;

          await batchRepo.update(batch.id, {
            quantityRemaining: (available - deducted).toString(),
          });

          result.batches.push({
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            quantityDeducted: deducted,
            unitCost: wac,
          });
          result.totalCost += deducted * wac;
        }
      } else {
        // FIFO or LIFO: sequential deduction
        let remaining = quantity;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const available = parseFloat(batch.quantityRemaining as string);
          const unitCost = parseFloat(batch.unitCost as string);
          const deducted = Math.min(available, remaining);
          remaining -= deducted;

          await batchRepo.update(batch.id, {
            quantityRemaining: (available - deducted).toString(),
          });

          result.batches.push({
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            quantityDeducted: deducted,
            unitCost,
          });
          result.totalCost += deducted * unitCost;
        }
      }

      result.averageCost = quantity > 0 ? result.totalCost / quantity : 0;
      return result;
    };

    if (existingManager) {
      return runDeduction(existingManager);
    }
    return this.dataSource.transaction(runDeduction);
  }

  async calculateWAC(productId: string, branchId: string): Promise<number> {
    const batches = await this.batchRepository
      .createQueryBuilder('batch')
      .where('batch.product_id = :productId', { productId })
      .andWhere('batch.branch_id = :branchId', { branchId })
      .andWhere('batch.quantity_remaining > 0')
      .getMany();

    if (!batches.length) return 0;

    const totalValue = batches.reduce(
      (sum, b) => sum + parseFloat(b.quantityRemaining as string) * parseFloat(b.unitCost as string),
      0,
    );
    const totalQty = batches.reduce(
      (sum, b) => sum + parseFloat(b.quantityRemaining as string),
      0,
    );
    return totalQty > 0 ? totalValue / totalQty : 0;
  }

  async findExpiringSoon(daysAhead = 30, branchId?: string): Promise<ProductBatch[]> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    const qb = this.batchRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .where('batch.expiry_date IS NOT NULL')
      .andWhere('batch.expiry_date <= :cutoff', { cutoff: cutoff.toISOString().split('T')[0] })
      .andWhere('batch.quantity_remaining > 0')
      .orderBy('batch.expiry_date', 'ASC');

    if (branchId) qb.andWhere('batch.branch_id = :branchId', { branchId });
    return qb.getMany();
  }

  async getInventoryValuation(branchId?: string): Promise<{
    totalValue: number;
    totalItems: number;
    batches: Array<{ productId: string; productName: string; totalQty: number; totalValue: number; }>;
  }> {
    const qb = this.batchRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .where('batch.quantity_remaining > 0');

    if (branchId) qb.andWhere('batch.branch_id = :branchId', { branchId });
    const batches = await qb.getMany();

    const grouped: Record<string, { productId: string; productName: string; totalQty: number; totalValue: number }> = {};
    let totalValue = 0;

    for (const batch of batches) {
      const qty = parseFloat(batch.quantityRemaining as string);
      const cost = parseFloat(batch.unitCost as string);
      const value = qty * cost;
      totalValue += value;

      if (!grouped[batch.productId]) {
        grouped[batch.productId] = {
          productId: batch.productId,
          productName: (batch as any).product?.name || 'Unknown',
          totalQty: 0,
          totalValue: 0,
        };
      }
      grouped[batch.productId].totalQty += qty;
      grouped[batch.productId].totalValue += value;
    }

    return {
      totalValue,
      totalItems: Object.keys(grouped).length,
      batches: Object.values(grouped),
    };
  }
}
