import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../../database/entities/expense.entity';
import { ExpenseCategory } from '../../database/entities/expense-category.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private categoryRepository: Repository<ExpenseCategory>,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    branchId?: string,
    status?: string,
  ): Promise<{ data: Expense[]; total: number }> {
    const qb = this.expenseRepository
      .createQueryBuilder('exp')
      .leftJoinAndSelect('exp.category', 'category')
      .leftJoinAndSelect('exp.submittedBy', 'submittedBy')
      .orderBy('exp.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (branchId) qb.andWhere('exp.branch_id = :branchId', { branchId });
    if (status) qb.andWhere('exp.status = :status', { status });

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id },
      relations: ['category', 'submittedBy'],
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }

  async create(data: Partial<Expense>): Promise<Expense> {
    const expense = this.expenseRepository.create(data);
    return this.expenseRepository.save(expense);
  }

  async update(id: string, data: Partial<Expense>): Promise<Expense> {
    await this.findOne(id);
    await this.expenseRepository.update(id, data);
    return this.findOne(id);
  }

  async approve(id: string, approvedById: string): Promise<void> {
    await this.expenseRepository.update(id, {
      status: 'APPROVED',
      approvedById,
    });
  }

  async reject(id: string, reason?: string): Promise<void> {
    await this.expenseRepository.update(id, {
      status: 'REJECTED',
      rejectionReason: reason ?? null,
    });
  }

  async findAllCategories(): Promise<ExpenseCategory[]> {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  async createCategory(
    data: Partial<ExpenseCategory>,
  ): Promise<ExpenseCategory> {
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }
}
