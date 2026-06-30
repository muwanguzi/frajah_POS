import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockLevel } from '../../database/entities/stock-level.entity';
import { StockAdjustment } from '../../database/entities/stock-adjustment.entity';
import { StockTransfer } from '../../database/entities/stock-transfer.entity';
import { StockCount } from '../../database/entities/stock-count.entity';

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

  async createAdjustment(
    data: Partial<StockAdjustment>,
  ): Promise<StockAdjustment> {
    const adjustment = this.adjustmentRepository.create(data);
    return this.adjustmentRepository.save(adjustment);
  }

  async findAdjustments(
    page = 1,
    limit = 20,
  ): Promise<{ data: StockAdjustment[]; total: number }> {
    const [data, total] = await this.adjustmentRepository.findAndCount({
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
