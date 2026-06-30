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
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { Expense } from '../../database/entities/expense.entity';
import { ExpenseCategory } from '../../database/entities/expense-category.entity';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
  ) {
    const { data, total } = await this.expensesService.findAll(
      Number(page),
      Number(limit),
      branchId,
      status,
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create expense' })
  create(@Body() dto: Partial<Expense>) {
    return this.expensesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update expense' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<Expense>) {
    return this.expensesService.update(id, dto);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Approve expense' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.expensesService.approve(id, user.id);
    return { message: 'Expense approved' };
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Reject expense' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string },
  ) {
    await this.expensesService.reject(id, body?.reason);
    return { message: 'Expense rejected' };
  }

  @Get('categories/list')
  @ApiOperation({ summary: 'List expense categories' })
  findAllCategories() {
    return this.expensesService.findAllCategories();
  }

  @Post('categories')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create expense category' })
  createCategory(@Body() dto: Partial<ExpenseCategory>) {
    return this.expensesService.createCategory(dto);
  }
}
