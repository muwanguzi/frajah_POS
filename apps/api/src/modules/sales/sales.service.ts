import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleOrder } from '../../database/entities/sale-order.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { Quote } from '../../database/entities/quote.entity';
import { DeliveryNote } from '../../database/entities/delivery-note.entity';
import { CreditNote } from '../../database/entities/credit-note.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SaleOrder)
    private saleOrderRepository: Repository<SaleOrder>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(DeliveryNote)
    private deliveryNoteRepository: Repository<DeliveryNote>,
    @InjectRepository(CreditNote)
    private creditNoteRepository: Repository<CreditNote>,
  ) {}

  // ─── Sale Orders ───────────────────────────────────────────────────────────

  async findAllOrders(
    page = 1,
    limit = 20,
  ): Promise<{ data: SaleOrder[]; total: number }> {
    const [data, total] = await this.saleOrderRepository.findAndCount({
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOrderById(id: string): Promise<SaleOrder> {
    const order = await this.saleOrderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Sale order not found');
    return order;
  }

  async createOrder(data: Partial<SaleOrder>): Promise<SaleOrder> {
    const order = this.saleOrderRepository.create(data);
    return this.saleOrderRepository.save(order);
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────

  async findAllInvoices(
    page = 1,
    limit = 20,
    status?: string,
  ): Promise<{ data: Invoice[]; total: number }> {
    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .orderBy('invoice.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.where('invoice.status = :status', { status });

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const count = await this.invoiceRepository.count();
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
    const invoice = this.invoiceRepository.create({ ...data, invoiceNumber });
    return this.invoiceRepository.save(invoice);
  }

  // ─── Quotes ───────────────────────────────────────────────────────────────

  async findAllQuotes(
    page = 1,
    limit = 20,
  ): Promise<{ data: Quote[]; total: number }> {
    const [data, total] = await this.quoteRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async createQuote(data: Partial<Quote>): Promise<Quote> {
    const count = await this.quoteRepository.count();
    const quoteNumber = `QUO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
    const quote = this.quoteRepository.create({ ...data, quoteNumber });
    return this.quoteRepository.save(quote);
  }

  async convertQuoteToInvoice(id: string): Promise<Invoice> {
    const quote = await this.quoteRepository.findOne({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status === 'ACCEPTED')
      throw new BadRequestException('Quote already converted');
    if (quote.status === 'REJECTED')
      throw new BadRequestException('Cannot convert a rejected quote');

    await this.quoteRepository.update(id, { status: 'ACCEPTED' });

    return this.createInvoice({
      customerId: quote.customerId,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      status: 'DRAFT',
      items: quote.items,
    });
  }

  async cancelQuote(id: string): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status === 'ACCEPTED' || quote.status === 'REJECTED')
      throw new BadRequestException('Cannot cancel a finalised quote');

    await this.quoteRepository.update(id, { status: 'REJECTED' });
    return this.quoteRepository.findOne({ where: { id } }) as Promise<Quote>;
  }

  // ─── Delivery Notes ───────────────────────────────────────────────────────

  async findAllDeliveryNotes(
    page = 1,
    limit = 20,
  ): Promise<{ data: DeliveryNote[]; total: number }> {
    const [data, total] = await this.deliveryNoteRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async createDeliveryNote(data: Partial<DeliveryNote>): Promise<DeliveryNote> {
    const count = await this.deliveryNoteRepository.count();
    const dnNumber = `DN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
    const dn = this.deliveryNoteRepository.create({ ...data, dnNumber });
    return this.deliveryNoteRepository.save(dn);
  }

  // ─── Credit Notes ─────────────────────────────────────────────────────────

  async findAllCreditNotes(
    page = 1,
    limit = 20,
  ): Promise<{ data: CreditNote[]; total: number }> {
    const [data, total] = await this.creditNoteRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async createCreditNote(data: Partial<CreditNote>): Promise<CreditNote> {
    const count = await this.creditNoteRepository.count();
    const cnNumber = `CN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(count + 1).padStart(4, '0')}`;
    const cn = this.creditNoteRepository.create({ ...data, cnNumber });
    return this.creditNoteRepository.save(cn);
  }
}
