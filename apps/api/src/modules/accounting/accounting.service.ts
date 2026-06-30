import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../../database/entities/account.entity';
import { JournalEntry } from '../../database/entities/journal-entry.entity';
import { CashbookEntry } from '../../database/entities/cashbook-entry.entity';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(JournalEntry)
    private journalEntryRepository: Repository<JournalEntry>,
    @InjectRepository(CashbookEntry)
    private cashbookRepository: Repository<CashbookEntry>,
  ) {}

  async findAllAccounts(): Promise<Account[]> {
    return this.accountRepository.find({
      relations: ['parent', 'children'],
      order: { code: 'ASC' },
    });
  }

  async findAccountById(id: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async createAccount(data: Partial<Account>): Promise<Account> {
    const account = this.accountRepository.create(data);
    return this.accountRepository.save(account);
  }

  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    await this.findAccountById(id);
    await this.accountRepository.update(id, data);
    return this.findAccountById(id);
  }

  async findAllJournalEntries(
    page = 1,
    limit = 20,
  ): Promise<{ data: JournalEntry[]; total: number }> {
    const [data, total] = await this.journalEntryRepository.findAndCount({
      relations: ['lines', 'lines.account'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async createJournalEntry(data: Partial<JournalEntry>): Promise<JournalEntry> {
    const entry = this.journalEntryRepository.create(data);
    return this.journalEntryRepository.save(entry);
  }

  async postJournalEntry(id: string): Promise<void> {
    await this.journalEntryRepository.update(id, { isPosted: true });
  }

  async findAllCashbookEntries(
    page = 1,
    limit = 20,
    branchId?: string,
  ): Promise<{ data: CashbookEntry[]; total: number }> {
    const where = branchId ? { branchId } : {};
    const [data, total] = await this.cashbookRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async createCashbookEntry(data: Partial<CashbookEntry>): Promise<CashbookEntry> {
    const entry = this.cashbookRepository.create(data);
    return this.cashbookRepository.save(entry);
  }
}
