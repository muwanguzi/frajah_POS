import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService, ReportFilter } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.AUDITOR)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Sales summary report' })
  getSalesSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    const filter: ReportFilter = { startDate, endDate, branchId };
    return this.reportsService.getSalesSummary(filter);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory valuation report' })
  getInventoryReport(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getInventoryReport({ startDate, endDate, branchId });
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Profit & loss report' })
  getProfitLoss(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getProfitLossReport({ startDate, endDate, branchId });
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Expenses report' })
  getExpenses(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getExpensesReport({ startDate, endDate, branchId });
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Cash flow statement' })
  getCashFlow(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getCashFlowReport({ startDate, endDate, branchId });
  }

  @Get('vat')
  @ApiOperation({ summary: 'VAT report (URA compliance)' })
  getVATReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getVATReport({ startDate, endDate, branchId });
  }
}
