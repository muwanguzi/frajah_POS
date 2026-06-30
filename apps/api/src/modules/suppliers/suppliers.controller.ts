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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Supplier } from '../../database/entities/supplier.entity';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'List all suppliers' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    const { data, total } = await this.suppliersService.findAll(
      Number(page),
      Number(limit),
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findOne(id);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get purchase orders for a supplier' })
  getOrders(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.getOrdersBySupplier(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create a supplier' })
  create(@Body() dto: Partial<Supplier>) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Update a supplier' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<Supplier>,
  ) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Deactivate a supplier' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    await this.suppliersService.deactivate(id);
    return { message: 'Supplier deactivated' };
  }
}
