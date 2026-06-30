import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BatchesService } from './batches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('Batches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  @ApiOperation({ summary: 'List all product batches' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('branchId') branchId?: string,
  ) {
    const { data, total } = await this.batchesService.findAll(
      Number(page),
      Number(limit),
      branchId,
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get batches expiring soon' })
  findExpiringSoon(
    @Query('days') days = 30,
    @Query('branchId') branchId?: string,
  ) {
    return this.batchesService.findExpiringSoon(Number(days), branchId);
  }

  @Get('valuation')
  @ApiOperation({ summary: 'Get inventory valuation by batch' })
  getValuation(@Query('branchId') branchId?: string) {
    return this.batchesService.getInventoryValuation(branchId);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get batches for a product' })
  findByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.batchesService.findByProduct(productId, branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get batch by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.batchesService.findOne(id);
  }
}
