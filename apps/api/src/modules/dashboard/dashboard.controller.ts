import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get dashboard metrics and KPIs' })
  getMetrics(@Query('branchId') branchId?: string) {
    return this.dashboardService.getMetrics(branchId);
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Get sales chart data' })
  getSalesChart(
    @Query('period') period: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.dashboardService.getSalesChart(period, branchId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get system alerts' })
  getAlerts(@Query('branchId') branchId?: string) {
    return this.dashboardService.getAlerts(branchId);
  }
}
