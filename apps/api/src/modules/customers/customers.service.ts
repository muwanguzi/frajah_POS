import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Customer } from '../../database/entities/customer.entity';
import { LoyaltyTransaction } from '../../database/entities/loyalty-transaction.entity';
import { POSTransaction } from '../../database/entities/pos-transaction.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(LoyaltyTransaction)
    private loyaltyRepository: Repository<LoyaltyTransaction>,
    @InjectRepository(POSTransaction)
    private transactionRepository: Repository<POSTransaction>,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{ data: Customer[]; total: number }> {
    const where = search
      ? [{ name: ILike(`%${search}%`) }, { phone: ILike(`%${search}%`) }]
      : {};
    const [data, total] = await this.customerRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    const customer = this.customerRepository.create(data);
    return this.customerRepository.save(customer);
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    await this.findOne(id);
    await this.customerRepository.update(id, data);
    return this.findOne(id);
  }

  async deactivate(id: string): Promise<void> {
    await this.findOne(id);
    await this.customerRepository.update(id, { isActive: false });
  }

  async getLoyaltyTransactions(
    customerId: string,
  ): Promise<LoyaltyTransaction[]> {
    return this.loyaltyRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async getSalesByCustomer(customerId: string): Promise<POSTransaction[]> {
    return this.transactionRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async addLoyaltyTransaction(
    data: Partial<LoyaltyTransaction>,
  ): Promise<LoyaltyTransaction> {
    const tx = this.loyaltyRepository.create(data);
    const saved = await this.loyaltyRepository.save(tx);
    // Update customer loyalty points
    if (data.customerId && data.points) {
      await this.customerRepository
        .createQueryBuilder()
        .update(Customer)
        .set({
          loyaltyPoints: () => `loyalty_points + ${data.points}`,
        })
        .where('id = :id', { id: data.customerId })
        .execute();
    }
    return saved;
  }
}
