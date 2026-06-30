import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../../database/entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ data: Product[]; total: number }> {
    const where = search
      ? [{ name: ILike(`%${search}%`) }, { sku: ILike(`%${search}%`) }]
      : {};
    const [data, total] = await this.productRepository.findAndCount({
      where,
      relations: ['category'],
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.productRepository.findOne({ where: { sku } });
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.productRepository.findOne({ where: { barcode } });
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(data);
    return this.productRepository.save(product);
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    await this.findOne(id);
    await this.productRepository.update(id, data);
    return this.findOne(id);
  }

  async deactivate(id: string): Promise<void> {
    await this.findOne(id);
    await this.productRepository.update(id, { isActive: false });
  }
}
