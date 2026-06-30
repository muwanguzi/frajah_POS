import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { StockAdjustment } from '../../database/entities/stock-adjustment.entity';
import { StockTransfer } from '../../database/entities/stock-transfer.entity';
import { StockCount } from '../../database/entities/stock-count.entity';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock-levels')
  @ApiOperation({ summary: 'Get stock levels' })
  async getStockLevels(
    @Query('branchId') branchId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const { data, total } = await this.inventoryService.getStockLevels(
      branchId,
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get('stock-levels/:productId/:branchId')
  @ApiOperation({ summary: 'Get stock level for product in branch' })
  getStockLevel(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('branchId', ParseUUIDPipe) branchId: string,
  ) {
    return this.inventoryService.getStockLevel(productId, branchId);
  }

  @Get('adjustments')
  @ApiOperation({ summary: 'List stock adjustments' })
  async findAdjustments(@Query('page') page = 1, @Query('limit') limit = 20) {
    const { data, total } = await this.inventoryService.findAdjustments(
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Post('adjustments')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STORE_KEEPER)
  @ApiOperation({ summary: 'Create a stock adjustment' })
  createAdjustment(@Body() dto: Partial<StockAdjustment>) {
    return this.inventoryService.createAdjustment(dto);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'List stock transfers' })
  async findTransfers(@Query('page') page = 1, @Query('limit') limit = 20) {
    const { data, total } = await this.inventoryService.findTransfers(
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get('transfers/:id')
  @ApiOperation({ summary: 'Get transfer by ID' })
  findTransferById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findTransferById(id);
  }

  @Post('transfers')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STORE_KEEPER)
  @ApiOperation({ summary: 'Create a stock transfer' })
  createTransfer(@Body() dto: Partial<StockTransfer>) {
    return this.inventoryService.createTransfer(dto);
  }

  @Get('stock-counts')
  @ApiOperation({ summary: 'List stock counts' })
  async findStockCounts(@Query('page') page = 1, @Query('limit') limit = 20) {
    const { data, total } = await this.inventoryService.findStockCounts(
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Post('stock-counts')
  @Roles(Role.ADMIN, Role.MANAGER, Role.STORE_KEEPER)
  @ApiOperation({ summary: 'Create a stock count' })
  createStockCount(@Body() dto: Partial<StockCount>) {
    return this.inventoryService.createStockCount(dto);
  }
}
