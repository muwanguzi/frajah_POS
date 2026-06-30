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
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Customer } from '../../database/entities/customer.entity';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List all customers' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    const { data, total } = await this.customersService.findAll(
      Number(page),
      Number(limit),
      search,
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/sales')
  @ApiOperation({ summary: 'Get customer purchase history' })
  getSales(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getSalesByCustomer(id);
  }

  @Get(':id/loyalty')
  @ApiOperation({ summary: 'Get customer loyalty transactions' })
  getLoyalty(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getLoyaltyTransactions(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Create a customer' })
  create(@Body() dto: Partial<Customer>) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Update a customer' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<Customer>,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Deactivate a customer' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    await this.customersService.deactivate(id);
    return { message: 'Customer deactivated' };
  }
}
