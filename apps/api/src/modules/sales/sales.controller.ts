import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { SaleOrder } from '../../database/entities/sale-order.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { Quote } from '../../database/entities/quote.entity';
import { DeliveryNote } from '../../database/entities/delivery-note.entity';
import { CreditNote } from '../../database/entities/credit-note.entity';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ─── Orders ───────────────────────────────────────────────────────────────

  @Get('orders')
  @ApiOperation({ summary: 'List sale orders' })
  async findAllOrders(@Query('page') page = 1, @Query('limit') limit = 20) {
    const { data, total } = await this.salesService.findAllOrders(
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get sale order by ID' })
  findOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findOrderById(id);
  }

  @Post('orders')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Create a sale order' })
  createOrder(@Body() dto: Partial<SaleOrder>) {
    return this.salesService.createOrder(dto);
  }

  // ─── Invoices ─────────────────────────────────────────────────────────────

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
  async findAllInvoices(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    const { data, total } = await this.salesService.findAllInvoices(
      Number(page),
      Number(limit),
      status,
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Post('invoices')
  @Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Create an invoice' })
  createInvoice(@Body() dto: Partial<Invoice>) {
    return this.salesService.createInvoice(dto);
  }

  // ─── Quotes ───────────────────────────────────────────────────────────────

  @Get('quotes')
  @ApiOperation({ summary: 'List quotes' })
  async findAllQuotes(@Query('page') page = 1, @Query('limit') limit = 20) {
    const { data, total } = await this.salesService.findAllQuotes(
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Post('quotes')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Create a quote' })
  createQuote(@Body() dto: Partial<Quote>) {
    return this.salesService.createQuote(dto);
  }

  @Patch('quotes/:id/convert')
  @Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Convert quote to invoice' })
  convertQuote(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.convertQuoteToInvoice(id);
  }

  @Patch('quotes/:id/cancel')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Cancel a quote' })
  cancelQuote(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.cancelQuote(id);
  }

  // ─── Delivery Notes ───────────────────────────────────────────────────────

  @Get('delivery-notes')
  @ApiOperation({ summary: 'List delivery notes' })
  async findAllDeliveryNotes(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const { data, total } = await this.salesService.findAllDeliveryNotes(
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Post('delivery-notes')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a delivery note' })
  createDeliveryNote(@Body() dto: Partial<DeliveryNote>) {
    return this.salesService.createDeliveryNote(dto);
  }

  // ─── Credit Notes ─────────────────────────────────────────────────────────

  @Get('credit-notes')
  @ApiOperation({ summary: 'List credit notes' })
  async findAllCreditNotes(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const { data, total } = await this.salesService.findAllCreditNotes(
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Post('credit-notes')
  @Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Create a credit note' })
  createCreditNote(@Body() dto: Partial<CreditNote>) {
    return this.salesService.createCreditNote(dto);
  }
}
