import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../../database/entities/supplier.entity';
import { PurchaseOrder } from '../../database/entities/purchase-order.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
  ) {}

  async findAll(page = 1, limit = 20): Promise<{ data: Supplier[]; total: number }> {
    const [data, total] = await this.supplierRepository.findAndCount({
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(data: Partial<Supplier>): Promise<Supplier> {
    const supplier = this.supplierRepository.create(data);
    return this.supplierRepository.save(supplier);
  }

  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    await this.findOne(id);
    await this.supplierRepository.update(id, data);
    return this.findOne(id);
  }

  async deactivate(id: string): Promise<void> {
    await this.findOne(id);
    await this.supplierRepository.update(id, { isActive: false });
  }

  async getOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.find({
      where: { supplierId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
