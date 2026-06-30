import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { POSService } from './pos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('POS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pos')
export class POSController {
  constructor(private readonly posService: POSService) {}

  @Post('sessions/open')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Open a POS session' })
  openSession(
    @Body() body: { branchId: string; cashierId: string; openingCash: number },
  ) {
    return this.posService.openSession(body);
  }

  @Patch('sessions/:id/close')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Close a POS session' })
  closeSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { closingCash: number },
  ) {
    return this.posService.closeSession(id, body.closingCash);
  }

  @Get('sessions/active')
  @ApiOperation({ summary: 'Get active session for cashier' })
  getActiveSession(@Query('cashierId') cashierId: string) {
    return this.posService.getActiveSession(cashierId);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List POS sessions' })
  async findSessions(@Query('page') page = 1, @Query('limit') limit = 20) {
    const { data, total } = await this.posService.findSessions(
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session by ID' })
  findSessionById(@Param('id', ParseUUIDPipe) id: string) {
    return this.posService.findSessionById(id);
  }

  @Get('products/lookup')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Look up product by barcode or SKU' })
  lookupProduct(@Query('q') query: string) {
    return this.posService.lookupProduct(query);
  }

  @Post('sales')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Complete a POS sale' })
  completeSale(
    @Body()
    body: {
      sessionId: string;
      customerId?: string;
      branchId: string;
      cashierId: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        discountPercent?: number;
      }>;
      payments: Array<{ method: string; amount: number; reference?: string }>;
      discountAmount?: number;
      notes?: string;
      taxRate?: number;
    },
  ) {
    return this.posService.completeSale(body);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List POS transactions' })
  async findTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sessionId') sessionId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { data, total } = await this.posService.findTransactions(
      Number(page),
      Number(limit),
      sessionId,
      startDate,
      endDate,
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findTransactionById(@Param('id', ParseUUIDPipe) id: string) {
    return this.posService.findTransactionById(id);
  }

  @Delete('transactions/:id/void')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Void a transaction' })
  voidTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
  ) {
    return this.posService.voidTransaction(id, body.reason);
  }
}
