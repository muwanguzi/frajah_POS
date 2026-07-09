import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['parent', 'children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let i = 1;
    while (true) {
      const qb = this.categoryRepository.createQueryBuilder('c').where('c.slug = :slug', { slug });
      if (excludeId) qb.andWhere('c.id != :id', { id: excludeId });
      const exists = await qb.getOne();
      if (!exists) return slug;
      slug = `${base}-${i++}`;
    }
  }

  async create(data: Partial<Category>): Promise<Category> {
    const base = this.toSlug(data.name ?? '');
    const slug = await this.uniqueSlug(base);
    const category = this.categoryRepository.create({ ...data, slug });
    return this.categoryRepository.save(category);
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    await this.findOne(id);
    if (data.name && !data.slug) {
      data.slug = await this.uniqueSlug(this.toSlug(data.name), id);
    }
    await this.categoryRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.categoryRepository.update(id, { isActive: false });
  }
}
