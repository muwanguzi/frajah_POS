import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { paginate } from '../../common/utils/pagination.util';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.AUDITOR)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'List audit logs' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
  ) {
    const { data, total } = await this.auditService.findAll(
      Number(page),
      Number(limit),
      entityType,
      userId,
    );
    return paginate(data, total, { page: Number(page), limit: Number(limit) });
  }
}
