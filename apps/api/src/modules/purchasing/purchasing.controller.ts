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
import { PurchasingService } from './purchasing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('Purchasing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchasing')
export class PurchasingController {
  constructor(private readonly purchasingService: PurchasingService) {}

  @Get('orders')
  @ApiOperation({ summary: 'List purchase orders' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    const { data, total } = await this.purchasingService.findAll(
      Number(page),
      Number(limit),
      status,
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get('orders/pending')
  @ApiOperation({ summary: 'List pending purchase orders' })
  getPendingOrders(@Query('branchId') branchId?: string) {
    return this.purchasingService.getPendingOrders(branchId);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasingService.findOne(id);
  }

  @Post('orders')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STORE_KEEPER)
  @ApiOperation({ summary: 'Create a purchase order' })
  createPurchaseOrder(
    @Body()
    body: {
      supplierId: string;
      branchId: string;
      createdById: string;
      expectedDate?: string;
      notes?: string;
      items: Array<{
        productId: string;
        quantityOrdered: number;
        unitCost: number;
      }>;
    },
  ) {
    return this.purchasingService.createPurchaseOrder(body);
  }

  @Patch('orders/:id/status')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STORE_KEEPER)
  @ApiOperation({ summary: 'Update purchase order status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
  ) {
    return this.purchasingService.updateStatus(id, body.status);
  }

  @Post('receipts')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STORE_KEEPER)
  @ApiOperation({ summary: 'Receive goods against a purchase order' })
  receiveGoods(
    @Body()
    body: {
      purchaseOrderId: string;
      branchId: string;
      receivedById: string;
      notes?: string;
      items: Array<{
        purchaseOrderItemId: string;
        quantityReceived: number;
        quantityDamaged?: number;
        expiryDate?: string;
      }>;
    },
  ) {
    return this.purchasingService.receiveGoods(body);
  }
}
